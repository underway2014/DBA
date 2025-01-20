import { QueryTypes, Sequelize, Transaction } from 'sequelize'
import * as _ from 'lodash'
import moment from 'moment'
import { IConnection, IGrantRole } from '../renderer/src/interface'
import { DataBase, RolePermissionMap } from '../renderer/src/utils/constant'
import Mysql from './mysql'
import Postgres from './postgres'

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
;(async function initExeca() {
  execa = (await import('execa')).execa
})()

async function clearDb({ id }) {
  if (dbMap[id]) {
    try {
      const con = dbMap[id]
      await con.close()

      delete dbMap[id]
    } catch (error) {}
  }
}

async function closeConnection(data?) {
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
    const db = new Sequelize({
      ...config
      // dialectOptions: {
      //   // ssl: {
      //   //   require: true,
      //   //   rejectUnauthorized: false
      //   // }
      // }
    })
    obj = { db, config }
  }

  dbMap[id] = obj

  return obj.db
}

async function query({ sql, id, opt = {}, config }: QueryType) {
  const db = initDb({ id, config })

  if (/^\s*\b(update|delete)\b/gi.test(sql)) {
    Object.assign(opt, { type: QueryTypes.UPDATE })
  }

  const data = await db.query(sql, { type: QueryTypes.SELECT, ...opt })
  return data
}

function isMysql(data) {
  if (data.id && dbMap[data.id]) {
    if (dbMap[data.id].config.dialect === DataBase.MYSQL) {
      return true
    }

    return false
  }

  if (data.connection.config.dialect === DataBase.MYSQL) {
    return true
  }

  return false
}

// async function testConnection(db) {
//     try {
//         await db.authenticate();
//       } catch (error) {
//         console.error('Unable to connect to the database:', error);
//       }
// }

async function getSchema(data) {
  return Postgres.getSchema(data)
}

async function getColums(data) {
  if (isMysql(data)) {
    return Mysql.getColums(data)
  }

  return Postgres.getColums(data)
}

//select oid from pg_class where relname='active_lock_user' //可以查出tabelId
async function getTables({ id, schema = 'public', config }) {
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
  sql = sql.replace(/(;|\uFF1B)\s*$/, '')
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
            .replace(/order\s+by.*(asc|desc)/i, '')
            .replace(/order\s+by.*(?=limit)/i, '')
            .replace(/order\s+by.*/i, '')

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

  if (isMysql({ id })) {
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
  } else {
    const data = await query({ sql, opt: { type: QueryTypes.RAW }, id })
    res.rows = data[0]
    res.columns = data[1].fields
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

// tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3] sql: ''
async function getDDL(data) {
  return Postgres.getDDL(data)
}

async function getTableData(data) {
  // await Postgres.getDDL(data)
  if (/(select\s+pg_terminate_backend)\(/i.test(data.sql)) {
    return query({ sql: data.sql, id: data.id })
  }

  if (/show\s+max_connections\b/i.test(data.sql)) {
    const rows = await query({ sql: data.sql, id: data.id })
    return {
      rows,
      columns: [{ name: 'max_connections' }]
    }
  }
  if (/select\s+nextval\(/i.test(data.sql)) {
    const rows = await query({ sql: data.sql, id: data.id })
    return {
      rows,
      columns: [{ name: 'nextval' }]
    }
  }

  if (/^\s*select\b/i.test(data.sql)) {
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

// type 1-struct 2-struct and data
async function restore(data) {
  if (isMysql(data)) {
    return Mysql.restore(data)
  } else {
    return Postgres.restore(data)
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
async function backup(data) {
  if (isMysql(data)) {
    return Mysql.backup(data)
  } else {
    return Postgres.backup(data)
  }
}

async function createDb(data) {
  if (isMysql(data)) {
    return false
  } else {
    return Postgres.createDb(data)
  }
}

// ALTER TABLE active
// ADD COLUMN aa4 INTEGER NOT null
// DEFAULT 0;
// {
//   tableName,
//   column,
//   dataType,
//   defaltValue,
//   comment,
//   notnull,
//   id,
//   schema = 'public',
//   connection
// }
async function addField(data) {
  if (isMysql(data)) {
    return Mysql.addField(data)
  }

  return Postgres.addField(data)
}

async function delField({ tableName, column, schema, id, connection }) {
  let opt = {}
  if (isMysql({ connection })) {
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
  if (isMysql(data)) {
    return Mysql.alterColumn(data)
  }

  return Postgres.alterColumn(data)
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
  if (dbMap[id].config.dialect === DataBase.MYSQL) {
    return Mysql.addRow({ id, tableName, fields })
  }

  return Postgres.addRow({ id, tableName, fields, schema })
}

async function delRows({ id, tableName, ids, schema }) {
  if (dbMap[id].config.dialect === DataBase.MYSQL) {
    return Mysql.delRows({ id, tableName, ids })
  }

  return Postgres.delRow({ id, tableName, ids, schema })
}

async function getIndexs(data) {
  if (isMysql(data)) {
    return Mysql.getIndexs(data)
  }

  return Postgres.getIndexs(data)
}

//http://www.postgres.cn/docs/15/sql-createindex.html
//create index index_name on schema.table_name using btree (column_1, column_2)
async function editIndex(data) {
  if (isMysql(data)) {
    return Mysql.editIndex(data)
  }

  return Postgres.editIndex(data)
}

//type 1-drop 2-truncate
async function editTable({ type, tableName, connection, engine, schema }) {
  if (connection.config.dialect === DataBase.MYSQL) {
    return Mysql.editTable({ type, tableName, connection, engine })
  }

  return Postgres.editTable({ type, tableName, connection, schema })
}

async function editSchema(data) {
  return Postgres.editSchema(data)
}

async function getRoles(data) {
  return Postgres.getRoles(data)
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
  execa,
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
  initDb,
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
  getExportData,
  getDDL
}
