import {  QueryTypes, Sequelize } from "sequelize";

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

    return query({sql})
}


async function getTables({name, config}) {
    await initDb({name, config})
    let tables = await currentDb.query(`select table_name from information_schema.tables where table_schema='public' LIMIT 1000`)

    console.log('tabels:', tables)

    return tables[0]
}

async function query({sql}) {
    console.log('query: ',  sql)
    let data = await currentDb.query(sql, {type: QueryTypes.SELECT})

    return data
}

async function getTableData({sql}) {
    let tableName = getTableName(sql)

    let columns = await getColums(tableName)

    console.log('getTableData22: ', sql)
    let rows = await query({sql})

    return {columns, rows}
}

function getTableName(sql) {
    if(!sql){
        throw new Error(`${sql} error`)
    }

    let a = sql.split('from')
    let b = a[1].split(' ')

    return b.find(el => !!el)
}

export {getTables, query, getColums, getTableData}