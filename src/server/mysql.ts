import { QueryTypes } from 'sequelize'
import { initDb, query, execa } from './db'
import { app } from 'electron'
import Common from './common'
import path from 'path'
import moment from 'moment'

export default class Mysql {
  //db dump MYSQL_PWD=root mysqldump -h 127.0.0.1 -P 3306 -u root dd2 > test/dd3.sql
  //mysqldump -u root -p --no-data my_database > my_database_structure.sql  只备份结构
  static async restore({ type, connection, sqlPath }) {
    initDb({ id: connection.id, config: connection.config })
    const pgPath = await Common.getMysqlPath({ type: 2 })

    // if (type === 1) {
    //只恢复结构
    // res = await execa({
    //   env: { MYSQL_PWD: connection.config.password }
    // })`sed '/^INSERT INTO /d' ${sqlPath}`
    //   .pipe`${pgPath} ${['-h', connection.config.host, '-P', connection.config.port, '-u', connection.config.username, connection.config.database, '--execute', 'source ' + sqlPath]}`
    // } else {
    const res = await execa({
      env: { MYSQL_PWD: connection.config.password }
    })`${pgPath} ${['-h', connection.config.host, '-P', connection.config.port, '-u', connection.config.username, connection.config.database, '--execute', 'source ' + sqlPath]}`
    // }
    // mysql -h 127.0.0.1 -P 3306 -u root -p ddd1 --execute "source /Users/apple/Downloads/dd2_mysql_20241210171722.sql"
    // mysql -u root -p --execute "source /path/to/all_databases_backup.sql"
    // /Users/apple/Downloads/dd2_mysql_20241210171722.sql
    // MYSQL_PWD=root mysql -h 127.0.0.1 -P 3306 -u root ddd1 --execute "SET FOREIGN_KEY_CHECKS=0;source /Users/apple/Downloads/dd2_mysql_20241210171722.sql;SET FOREIGN_KEY_CHECKS=1;"
    // mysql -u 用户名 -p 数据库名 --execute="SET FOREIGN_KEY_CHECKS=0; source full_backup.sql; SET FOREIGN_KEY_CHECKS=1;"

    return {
      code: res.exitCode,
      dbName: connection.config.database,
      path: sqlPath
    }
  }

  static async backup({ connection }) {
    initDb({ id: connection.id, config: connection.config })

    // console.log('versionRes: ', versionRes, typeof versionRes)
    const pgPath = await Common.getMysqlPath({ type: 1 })
    const downPath = path.join(
      app.getPath('downloads'),
      `${connection.config.database}_mysql_${moment().format('YYYYMMDDHHmmss')}.sql`
    )

    const res = await execa({
      env: { MYSQL_PWD: connection.config.password }
    })`${pgPath} ${['-h', connection.config.host, '-P', connection.config.port, '-u', connection.config.username, connection.config.database, '--result-file', downPath]}`

    return {
      code: res?.exitCode,
      path: downPath,
      dbName: connection.config.database
    }
  }

  // mysql -u root -p my_database < my_database_backup.sql  恢复数据库

  static async delRows({ id, tableName, ids, primaryKey = 'id', cascade = false }) {
    // 如果是字符串类型的主键值，需要加引号
    const processedIds = ids.map((item: any) => {
      if (typeof item === 'string') {
        return `'${item}'`
      }
      return item
    })

    // 如果是级联删除，先获取所有引用该表的外键表并删除
    if (cascade) {
      // 先查询所有引用该表的外键约束
      const dbName = (await query({ sql: 'SELECT DATABASE() as db', id, opt: { type: QueryTypes.RAW } }))[0]?.db
      const fkSql = `
        SELECT
          TABLE_SCHEMA,
          TABLE_NAME,
          COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_SCHEMA = '${dbName}'
          AND REFERENCED_TABLE_NAME = '${tableName}'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `
      const fks = await query({ sql: fkSql, id })
      // 删除引用记录
      for (const fk of fks) {
        const refSql = `delete from ${fk.TABLE_NAME} where ${fk.COLUMN_NAME} in (${processedIds.join(',')})`
        await query({ sql: refSql, id, opt: { type: QueryTypes.RAW } })
      }
    }

    const sql = `delete from ${tableName} where ${primaryKey} in (${processedIds.join(',')})`

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

  static async addField({ tableName, column, dataType, defaltValue, comment, isNullable, id }) {
    const opt = { type: QueryTypes.RAW }

    let sql = `ALTER TABLE ${tableName} ADD ${column} ${dataType}`

    if (isNullable) {
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
    if (data.dataType !== data.oldValue.dataType || data.isNullable !== data.oldValue.isNullable) {
      let sql = `ALTER TABLE ${data.tableName} MODIFY COLUMN ${data.column} ${data.dataType}`
      if (data.isNullable) {
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

  // 获取当前表拥有的外键（当前表引用其他表）
  static async getForeignKeys({ id, dbName, tableName }) {
    const sql = `
      SELECT
        CONSTRAINT_NAME AS constraint_name,
        TABLE_SCHEMA AS table_schema,
        TABLE_NAME AS table_name,
        COLUMN_NAME AS column_name,
        REFERENCED_TABLE_SCHEMA AS foreign_table_schema,
        REFERENCED_TABLE_NAME AS foreign_table_name,
        REFERENCED_COLUMN_NAME AS foreign_column_name
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbName}'
        AND TABLE_NAME = '${tableName}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `

    const foreignKeys = await query({ sql, id })

    return {
      rows: foreignKeys,
      columns: foreignKeys.length
        ? Object.keys(foreignKeys[0]).map((el) => ({ name: el }))
        : []
    }
  }

  // 删除外键约束
  static async delForeignKey({ id, tableName, constraintName }) {
    const sql = `ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraintName}`
    return query({ sql, id, opt: { type: QueryTypes.RAW } })
  }

  // 获取引用当前表的外键（用于级联删除检查）
  static async getReferencingForeignKeys({ id, dbName, tableName }) {
    const sql = `
      SELECT
        CONSTRAINT_NAME AS constraint_name,
        TABLE_SCHEMA AS table_schema,
        TABLE_NAME AS table_name,
        COLUMN_NAME AS column_name,
        REFERENCED_TABLE_SCHEMA AS foreign_table_schema,
        REFERENCED_TABLE_NAME AS foreign_table_name,
        REFERENCED_COLUMN_NAME AS foreign_column_name
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = '${dbName}'
        AND REFERENCED_TABLE_NAME = '${tableName}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `

    const foreignKeys = await query({ sql, id })

    return {
      rows: foreignKeys,
      columns: foreignKeys.length
        ? Object.keys(foreignKeys[0]).map((el) => ({ name: el }))
        : []
    }
  }
}
