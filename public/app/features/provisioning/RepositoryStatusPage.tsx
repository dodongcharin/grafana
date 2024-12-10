import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useParams } from 'react-router-dom-v5-compat';
import { useAsync } from 'react-use';

import { SelectableValue, urlUtil } from '@grafana/data';
import {
  Alert,
  Card,
  CellProps,
  Column,
  EmptyState,
  FilterInput,
  InteractiveTable,
  LinkButton,
  Spinner,
  Stack,
  Tab,
  TabContent,
  TabsBar,
  Text,
  TextLink,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useQueryParams } from 'app/core/hooks/useQueryParams';

import { ScopedResourceClient } from '../apiserver/client';

import { useGetRepositoryStatusQuery, useListRepositoryFilesQuery } from './api';
import { JobSpec, JobStatus, RepositoryResource } from './api/types';
import { PROVISIONING_URL } from './constants';

enum TabSelection {
  Files = 'files',
  Jobs = 'jobs',
  Folder = 'folder', // the configured folder
  Settings = 'settings',
}
const tabInfo: SelectableValue<TabSelection> = [
  { value: TabSelection.Files, label: 'Files' },
  { value: TabSelection.Jobs, label: 'Recent Events' },
  { value: TabSelection.Folder, label: 'Folder' },
  { value: TabSelection.Settings, label: 'Settings' },
];

export default function RepositoryStatusPage() {
  const { name = '' } = useParams();
  const query = useGetRepositoryStatusQuery({ name });

  const location = useLocation();
  const [queryParams] = useQueryParams();
  const tab = (queryParams['tab'] as TabSelection) ?? TabSelection.Files;

  //@ts-expect-error TODO add error types
  const notFound = query.isError && query.error?.status === 404;
  return (
    <Page
      navId="provisioning"
      pageNav={{
        text: query.data?.spec.title ?? 'Repository Status',
        subTitle: 'Check the status of configured repository.',
      }}
    >
      <Page.Contents isLoading={query.isLoading}>
        {notFound ? (
          <EmptyState message={`Repository not found`} variant="not-found">
            <Text element={'p'}>Make sure the repository config exists in the configuration file.</Text>
            <TextLink href={PROVISIONING_URL}>Back to repositories</TextLink>
          </EmptyState>
        ) : (
          <>
            {query.data ? (
              <>
                <TabsBar>
                  {tabInfo.map((t: SelectableValue) => (
                    <Tab
                      href={urlUtil.renderUrl(location.pathname, { ...queryParams, tab: t.value })}
                      key={t.value}
                      label={t.label!}
                      active={tab === t.value}
                    />
                  ))}
                </TabsBar>
                <TabContent>
                  {tab === TabSelection.Files && <FilesView repo={query.data} />}
                  {tab === TabSelection.Jobs && <JobsView repo={query.data} />}
                  {tab === TabSelection.Folder && <FolderView repo={query.data} />}
                  {tab === TabSelection.Settings && <SettingsView repo={query.data} />}
                </TabContent>
              </>
            ) : (
              <div>not found</div>
            )}
          </>
        )}
      </Page.Contents>
    </Page>
  );
}

type FileDetails = {
  path: string;
  size: string;
  hash: string;
};

interface RepoProps {
  repo: RepositoryResource;
}

type Cell<T extends keyof FileDetails = keyof FileDetails> = CellProps<FileDetails, FileDetails[T]>;

function FilesView({ repo }: RepoProps) {
  const name = repo.metadata.name;
  const query = useListRepositoryFilesQuery({ name });
  const [searchQuery, setSearchQuery] = useState('');
  const data = [...(query.data?.files ?? [])].filter((file) =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const columns: Array<Column<FileDetails>> = useMemo(
    () => [
      {
        id: 'path',
        header: 'Path',
        sortType: 'string',
        cell: ({ row: { original } }: Cell<'path'>) => {
          const { path } = original;
          return <a href={`${PROVISIONING_URL}/${name}/file/${path}`}>{path}</a>;
        },
      },
      {
        id: 'size',
        header: 'Size (KB)',
        cell: ({ row: { original } }: Cell<'size'>) => {
          const { size } = original;
          return (parseInt(size, 10) / 1024).toFixed(2);
        },
        sortType: 'number',
      },
      {
        id: 'hash',
        header: 'Hash',
        sortType: 'string',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row: { original } }: Cell<'path'>) => {
          const { path } = original;
          return (
            <Stack>
              <LinkButton href={`${PROVISIONING_URL}/${name}/file/${path}`}>View</LinkButton>
              <LinkButton href={`${PROVISIONING_URL}/${name}/history/${path}`}>History</LinkButton>
            </Stack>
          );
        },
      },
    ],
    [name]
  );

  if (query.isLoading) {
    return (
      <Stack justifyContent={'center'} alignItems={'center'}>
        <Spinner />
      </Stack>
    );
  }

  return (
    <Stack grow={1} direction={'column'} gap={2}>
      <Stack gap={2}>
        <FilterInput placeholder="Search" autoFocus={true} value={searchQuery} onChange={setSearchQuery} />
      </Stack>
      <InteractiveTable
        columns={columns}
        data={data}
        pageSize={25}
        getRowId={(file: FileDetails) => String(file.hash)}
      />
    </Stack>
  );
}

const jobsClient = new ScopedResourceClient<JobSpec, JobStatus, 'Job'>({
  group: 'provisioning.grafana.app',
  version: 'v0alpha1',
  resource: 'jobs',
});

function JobsView({ repo }: RepoProps) {
  const name = repo.metadata.name;
  const jobs = useAsync(async () => {
    return jobsClient.list({
      labelSelector: [
        {
          key: 'repository',
          operator: '=',
          value: name,
        },
      ],
    });
  }, [name]);

  if (jobs.loading) {
    return <Spinner />;
  }
  if (jobs.error) {
    return (
      <Alert title="error loading jobs">
        <pre>{JSON.stringify(jobs.error)}</pre>
      </Alert>
    );
  }
  if (!jobs.value?.items?.length) {
    return (
      <div>
        No recent events...
        <br />
        Note: history is not maintained after system restart
      </div>
    );
  }

  return (
    <div>
      {jobs.value.items.map((item) => {
        return (
          <Card key={item.metadata.resourceVersion}>
            <Card.Heading>
              {item.spec.action} / {item.status?.state}
            </Card.Heading>
            <Card.Description>
              <span>{JSON.stringify(item.spec)}</span>
              <span>{JSON.stringify(item.status)}</span>
            </Card.Description>
          </Card>
        );
      })}
    </div>
  );
}

function FolderView({ repo }: RepoProps) {
  return (
    <div>
      <h2>TODO, show folder: {repo.metadata.name}</h2>
      <br />
      <a href={`/dashboards/f/${repo.spec.folder} /`}>{repo.spec.folder} </a>
    </div>
  );
}

function SettingsView({ repo }: RepoProps) {
  return (
    <div>
      <h2>TODO, show settings inline???: {repo.metadata.name}</h2>

      <LinkButton href={`${PROVISIONING_URL}/${repo.metadata.name}/edit`}>Edit</LinkButton>
    </div>
  );
}
