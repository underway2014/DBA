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

export interface IConnectionConfig {
  host: string
  port: number
  username: string
  password: string
  dialect: string
  database: string
}

export interface IConnection {
  name: string
  config: IConnectionConfig
  id: string
}

export interface IGetTabData {
  id: string
  tableName: string
  type: number
  schema: string
  dbName?: string
  sql?: string
  roleName?: string
  connection?: IConnection
}

export interface IGrantRole {
  name: string
  permission: string
}
