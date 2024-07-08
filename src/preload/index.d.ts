import { ElectronAPI } from '@electron-toolkit/preload'
import { Interface } from 'readline'

interface ApiFunction {
  addStore: Function
  editStore: Function
  delStore: Function
  getStore: Function
  getTables: Function
  querySql: Function
  getTableData: Function
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiFunction
  }
}
