import { ContextValue, NSDatabase, QueryBuilder } from '@sqltools/types';
import queryFactory from '@sqltools/base-driver/dist/lib/factory';
import { IQueries } from './irisdb';

/** write your queries here go fetch desired data. This queries are just examples copied from SQLite driver */

const describeTable: IQueries['describeTable'] = queryFactory`
  SELECT C.*
  FROM pragma_table_info('${p => p.label}') AS C
  ORDER BY C.cid ASC
`;

const fetchColumns: IQueries['fetchColumns'] = queryFactory`
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

const fetchRecords: IQueries['fetchRecords'] = queryFactory`
SELECT TOP ${p => p.limit || 50} *
FROM ${p => p.table.schema}.${p => (p.table.label || p.table)}
`;

const countRecords: IQueries['countRecords'] = queryFactory`
SELECT count(1) AS total
FROM ${p => p.table.schema}.${p => (p.table.label || p.table)}
`;

const fetchAnyItems = <T>(type: ContextValue, isView: boolean, name: string, func: string): QueryBuilder<NSDatabase.ISchema, T> => queryFactory`
SELECT 
  ${name} AS label,
  SCHEMA_NAME AS "schema",
  '${type}' as "type",
  '${isView ? 'TRUE' : 'FALSE'}' as isView
FROM %SQL_MANAGER.${func}()
WHERE SCHEMA_NAME = '${p => p.schema}'
ORDER BY
  ${name}
`;

const fetchTables = fetchAnyItems<NSDatabase.ITable>(ContextValue.TABLE, false, 'TABLE_NAME', 'TablesTree');
const fetchViews = fetchAnyItems<NSDatabase.ITable>(ContextValue.TABLE, true, 'VIEW_NAME', 'ViewsTree');
const fetchFunctions = fetchAnyItems<NSDatabase.IProcedure>(ContextValue.FUNCTION, false, 'PROCEDURE_NAME', 'ProceduresTree');

const searchTables: IQueries['searchTables'] = queryFactory`
SELECT name AS label,
  type
FROM sqlite_master
${p => p.search ? `WHERE LOWER(name) LIKE '%${p.search.toLowerCase()}%'` : ''}
ORDER BY name
`;
const searchColumns: IQueries['searchColumns'] = queryFactory`
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

const fetchTypedSchemas = (type: ContextValue, func: string): IQueries['fetchSchemas'] => queryFactory`
SELECT 
  DISTINCT BY (SCHEMA_NAME) 
  %EXACT(SCHEMA_NAME) AS label,
  %EXACT(SCHEMA_NAME) AS "schema",
  '${ContextValue.SCHEMA}' as "type",
  '${type}' as "childType",
  'folder' as iconId
FROM %SQL_MANAGER.${func}()
`;

const fetchTableSchemas = fetchTypedSchemas(ContextValue.TABLE, 'TablesTree');
const fetchViewSchemas = fetchTypedSchemas(ContextValue.VIEW, 'ViewsTree');
const fetchFunctionSchemas = fetchTypedSchemas(ContextValue.FUNCTION, 'ProceduresTree');

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  fetchFunctions,
  fetchViews,
  searchTables,
  searchColumns,
  fetchTableSchemas,
  fetchViewSchemas,
  fetchFunctionSchemas,
}
