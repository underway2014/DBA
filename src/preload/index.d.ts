import { ElectronAPI } from '@electron-toolkit/preload'
import { Interface } from 'readline'

interface ApiFunction {
  addStore: Function
  editStore: Function
  delStore: Function
  getStore: Function
  getTables: Function
  getSchema: Function
  querySql: Function
  getTableData: Function
  updateDate: Function
  dbCreate: Function
  dbBackup: Function
  dbRestore: Function
  alterTable: Function
  editConnection: Function
  addRow: Function
  delRows: Function
  closeConnections: Function
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiFunction
  }
}
