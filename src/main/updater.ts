import { is } from '@electron-toolkit/utils'
import { BrowserWindow, dialog, shell, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

// auto download
autoUpdater.autoDownload = false
// auto install after quit
autoUpdater.autoInstallOnAppQuit = false

export default (win: BrowserWindow) => {
  if (is.dev) return
  const checkForUpdates = (manual = false) => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error('Error checking for updates:', error)
    })

    if (manual) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Check Update',
        message: 'checking...'
      })
    }
  }
  // 监听来自渲染进程的手动检查更新请求
  ipcMain.on('startForCheckUpdate', () => {
    checkForUpdates()
  })

  // 监听来自渲染进程的手动检查更新请求
  ipcMain.on('CheckForUpdates', () => {
    checkForUpdates(true)
  })

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Tip',
        message: `new version ${info.version},update or not?`,
        detail: info.releaseNotes ? `Update Explanation: ${info.releaseNotes}` : '',
        buttons: ['update', 'cancel'],
        cancelId: 1
      })
      .then((res) => {
        if (res.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Tip',
      message: `now version ${info.version}, It's already the latest version`
    })
  })

  autoUpdater.on('download-progress', (prog) => {
    win.webContents.send('downloadProgress', {
      speed: Math.ceil(prog.bytesPerSecond / 1000), // 网速
      percent: Math.ceil(prog.percent) // 百分比
    })
  })

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('downloaded')
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Complete',
        message: 'The update has been downloaded and completed. Do you want to install it now？',
        buttons: ['Yes', 'Not'],
        cancelId: 1
      })
      .then((res) => {
        if (res.response === 0) {
          // 退出并安装更新
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (error) => {
    dialog
      .showMessageBox({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred during the software update process',
        detail: error ? error.toString() : '',
        buttons: ['Download', 'Cancel'],
        cancelId: 1
      })
      .then((res) => {
        if (res.response === 0) {
          shell.openExternal('https://github.com/owner/xxx/releases')
        }
      })
  })
}
