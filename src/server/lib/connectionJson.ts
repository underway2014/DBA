import { clearDb } from '../db'
import { readFile, writeFile } from './storageHelper'

const FILENAME = 'config.json'
// {
//     "version": "1.0.0",
//     "connections": [
//       {
//         "name": "t1",
//         "config": {
//           "host": "127.0.0.1",
//           "port": "5432",
//           "username": "postgres",
//           "password": "postgres",
//           "dialect": "postgres",
//           "database": "t1"
//         },
//         "id": "1720530542130"
//       }
//     ],
// sqls: [
//   {id: 'jjdlskfj', content: 'select *', note: 'update user data', date: 112131313}
// ]
//   }

export const getConfig = () => {
  const data = readFile(FILENAME)

  return data
}

export const delSql = (id) => {
  const data = readFile(FILENAME)
  const sqls = data.sqls.filter((el) => {
    return el.id !== id
  })

  data.sqls = sqls

  return writeFile(FILENAME, data)
}

export const searchSql = (key) => {
  const data = readFile(FILENAME)
  const r = new RegExp(key, 'ig')
  const sqls = data.sqls.filter((el) => {
    return r.test(el.note)
  })

  return sqls
}

export const delConnection = async (connectionStr) => {
  const a = connectionStr.split('@')
  const id = a[a.length - 1]
  const data = readFile(FILENAME)
  const connections = data.connections.filter((el) => {
    return el.id !== id
  })

  await clearDb({ id })

  data.connections = connections

  return writeFile(FILENAME, data)
}

export const editConnection = async function (val) {
  const data = readFile(FILENAME)
  const list = data.connections.filter((el) => {
    return el.id + '' !== val.id + ''
  })

  await clearDb({ id: val.id })

  data.connections = list
  val.id = new Date().getTime() + ''
  list.push(val)

  writeFile(FILENAME, data)
}

export const addConnection = function (val) {
  const data = readFile(FILENAME)
  const list = data.connections || []
  val.id = new Date().getTime() + ''
  list.push(val)

  data.connections = list

  writeFile(FILENAME, data)
}

export const addSql = function (val) {
  const data = readFile(FILENAME)
  const sqls = data.sqls || []
  val.id = new Date().getTime() + ''
  val.date = new Date().getTime()
  sqls.unshift(val)

  data.sqls = sqls

  writeFile(FILENAME, data)
}

export const changeMode = function (val) {
  const data = readFile(FILENAME)
  data.theme = val

  writeFile(FILENAME, data)
}

export const storeAdd = function (val) {
  if (val.type === 1) {
    return addConnection(val.data)
  } else if (val.type === 2) {
    return addSql(val.data)
  }
}

export const storeDel = async function (val) {
  if (val.type === 1) {
    return delConnection(val.data)
  } else if (val.type === 2) {
    return delSql(val.data)
  }
}

export const storeSearch = async function (val) {
  if (val.type === 1) {
    // return delConnection(val.data)
  } else if (val.type === 2) {
    return searchSql(val.data)
  }
}
