import { QueryTypes, Sequelize, Transaction } from 'sequelize'
import * as _ from 'lodash'
import path from 'path'
import { app } from 'electron'
import moment from 'moment'
import { IConnection, IGrantRole } from '../renderer/src/interface'
import { RolePermissionMap } from '../renderer/src/utils/constant'

// const sequelize = new Sequelize({
//     host: '127.0.0.1',
//     port: 5432,
//     username: 'postgres',
//     password: 'postgres',
//     dialect: 'postgres',
//     database: 'db'
// })
// await sequelize.authenticate();

type QueryType = {
  id: string
  config?: IConnection
  sql: string
  opt?: { type?: string; transaction?: Transaction; raw?: boolean }
}

const dbMap = {}
let execa

async function clearDb({ id }) {
  if (dbMap[id]) {
    try {
      const con = dbMap[id]
      await con.close()

      delete dbMap[id]
    } catch (error) {}
  }
}

async function closeConnection(data) {
  if (data?.id) {
    return clearDb(data)
  } else {
    const works = Object.keys(dbMap).map((id) => clearDb({ id }))

    return Promise.all(works)
  }
}

function initDb({ id, config }) {
  let obj = dbMap[id]

  if (!obj) {
    const db = new Sequelize(config)
    obj = { db, config }
  }

  dbMap[id] = obj

  return obj.db
}

// async function testConnection(db) {
//     try {
//         await db.authenticate();
//       } catch (error) {
//         console.error('Unable to connect to the database:', error);
//       }
// }

const defaultSchemas = ['information_schema', 'pg_catalog', 'pg_toast']
async function getSchema({ id, config }) {
  const sql = `select schema_name as name from information_schema.schemata`

  const schemas = await query({ sql, id, config })

  return schemas.filter((el) => !defaultSchemas.includes(el.name))
}

async function getColums({ tableName, id, dbName, schema }) {
  const sql =
    dbMap[id].config.dialect === 'postgres'
      ? `
  SELECT column_name as name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = '${schema}' AND table_name = '${tableName}' LIMIT 500
  `
      : `
  SELECT LOWER(COLUMN_NAME) as name
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${tableName}' LIMIT 500;
  `

  const columns = await query({ sql, id })

  return columns
}

//select oid from pg_class where relname='active_lock_user' //可以查出tabelId
async function getTables({ id, schema = 'public', config }) {
  console.log('get tables: ', id, schema, config)
  const sql = `select table_name from information_schema.tables where table_schema='${schema}' LIMIT 1000`
  const tables = await query({ id, sql, config })

  return _.sortBy(tables, ['table_name', 'TABLE_NAME'])
}

async function getRowAndColumns({
  sql,
  total,
  page = 1,
  pageSize = 10,
  id,
  tableName,
  schema,
  dbName
}) {
  const res = { rows: [], columns: [], total }
  if (!total) {
    try {
      if (!/\blimit\b/i.test(sql)) {
        let totalSql = ''
        if (/\bunion\b/i.test(sql)) {
          totalSql = `select count(*) as count from ( ${sql} ) lrq2019`
        } else {
          totalSql = sql
            .replace(/\n/g, ' ')
            .replace(/(?<=select).*?(?=from)/i, ' count(*) count ')
            .replace(/order by.*(asc|desc)/i, '')
            .replace(/order by.*(?=limit)/i, '')
            .replace(/order by.*/i, '')
            .replace(/;\s*$/, '')

          if (/\bgroup\s+by\b/i.test(sql)) {
            totalSql = `select count(*) as count from ( ${totalSql} ) lrq2019`
          }
        }

        const totalRes = await query({ sql: totalSql, id })

        res.total = totalRes[0].count || 0
      }
    } catch (error) {
      const totalSql = `select count(*) as count from ( ${sql} ) lrq2019`
      const totalRes = await query({ sql: totalSql, id })

      res.total = totalRes[0].count || 0
    }
  }

  if (!/\blimit\b/i.test(sql) && !/\bgroup\s+by\b/i.test(sql)) {
    sql = `${sql} limit ${pageSize}`
    if (!/\boffset\b/i.test(sql)) {
      sql = `${sql} offset ${pageSize * (page - 1)}`
    }
  }

  if (dbMap[id].config.dialect === 'postgres') {
    const data = await query({ sql, opt: { type: QueryTypes.RAW }, id })
    res.rows = data[0]
    res.columns = data[1].fields
  } else {
    const data = await query({ sql, opt: { type: QueryTypes.SELECT }, id })
    res.rows = data

    if (!data.length) {
      res.columns = await getColums({ tableName, schema, id, dbName })
    } else {
      res.columns = Object.keys(data[0]).map((el) => {
        return {
          name: el
        }
      })
    }
  }

  return res
}

