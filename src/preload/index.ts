import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { alterTable, backup, createDb, getSchema, getTableData, getTables, query, updateDate } from '../server/db'

// Custom APIs for renderer
const api = {
  addStore: (val) => {
    console.log('setstore', val)
    ipcRenderer.invoke('store:add', val)
    },
  delStore: (val) => {
    console.log('delStore', val)
    ipcRenderer.invoke('store:del', val)
    },
  editStore: (val) => {
    console.log('editStore', val)
    ipcRenderer.invoke('store:edit', val)
    },
  getStore: async (val) => {
    console.log('getStore', val)
    return ipcRenderer.invoke('store:get', val)
  },
  getTables: async(val) => {
    console.log('getTables: ', val)
    return getTables(val)
  },
  getSchema: async(val) => {
    console.log('getSchema 222: ', val)
    return getSchema(val)
  },
  querySql: async(sql)=> {
    console.log('querySql: ', sql)
    return query({ sql})
  },
  updateDate: async(val)=> {
    console.log('updateDate: ', val)
    return updateDate(val)
  },
  getTableData: async(data)=> {
    console.log('getTableData: ', data)
    return getTableData(data)
  },
  dbBackup: async(val)=> {
    console.log('dbBackup: ', val)
    return ipcRenderer.invoke('db:backup', val)
  },
  dbRestore: async(val)=> {
    console.log('restore: ', val)
    return ipcRenderer.invoke('db:restore', val)
  },
  dbCreate: async(val)=> {
    console.log('restore: ', val)
     return ipcRenderer.invoke('db:create', val)
  },
  alterTable: async(val)=> {
    console.log('alterTable: ', val)
     return alterTable(val)
  },
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
