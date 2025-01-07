import { message } from 'antd'
import moment from 'moment'
import { LogType } from './constant'
import { ILogItem } from '@renderer/interface'

type LogOpt = {
  logList: ILogItem[]
  setLogList: (a) => void
  text: string
  action: string
  affectRows?: number | null
  sql?: string | undefined
  type: number
}

export const addLog = ({ logList, affectRows, sql, setLogList, text, action, type }: LogOpt) => {
  setLogList([
    ...logList,
    {
      type,
      sql,
      affectRows,
      action,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      text
    }
  ])

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
