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
        db = new Sequelize({
            host: '127.0.0.1',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            dialect: 'postgres',
            database: 'jogo_gaming_dev'
        })
    }


    dbMap[name] = db
    currentDb = db

    return db
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

export {getTables, query}