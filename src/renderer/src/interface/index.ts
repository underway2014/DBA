import { LogType } from '@renderer/utils/constant'

export interface ILogItem {
  type: LogType
  action: any
  date: string
  text: string
}

export interface IFormItem {
  name: string
  value?: any
}
