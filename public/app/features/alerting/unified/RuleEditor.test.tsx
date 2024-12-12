import { Route, Routes } from 'react-router-dom-v5-compat';
import { selectOptionInTest } from 'test/helpers/selectOptionInTest';
import { render, screen } from 'test/test-utils';

import { setAppEvents } from '@grafana/runtime';
import appEvents from 'app/core/app_events';
import RuleEditor from 'app/features/alerting/unified/RuleEditor';
import { setupMswServer } from 'app/features/alerting/unified/mockApi';
import { grantUserPermissions, mockDataSource } from 'app/features/alerting/unified/mocks';
import { setupDataSources } from 'app/features/alerting/unified/testSetup/datasources';
import { DataSourceType } from 'app/features/alerting/unified/utils/datasource';
import { AccessControlAction } from 'app/types';

setupMswServer();

// Required to make sure that loading the datasource plugin does not fail
// see public/app/plugins/datasource/loki/module.ts
setAppEvents(appEvents);

const lokiDatasource = mockDataSource(
  {
    type: DataSourceType.Loki,
    name: 'loki',
    uid: 'oKflPJ2GF38UCq',
    id: 1,
    isDefault: true,
    jsonData: {
      manageAlerts: true,
    },
  },
  {
    alerting: true,
    // needed to make the correct plugin components load
    module: 'core:plugin/loki',
    id: 'loki',
  }
);

beforeEach(() => {
  grantUserPermissions([
    AccessControlAction.AlertingInstanceCreate,
    AccessControlAction.FoldersRead,
    AccessControlAction.DataSourcesRead,
    AccessControlAction.AlertingRuleCreate,
    AccessControlAction.AlertingRuleExternalWrite,
    AccessControlAction.AlertingRuleExternalRead,
  ]);
  setupDataSources(lokiDatasource);
});

const renderRecordingRuleEditor = () => {
  return render(
    <Routes>
      <Route path="/alerting/new/:type" element={<RuleEditor />} />
    </Routes>,
    {
      historyOptions: {
        initialEntries: [`/alerting/new/recording`],
      },
    }
  );
};

describe('Recording rules', () => {
  it('allows user to create loki recording rule', async () => {
    const { user } = renderRecordingRuleEditor();
    await screen.findByText('New recording rule');

    const datasourcePicker = await screen.findByLabelText(/select data source/i);
    await user.click(datasourcePicker);

    await selectOptionInTest(datasourcePicker, /loki/i);

    const editor = await screen.findByPlaceholderText(/text to find/i);
    await user.type(editor, '1');

    await user.click(screen.getByText(/run query/i));
    // screen.debug(await screen.findByTestId('loki-editor'), Infinity);
    expect(await screen.findByText(/No data/)).toBeInTheDocument();
  });

  // it('renders ', async () => {
  //   const { user } = render(
  //     <Routes>
  //       <Route path="/alerting/new/:type" element={<RuleEditor />} />
  //     </Routes>,
  //     {
  //       historyOptions: {
  //         initialEntries: [`/alerting/new/recording`],
  //       },
  //     }
  //   );

  //   await screen.findByText('New recording rule');

  //   const datasourcePicker = await screen.findByLabelText(/select data source/i);
  //   await user.click(datasourcePicker);

  //   await selectOptionInTest(datasourcePicker, /loki/i);

  //   const editor = await screen.findByPlaceholderText(/text to find/i);
  //   await user.type(editor, '1');

  //   await user.click(screen.getByText(/run query/i));
  // });
});
