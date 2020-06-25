import { IBaseQueries, ContextValue } from '@sqltools/types';
import queryFactory from '@sqltools/base-driver/dist/lib/factory';

/** write your queries here go fetch desired data. This queries are just examples copied from SQLite driver */

const describeTable: IBaseQueries['describeTable'] = queryFactory`
  SELECT C.*
  FROM pragma_table_info('${p => p.label}') AS C
  ORDER BY C.cid ASC
`;

const fetchColumns: IBaseQueries['fetchColumns'] = queryFactory`
SELECT
  C.COLUMN_NAME AS label,
  '${ContextValue.COLUMN}' as type,
  C.TABLE_NAME AS "table",
  C.DATA_TYPE AS "dataType",
  UPPER(C.DATA_TYPE || (
    CASE WHEN C.CHARACTER_MAXIMUM_LENGTH > 0 THEN (
      '(' || C.CHARACTER_MAXIMUM_LENGTH || ')'
    ) ELSE '' END
  )) AS "detail",
  C.CHARACTER_MAXIMUM_LENGTH AS size,
  C.TABLE_SCHEMA AS "schema",
  C.COLUMN_DEFAULT AS "defaultValue",
  C.IS_NULLABLE AS "isNullable"
FROM
  INFORMATION_SCHEMA.COLUMNS C
WHERE
  C.TABLE_SCHEMA = '${p => p.schema}'
  AND C.TABLE_NAME = '${p => p.label}'
ORDER BY
  C.TABLE_NAME,
  C.ORDINAL_POSITION
`;

const fetchRecords: IBaseQueries['fetchRecords'] = queryFactory`
SELECT TOP ${p => p.limit || 50} *
FROM ${p => p.table.schema}.${p => (p.table.label || p.table)}
`;

const countRecords: IBaseQueries['countRecords'] = queryFactory`
SELECT count(1) AS total
FROM ${p => p.table.schema}.${p => (p.table.label || p.table)}
`;

const fetchTablesAndViews = (type: ContextValue, tableType = 'BASE TABLE'): IBaseQueries['fetchTables'] => queryFactory`
SELECT
  T.TABLE_NAME AS label,
  '${type}' as type,
  T.TABLE_SCHEMA AS "schema",
  '${type === ContextValue.VIEW ? 'TRUE' : 'FALSE'}' AS isView
FROM INFORMATION_SCHEMA.${type === ContextValue.VIEW ? 'VIEWS' : 'TABLES'} AS T
WHERE
  T.TABLE_SCHEMA = '${p => p.schema}'
  AND T.TABLE_TYPE = '${tableType}'
ORDER BY
  T.TABLE_NAME
`;

const fetchTables: IBaseQueries['fetchTables'] = fetchTablesAndViews(ContextValue.TABLE);
const fetchViews: IBaseQueries['fetchTables'] = fetchTablesAndViews(ContextValue.VIEW , 'view');

const searchTables: IBaseQueries['searchTables'] = queryFactory`
SELECT name AS label,
  type
FROM sqlite_master
${p => p.search ? `WHERE LOWER(name) LIKE '%${p.search.toLowerCase()}%'` : ''}
ORDER BY name
`;
const searchColumns: IBaseQueries['searchColumns'] = queryFactory`
SELECT C.name AS label,
  T.name AS "table",
  C.type AS dataType,
  C."notnull" AS isNullable,
  C.pk AS isPk,
  '${ContextValue.COLUMN}' as type
FROM sqlite_master AS T
LEFT OUTER JOIN pragma_table_info((T.name)) AS C ON 1 = 1
WHERE 1 = 1
${p => p.tables.filter(t => !!t.label).length
  ? `AND LOWER(T.name) IN (${p.tables.filter(t => !!t.label).map(t => `'${t.label}'`.toLowerCase()).join(', ')})`
  : ''
}
${p => p.search
  ? `AND (
    LOWER(T.name || '.' || C.name) LIKE '%${p.search.toLowerCase()}%'
    OR LOWER(C.name) LIKE '%${p.search.toLowerCase()}%'
  )`
  : ''
}
ORDER BY C.name ASC,
  C.cid ASC
LIMIT ${p => p.limit || 100}
`;

const fetchSchemas: IBaseQueries['fetchSchemas'] = queryFactory`
SELECT
  schema_name AS label,
  schema_name AS "schema",
  '${ContextValue.SCHEMA}' as "type",
  'folder' as iconId
FROM information_schema.schemata
WHERE schema_name <> 'information_schema'
`;

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  fetchViews,
  searchTables,
  searchColumns,
  fetchSchemas,
}
