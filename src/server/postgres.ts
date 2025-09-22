import { app } from 'electron'
import { execa, initDb, query } from './db'
import path from 'path'
import moment from 'moment'
import { QueryTypes } from 'sequelize'
import Common from './common'

const defaultSchemas = ['information_schema', 'pg_catalog', 'pg_toast']

export default class Postgres {
  static async delRow({ id, tableName, ids, schema }) {
    tableName = `${schema}.${tableName}`
    const sql = `delete from ${tableName} where id in (${ids})`

    return query({ sql, id })
  }

  static async addRow({ id, tableName, fields, schema }) {
    tableName = `${schema}.${tableName}`
    const cols = Object.keys(fields)
    const vals = cols.map((k) => `'${fields[k]}'`)
    const sql = `
      INSERT INTO ${tableName} (${cols.join(',')})
      VALUES (${vals.join(',')});
      `

    return query({ sql, id })
  }

  static async editTable({ type, tableName, connection, schema = 'public' }) {
    tableName = `${schema}.${tableName}`

    let sql
    if (type === 1) {
      sql = `DROP TABLE ${tableName}`
    } else if (type === 2) {
      sql = `TRUNCATE ${tableName}`
    } else if (type === 3) {
      sql = `CREATE TABLE ${tableName} ()`
    }

    return query({
      sql,
      id: connection.id,
      config: connection.config
      // opt: { type: QueryTypes.RAW }
    })
  }

  static async editSchema({ type, schema, id }) {
    let sql
    if (type === 1) {
      sql = `DROP SCHEMA ${schema} CASCADE`
    } else {
      sql = `CREATE SCHEMA ${schema}`
    }

    return query({ sql, id })
  }

  static async getRoles({ id, roleName }) {
    let sql = `SELECT * FROM pg_roles`

    if (roleName) {
      sql += ` where rolname='${roleName}'`
    }

    const roles = await query({ sql, id })
    return roles.filter((el) => !/^pg_/.test(el.rolname))
  }

  static async getColums({ tableName, id, schema }) {
    const sql = `
    SELECT column_name as name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = '${schema}' AND table_name = '${tableName}' LIMIT 500
    `

    const columns = await query({ sql, id })

    return columns
  }

  static async getSchema({ id, config }) {
    const sql = `select schema_name as name from information_schema.schemata`

    const schemas = await query({ sql, id, config })

    return schemas.filter((el) => !defaultSchemas.includes(el.name))
  }

  static async restore({ type, connection, sqlPath }) {
    initDb({ id: connection.id, config: connection.config })
    const pgPath = await Common.getPostgresToolPath({ type: 3 })

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

  static async getDDL({ connection, tableName, schema }) {
    // ./pg_dump -U postgres -h 127.0.0.1 -d postgres -t game_bet --schema-only
    const pgPath = await Common.getPostgresToolPath({ type: 2 })

    tableName = `${schema}.${tableName}`

    const res = await execa({
      env: { PGPASSWORD: connection.config.password }
    })`${pgPath} ${['-U', connection.config.username, '-h', connection.config.host, '-p', connection.config.port, '-d', connection.config.database, '-t', tableName, '--schema-only']}`

    let sql = res.stdout.match(/CREATE([^;]*);/i)[0]
    const primaryKey = res.stdout.match(/PRIMARY KEY ([^;]*)/i)[0]
    console.log('primarykey: ', primaryKey)
    sql = sql.replace('\n);', `,\n   ${primaryKey}\n);`)
    const comments = res.stdout.match(/COMMENT ON COLUMN [^;]+;/gi)
    // CREATE INDEX name_index ON public.active USING btree (name)
    // CREATE INDEX cycle_status_test_index ON public.active USING btree (cycle, status);
    const indexSql = res.stdout.match(/CREATE INDEX ([^;]*);/gi)
    return `${sql}\n\n
    ${indexSql?.length ? indexSql.join('\n') : ''}\n\n
    ${comments?.length ? comments.join('\n') : ''}`

    // const regex = /--\n-- Name[^;]+--[^;]+;/g
    // const result = res.stdout.replace(regex, '')

    // return result
  }

  static async backup({ connection }) {
    initDb({ id: connection.id, config: connection.config })

    // console.log('versionRes: ', versionRes, typeof versionRes)
    const pgPath = await Common.getPostgresToolPath({ type: 2 })
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

  static async createDb(data) {
    const { connection } = data
    initDb({ id: connection.id, config: connection.config })

    const pgPath = await Common.getPostgresToolPath({ type: 1 })
    const res = await execa({
      env: { PGPASSWORD: connection.config.password }
    })`${pgPath} ${['-U', connection.config.username, '-h', connection.config.host, '-p', connection.config.port, data.dbName]}`

    return {
      code: res.exitCode,
      dbName: data.dbName
    }
  }

  static async addField({
    tableName,
    column,
    dataType,
    defaultValue,
    comment,
    notnull,
    id,
    schema = 'public'
  }) {
    tableName = `${schema}.${tableName}`

    let sql = `ALTER TABLE ${tableName} ADD ${column} ${dataType}`

    if (notnull) {
      sql = `${sql} NOT NULL`
    }

    if (defaultValue) {
      if (/nextval/.test(defaultValue)) {
        // a.replace(/(nextval\(|:|regclass\)|')/ig, '')
        const nextSql = `ALTER SEQUENCE game_bet_id_seq1 RENAME TO game_bet_id_seq`
      } else {
        sql = `${sql} default '${defaultValue}'`
      }
    }

    const res = await query({ sql, id })
    if (comment) {
      const commentSql = `COMMENT on COLUMN ${tableName}.${column} is '${comment}'`
      await query({ sql: commentSql, id, opt: { type: QueryTypes.RAW } })
    }

    return res
  }

  static async alterColumn(data) {
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

    if (data.defaultValue !== data.oldValue.defaultValue) {
      await query({
        sql: `ALTER TABLE ${data.tableName}
              ALTER COLUMN ${data.column}
              SET DEFAULT '${data.defaultValue}'`,
        id: data.id
      })
    }
  }

  static async getIndexs({ id, schema = 'public', tableName }) {
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

  static async editIndex({
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
}
