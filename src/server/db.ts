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


async function getTables({name, config, schema = 'public'}) {
    console.log('get tables schema: ', schema)
    await initDb({name, config})
    let tables = await currentDb.query(`select table_name from information_schema.tables where table_schema='${schema}' LIMIT 1000`)

    console.log('tabels:', tables)

    return  _.sortBy(tables[0], ['table_name'])

}

async function query({sql }) {
    console.log('query: ',  sql)
    let data = await currentDb.query(sql, {type: QueryTypes.SELECT})

    return data
}

async function getTableData({sql}) {
    console.log('getTableData22: ', sql)
    let tableName = getTableName(sql)

    console.log('tableName: ', tableName)
    let columns = await getColums(tableName)

    let rows = await query({sql})

    return {columns, rows}
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

    let a = sql.replaceAll('\n', '').split('from')
    let b = a[1].split(' ')

    return b.find(el => !!el)
}

//type 1-database 2-table
async function restore({type, connection, dbName, sqlPath}) {
    console.log('restore: ', type, connection, dbName, sqlPath)
    let appPath =  app.getAppPath()
    let pgPath = path.join(appPath, 'resources/bin/mac/pg_restore')
    console.log('pgDumpPath: ', pgPath)
    const res = await $`export PGPASSWORD='${connection.config.password}' && ${pgPath} -U ${connection.config.username} -h ${connection.config.host} -p ${connection.config.port} --dbname=${dbName}  ${sqlPath}`
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
    return res
}

export {getTables, updateDate, query, getColums, getTableData, getSchema, backup, restore}