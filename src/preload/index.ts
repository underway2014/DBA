import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { getTables, query } from '../server/db'

// Custom APIs for renderer
const api = {
  setStore: (val) => {
    console.log('setstore', val)
    ipcRenderer.invoke('store:set', val)
    },
  getStore: async (val) => {
    console.log('getStore', val)
    return ipcRenderer.invoke('store:get', val)
  },
  getTables: async(val) => {
    console.log('getTables: ', val)
    return getTables({name: 'test1', config: {
      host: '127.0.0.1',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      dialect: 'postgres',
      database: 'jogo_gaming_dev'
  }})
  },
  querySql: async(sql)=> {
    console.log('querySql: ', sql)
    return query({ sql})
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
