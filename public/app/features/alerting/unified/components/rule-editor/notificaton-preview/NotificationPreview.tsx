import { compact } from 'lodash';
import { lazy, Suspense } from 'react';

import { Button, LoadingPlaceholder, Stack, Text } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { alertRuleApi } from 'app/features/alerting/unified/api/alertRuleApi';
import { AlertQuery } from 'app/types/unified-alerting-dto';

import { Folder, KBObjectArray } from '../../../types/rule-form';
import { useGetAlertManagerDataSourcesByPermissionAndConfig } from '../../../utils/datasource';

const NotificationPreviewByAlertManager = lazy(() => import('./NotificationPreviewByAlertManager'));

interface NotificationPreviewProps {
  customLabels: KBObjectArray;
  alertQueries: AlertQuery[];
  condition: string | null;
  folder?: Folder;
  alertName?: string;
  alertUid?: string;
}

// TODO the scroll position keeps resetting when we preview
// this is to be expected because the list of routes dissapears as we start the request but is very annoying
export const NotificationPreview = ({
  alertQueries,
  customLabels,
  condition,
  folder,
  alertName,
  alertUid,
}: NotificationPreviewProps) => {
  const disabled = !condition || !folder;

  const previewEndpoint = alertRuleApi.endpoints.preview;

  const [trigger, { data = [], isLoading, isUninitialized: previewUninitialized }] = previewEndpoint.useMutation();

  // potential instances are the instances that are going to be routed to the notification policies
  // convert data to list of labels: are the representation of the potential instances
  const potentialInstances = compact(data.flatMap((label) => label?.labels));

  const onPreview = () => {
    if (!folder || !condition) {
      return;
    }

    // Get the potential labels given the alert queries, the condition and the custom labels (autogenerated labels are calculated on the BE side)
    trigger({
      alertQueries: alertQueries,
      condition: condition,
      customLabels: customLabels,
      folder: folder,
      alertName: alertName,
      alertUid: alertUid,
    });
  };

  //  Get alert managers's data source information
  const alertManagerDataSources = useGetAlertManagerDataSourcesByPermissionAndConfig('notification');

  const onlyOneAM = alertManagerDataSources.length === 1;

  return (
    <Stack direction="column">
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack direction="column" gap={1}>
          <Text element="h5">
            <Trans i18nKey="alerting.notification-preview.title">Alert instance routing preview</Trans>
          </Text>
          {isLoading && previewUninitialized && (
            <Text color="secondary" variant="bodySmall">
              <Trans i18nKey="alerting.common.loading">Loading...</Trans>
            </Text>
          )}
          {previewUninitialized ? (
            <Text color="secondary" variant="bodySmall">
              <Trans i18nKey="alerting.notification-preview.uninitialized">
                When you have your folder selected and your query and labels are configured, click &quot;Preview
                routing&quot; to see the results here.
              </Trans>
            </Text>
          ) : (
            <Text color="secondary" variant="bodySmall">
              <Trans i18nKey="alerting.notification-preview.initialized">
                Based on the labels added, alert instances are routed to the following notification policies. Expand
                each notification policy below to view more details.
              </Trans>
            </Text>
          )}
        </Stack>
        <Button icon="sync" variant="secondary" type="button" onClick={onPreview} disabled={disabled}>
          <Trans i18nKey="alerting.notification-preview.preview-routing">Preview routing</Trans>
        </Button>
      </Stack>
      {!isLoading && !previewUninitialized && potentialInstances.length > 0 && (
        <Suspense fallback={<LoadingPlaceholder text="Loading preview..." />}>
          {alertManagerDataSources.map((alertManagerSource) => (
            <NotificationPreviewByAlertManager
              alertManagerSource={alertManagerSource}
              potentialInstances={potentialInstances}
              onlyOneAM={onlyOneAM}
              key={alertManagerSource.name}
            />
          ))}
        </Suspense>
      )}
    </Stack>
  );
};
