import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { getSchema, getTableData, getTables, query } from '../server/db'

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
  getTableData: async(sql)=> {
    console.log('getTableData: ', sql)
    return getTableData({ sql})
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
