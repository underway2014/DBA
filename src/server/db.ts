import {  QueryTypes, Sequelize } from "sequelize";
import * as _ from 'lodash'
import { $ } from 'zx'
import path from "path";
import { app } from "electron";


// import { getConnections } from "./lib/wrjson";
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
let currentDb

function clearDb({id}) {
    console.log('cleardb: ',id, dbMap)
    delete dbMap[id]
    console.log('after cleardb: ',id, dbMap)
}

function initDb({id, config}) {
    console.log('init db: ', id, config, dbMap)
    console.log('init db: ', id, config, dbMap)
    console.log('init db: ', id, config, dbMap)
    let db = dbMap[id]

    if(!db){
        db = new Sequelize(config)
    }

    dbMap[id] = db
    currentDb = db

    return db
}

async function getSchema({id, config}) {
      initDb({id, config})

    let sql = `
    select schema_name as name from information_schema.schemata
    `

    return query({sql})
}

async function getColums(tableName) {
    let sql = `
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

    let columns = await query({sql})

    let idEl = null
    columns = columns.filter(el => {
        if(el.column_name === 'id') {
            idEl = el
            return false
        }
        return true
    })
    

    columns = _.sortBy(columns, ['column_name'])

    if(idEl) {
        columns.unshift(idEl)
    }

    return columns
}

//select oid from pg_class where relname='active_lock_user' //可以查出tabelId
async function getTables({name, id, config, schema = 'public'}) {
    console.log('db getTables ', arguments)
     initDb({id, config})
    let tables = await currentDb.query(`select table_name from information_schema.tables where table_schema='${schema}' LIMIT 1000`)

    console.log('tabels:', tables)

    return  _.sortBy(tables[0], ['table_name'])

}

async function getRowAndColumns({sql, type}) {
    let data = await currentDb.query(sql, {type: QueryTypes.RAW})
    console.log('data1: ',data)

    return {rows: data[0], columns: data[1].fields}
}

async function query({sql }) {
    console.log('query: ',  sql)
    let data = await currentDb.query(sql, {type: QueryTypes.SELECT})
    
    return data
}

function setDb(id) {
    let db = initDb({id, config: null})

    currentDb = db
}

// tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3] sql: ''
async function getTableData(data) {
    console.log('db getTableData: ', data)
    setDb(data.id)

    if(/^\s*select/i.test(data.sql)){
        return getRowAndColumns({sql: data.sql, type: null})
    }else {
        return query({sql: data.sql})

    }

}

async function updateOneField({tableName, id, field, value}) {
    let sql = `
    update ${tableName} set ${field} = '${value}'
    where id = ${id}
    `

    console.log('updateOneField sql: ', sql)


    await query({sql})
}

async function updateDate({tableName, id, data, type}) {

    if(type === 2) {
        return updateOneField({tableName, id, ...data})
    }
    let updateFields = Object.keys(data).map(key => {
        if(Number.isInteger(data[key])) {
            return `${key} = ${data[key]}`
        }else {
            return `${key} = '${data[key]}'`
        }
    }).join(',')
    
    let sql = `
    update ${tableName} set ${updateFields}
    where id = ${id}
    `

    console.log('updateDate sql: ', sql, tableName,id, data)

    await query({sql})
}

function getAppPath() {
    let appPath =  app.getAppPath()
    if(process.env.NODE_ENV !== 'development') {
        appPath += '.unpacked'
    }

    console.log('getAppPath: ', appPath)

    return appPath
}

// type 1-struct 2-struct and data
async function restore({type, connection, dbName, sqlPath}) {
    console.log('restore: ', type, connection, dbName, sqlPath)
    let appPath =  getAppPath()
    let pgPath = path.join(appPath, 'resources/bin/mac/pg_restore')
    console.log('pgDumpPath: ', pgPath)
    let option = ''
    if(type === 1) {
        option = '-s'
    }

    const res = await $`export PGPASSWORD='${connection.config.password}' && ${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} ${option} --dbname=${connection.config.database}  ${sqlPath}`
    console.log('restore res: ', res, res.exitCode)
    return res
}

//type 1-database 2-table
async function backup({type, config}) {
    console.log('backup: ', type,  config, process.env.NODE_ENV)
    let appPath =  getAppPath()
    let pgPath = path.join(appPath, 'resources/bin/mac/pg_dump')
    console.log('pgDumpPath: ', pgPath)
    let downPath = path.join(app.getPath('downloads'), `${config.config.database}_${new Date().getTime()}.sql`)
    console.log('downPath: ', `export PGPASSWORD='${config.config.password}' && ${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} > ${downPath}`)
    const res = await $`export PGPASSWORD='${config.config.password}' && ${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} > ${downPath}`
    console.log('backup res: ', res, res.exitCode)
    
    return res?.exitCode
}

async function createDb({dbName, connection}) {
    console.log('createDatabase: ', dbName,  connection)
    let appPath = getAppPath()

    let pgPath = path.join(appPath, 'resources/bin/mac/createdb')
    console.log('pgDumpPath: ', pgPath)
    const res = await $`export PGPASSWORD='${connection.config.password}' && ${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} ${dbName}`
    return res
}


    // ALTER TABLE active
    // ADD COLUMN aa4 INTEGER NOT null
    // DEFAULT 0;
async function addField({tableName, column, dataType, defaltValue, comment, notnull}) {
    let sql = `ALTER TABLE ${tableName} ADD ${column} ${dataType}`

    if(notnull) {
        sql = `${sql} NOT NULL`
    }

    if(defaltValue) {
        sql = `${sql} default ${defaltValue}`
    }

    let res = await query({sql})
    if(comment){
        let commentSql = `COMMENT on COLUMN ${tableName}.${column} is '${comment}'`
        await query({sql: commentSql})
    }

    return res
}

async function delField({tableName, column}) {
    let dropSql = column.map(el => {
        return `drop column ${el}`
    })
    const sql = `ALTER TABLE ${tableName} ${dropSql.join(',')}`

    return query({sql})
}
//语句文档地址http://www.postgres.cn/docs/9.6/ddl-alter.html
async function alterColumn(data) {
    console.log('alterColumn data: ', data)
    if(data.dataType !== data.oldValue.dataType) {
        await query({
            sql: `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} TYPE ${data.dataType} USING ${data.column}::${data.dataType}`
        })
    }

    if(data.notnull !== data.oldValue.notnull) {
        console.log('data.notnull: ', !!data.notnull, data.notnull)
        let sql = `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} SET NOT NULL`
        if(data.notnull) {
            sql = `ALTER TABLE ${data.tableName} ALTER COLUMN ${data.column} DROP NOT NULL`
        }
       let res = await query({sql})
        console.log('alter sql: ', sql, res)
    }
    
    if(data.column !== data.oldValue.column) {
        await query({
            sql: `ALTER TABLE ${data.tableName} RENAME COLUMN ${data.oldValue.column} TO ${data.column}`
        })
    }

}

async function alterTable(data) {
    if(data.type === 1) {
        return addField(data)
    }else if(data.type === 2) {
        return delField(data)
    }else if(data.type === 3) {
        return alterColumn(data)
    }
}

export {clearDb, getTables, updateDate, query, getColums, getTableData, getSchema, backup, restore, createDb,alterTable}