async function getExportData({ sql, id }) {
  const data = await query({ sql, opt: { type: QueryTypes.RAW }, id })

  return {
    rows: data[0],
    columns: data[1].fields
  }
}

async function query({ sql, id, opt, config }: QueryType) {
  const db = initDb({ id, config })

  const data = await db.query(sql, { type: QueryTypes.SELECT, ...opt })

  return data
}

// tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3] sql: ''
async function getTableData(data) {
  if (/(pg_terminate_backend|nextval)\(/i.test(data.sql)) {
    return query({ sql: data.sql, id: data.id })
  }

  if (/show\s+max_connections/i.test(data.sql)) {
    const rows = await query({ sql: data.sql, id: data.id })
    return {
      rows,
      columns: [{ name: 'max_connections' }]
    }
  }

  if (/^\s*select/i.test(data.sql)) {
    return getRowAndColumns({
      sql: data.sql,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      id: data.id,
      tableName: data.tableName,
      schema: data.schema,
      dbName: data.dbName
    })
  } else {
    return query({ sql: data.sql, id: data.id })
  }
}

async function updateOneField({ tableName, dataId, id, field, value }) {
  const sql = `
    update ${tableName} set ${field} = '${value}'
    where id = ${dataId}
    `

  await query({ sql, id, opt: { type: QueryTypes.UPDATE } })
}

async function updateDate({ tableName, id, dataId, data, type }) {
  if (type === 2) {
    return updateOneField({ tableName, id, dataId, ...data })
  }
  console.log('updateDate: ', tableName, id, type, dataId, data)
  const updateFields = Object.keys(data)
    .map((key) => {
      if (Number.isInteger(data[key])) {
        return `${key} = ${data[key]}`
      } else {
        return `${key} = '${data[key]}'`
      }
    })
    .join(',')

  const sql = `
    update ${tableName} set ${updateFields}
    where id = ${dataId}
    `

  await query({ sql, id })
}

function getAppPath() {
  let appPath = app.getAppPath()
  if (process.env.NODE_ENV !== 'development') {
    appPath += '.unpacked'
  }

  return appPath
}

// type 1-struct 2-struct and data
async function restore({ type, connection, sqlPath }) {
  initDb({ id: connection.id, config: connection.config })
  const pgPath = await getToolPath({ type: 3 })

  const params: string[] = []
  if (type === 1) {
    params.push('-s')
  }

  const res = await execa({
    env: { PGPASSWORD: connection.config.password }
  })`${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} ${params} --dbname=${connection.config.database}  ${sqlPath}`

  return {
    code: res.exitCode,
    dbName: connection.config.database,
    path: sqlPath
  }
}

// async function getServerVersion() {
//   const versionSql = `select version()`
//   const versionRes = await query({ sql: versionSql })

//   let version = 16
//   const match = versionRes[0].version.match(/PostgreSQL (\d+)/)
//   if (match) {
//     version = match[1]
//   }

//   return version + ''
// }

//type 1-database 2-table
async function backup({ connection }) {
  initDb({ id: connection.id, config: connection.config })

  // console.log('versionRes: ', versionRes, typeof versionRes)
  const pgPath = await getToolPath({ type: 2 })
  const downPath = path.join(
    app.getPath('downloads'),
    `${connection.config.database}_${moment().format('YYYYMMDDHHmmss')}.dba`
  )

  const res = await execa({
    env: { PGPASSWORD: connection.config.password }
  })`${pgPath} ${['-U', connection.config.username, '-h', connection.config.host, '-p', connection.config.port, '-Fc', '-f', downPath, connection.config.database]}`
  // const res = await execa({env: {PGPASSWORD: config.config.password}})`${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} -f ${downPath}`
  // const res = await execa({env: {PGPASSWORD: config.config.password}})`${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} -f ${downPath}`

  return {
    code: res?.exitCode,
    path: downPath,
    dbName: connection.config.database
  }
}

function getPlatform() {
  switch (process.platform) {
    case 'win32':
      return 'win'
    default:
      return 'mac'
  }
}

//type 1-createdb 2-backup 3-restore
async function getToolPath({ type }) {
  const appPath = getAppPath()
  const os = getPlatform()
  let tool = ''
  switch (type) {
    case 1:
      tool = 'createdb'
      break
    case 2:
      tool = 'pg_dump'
      break
    case 3:
      tool = 'pg_restore'
      break
    default:
      break
  }

  // const version = '17'
  let toolPath = ''
  if (os === 'win') {
    tool += '.exe'
    toolPath = path.join(appPath, 'resources', 'bin', os, '16', tool)
  } else {
    toolPath = path.join(appPath, 'resources', 'bin', os, '17', 'bin', tool)
  }

  return toolPath
}

;(async function initExeca() {
  execa = (await import('execa')).execa
})()

async function createDb({ dbName, connection, character, collate }) {
  initDb({ id: connection.id, config: connection.config })

  if (connection.config.dialect === 'postgres') {
    const pgPath = await getToolPath({ type: 1 })
    const res = await execa({
      env: { PGPASSWORD: connection.config.password }
    })`${pgPath} ${['-U', connection.config.username, '-h', connection.config.host, '-p', connection.config.port, dbName]}`

    return {
      code: res.exitCode,
      dbName
    }
  } else {
    const sql = `
      CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET ${character} COLLATE ${collate}
      `

    const res = await query({ sql, id: connection.id, opt: { type: QueryTypes.RAW } })
    console.log('create mysql res: ', res)
    return {
      // code: res.exitCode,
      dbName,
      code: 0
    }
  }
}

// ALTER TABLE active
// ADD COLUMN aa4 INTEGER NOT null
// DEFAULT 0;
async function addField({
  tableName,
  column,
  dataType,
  defaltValue,
  comment,
  notnull,
  id,
  schema = 'public',
  connection
}) {
  let opt = {}
  if (connection.config.dialect === 'postgres') {
    tableName = `${schema}.${tableName}`
  } else {
    opt = { type: QueryTypes.RAW }
  }

  let sql = `ALTER TABLE ${tableName} ADD ${column} ${dataType}`

  if (notnull) {
    sql = `${sql} NOT NULL`
  }

  if (defaltValue) {
    sql = `${sql} default ${defaltValue}`
  }

  const res = await query({ sql, id, opt })
  if (comment) {
    const commentSql = `COMMENT on COLUMN ${tableName}.${column} is '${comment}'`
    await query({ sql: commentSql, id, opt: { type: QueryTypes.RAW } })
  }

  return res
}

async function delField({ tableName, column, schema, id, connection }) {
  let opt = {}
  if (connection.config.dialect === 'mysql') {
    opt = { type: QueryTypes.RAW }
  }
  if (schema) {
    tableName = `${schema}.${tableName}`
  }

  const dropSql = column.map((el) => {
    return `drop column ${el}`
  })
  const sql = `ALTER TABLE ${tableName} ${dropSql.join(',')}`

  return query({ sql, id, opt })
}

//语句文档地址http://www.postgres.cn/docs/9.6/ddl-alter.html
async function mysqlAlter(data) {
  if (data.dataType !== data.oldValue.dataType || data.notnull !== data.oldValue.notnull) {
    let sql = `ALTER TABLE ${data.tableName} MODIFY COLUMN ${data.column} ${data.dataType}`
    if (data.notnull) {
      sql += ` NOT NULL`
    } else {
      sql += ` NULL`
    }

    await query({
      sql,
      id: data.id,
      opt: { type: QueryTypes.RAW }
    })
  }

  if (data.column !== data.oldValue.column) {
    await query({
      sql: `ALTER TABLE ${data.tableName} CHANGE COLUMN ${data.oldValue.column} ${data.dataType}`,
      id: data.id,
      opt: { type: QueryTypes.RAW }
    })
  }
}

async function alterColumn(data) {
  if (data.connection.config.dialect === 'mysql') {
    return mysqlAlter(data)
  }
  if (data.schema) {
    data.tableName = `${data.schema}.${data.tableName}`
  }

  if (data.dataType !== data.oldValue.dataType) {
    await query({
      sql: `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} TYPE ${data.dataType} USING ${data.column}::${data.dataType}`,
      id: data.id
    })
  }

  if (data.notnull !== data.oldValue.notnull) {
    let sql = `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} SET NOT NULL`
    if (data.notnull) {
      sql = `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} DROP NOT NULL`
    }
    await query({ sql, id: data.id })
  }

  if (data.column !== data.oldValue.column) {
    await query({
      sql: `ALTER TABLE ${data.tableName} RENAME COLUMN ${data.oldValue.column} TO ${data.column}`,
      id: data.id
    })
  }
}

async function alterTable(data) {
  if (data.type === 1) {
    return addField(data)
  } else if (data.type === 2) {
    return delField(data)
  } else if (data.type === 3) {
    return alterColumn(data)
  }
}

async function addRow({ id, tableName, fields, schema }) {
  if (schema) {
    tableName = `${schema}.${tableName}`
  }
  const cols = Object.keys(fields)
  const vals = cols.map((k) => `'${fields[k]}'`)
  const sql = `
    INSERT INTO ${tableName} (${cols.join(',')})
    VALUES (${vals.join(',')});
    `

  return query({ sql, id })
}

async function delRows({ id, tableName, ids, schema }) {
  tableName = `${schema}.${tableName}`

  const sql = `delete from ${tableName} where id in (${ids})`

  return query({ sql, id })
}

async function getIndexs({ id, schema = 'public', tableName }) {
  const sql = `
      SELECT
        ns.nspname as schema_name,
        tab.relname as table_name,
        cls.relname as index_name,
        am.amname as index_type,
        idx.indisprimary as is_pk,
        idx.indisunique as is_unique,
        pg_get_indexdef(idx.indexrelid) || ';' AS columns
    FROM
        pg_index idx
    INNER JOIN pg_class cls ON cls.oid=idx.indexrelid
    INNER JOIN pg_class tab ON tab.oid=idx.indrelid
    INNER JOIN pg_am am ON am.oid=cls.relam
    INNER JOIN pg_namespace ns on ns.oid=tab.relnamespace
    WHERE ns.nspname = '${schema}' AND tab.relname = '${tableName}' LIMIT 1000
  `

  const indexs = await query({ sql, id })

  // console.log('indexs: ', indexs)

  indexs.forEach((element) => {
    // CREATE INDEX test1 ON s1.t2 USING btree (age, name);
    const match = element.columns.match(/\(([^)]+)\)/)
    if (match) {
      element.columns = match[1]
    }
  })

  // indexs = indexs.filter((el) => el.schema_name == schema)

  return {
    rows: indexs,
    columns: indexs.length
      ? Object.keys(indexs[0]).map((el) => {
          return {
            name: el
          }
        })
      : []
  }
}

