package schedule

import (
	context "context"
	"errors"
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/services/ngalert/eval"
	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/state"
	"github.com/grafana/grafana/pkg/util"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

type alertRuleInfo struct {
	key      ngmodels.AlertRuleKey
	evalCh   chan *evaluation
	updateCh chan ruleVersionAndPauseStatus
	ctx      context.Context
	cancel   util.CancelCauseFunc
}

func newAlertRuleInfo(parent context.Context, key ngmodels.AlertRuleKey) *alertRuleInfo {
	ctx, cancel := util.WithCancelCause(parent)
	return &alertRuleInfo{
		key:      key,
		evalCh:   make(chan *evaluation),
		updateCh: make(chan ruleVersionAndPauseStatus),
		ctx:      ctx,
		cancel:   cancel,
	}
}

// eval signals the rule evaluation routine to perform the evaluation of the rule. Does nothing if the loop is stopped.
// Before sending a message into the channel, it does non-blocking read to make sure that there is no concurrent send operation.
// Returns a tuple where first element is
//   - true when message was sent
//   - false when the send operation is stopped
//
// the second element contains a dropped message that was sent by a concurrent sender.
func (a *alertRuleInfo) eval(eval *evaluation) (bool, *evaluation) {
	// read the channel in unblocking manner to make sure that there is no concurrent send operation.
	var droppedMsg *evaluation
	select {
	case droppedMsg = <-a.evalCh:
	default:
	}

	select {
	case a.evalCh <- eval:
		return true, droppedMsg
	case <-a.ctx.Done():
		return false, droppedMsg
	}
}

// update sends an instruction to the rule evaluation routine to update the scheduled rule to the specified version. The specified version must be later than the current version, otherwise no update will happen.
// func (a *alertRuleInfo) update(lastVersion ruleVersionAndPauseStatus) bool {
func (a *alertRuleInfo) update(rule *ngmodels.AlertRule, folderTitle string) bool {
	// check if the channel is not empty.
	select {
	case <-a.updateCh:
	case <-a.ctx.Done():
		return false
	default:
	}

	// TODO: Probably need a mutex for this update
	// TODO: move inside ruleRoutine, so that we don't change fields out from underneath a running rule. ruleRoutine is the main reader here, so handling updates inside that prevents read/write races with the new fields
	// TODO: Ideally the key should never change due to the how the registry works.
	a.key = rule.GetKey()

	rvp := ruleVersionAndPauseStatus{
		Fingerprint: ruleWithFolder{rule: rule, folderTitle: folderTitle}.Fingerprint(),
		IsPaused:    rule.IsPaused,
	}

	select {
	case a.updateCh <- rvp:
		return true
	case <-a.ctx.Done():
		return false
	}
}

// stop sends a signal to the rule evaluation routine to stop evaluating.
func (a *alertRuleInfo) stop(reason error) {
	a.cancel(reason)
}

//nolint:gocyclo
func (r *alertRuleInfo) ruleRoutine(sch *schedule) error {
	grafanaCtx := ngmodels.WithRuleKey(r.ctx, r.key)
	logger := sch.log.FromContext(grafanaCtx)
	logger.Debug("Alert rule routine started")

	orgID := fmt.Sprint(r.key.OrgID)
	evalTotal := sch.metrics.EvalTotal.WithLabelValues(orgID)
	evalDuration := sch.metrics.EvalDuration.WithLabelValues(orgID)
	evalTotalFailures := sch.metrics.EvalFailures.WithLabelValues(orgID)
	processDuration := sch.metrics.ProcessDuration.WithLabelValues(orgID)
	sendDuration := sch.metrics.SendDuration.WithLabelValues(orgID)

	notify := func(states []state.StateTransition) {
		expiredAlerts := state.FromAlertsStateToStoppedAlert(states, sch.appURL, sch.clock)
		if len(expiredAlerts.PostableAlerts) > 0 {
			sch.alertsSender.Send(grafanaCtx, r.key, expiredAlerts)
		}
	}

	resetState := func(ctx context.Context, isPaused bool) {
		rule := sch.schedulableAlertRules.get(r.key)
		reason := ngmodels.StateReasonUpdated
		if isPaused {
			reason = ngmodels.StateReasonPaused
		}
		states := sch.stateManager.ResetStateByRuleUID(ctx, rule, reason)
		notify(states)
	}

	evaluate := func(ctx context.Context, f fingerprint, attempt int64, e *evaluation, span trace.Span, retry bool) error {
		logger := logger.New("version", e.rule.Version, "fingerprint", f, "attempt", attempt, "now", e.scheduledAt).FromContext(ctx)
		start := sch.clock.Now()

		evalCtx := eval.NewContextWithPreviousResults(ctx, SchedulerUserFor(e.rule.OrgID), sch.newLoadedMetricsReader(e.rule))
		if sch.evaluatorFactory == nil {
			panic("evalfactory nil")
		}
		ruleEval, err := sch.evaluatorFactory.Create(evalCtx, e.rule.GetEvalCondition())
		var results eval.Results
		var dur time.Duration
		if err != nil {
			dur = sch.clock.Now().Sub(start)
			logger.Error("Failed to build rule evaluator", "error", err)
		} else {
			results, err = ruleEval.Evaluate(ctx, e.scheduledAt)
			dur = sch.clock.Now().Sub(start)
			if err != nil {
				logger.Error("Failed to evaluate rule", "error", err, "duration", dur)
			}
		}

		evalTotal.Inc()
		evalDuration.Observe(dur.Seconds())

		if ctx.Err() != nil { // check if the context is not cancelled. The evaluation can be a long-running task.
			span.SetStatus(codes.Error, "rule evaluation cancelled")
			logger.Debug("Skip updating the state because the context has been cancelled")
			return nil
		}

		if err != nil || results.HasErrors() {
			evalTotalFailures.Inc()

			// Only retry (return errors) if this isn't the last attempt, otherwise skip these return operations.
			if retry {
				// The only thing that can return non-nil `err` from ruleEval.Evaluate is the server side expression pipeline.
				// This includes transport errors such as transient network errors.
				if err != nil {
					span.SetStatus(codes.Error, "rule evaluation failed")
					span.RecordError(err)
					return fmt.Errorf("server side expressions pipeline returned an error: %w", err)
				}

				// If the pipeline executed successfully but have other types of errors that can be retryable, we should do so.
				if !results.HasNonRetryableErrors() {
					span.SetStatus(codes.Error, "rule evaluation failed")
					span.RecordError(err)
					return fmt.Errorf("the result-set has errors that can be retried: %w", results.Error())
				}
			}

			// If results is nil, we assume that the error must be from the SSE pipeline (ruleEval.Evaluate) which is the only code that can actually return an `err`.
			if results == nil {
				results = append(results, eval.NewResultFromError(err, e.scheduledAt, dur))
			}

			// If err is nil, we assume that the SSS pipeline succeeded and that the error must be embedded in the results.
			if err == nil {
				err = results.Error()
			}

			span.SetStatus(codes.Error, "rule evaluation failed")
			span.RecordError(err)
		} else {
			logger.Debug("Alert rule evaluated", "results", results, "duration", dur)
			span.AddEvent("rule evaluated", trace.WithAttributes(
				attribute.Int64("results", int64(len(results))),
			))
		}
		start = sch.clock.Now()
		processedStates := sch.stateManager.ProcessEvalResults(
			ctx,
			e.scheduledAt,
			e.rule,
			results,
			state.GetRuleExtraLabels(e.rule, e.folderTitle, !sch.disableGrafanaFolder),
		)
		processDuration.Observe(sch.clock.Now().Sub(start).Seconds())

		start = sch.clock.Now()
		alerts := state.FromStateTransitionToPostableAlerts(processedStates, sch.stateManager, sch.appURL)
		span.AddEvent("results processed", trace.WithAttributes(
			attribute.Int64("state_transitions", int64(len(processedStates))),
			attribute.Int64("alerts_to_send", int64(len(alerts.PostableAlerts))),
		))
		if len(alerts.PostableAlerts) > 0 {
			sch.alertsSender.Send(ctx, r.key, alerts)
		}
		sendDuration.Observe(sch.clock.Now().Sub(start).Seconds())

		return nil
	}

	evalRunning := false
	var currentFingerprint fingerprint
	defer sch.stopApplied(r.key)
	for {
		select {
		// used by external services (API) to notify that rule is updated.
		case ctx := <-r.updateCh:
			if currentFingerprint == ctx.Fingerprint {
				logger.Info("Rule's fingerprint has not changed. Skip resetting the state", "currentFingerprint", currentFingerprint)
				continue
			}

			logger.Info("Clearing the state of the rule because it was updated", "isPaused", ctx.IsPaused, "fingerprint", ctx.Fingerprint)
			// clear the state. So the next evaluation will start from the scratch.
			resetState(grafanaCtx, ctx.IsPaused)
			currentFingerprint = ctx.Fingerprint
		// evalCh - used by the scheduler to signal that evaluation is needed.
		case ctx, ok := <-r.evalCh:
			if !ok {
				logger.Debug("Evaluation channel has been closed. Exiting")
				return nil
			}
			if evalRunning {
				continue
			}

			func() {
				evalRunning = true
				defer func() {
					evalRunning = false
					sch.evalApplied(r.key, ctx.scheduledAt)
				}()

				for attempt := int64(1); attempt <= sch.maxAttempts; attempt++ {
					isPaused := ctx.rule.IsPaused
					f := ruleWithFolder{ctx.rule, ctx.folderTitle}.Fingerprint()
					// Do not clean up state if the eval loop has just started.
					var needReset bool
					if currentFingerprint != 0 && currentFingerprint != f {
						logger.Debug("Got a new version of alert rule. Clear up the state", "fingerprint", f)
						needReset = true
					}
					// We need to reset state if the loop has started and the alert is already paused. It can happen,
					// if we have an alert with state and we do file provision with stateful Grafana, that state
					// lingers in DB and won't be cleaned up until next alert rule update.
					needReset = needReset || (currentFingerprint == 0 && isPaused)
					if needReset {
						resetState(grafanaCtx, isPaused)
					}
					currentFingerprint = f
					if isPaused {
						logger.Debug("Skip rule evaluation because it is paused")
						return
					}

					fpStr := currentFingerprint.String()
					utcTick := ctx.scheduledAt.UTC().Format(time.RFC3339Nano)
					tracingCtx, span := sch.tracer.Start(grafanaCtx, "alert rule execution", trace.WithAttributes(
						attribute.String("rule_uid", ctx.rule.UID),
						attribute.Int64("org_id", ctx.rule.OrgID),
						attribute.Int64("rule_version", ctx.rule.Version),
						attribute.String("rule_fingerprint", fpStr),
						attribute.String("tick", utcTick),
					))

					// Check before any execution if the context was cancelled so that we don't do any evaluations.
					if tracingCtx.Err() != nil {
						span.SetStatus(codes.Error, "rule evaluation cancelled")
						span.End()
						logger.Error("Skip evaluation and updating the state because the context has been cancelled", "version", ctx.rule.Version, "fingerprint", f, "attempt", attempt, "now", ctx.scheduledAt)
						return
					}

					retry := attempt < sch.maxAttempts
					err := evaluate(tracingCtx, f, attempt, ctx, span, retry)
					// This is extremely confusing - when we exhaust all retry attempts, or we have no retryable errors
					// we return nil - so technically, this is meaningless to know whether the evaluation has errors or not.
					span.End()
					if err == nil {
						return
					}

					logger.Error("Failed to evaluate rule", "version", ctx.rule.Version, "fingerprint", f, "attempt", attempt, "now", ctx.scheduledAt, "error", err)
					select {
					case <-tracingCtx.Done():
						logger.Error("Context has been cancelled while backing off", "version", ctx.rule.Version, "fingerprint", f, "attempt", attempt, "now", ctx.scheduledAt)
						return
					case <-time.After(retryDelay):
						continue
					}
				}
			}()

		case <-grafanaCtx.Done():
			// clean up the state only if the reason for stopping the evaluation loop is that the rule was deleted
			if errors.Is(grafanaCtx.Err(), errRuleDeleted) {
				// We do not want a context to be unbounded which could potentially cause a go routine running
				// indefinitely. 1 minute is an almost randomly chosen timeout, big enough to cover the majority of the
				// cases.
				ctx, cancelFunc := context.WithTimeout(context.Background(), time.Minute)
				defer cancelFunc()
				states := sch.stateManager.DeleteStateByRuleUID(ngmodels.WithRuleKey(ctx, r.key), r.key, ngmodels.StateReasonRuleDeleted)
				notify(states)
			}
			logger.Debug("Stopping alert rule routine")
			return nil
		}
	}
}
