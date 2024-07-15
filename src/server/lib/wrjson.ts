import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

console.log('wrjosn test: ', app.getPath('userData'))
const filePath = path.join(app.getPath('userData'), './config.json')
console.log('now dir: ', __dirname, filePath)

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
function readFile () {
    if(!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({
            version: '1.0.0',
            connections: []
        }))
    }

  let data = fs.readFileSync(filePath, { encoding: 'utf-8' })

  console.log(data, typeof data)

  return JSON.parse(data)
}


function writeFile (obj: object) {
    fs.writeFileSync(filePath, JSON.stringify(obj))
}

export const getConnections = () => {
    let data = readFile()

    return data.connections
}

export const delConnection = (id) => {
    console.log('delConnection ww: ', id)
    let data = readFile()
    let connections = data.connections.filter(el => {
        if(el.id === id) {
            return false
        }

        return true
    })

    data.connections = connections

    writeFile(data)
}

export const editConnection = function(val) {
    const data = readFile()
    const list = data.connections.map(el => {
        if(el.id + '' === val.id + '') {
            return val
        }

        return el
    })
    

    data.connections = list

    writeFile(data)
}

export const addConnection = function(val) {
    const data = readFile()
    const list = data.connections || []
    val.id = new Date().getTime() + ''
    list.push(val)

    data.connections = list

    writeFile(data)
}