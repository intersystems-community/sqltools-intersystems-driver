import { ContextValue, NSDatabase, QueryBuilder } from '@sqltools/types';
import queryFactory from '@sqltools/base-driver/dist/lib/factory';
import { IQueries } from './irisdb';

const Functions = {};
Functions[ContextValue.TABLE] = "%SQL_MANAGER.TablesTree";
Functions[ContextValue.VIEW] = "%SQL_MANAGER.ViewsTree";
Functions[ContextValue.FUNCTION] = "%SQL_MANAGER.ProceduresTree";

const ValueColumn = {};
ValueColumn[ContextValue.TABLE] = "TABLE_NAME";
ValueColumn[ContextValue.VIEW] = "VIEW_NAME";
ValueColumn[ContextValue.FUNCTION] = "PROCEDURE_NAME";

interface ISchema extends NSDatabase.ISchema {
  showSystem: boolean;
  filter: string;
}

const describeTable: IQueries['describeTable'] = queryFactory`
SELECT * FROM INFORMATION_SCHEMA.COLUMNS
WHERE
  TABLE_NAME = '${p => p.label}'
  AND TABLE_SCHEMA = '${p => p.schema}'
`;

const fetchColumns: IQueries['fetchColumns'] = queryFactory`
SELECT
  COLUMN_NAME AS label,
  '${ContextValue.COLUMN}' as type,
  TABLE_NAME AS "table",
  DATA_TYPE AS "dataType",
  UPPER(DATA_TYPE || (
    CASE WHEN CHARACTER_MAXIMUM_LENGTH > 0 THEN (
      '(' || CHARACTER_MAXIMUM_LENGTH || ')'
    ) ELSE '' END
  )) AS "detail",
  CHARACTER_MAXIMUM_LENGTH AS size,
  TABLE_SCHEMA AS "schema",
  COLUMN_DEFAULT AS "defaultValue",
  IS_NULLABLE AS "isNullable"
FROM
  INFORMATION_SCHEMA.COLUMNS
WHERE
  TABLE_SCHEMA = '${p => p.schema}'
  AND TABLE_NAME = '${p => p.label}'
ORDER BY
  TABLE_NAME,
  ORDINAL_POSITION
`;

const searchColumns: IQueries['searchColumns'] = queryFactory`
SELECT COLUMN_NAME AS label,
  '${ContextValue.COLUMN}' as type,
  TABLE_NAME AS "table",
  TABLE_SCHEMA AS "schema",
  DATA_TYPE AS "dataType",
  IS_NULLABLE AS "isNullable"
FROM
  INFORMATION_SCHEMA.COLUMNS
WHERE 1 = 1
${
  p => p.search
    ? `AND (
    LOWER(TABLE_NAME || '.' || COLUMN_NAME) LIKE '%${p.search.toLowerCase()}%'
    OR LOWER(COLUMN_NAME) LIKE '%${p.search.toLowerCase()}%'
  )`
    : ''
  }
${
  p => p.tables ? 'AND (' +
    p.tables.map(t => `TABLE_NAME = '${t.label}' and TABLE_SCHEMA = '${t.database}'`).join(' OR ')
    + ")" : ''
}
ORDER BY
  TABLE_NAME,
  ORDINAL_POSITION
`;

const treeFunctionFilter = function(p: { [key: string]: any }): string {
  if (p.schema || p.search) {
    let filter = ", '";
    if (p.schema) {
      filter += p.schema + ".";
    }
    if (p.search) {
      filter += p.search;
    }
    filter += "*'";
    return filter;
  }
  return "";
}

const fetchRecords: IQueries['fetchRecords'] = queryFactory`
SELECT * FROM (
  SELECT TOP ALL *
  FROM ${p => p.table.schema}.${p => (p.table.label || p.table)}
)
WHERE %vid BETWEEN ${p => (p.offset || 0) + 1} AND ${p => ((p.offset || 0) + (p.limit || 50))}
`;

