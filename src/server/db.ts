import {  QueryTypes, Sequelize } from "sequelize";
import * as _ from 'lodash'
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

function getTableName(sql) {
    if(!sql){
        throw new Error(`${sql} error`)
    }

    let a = sql.replaceAll('\n', '').split('from')
    let b = a[1].split(' ')

    return b.find(el => !!el)
}

export {getTables, query, getColums, getTableData, getSchema}