import ExcelJS from 'exceljs'
import { app } from 'electron'
import path from 'path'
import moment from 'moment'
import { getExportData } from '../db'

export const exportFile = async function (opt) {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'DBA'
  workbook.lastModifiedBy = 'Her'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastPrinted = new Date()

  const worksheet = workbook.addWorksheet('dba export')

  const data = await getExportData(opt)

  worksheet.columns = data.columns.map((el) => {
    return {
      header: el.name,
      key: el.name,
      width: 20
    }
  })

  worksheet.addRows(
    data.rows.map((el) => {
      Object.keys(el).forEach((key) => {
        if (el[key] && typeof el[key] === 'object') {
          el[key] = JSON.stringify(el[key])
        }
      })

      return el
    })
  )

  const downPath = path.join(
    app.getPath('downloads'),
    `dba_${moment().format('YYYYMMDDHHmmss')}.xlsx`
  )

  await workbook.xlsx.writeFile(downPath)

  return {
    code: 0,
    path: downPath
  }
}
