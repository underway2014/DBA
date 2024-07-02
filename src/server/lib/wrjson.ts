import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'


const filePath = path.join(app.getPath('userData'), './config.json')
// const filePath = path.join(__dirname, './config.json')
console.log('now dir: ', __dirname, filePath)



function readFile () {
    if(!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({connections:[{
            "name": "local-pg",
            "config": {
                "host": "127.0.0.1",
                "port": 5432,
                "username": "postgres",
                "password": "postgres",
                "dialect": "postgres",
                "database": "jogo_gaming_dev"
            }
        }]}))
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

export const addConnections = function(val) {
    const data = readFile()
    const list = data.connections || []
    list.push(val)

    data.connections = list

    writeFile(data)
}