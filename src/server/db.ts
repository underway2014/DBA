import { QueryTypes, Sequelize } from 'sequelize'
import * as _ from 'lodash'
import path from 'path'
import { app } from 'electron'
import moment from 'moment'
// const sequelize = new Sequelize({
//     host: '127.0.0.1',
//     port: 5432,
//     username: 'postgres',
//     password: 'postgres',
//     dialect: 'postgres',
//     database: 'db'
// })
// await sequelize.authenticate();

const dbMap = {}
let execa
let currentDb

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
    const works = Object.keys(dbMap).map((k) => dbMap[k].close())

    return Promise.all(works)
  }
}

function initDb({ id, config }) {
  let db = dbMap[id]

  if (!db) {
    db = new Sequelize(config)
  }

  dbMap[id] = db
  currentDb = db

  return db
}

// async function testConnection(db) {
//     try {
//         await db.authenticate();
//       } catch (error) {
//         console.error('Unable to connect to the database:', error);
//       }
// }

async function getSchema({ id, config }) {
  initDb({ id, config })

  const sql = `
    select schema_name as name from information_schema.schemata
    `

  return query({ sql })
}

async function getColums({ tableName, id }) {
  selectDB(id)
  const sql = `
    SELECT
        table_name,
        column_name,
        data_type,
        column_default
    FROM
    information_schema.columns
    WHERE
    table_name = '${tableName}' LIMIT 1000
    `

  const columns = await query({ sql })

  // let idEl = null
  // columns = columns.filter((el) => {
  //   if (el.column_name === 'id') {
  //     idEl = el
  //     return false
  //   }
  //   return true
  // })

  // columns = _.sortBy(columns, ['column_name'])

  // if (idEl) {
  //   columns.unshift(idEl)
  // }

  return columns
}

//select oid from pg_class where relname='active_lock_user' //可以查出tabelId
async function getTables({ id, config, schema = 'public' }) {
  initDb({ id, config })
  const tables = await currentDb.query(
    `select table_name from information_schema.tables where table_schema='${schema}' LIMIT 1000`
  )

  return _.sortBy(tables[0], ['table_name'])
}

async function getRowAndColumns({ sql, total, page, pageSize }) {
  const res = { rows: [], columns: [], total }
  if (!total) {
    if (!/\blimit\b/i.test(sql)) {
      const totalSql = sql
        .replace(/(?<=select).*?(?=from)/i, ' count(*) count ')
        .replace(/order by.*(asc|desc)/i, '')
        .replace(/order by.*(?=limit)/i, '')
        .replace(/order by.*/i, '')

      const totalRes = await query({ sql: totalSql })

      res.total = totalRes[0].count || 0
    }
  }

  if (page && pageSize && !/\blimit\b/i.test(sql)) {
    sql = `
            ${sql}
            limit ${pageSize}
                `
    if (!/\boffset\b/i.test(sql)) {
      sql = `
                ${sql}
                offset ${pageSize * (page - 1)}
                `
    }
  }

  const data = await currentDb.query(sql, { type: QueryTypes.RAW })
  res.rows = data[0]
  res.columns = data[1].fields

  return res
}

async function query({ sql }) {
  console.log('query sql: ', sql)
  const data = await currentDb.query(sql, { type: QueryTypes.SELECT })

  return data
}

function selectDB(id) {
  initDb({ id, config: null })
}

// tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3] sql: ''
async function getTableData(data) {
  selectDB(data.id)

  if (/(pg_terminate_backend|nextval)\(/i.test(data.sql)) {
    return query({ sql: data.sql })
  }

  if (/show\s+max_connections/i.test(data.sql)) {
    const rows = await query({ sql: data.sql })
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
      pageSize: data.pageSize
    })
  } else {
    return query({ sql: data.sql })
  }
}

async function updateOneField({ tableName, id, field, value }) {
  const sql = `
    update ${tableName} set ${field} = '${value}'
    where id = ${id}
    `

  await query({ sql })
}

