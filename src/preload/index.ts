import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { clearDb } from '../server/db'

// Custom APIs for renderer
const api = {
  addStore: (val) => {
    return ipcRenderer.invoke('store:add', val)
  },
  delStore: (val) => {
    return ipcRenderer.invoke('store:del', val)
  },
  editStore: (val) => {
    clearDb({ id: val.id })
    return ipcRenderer.invoke('store:edit', val)
  },
  getStore: async (val) => {
    return ipcRenderer.invoke('store:get', val)
  },
  changeTheme: async (val) => {
    return ipcRenderer.invoke('store:changetheme', val)
  },
  getTables: async (val) => {
    return ipcRenderer.invoke('getTables', val)
  },
  getSchema: async (val) => {
    return ipcRenderer.invoke('getSchema', val)
  },
  querySql: async (sql) => {
    return ipcRenderer.invoke('querySql', { sql })
  },
  updateDate: async (val) => {
    return ipcRenderer.invoke('updateDate', val)
  },
  getTableData: async (val) => {
    return ipcRenderer.invoke('getTableData', val)
  },
  dbBackup: async (val) => {
    return ipcRenderer.invoke('db:backup', val)
  },
  dbRestore: async (val) => {
    return ipcRenderer.invoke('db:restore', val)
  },
  dbCreate: async (val) => {
    return ipcRenderer.invoke('db:create', val)
  },
  alterTable: async (val) => {
    return ipcRenderer.invoke('alterTable', val)
  },
  addRow: async (val) => {
    return ipcRenderer.invoke('addRow', val)
  },
  delRows: async (val) => {
    return ipcRenderer.invoke('delRows', val)
  },
  closeConnections: async (val) => {
    return ipcRenderer.invoke('connection:close', val)
  },
  getIndexs: async (val) => {
    return ipcRenderer.invoke('db:indexs', val)
  },
  editIndex: async (val) => {
    return ipcRenderer.invoke('db:editindexs', val)
  },
  getColums: async (val) => {
    return ipcRenderer.invoke('db:getcolumns', val)
  },
  editTable: async (val) => {
    return ipcRenderer.invoke('db:edittable', val)
  },
  toggleTheme: (val) => {
    return ipcRenderer.invoke('dark-mode:toggle', val)
  },
  exportFile: (val) => {
    return ipcRenderer.invoke('excel:export', val)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)

    // contextBridge.exposeInMainWorld('darkMode', {
    //   toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
    //   system: () => ipcRenderer.invoke('dark-mode:system')
    // })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
