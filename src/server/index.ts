import Koa from 'koa';
import sequelize from './db';
import { QueryTypes } from 'sequelize';

import bodyParse from 'koa-bodyparser'

import Router from "@koa/router";
var router = new Router();

async function server( ) {
const app: Koa = new Koa();

  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Credentials', 'true')
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    ctx.set('Access-Control-Allow-Origin', '*')
    await next()
  })

  app.use(bodyParse())

router.get('/list', async (ctx, _) => {
        console.log('get client request!!!')
        let sql = `
        select * from active limit 2
        `
    
        let result = await sequelize.query(sql, {type: QueryTypes.SELECT})
        console.log('result: ', result)
        ctx.status = 200
        ctx.body = {data: result};
})


app.use(router.routes());

app.listen(3000);
console.log('server start')
}

export default server