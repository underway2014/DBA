import { message } from 'antd'
import moment from 'moment'
import { LogType } from './constant'
import { ILogItem } from '@renderer/interface'

type LogOpt = {
  logList: ILogItem[]
  setLogList: Function
  text: string
  action: string
  type: number
}

export const addLog = ({ logList, setLogList, text, action, type }: LogOpt) => {
  setLogList([
    ...logList,
    {
      type,
      action,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      text
    }
  ])

  switch (type) {
    case LogType.ERROR: {
      message.error({
        type: 'error',
        content: `${action} fail`
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
