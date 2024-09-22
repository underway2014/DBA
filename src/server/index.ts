import Koa from 'koa'

import bodyParse from 'koa-bodyparser'

import Router from '@koa/router'
// import { getDb } from './db';
const router = new Router()

async function server() {
  const app: Koa = new Koa()

  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Credentials', 'true')
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    ctx.set('Access-Control-Allow-Origin', '*')
    await next()
  })

  app.use(bodyParse())

  // const db = getDb({name: 'local-server', config: {}})

  router.get('/list', async (ctx, _) => {
    const sql = `
        select * from active limit 2
        `

    // let result = await db.query(sql, {type: QueryTypes.SELECT})

    ctx.status = 200
    ctx.body = { data: sql }
  })

  app.use(router.routes())

  app.listen(3000)
}

export default server
