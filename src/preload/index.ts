import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { clearDb } from '../server/db'

// Custom APIs for renderer
const api = {
  addStore: (val) => {
    console.log('setstore', val)
    return ipcRenderer.invoke('store:add', val)
  },
  delStore: (val) => {
    console.log('delStore', val)
    return ipcRenderer.invoke('store:del', val)
  },
  editStore: (val) => {
    console.log('editStore', val)
    clearDb({ id: val.id })
    return ipcRenderer.invoke('store:edit', val)
  },
  getStore: async (val) => {
    console.log('getStore', val)
    return ipcRenderer.invoke('store:get', val)
  },
  getTables: async (val) => {
    console.log('getTables: ', val)
    return ipcRenderer.invoke('getTables', val)
  },
  getSchema: async (val) => {
    console.log('getSchema 222: ', val)
    return ipcRenderer.invoke('getSchema', val)
  },
  querySql: async (sql) => {
    console.log('querySql: ', sql)
    return ipcRenderer.invoke('querySql', { sql })
  },
  updateDate: async (val) => {
    console.log('updateDate: ', val)
    return ipcRenderer.invoke('updateDate', val)
  },
  getTableData: async (val) => {
    console.log('getTableData: ', val)
    return ipcRenderer.invoke('getTableData', val)
  },
  dbBackup: async (val) => {
    console.log('dbBackup: ', val)
    return ipcRenderer.invoke('db:backup', val)
  },
  dbRestore: async (val) => {
    console.log('restore: ', val)
    return ipcRenderer.invoke('db:restore', val)
  },
  dbCreate: async (val) => {
    console.log('dbCreate: ', val)
    return ipcRenderer.invoke('db:create', val)
  },
  alterTable: async (val) => {
    console.log('alterTable: ', val)
    return ipcRenderer.invoke('alterTable', val)
  },
  addRow: async (val) => {
    console.log('addRow: ', val)
    return ipcRenderer.invoke('addRow', val)
  },
  delRows: async (val) => {
    console.log('delRow: ', val)
    return ipcRenderer.invoke('delRows', val)
  },
  closeConnections: async () => {
    console.log('closeConnections: ')
    return ipcRenderer.invoke('connection:close')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
