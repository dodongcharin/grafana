import { DashboardV2Spec } from '@grafana/schema/dist/esm/schema/dashboard/v2alpha0/dashboard.gen';
import { DashboardDTO } from 'app/types';

import { LegacyDashboardAPI } from './legacy';
import { DashboardAPI, DashboardWithAccessInfo } from './types';
import { getDashboardsApiVersion } from './utils';
import { K8sDashboardAPI } from './v0';
import { K8sDashboardV2APIStub } from './v2';

type DashboardAPIClients = {
  legacy: DashboardAPI<DashboardDTO>;
  v0: DashboardAPI<DashboardDTO>;
  v2: DashboardAPI<DashboardDTO | DashboardWithAccessInfo<DashboardV2Spec>>;
};

type V2ModeOptions = {
  useV2Mode: true;
};

let clients: Partial<DashboardAPIClients>;

// Overloads
export function getDashboardAPI(): DashboardAPI<DashboardDTO>;
export function getDashboardAPI(opts: V2ModeOptions): DashboardAPI<DashboardWithAccessInfo<DashboardV2Spec>>;

export function getDashboardAPI(opts?: V2ModeOptions): DashboardAPI<any> {
  const v = getDashboardsApiVersion();
  const isConvertingToV1 = opts?.useV2Mode ? false : true;

  if (!clients) {
    clients = {
      legacy: new LegacyDashboardAPI(),
      v0: new K8sDashboardAPI(),
      v2: new K8sDashboardV2APIStub(isConvertingToV1),
    };
  }

  if (v === 'v2' && opts?.useV2Mode) {
    return new K8sDashboardV2APIStub(isConvertingToV1);
  }

  if (!clients[v]) {
    throw new Error(`Unknown Dashboard API version: ${v}`);
  }

  return clients[v];
}
