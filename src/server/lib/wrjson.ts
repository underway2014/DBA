import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { clearDb } from '../db'
// const getConfigPath() = path.join(app.getPath('userData'), './config.json')

function getConfigPath() {
  return path.join(app.getPath('userData'), './config.json')
}
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
//     ]
//   }
function readFile() {
  if (!fs.existsSync(getConfigPath())) {
    fs.writeFileSync(
      getConfigPath(),
      JSON.stringify({
        version: '1.0.0',
        theme: 'light',
        connections: []
      })
    )
  }

  const data = fs.readFileSync(getConfigPath(), { encoding: 'utf-8' })

  if (!data) {
    return {
      version: '1.0.0',
      theme: 'light',
      connections: []
    }
  }

  console.log('config data: ', data)

  return JSON.parse(data)
}

function writeFile(obj: object) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(obj))
}

export const getConnections = () => {
  const data = readFile()

  return data
}

export const delConnection = async (connectionStr) => {
  // connection@t1_local2@1723166257140

  const a = connectionStr.split('@')
  const id = a[a.length - 1]
  const data = readFile()
  const connections = data.connections.filter((el) => {
    return el.id !== id
  })

  await clearDb({ id })

  data.connections = connections

  return writeFile(data)
}

export const editConnection = async function (val) {
  const data = readFile()
  const list = data.connections.filter((el) => {
    return el.id + '' !== val.id + ''
  })

  await clearDb({ id: val.id })

  data.connections = list
  val.id = new Date().getTime() + ''
  list.push(val)

  writeFile(data)

  // return val
}

export const addConnection = function (val) {
  const data = readFile()
  const list = data.connections || []
  val.id = new Date().getTime() + ''
  list.push(val)

  data.connections = list

  writeFile(data)
}

export const changeMode = function (val) {
  const data = readFile()
  data.theme = val

  writeFile(data)
}
