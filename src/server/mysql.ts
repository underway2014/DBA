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

  static async getIndexs({ id, dbName, tableName }) {
    const sql = `
        SELECT 
          TABLE_NAME,          -- 表名
          INDEX_NAME,          -- 索引名
          COLUMN_NAME,         -- 索引的列名
          NON_UNIQUE,          -- 是否唯一索引 0 表示唯一 1 表示非唯一）
          INDEX_TYPE,          -- 索引类型（如 BTREE、FULLTEXT 等）
          SEQ_IN_INDEX,        -- 列在索引中的顺序
          COLLATION,           -- 列的排序方式 A=升序NULL=无序）
          CARDINALITY,         -- 索引基数（估计的唯一值数）
          SUB_PART,            -- 索引列的前缀长度（若为 NULL则表示完整列
          PACKED,              -- 是否压缩
          NULLABLE,            -- 列是否允许 NULL
          COMMENT              -- 索引注释
      FROM 
          information_schema.STATISTICS
      WHERE 
          TABLE_SCHEMA = '${dbName}'  -- 替换为你的数据库名
          AND TABLE_NAME = '${tableName}'  -- 如果
    `

    const indexs = await query({ sql, id })

    console.log('indexs: ', indexs)

    // indexs.forEach((element) => {
    //   // CREATE INDEX test1 ON s1.t2 USING btree (age, name);
    //   const match = element.columns.match(/\(([^)]+)\)/)
    //   if (match) {
    //     element.columns = match[1]
    //   }
    // })

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

  static async editIndex({ type, unique, indexName, tableName, indexType, id, columns }) {
    console.log('edit indexs indexName: ', indexName)
    let sql
    if (type === 1) {
      //add
      sql = `
            CREATE ${unique ? 'unique' : ''} INDEX  ${indexName} USING ${indexType} on ${tableName}(${columns.join(',')})
            `
      return query({ sql, id, opt: { type: QueryTypes.RAW } })
    } else {
      //del
      const works = indexName.map((el) => {
        return query({
          sql: `DROP INDEX ${el} on ${tableName}`,
          id,
          opt: { type: QueryTypes.RAW }
        })
      })

      return Promise.all(works)
    }
  }
}
