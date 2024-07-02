import { Sequelize } from "sequelize";

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

function getDb({name, config}) {
    console.log('init db: ', name, config)
    let db = dbMap[name]

    if(db){
        console.log(`db: ${name} is in pool`)
        return db
    }

    db = new Sequelize({
        host: '127.0.0.1',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        dialect: 'postgres',
        database: 'jogo_gaming_dev'
    })

    dbMap[name] = db

    return db
}


async function getTables(params) {
    let db =  getDb(params)

    let tables = await db.query(`select table_name from information_schema.tables where table_schema='public' LIMIT 1000`)

    console.log('tabels:', tables)

    return tables[0]
}

export {getTables, getDb}