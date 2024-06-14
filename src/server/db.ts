import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    dialect: 'postgres',
    database: 'jogo_gaming_dev'
})


export default sequelize