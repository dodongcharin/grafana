package api

import (
	"io"

	"gopkg.in/yaml.v3"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/datasources"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/web"
)

const (
	datasourceUIDHeader = "X-Datasource-Uid"
)

// RulerApiHandler will validate and proxy requests to the correct backend type depending on the datasource.
type RulerApiHandler struct {
	LotexRuler      *LotexRuler
	GrafanaRuler    *RulerSrv
	DatasourceCache datasources.CacheService
}

func NewForkingRuler(datasourceCache datasources.CacheService, lotex *LotexRuler, grafana *RulerSrv) *RulerApiHandler {
	return &RulerApiHandler{
		LotexRuler:      lotex,
		GrafanaRuler:    grafana,
		DatasourceCache: datasourceCache,
	}
}

func (f *RulerApiHandler) handleRouteDeleteNamespaceRulesConfig(ctx *contextmodel.ReqContext, dsUID, namespace string) response.Response {
	t, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	return t.RouteDeleteNamespaceRulesConfig(ctx, namespace)
}

func (f *RulerApiHandler) handleRouteDeleteRuleGroupConfig(ctx *contextmodel.ReqContext, dsUID, namespace, group string) response.Response {
	t, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	return t.RouteDeleteRuleGroupConfig(ctx, namespace, group)
}

func (f *RulerApiHandler) handleRouteGetNamespaceRulesConfig(ctx *contextmodel.ReqContext, dsUID, namespace string) response.Response {
	t, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	return t.RouteGetNamespaceRulesConfig(ctx, namespace)
}

func (f *RulerApiHandler) handleRouteGetRulegGroupConfig(ctx *contextmodel.ReqContext, dsUID, namespace, group string) response.Response {
	t, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	return t.RouteGetRulegGroupConfig(ctx, namespace, group)
}

func (f *RulerApiHandler) handleRouteGetRulesConfig(ctx *contextmodel.ReqContext, dsUID string) response.Response {
	t, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	return t.RouteGetRulesConfig(ctx)
}

func (f *RulerApiHandler) handleRoutePostNameRulesConfig(ctx *contextmodel.ReqContext, conf apimodels.PostableRuleGroupConfig, dsUID, namespace string) response.Response {
	t, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	if conf.Type() != apimodels.LoTexRulerBackend {
		return errorToResponse(backendTypeDoesNotMatchPayloadTypeError(apimodels.LoTexRulerBackend, conf.Type().String()))
	}
	return t.RoutePostNameRulesConfig(ctx, conf, namespace)
}

func (f *RulerApiHandler) handleRouteDeleteNamespaceGrafanaRulesConfig(ctx *contextmodel.ReqContext, namespace string) response.Response {
	return f.GrafanaRuler.RouteDeleteAlertRules(ctx, namespace, "")
}

func (f *RulerApiHandler) handleRouteDeleteGrafanaRuleGroupConfig(ctx *contextmodel.ReqContext, namespace, groupName string) response.Response {
	return f.GrafanaRuler.RouteDeleteAlertRules(ctx, namespace, groupName)
}

func (f *RulerApiHandler) handleRouteGetNamespaceGrafanaRulesConfig(ctx *contextmodel.ReqContext, namespace string) response.Response {
	return f.GrafanaRuler.RouteGetNamespaceRulesConfig(ctx, namespace)
}

func (f *RulerApiHandler) handleRouteGetGrafanaRuleGroupConfig(ctx *contextmodel.ReqContext, namespace, group string) response.Response {
	return f.GrafanaRuler.RouteGetRulesGroupConfig(ctx, namespace, group)
}

func (f *RulerApiHandler) handleRouteGetGrafanaRulesConfig(ctx *contextmodel.ReqContext) response.Response {
	return f.GrafanaRuler.RouteGetRulesConfig(ctx)
}

func (f *RulerApiHandler) handleRouteGetRuleByUID(ctx *contextmodel.ReqContext, ruleUID string) response.Response {
	return f.GrafanaRuler.RouteGetRuleByUID(ctx, ruleUID)
}

func (f *RulerApiHandler) handleRoutePostNameGrafanaRulesConfig(ctx *contextmodel.ReqContext, conf apimodels.PostableRuleGroupConfig, namespace string) response.Response {
	payloadType := conf.Type()
	if payloadType != apimodels.GrafanaBackend {
		return errorToResponse(backendTypeDoesNotMatchPayloadTypeError(apimodels.GrafanaBackend, conf.Type().String()))
	}
	return f.GrafanaRuler.RoutePostNameRulesConfig(ctx, conf, namespace)
}

func (f *RulerApiHandler) handleRoutePostRulesGroupForExport(ctx *contextmodel.ReqContext, conf apimodels.PostableRuleGroupConfig, namespace string) response.Response {
	payloadType := conf.Type()
	if payloadType != apimodels.GrafanaBackend {
		return errorToResponse(backendTypeDoesNotMatchPayloadTypeError(apimodels.GrafanaBackend, conf.Type().String()))
	}
	return f.GrafanaRuler.ExportFromPayload(ctx, conf, namespace)
}

func (f *RulerApiHandler) handleRouteGetRulesForExport(ctx *contextmodel.ReqContext) response.Response {
	return f.GrafanaRuler.ExportRules(ctx)
}

func (f *RulerApiHandler) handleRoutePostGrafanaRuleGroupPrometheusConfig(ctx *contextmodel.ReqContext, namespace string) response.Response {
	body, err := io.ReadAll(ctx.Req.Body)
	if err != nil {
		return errorToResponse(err)
	}
	defer func() { _ = ctx.Req.Body.Close() }()

	datasourceUID := ctx.Req.Header.Get(datasourceUIDHeader)

	var ruleGroup apimodels.PostablePrometheusRuleGroup
	if err := yaml.Unmarshal(body, &ruleGroup); err != nil {
		return errorToResponse(err)
	}

	return f.GrafanaRuler.RoutePostGrafanaRuleGroupPrometheusConfig(ctx, ruleGroup, namespace, datasourceUID)
}

func (f *RulerApiHandler) handleRouteGetGrafanaRulesPrometheusConfig(ctx *contextmodel.ReqContext) response.Response {
	return f.GrafanaRuler.RouteGetGrafanaRulesPrometheusConfig(ctx)
}

func (f *RulerApiHandler) handleRouteGetGrafanaRuleGroupPrometheusConfig(ctx *contextmodel.ReqContext) response.Response {
	namespaceParam := web.Params(ctx.Req)[":Namespace"]
	groupnameParam := web.Params(ctx.Req)[":Group"]
	return f.GrafanaRuler.RouteGetGrafanaRuleGroupPrometheusConfig(ctx, namespaceParam, groupnameParam)
}

func (f *RulerApiHandler) getService(ctx *contextmodel.ReqContext) (*LotexRuler, error) {
	_, err := getDatasourceByUID(ctx, f.DatasourceCache, apimodels.LoTexRulerBackend)
	if err != nil {
		return nil, err
	}
	return f.LotexRuler, nil
}

func (f *RulerApiHandler) handleRouteDeleteGrafanaPrometheusRuleGroup(ctx *contextmodel.ReqContext, fullpath, groupName string) response.Response {
	return f.GrafanaRuler.RouteDeleteAlertRulesByFullpath(ctx, fullpath, groupName)
}

func (f *RulerApiHandler) handleRouteDeleteGrafanaPrometheusNamespace(ctx *contextmodel.ReqContext, fullpath string) response.Response {
	return f.GrafanaRuler.RouteDeleteAlertRulesByFullpath(ctx, fullpath, "")
}