//http://www.postgres.cn/docs/15/sql-createindex.html
//create index index_name on schema.table_name using btree (column_1, column_2)
async function editIndex({
  type,
  unique,
  indexName,
  schema = 'public',
  tableName,
  indexType,
  id,
  columns
}) {
  let sql
  if (type === 1) {
    //add
    sql = `
          CREATE ${unique ? 'unique' : ''} INDEX  ${indexName} on ${schema ? schema : 'public'}.${tableName} USING ${indexType ? indexType : 'btree'} (${columns.join(',')})
          `
  } else {
    //del
    sql = `
    DROP INDEX ${indexName.map((el) => `${schema}.${el}`).join(',')}
    `
  }

  return query({ sql, id })
}

//type 1-drop 2-truncate
async function editTable({ type, tableName, connection, engine = 'InnoDB', schema = 'public' }) {
  if (connection.config.dialect === 'postgres') {
    tableName = `${schema}.${tableName}`
  }

  let sql
  if (type === 1) {
    sql = `DROP TABLE ${tableName}`
  } else if (type === 2) {
    sql = `TRUNCATE ${tableName}`
  } else if (type === 3) {
    if (connection.config.dialect === 'postgres') {
      sql = `CREATE TABLE ${tableName} ()`
    } else {
      sql = `
       CREATE TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY) ENGINE=${engine}
      `
    }
  }

  return query({ sql, id: connection.id, config: connection.config, opt: { type: QueryTypes.RAW } })
}

