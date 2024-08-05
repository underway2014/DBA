import {  QueryTypes, Sequelize } from "sequelize";
import * as _ from 'lodash'
// import { execa } from "execa";
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
//     database: 'jogo_gaming_dev'
// })
// await sequelize.authenticate();

const dbMap = {}
let currentDb

function initDb({name, config}) {
    console.log('init db: ', name, config)
    let db = dbMap[name]

    if(!db){
        db = new Sequelize(config)
    }

    dbMap[name] = db
    currentDb = db

    return db
}

async function getSchema({name, config}) {
    await initDb({name, config})

    let sql = `
    select schema_name name from information_schema.schemata
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
async function getTables({name, config, schema = 'public'}) {
    console.log('get tables schema: ', schema)
    await initDb({name, config})
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

function setDb(dbName) {
    let db = initDb({name: dbName, config: null})

    currentDb = db
}

function getFields(sql) {
    return sql.split('from')[0].replace(/select/gi, '').split(',').map(el => {

        el = el.trim()
        let a = el.split(/\s+/)

        return a[a.length - 1]
        // if(/as/i.test(el)) {
        //     return (el.split(/as/i)[1]).replace(/\s+/g, '')
        // }else {
        //     let a = el.split(/\s+/)

        //     return el.replace(/\s+/g, '')
        // }
    })



    // console.log('db fieldStr: ', fieldStr)
    // return fieldStr.split(',')
}

// tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3] sql: ''
async function getTableData(data) {
    console.log('db getTableData: ', data)
    setDb(data.dbName)

    // let columns = []
    // // let fields = data.fields || []

    
    // let tabeName = data.tabeName
    // if(data.sql) {
    //     tabeName = getTableName(data.sql)

    //     columns = getFields(data.sql)

    //     if(columns[0] === '*') {
    //         columns = await getColums(tabeName)
    //     }else {
    //         columns = columns.map(el => {
    //             return {column_name: el}
    //         })
    //     }
    // }

    // let rows = await query({sql: data.sql})

    // return {columns, rows}

    return getRowAndColumns({sql: data.sql, type: null})
}

async function updateDate({tableName, id, data}) {
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

function getTableName(sql) {
    if(!sql){
        throw new Error(`${sql} error`)
    }

    let a = sql.replaceAll('\n', '').split(/from/i)
    let b = a[1].split(' ')

    return b.find(el => !!el)
}

// type 1-struct 2-struct and data
async function restore({type, connection, dbName, sqlPath}) {
    console.log('restore: ', type, connection, dbName, sqlPath)
    let appPath =  app.getAppPath()
    let pgPath = path.join(appPath, 'resources/bin/mac/pg_restore')
    console.log('pgDumpPath: ', pgPath)
    let option = ''
    if(type === 1) {
        option = '-s'
    }
    
    const res = await $`export PGPASSWORD='${connection.config.password}' && ${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} ${option} --dbname=${dbName}  ${sqlPath}`
    console.log('restore res: ', res, res.exitCode)
    return res
}

//type 1-database 2-table
async function backup({type, config}) {
    console.log('backup: ', type,  config)
    let appPath =  app.getAppPath()
    let pgPath = path.join(appPath, 'resources/bin/mac/pg_dump')
    console.log('pgDumpPath: ', pgPath)
    let downPath = path.join(app.getPath('downloads'), `${config.config.database}_${new Date().getTime()}.sql`)
    console.log('downPath: ', downPath)
    const res = await $`export PGPASSWORD='${config.config.password}' && ${pgPath} -U ${config.config.username} -h ${config.config.host} -p ${config.config.port} -Fc ${config.config.database} > ${downPath}`
    console.log('backup res: ', res, res.exitCode)
    // let res1 = await execa(pgPath, ['--help']);
    // console.log('backup res1: ', res1)
    // let res = await execa`${shell}`
    return res?.exitCode
}

async function createDb({dbName, connection}) {
    console.log('createDatabase: ', dbName,  connection)
    let appPath =  app.getAppPath()
    let pgPath = path.join(appPath, 'resources/bin/mac/createdb')
    console.log('pgDumpPath: ', pgPath)
    const res = await $`export PGPASSWORD='${connection.config.password}' && ${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} ${dbName}`
    return res
}

async function addField({tableName, column, dataType, defaltValue, comment}) {
    let sql = `ALTER TABLE ${tableName} ADD ${column} ${dataType}`

    if(defaltValue) {
        sql = `${sql} default ${defaltValue}`
    }

    let res = await query({sql})
    if(comment){
        let commentSql = `COMMENT on COLUMN ${tableName}.${column} is '${comment}'`
        await query({sql: commentSql})
    }

    return res
    // ALTER TABLE active ADD c1 int8 DEFAULT 1 "test2"

}

async function delField({tableName, column}) {
    let dropSql = column.map(el => {
        return `drop column ${el}`
    })
    const sql = `ALTER TABLE ${tableName} ${dropSql.join(',')}`

    return query({sql})
}

async function alterTable(data) {
    if(data.type === 1) {
        return addField(data)
    }else if(data.type === 2) {
        return delField(data)
    }
}

export {getTables, updateDate, query, getColums, getTableData, getSchema, backup, restore, createDb,alterTable}