async function updateDate({ tableName, id, data, type }) {
  if (type === 2) {
    return updateOneField({ tableName, id, ...data })
  }
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
    where id = ${id}
    `

  await query({ sql })
}

function getAppPath() {
  let appPath = app.getAppPath()
  if (process.env.NODE_ENV !== 'development') {
    appPath += '.unpacked'
  }

  return appPath
}

// type 1-struct 2-struct and data
async function restore({ type, connection, dbName, sqlPath }) {
  const pgPath = getToolPath({ type: 3 })

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

//type 1-database 2-table
async function backup({ type, config }) {
  const pgPath = getToolPath({ type: 2 })
  const downPath = path.join(
    app.getPath('downloads'),
    `${config.config.database}_${moment().format('YYYYMMDDHHmmss')}.dba`
  )

  const res = await execa({
    env: { PGPASSWORD: config.config.password }
  })`${pgPath} ${['-U', config.config.username, '-h', config.config.host, '-p', config.config.port, '-Fc', '-f', downPath, config.config.database]}`
  // const res = await execa({env: {PGPASSWORD: config.config.password}})`${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} -f ${downPath}`
  // const res = await execa({env: {PGPASSWORD: config.config.password}})`${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} -f ${downPath}`

  return {
    code: res?.exitCode,
    path: downPath,
    dbName: config.config.database
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
function getToolPath({ type }) {
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

  if (os === 'win') {
    tool += '.exe'
  }

  const toolPath = path.join(appPath, 'resources', 'bin', os, tool)

  // if(os === 'win') {
  //     toolPath = toolPath.replace()
  // }

  return toolPath
}

;(async function initExeca() {
  execa = (await import('execa')).execa
})()

async function createDb({ dbName, connection }) {
  const pgPath = getToolPath({ type: 1 })
  const res = await execa({
    env: { PGPASSWORD: connection.config.password }
  })`${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} ${dbName}`
  return {
    code: res.exitCode,
    dbName
  }
}

// ALTER TABLE active
// ADD COLUMN aa4 INTEGER NOT null
// DEFAULT 0;
async function addField({ tableName, column, dataType, defaltValue, comment, notnull }) {
  let sql = `ALTER TABLE ${tableName} ADD ${column} ${dataType}`

  if (notnull) {
    sql = `${sql} NOT NULL`
  }

  if (defaltValue) {
    sql = `${sql} default ${defaltValue}`
  }

  const res = await query({ sql })
  if (comment) {
    const commentSql = `COMMENT on COLUMN ${tableName}.${column} is '${comment}'`
    await query({ sql: commentSql })
  }

  return res
}

async function delField({ tableName, column }) {
  const dropSql = column.map((el) => {
    return `drop column ${el}`
  })
  const sql = `ALTER TABLE ${tableName} ${dropSql.join(',')}`

  return query({ sql })
}
//语句文档地址http://www.postgres.cn/docs/9.6/ddl-alter.html
async function alterColumn(data) {
  if (data.dataType !== data.oldValue.dataType) {
    await query({
      sql: `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} TYPE ${data.dataType} USING ${data.column}::${data.dataType}`
    })
  }

  if (data.notnull !== data.oldValue.notnull) {
    let sql = `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} SET NOT NULL`
    if (data.notnull) {
      sql = `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} DROP NOT NULL`
    }
    const res = await query({ sql })
  }

  if (data.column !== data.oldValue.column) {
    await query({
      sql: `ALTER TABLE ${data.tableName} RENAME COLUMN ${data.oldValue.column} TO ${data.column}`
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

async function addRow({ id, tableName, fields }) {
  selectDB(id)
  const cols = Object.keys(fields)
  const vals = cols.map((k) => `'${fields[k]}'`)
  const sql = `
    INSERT INTO ${tableName} (${cols.join(',')})
    VALUES (${vals.join(',')});
    `

  return query({ sql })
}

async function delRows({ id, tableName, ids }) {
  selectDB(id)

  const sql = `
    delete from ${tableName} where id in (${ids})
    `

  return query({ sql })
}

async function getIndexs({ id, schema, tableName }) {
  selectDB(id)
  const sql = `
      select 
        c.relnamespace::regnamespace as schema_name,
        c.relname as table_name,
        i.indexrelid::regclass as index_name,
        i.indisprimary as is_pk,
        i.indisunique as is_unique
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    where c.relname = '${tableName}' LIMIT 100
  `

  const indexs = await query({ sql })

  console.log('indexs: ', indexs)

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
async function editIndex({ type, unique, indexName, schema, tableName, indexType, columns }) {
  let sql
  if (type === 1) {
    //add
    sql = `
CREATE ${unique ? 'unique' : ''} INDEX  ${indexName} on ${schema ? schema : 'public'}.${tableName} USING ${indexType ? indexType : 'btree'} (${columns.join(',')})
`
  } else {
    //del
    sql = `
    DROP INDEX ${indexName}
    `
  }

  console.log('edit index sql: ', sql)

  return query({ sql })
}

//type 1-drop 2-truncate
async function editTable({ type, tableName, id }) {
  selectDB(id)
  let sql
  if (type === 1) {
    sql = `DROP TABLE ${tableName}`
  } else {
    sql = `TRUNCATE ${tableName}`
  }

  return query({ sql })
}

export {
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
  editTable
}
