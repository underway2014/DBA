import { QueryTypes } from 'sequelize'
import { query } from './db'

export default class Mysql {
  static async delRows({ id, tableName, ids }) {
    const sql = `delete from ${tableName} where id in (${ids})`

    return query({ sql, id, opt: { type: QueryTypes.RAW } })
  }

  static async addRow({ id, tableName, fields }) {
    const cols = Object.keys(fields)
    const vals = cols.map((k) => `'${fields[k]}'`)
    const sql = `
      INSERT INTO ${tableName} (${cols.join(',')})
      VALUES (${vals.join(',')});
      `

    return query({ sql, id, opt: { type: QueryTypes.RAW } })
  }

  static async editTable({ type, tableName, connection, engine = 'InnoDB' }) {
    let sql
    if (type === 1) {
      sql = `DROP TABLE ${tableName}`
    } else if (type === 2) {
      sql = `TRUNCATE ${tableName}`
    } else if (type === 3) {
      sql = `
         CREATE TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY) ENGINE=${engine}
        `
    }

    return query({
      sql,
      id: connection.id,
      config: connection.config,
      opt: { type: QueryTypes.RAW }
    })
  }

  static async getColums({ tableName, id, dbName }) {
    const sql = `
    SELECT LOWER(COLUMN_NAME) as name
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${tableName}' LIMIT 500;
    `

    const columns = await query({ sql, id })

    return columns
  }

  static async createDb({ dbName, character, collate, connection }) {
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

  static async addField({ tableName, column, dataType, defaltValue, comment, notnull, id }) {
    const opt = { type: QueryTypes.RAW }

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

  static async alterColumn(data) {
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
}
