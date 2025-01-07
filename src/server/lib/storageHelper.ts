import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

function getConfigPath(fileName) {
  return path.join(app.getPath('userData'), fileName)
}

export const readFile = function (fileName) {
  const filePath = getConfigPath(fileName)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        version: '1.0',
        theme: 'light',
        connections: [],
        sqls: [
          {
            id: 'abcdefj',
            content: 'select * from companies',
            note: 'search company'
          }
        ]
      })
    )
  }

  const data = fs.readFileSync(filePath, { encoding: 'utf-8' })

  return JSON.parse(data)
}

export const writeFile = function (fileName, data) {
  fs.writeFileSync(getConfigPath(fileName), JSON.stringify(data))
}