const countRecords: IQueries['countRecords'] = queryFactory`
SELECT count(1) AS total
FROM ${p => p.table.schema}.${p => (p.table.label || p.table)}
`;

const fetchAnyItems = <T1, T2>(type: ContextValue): QueryBuilder<T1, T2> => queryFactory`
SELECT 
  ${p => p.schema || p.search && p.search.includes('.')
    ? `
      ${ValueColumn[type]} AS label, 
      SCHEMA_NAME AS "schema",
      SCHEMA_NAME || '.' || ${ValueColumn[type]} AS "snippet",
      '${type}' AS "type",
      ${type == ContextValue.VIEW ? `'TRUE'` : 'NULL'} AS isView,
      '0:' || ${ValueColumn[type]} AS sortText
      `
    : `
      DISTINCT BY(SCHEMA_NAME)
      %EXACT(SCHEMA_NAME) AS label,
      %EXACT(SCHEMA_NAME) AS "schema",
      '${ContextValue.SCHEMA}' AS "type",
      '0:' || SCHEMA_NAME AS sortText
      `
  }
FROM ${Functions[type]}(${p => p.showSystem ? 1 : 0}${p => treeFunctionFilter(p)})
ORDER BY
${p => p.schema || p.search && p.search.includes('.') ? ValueColumn[type] : 'SCHEMA_NAME'}
`;

const fetchTables = fetchAnyItems<ISchema, NSDatabase.ITable>(ContextValue.TABLE);
const fetchViews = fetchAnyItems<ISchema, NSDatabase.ITable>(ContextValue.VIEW);
const fetchFunctions = fetchAnyItems<ISchema, NSDatabase.IProcedure>(ContextValue.FUNCTION);

const searchHelper = (p: { [key: string]: any }, type: ContextValue) => `
SELECT 
  ${p.schema || p.search && p.search.includes('.')
    ? `
      ${ValueColumn[type]} AS label, 
      SCHEMA_NAME AS "schema",
      '${type}' AS "type",
      ${type == ContextValue.VIEW ? '1' : '0'} AS isView,
      '0:' || ${ValueColumn[type]} AS sortText
      `
    : `
      DISTINCT BY(SCHEMA_NAME)
      %EXACT(SCHEMA_NAME) AS label,
      %EXACT(SCHEMA_NAME) AS "schema",
      '${ContextValue.SCHEMA}' AS "type",
      '0:' || SCHEMA_NAME AS sortText
      `
  }
FROM ${Functions[type]}(${p.showSystem ? 1 : 0}${treeFunctionFilter(p)})
`;

const searchTables: IQueries['searchTables'] = queryFactory`
${p => searchHelper(p, ContextValue.TABLE)}
ORDER BY sortText
`;

const searchEverything: IQueries['searchEverything'] = queryFactory`
${p => searchHelper(p, ContextValue.TABLE)}
UNION
${p => searchHelper(p, ContextValue.VIEW)}
UNION
${p => searchHelper(p, ContextValue.FUNCTION)}
ORDER BY sortText
`;


const fetchTypedSchemas = (type: ContextValue): IQueries['fetchSchemas'] => queryFactory`
SELECT
DISTINCT BY(SCHEMA_NAME)
  %EXACT(SCHEMA_NAME) AS label,
  %EXACT(SCHEMA_NAME) AS "schema",
  '${ContextValue.SCHEMA}' as "type",
  '${type}' as "childType",
  'folder' as iconId
FROM ${Functions[type]} (${p => p.showSystem ? 1 : 0}, '${p => (p.filter && p.filter != "") ? `${p.filter.replace("'", "''")}` : "*"}')
`;

const fetchTableSchemas = fetchTypedSchemas(ContextValue.TABLE);
const fetchViewSchemas = fetchTypedSchemas(ContextValue.VIEW);
const fetchFunctionSchemas = fetchTypedSchemas(ContextValue.FUNCTION);

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  fetchFunctions,
  fetchViews,
  searchTables,
  searchEverything,
  searchColumns,
  fetchTableSchemas,
  fetchViewSchemas,
  fetchFunctionSchemas,
}
