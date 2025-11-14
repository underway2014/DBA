import { message } from 'antd'
import moment from 'moment'
import { LogType } from './constant'
import { ILogItem } from '@renderer/interface'

type LogOpt = {
  logList: ILogItem[]
  setLogList: (a: ILogItem[]) => void
  text: string
  action: string
  affectRows?: number | null
  sql?: string | undefined
  type: number
  toast?: boolean
}

export const addLog = ({ logList, affectRows, sql, setLogList, text, action, type, toast = true }: LogOpt) => {
  const sqlText = sql || ''
  setLogList([
    ...logList,
    {
      type,
      sql: sqlText,
      affectRows,
      action,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      text
    }
  ])

  if (toast) {
    switch (type) {
      case LogType.ERROR: {
        message.error({
          type: 'error',
          content: `fail`
        })
        break
      }
      case LogType.SUCCESS: {
        message.success({
          type: 'success',
          content: `success`
        })
        break
      }
    }
  }
}