async function editSchema({ type, schema, id }) {
  let sql
  if (type === 1) {
    sql = `DROP SCHEMA ${schema} CASCADE`
  } else {
    sql = `CREATE SCHEMA ${schema}`
  }

  return query({ sql, id })
}

async function getRoles({ id, roleName }) {
  let sql = `SELECT * FROM pg_roles`

  if (roleName) {
    sql += ` where rolname='${roleName}'`
  }

  const roles = await query({ sql, id })
  console.log('roles: ', roles)
  return roles.filter((el) => !/^pg_/.test(el.rolname))
}

// CREATE ROLE u1 NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'u1';
// GRANT ALL ON TABLE public.active TO u1;
// GRANT ALL ON TABLE public.active_label TO u1;
// GRANT SELECT ON TABLE public.active_lock_user TO u1;
// GRANT ALL ON TABLE public.active_peroid TO u1;
// GRANT DELETE, SELECT ON TABLE public.ad_sponsors TO u1;
// GRANT DELETE, SELECT ON TABLE public.admin_log TO u1;

async function createRole({ id, name, password, permissions, validuntil, oldName }) {
  console.log('create role: ', arguments)
  if (oldName) {
    return editRole({ id, name, password, permissions, validuntil, oldName })
  }

  const pStr = permissions.join(' ')
  let sql = `CREATE ROLE ${name} ${pStr} PASSWORD '${password}'`

  if (validuntil) {
    sql += ' VALID UNTIL ' + `'${moment(validuntil).format('YYYY-MM-DD HH:mm:ss')}'`
  }

  return query({ sql, id })
}

