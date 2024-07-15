import {  QueryTypes, Sequelize } from "sequelize";
import * as _ from 'lodash'
// import { execa } from "execa";
import { getConnections } from "./lib/wrjson";
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

    return _.sortBy(columns, ['columnn_name'])
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

async function backup({type, name, id}) {
    console.log('backup: ', type, name)

    let connections = await getConnections()
    let nowCon = connections.find(el => el.id === id && el.config.database === name)
    console.log('nowcon: ', nowCon)
    let shell = `export PGPASSWORD='postgres' && pg_dump -U postgres -h 127.0.0.1 -p 5432 -Fc jogo_gaming_dev > /Users/apple/Documents/dbBackup/testdata2.sql`
    // let res = await execa(shell)
    // console.log('backup res: ', res)
    return {ok: true}
}

export {getTables, updateDate, query, getColums, getTableData, getSchema, backup}