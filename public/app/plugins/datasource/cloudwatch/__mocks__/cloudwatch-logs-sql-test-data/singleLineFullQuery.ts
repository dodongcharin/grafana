import { monacoTypes } from '@grafana/ui';
export const singleLineFullQuery = {
  query:
    "SELECT A.transaction_id AS txn_id_a, A.user_id, A.instance_id AS inst_id_a, B.instance_id AS inst_id_b FROM `LogGroupA` AS A INNER JOIN `LogGroupB` AS B ON A.userId = B.userId WHERE B.Status = 'ERROR' -- comment at the end",
  tokens: [
    [
      { offset: 0, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 6, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 7, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 8, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 9, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 23, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 24, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 26, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 27, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 35, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 36, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 37, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 38, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 39, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 46, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 47, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 48, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 49, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 50, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 61, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 62, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 64, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 65, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 74, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 75, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 76, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 77, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 78, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 89, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 90, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 92, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 93, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 102, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 103, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 107, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 108, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 119, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 120, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 122, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 123, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 124, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 125, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 130, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 131, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 135, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 136, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 147, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 148, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 150, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 151, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 152, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 153, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 155, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 156, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 157, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 158, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 164, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 165, type: 'operator.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 166, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 167, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 168, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 169, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 175, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 176, type: 'keyword.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 181, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 182, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 183, type: 'delimiter.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 184, type: 'identifier.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 190, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 191, type: 'operator.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 192, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 193, type: 'string.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 194, type: 'string.escape.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 199, type: 'string.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 200, type: 'white.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
      { offset: 201, type: 'comment.cloudwatch-logs-sql', language: 'cloudwatch-logs-sql' },
    ],
  ] as monacoTypes.Token[][],
};