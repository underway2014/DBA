import { app } from 'electron'
import { execa, initDb, query } from './db'
import path from 'path'
import moment from 'moment'
import { QueryTypes } from 'sequelize'

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

  static getAppPath() {
    let appPath = app.getAppPath()
    if (process.env.NODE_ENV !== 'development') {
      appPath += '.unpacked'
    }

    return appPath
  }
  static getPlatform() {
    switch (process.platform) {
      case 'win32':
        return 'win'
      default:
        return 'mac'
    }
  }

  static async getToolPath({ type }) {
    const appPath = this.getAppPath()
    const os = this.getPlatform()
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

  static async restore({ type, connection, sqlPath }) {
    initDb({ id: connection.id, config: connection.config })
    const pgPath = await this.getToolPath({ type: 3 })

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

  static async backup({ connection }) {
    initDb({ id: connection.id, config: connection.config })

    // console.log('versionRes: ', versionRes, typeof versionRes)
    const pgPath = await this.getToolPath({ type: 2 })
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

    const pgPath = await this.getToolPath({ type: 1 })
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
    defaltValue,
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

    if (defaltValue) {
      sql = `${sql} default ${defaltValue}`
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
  }
}