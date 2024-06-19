import { ElectronAPI } from '@electron-toolkit/preload'
import { Interface } from 'readline'

interface ApiFunction {
  setStore: Function
  getStore: Function
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiFunction
  }
}
