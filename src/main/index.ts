import { app, shell, BrowserWindow, ipcMain, screen, Menu, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  changeMode,
  editConnection,
  getConfig,
  storeAdd,
  storeDel,
  storeSearch
} from '../server/lib/connectionJson'
import updater from './updater'
import { menuTemplate } from './menuTemplate'

import {
  addRow,
  alterTable,
  backup,
  closeConnection,
  createDb,
  createRole,
  delRole,
  delRows,
  editIndex,
  editSchema,
  editTable,
  getColums,
  getIndexs,
  getRolePermission,
  getRoles,
  getSchema,
  getTableData,
  getTables,
  grantRolePermission,
  query,
  restore,
  updateDate
} from '../server/db'
import { exportFile } from '../server/lib/excel'
// import { menuTemplate } from './menuTemplate'
// require('@electron/remote/main').initialize()
// remoteMain.initialize()

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().bounds
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    autoHideMenuBar: true,
    darkTheme: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
    // fullscreen: true,
    // maximizable
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', async () => {
    await closeConnection()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.webContents.openDevTools()
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  updater(mainWindow)
  initMenu()
}

function initMenu() {
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // server()
  // Set app user model id for windows
  electronApp.setAppUserModelId('electron.viki.com')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => {})

  ipcMain.handle('store:get', () => {
    const data = getConfig()

    return data
  })
  ipcMain.handle('store:add', (_, val) => {
    storeAdd(val)
  })
  ipcMain.handle('store:edit', (_, val) => {
    editConnection(val)
  })
  ipcMain.handle('store:del', (_, val) => {
    return storeDel(val)
  })
  ipcMain.handle('store:search', (_, val) => {
    return storeSearch(val)
  })
  ipcMain.handle('db:backup', async (_, val) => {
    return backup(val)
  })
  ipcMain.handle('db:restore', (_, val) => {
    return restore(val)
  })
  ipcMain.handle('db:create', (_, val) => {
    return createDb(val)
  })
  ipcMain.handle('getSchema', (_, val) => {
    return getSchema(val)
  })
  ipcMain.handle('getTables', (_, val) => {
    return getTables(val)
  })
  ipcMain.handle('querySql', (_, val) => {
    return query(val)
  })
  ipcMain.handle('updateDate', (_, val) => {
    return updateDate(val)
  })
  ipcMain.handle('getTableData', (_, val) => {
    return getTableData(val)
  })
  ipcMain.handle('alterTable', (_, val) => {
    return alterTable(val)
  })
  ipcMain.handle('addRow', (_, val) => {
    return addRow(val)
  })
  ipcMain.handle('delRows', (_, val) => {
    return delRows(val)
  })
  ipcMain.handle('connection:close', (_, val) => {
    return closeConnection(val)
  })
  ipcMain.handle('db:indexs', (_, val) => {
    return getIndexs(val)
  })
  ipcMain.handle('db:editindexs', (_, val) => {
    return editIndex(val)
  })
  ipcMain.handle('db:getcolumns', (_, val) => {
    return getColums(val)
  })
  ipcMain.handle('db:edittable', (_, val) => {
    return editTable(val)
  })

  ipcMain.handle('dark-mode:toggle', (_, val) => {
    nativeTheme.themeSource = val
    changeMode(val)
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('excel:export', (_, val) => {
    return exportFile(val)
  })
  ipcMain.handle('db:editschema', (_, val) => {
    console.log('db:editschema val: ', val)

    return editSchema(val)
  })

  ipcMain.handle('db:getroles', (_, val) => {
    console.log('db:getroles val: ', val)

    return getRoles(val)
  })
  ipcMain.handle('db:createrole', (_, val) => {
    console.log('db:createrole val: ', val)

    return createRole(val)
  })
  ipcMain.handle('db:grantrole', (_, val) => {
    return grantRolePermission(val)
  })
  ipcMain.handle('db:getrolepermission', (_, val) => {
    return getRolePermission(val)
  })
  ipcMain.handle('db:delrole', (_, val) => {
    return delRole(val)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // e.preventDefault()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// app.on('before-quit', e => {

// })

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
