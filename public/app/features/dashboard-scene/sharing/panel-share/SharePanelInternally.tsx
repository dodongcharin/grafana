import { css } from '@emotion/css';
import { useForm } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { SceneComponentProps } from '@grafana/scenes';
import { Alert, Button, ClipboardButton, Divider, Field, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { Input } from '@grafana/ui/src/components/Input/Input';
import { t, Trans } from 'app/core/internationalization';

import { getDashboardSceneFor } from '../../utils/utils';
import ShareInternallyConfiguration from '../ShareInternallyConfiguration';
import { ShareLinkTab, ShareLinkTabState } from '../ShareLinkTab';

export class SharePanelInternally extends ShareLinkTab {
  static Component = SharePanelInternallyRenderer;

  constructor(state: Partial<ShareLinkTabState>) {
    super(state);
  }

  public getTabLabel() {
    return t('share-panel.drawer.share-link-title', 'Link settings');
  }
}

type ImageSettingsForm = {
  width: number;
  height: number;
  zoom: number;
};

function SharePanelInternallyRenderer({ model }: SceneComponentProps<SharePanelInternally>) {
  const styles = useStyles2(getStyles);
  const { useLockedTime, useShortUrl, selectedTheme, isBuildUrlLoading, imageUrl } = model.useState();

  // const { handleSubmit, reset, ...formMethods } = useForm({ mode: 'onBlur', defaultValues: settings });

  const dashboard = getDashboardSceneFor(model);
  const isDashboardSaved = Boolean(dashboard.state.uid);

  return (
    <>
      <div className={styles.configDescription}>
        <Text variant="body">
          <Trans i18nKey="link.share-panel.config-description">
            Create a personalized, direct link to share your panel within your organization, with the following
            customization settings:
          </Trans>
        </Text>
      </div>
      <ShareInternallyConfiguration
        useLockedTime={useLockedTime}
        onToggleLockedTime={() => model.onToggleLockedTime()}
        useShortUrl={useShortUrl}
        onUrlShorten={() => model.onUrlShorten()}
        selectedTheme={selectedTheme}
        onChangeTheme={(t) => model.onThemeChange(t)}
        isLoading={isBuildUrlLoading}
      />
      <Stack gap={2} direction="column">
        <div className={styles.buttonsContainer}>
          <ClipboardButton
            icon="link"
            variant="primary"
            fill="outline"
            disabled={isBuildUrlLoading}
            getText={model.getShareUrl}
            onClipboardCopy={model.onCopy}
          >
            <Trans i18nKey="link.share.copy-link-button">Copy link</Trans>
          </ClipboardButton>
        </div>
        <Divider spacing={1} />
        {!isDashboardSaved && (
          <Alert severity="info" title={t('share-modal.link.save-alert', 'Dashboard is not saved')} bottomSpacing={0}>
            <Trans i18nKey="share-modal.link.save-dashboard">
              To render a panel image, you must save the dashboard first.
            </Trans>
          </Alert>
        )}
        {!config.rendererAvailable && (
          <Alert
            severity="info"
            title={t('share-modal.link.render-alert', 'Image renderer plugin not installed')}
            bottomSpacing={0}
          >
            <Trans i18nKey="share-modal.link.render-instructions">
              To render a panel image, you must install the{' '}
              <a
                href="https://grafana.com/grafana/plugins/grafana-image-renderer"
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Grafana image renderer plugin
              </a>
              . Please contact your Grafana administrator to install the plugin.
            </Trans>
          </Alert>
        )}
        <Stack gap={2} direction="column">
          <Text element="h4">
            <Trans i18nKey="link.share-panel.render-image-title">Panel preview</Trans>
          </Text>
          <Text element="h5">
            <Trans i18nKey="link.share-panel.render-image-subtitle">Image settings</Trans>
          </Text>
          <Stack gap={1} justifyContent="space-between" direction={{ xs: 'column', sm: 'row' }}>
            <Field label="Width" className={styles.imageConfigurationField}>
              <Input
                type="number"
                suffix="px"
                // onChange={(event) => onChange(event.currentTarget.value, to.value)}
                // addonAfter={icon}
                // onKeyDown={submitOnEnter}
                // data-testid={selectors.components.TimePicker.fromField}
                // value={from.value}
              />
            </Field>
            <Field label="Height" className={styles.imageConfigurationField}>
              <Input
                type="number"
                suffix="px"
                // onChange={(event) => onChange(event.currentTarget.value, to.value)}
                // addonAfter={icon}
                // onKeyDown={submitOnEnter}
                // data-testid={selectors.components.TimePicker.fromField}
                // value={from.value}
              />
            </Field>
            <Field label="Zoom" className={styles.imageConfigurationField}>
              <Input name="importantInput" required />
            </Field>
          </Stack>
          <Stack gap={1}>
            <Button
              icon="gf-layout-simple"
              variant="secondary"
              fill="solid"
              disabled={!config.rendererAvailable || !isDashboardSaved}
            >
              <Trans i18nKey="link.share-panel.render-image">Render image</Trans>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // modalRef?.resolve().onDismiss();
              }}
              fill="outline"
            >
              <Trans i18nKey="share-modal.export.cancel-button">Cancel</Trans>
            </Button>
          </Stack>
          {/*<img src={imageUrl} alt="panel-img" />*/}
        </Stack>
      </Stack>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  configDescription: css({
    marginBottom: theme.spacing(2),
  }),
  buttonsContainer: css({
    marginTop: theme.spacing(2),
  }),
  imageConfigurationField: css({
    flex: 1,
  }),
});