async function delRole({ id, roleName }) {
  const transaction = await dbMap[id].transaction()

  try {
    await revokeAllPermission({ roleName, id, transaction })

    await await query({
      id,
      sql: `DROP ROLE ${roleName}`,
      opt: { type: QueryTypes.RAW, transaction }
    })

    await transaction.commit()
    return true
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

async function editRole({ id, name, password, permissions, validuntil, oldName }) {
  const roles = await getRoles({ id, roleName: oldName })
  const role = roles[0]

  const transaction = await dbMap[id].transaction()

  try {
    if (!/^\*+\*$/.test(password)) {
      await query({
        id,
        sql: `ALTER ROLE ${role.rolname} WITH PASSWORD '${password}'`,
        opt: { type: QueryTypes.RAW, transaction }
      })
    }

    const oldPermission: string[] = []
    Object.keys(RolePermissionMap).forEach((el) => {
      if (role[el]) {
        oldPermission.push(RolePermissionMap[el])
      }
    })

    const addPermission = _.difference(permissions, oldPermission)
    const delPermission = _.difference(oldPermission, permissions)

    console.log('permission diff: ', addPermission, delPermission)

    if (addPermission.length) {
      await query({
        id,
        sql: `ALTER ROLE ${role.rolname} WITH ${addPermission.join(' ')}`,
        opt: { type: QueryTypes.RAW, transaction }
      })
    }

    if (delPermission.length) {
      await query({
        id,
        sql: `ALTER ROLE ${role.rolname} ${delPermission.map((el) => `NO${el}`).join(' ')}`,
        opt: { type: QueryTypes.RAW, transaction }
      })
    }

    if (role.rolname !== name) {
      await query({
        id,
        sql: `ALTER ROLE ${role.rolname} RENAME TO ${name}`,
        opt: { type: QueryTypes.RAW, transaction }
      })
    }

    await query({
      id,
      sql: validuntil
        ? `ALTER ROLE ${role.rolname} VALID UNTIL '${moment(validuntil).format('YYYY-MM-DD HH:mm:ss')}'`
        : `ALTER ROLE ${role.rolname} VALID UNTIL 'infinity'`,
      opt: { type: QueryTypes.RAW, transaction }
    })

    await transaction.commit()
  } catch (error) {
    console.log('edit role err: ', error)
    await transaction.rollback()
    throw error
  }
}

type GrantRoleType = {
  id: string
  roleName: string
  tables: IGrantRole[]
  permissions: string[]
  schemas: string[]
  type: number
}

async function getRolePermission({ id, roleName }) {
  // REFERENCES,INSERT,SELECT,UPDATE,DELETE,TRUNCATE,TRIGGER
  const sql = `
      SELECT
        table_name,grantee, table_schema, string_agg(privilege_type, ',')
    FROM
        information_schema.role_table_grants
    WHERE
        grantee = '${roleName}'  group by table_name,grantee, table_schema
  `

  return query({ sql, id })
}

async function revokeAllPermission({ roleName, id, transaction }) {
  const sql = `
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT schemaname, tablename FROM pg_tables) LOOP
              EXECUTE 'REVOKE ALL PRIVILEGES ON ' || r.schemaname || '.' || r.tablename || ' FROM ${roleName}';
          END LOOP;
      END $$;
  `

  await query({ sql, id, opt: { type: QueryTypes.RAW, transaction } })
}

async function grantSchemaPermission({ id, transaction, schema, roleName, permissions }) {
  const sql = `
  DO $$
  DECLARE
      r RECORD;
  BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '${schema}') LOOP
          EXECUTE 'GRANT ${permissions.join(',')} ON ${schema}.' || r.tablename || ' TO ${roleName}';
      END LOOP;
  END $$;
  `
  await query({ sql, id, opt: { type: QueryTypes.RAW, transaction } })
}

//type 1-修改多表 2-修改单个表
async function grantRolePermission({
  id,
  roleName,
  tables,
  schemas,
  permissions,
  type = 1
}: GrantRoleType) {
  if (!roleName) {
    throw new Error(`grant permisson error: role not exist`)
  }

  const transaction = await dbMap[id].transaction()
  try {
    if (type === 1) {
      await revokeAllPermission({ id, roleName, transaction })
    }

    if (!permissions.length) {
      return true
    }

    for (const s of schemas) {
      await grantSchemaPermission({ id, roleName, schema: s, transaction, permissions })
    }

    if (tables.length) {
      const sql = `GRANT ${permissions.join(',')} ON ${tables.join(',')} TO ${roleName}`

      await query({
        sql,
        id,
        opt: {
          type: QueryTypes.RAW,
          transaction
        }
      })
    }

    await transaction.commit()
    return true
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export {
  delRole,
  getRolePermission,
  grantRolePermission,
  createRole,
  getRoles,
  editSchema,
  clearDb,
  getTables,
  updateDate,
  query,
  getColums,
  getTableData,
  getSchema,
  backup,
  restore,
  createDb,
  alterTable,
  delRows,
  addRow,
  closeConnection,
  getIndexs,
  editIndex,
  editTable,
  getExportData
}
