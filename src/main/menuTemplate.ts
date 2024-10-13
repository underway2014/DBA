import { autoUpdater } from 'electron-updater'

export const menuTemplate = [
  {
    label: 'DBA',
    submenu: [
      {
        label: 'About',
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide',
        role: 'hide'
      },
      {
        label: 'HideOthers',
        role: 'hideOthers'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        role: 'quit'
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        role: 'undo'
      },
      {
        label: 'Redo',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        role: 'cut'
      },
      {
        label: 'Copy',
        role: 'copy'
      },
      {
        label: 'Paste',
        role: 'paste'
      },
      {
        label: 'Delete',
        role: 'delete'
      },
      {
        label: 'SelectAll',
        role: 'selectAll'
      }
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        role: 'minimize'
      },
      {
        label: 'Close',
        role: 'close'
      },
      {
        label: 'Togglefullscreen',
        role: 'togglefullscreen'
      }
    ]
  },
  {
    role: 'Help',
    submenu: [
      {
        label: 'DBA Community',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/underway2014/DBA')
        }
      },
      {
        label: 'Check for Updates',
        click: () => {
          // dialog.showMessageBox({
          //   type: 'info',
          //   title: 'Check Update',
          //   message: 'checking...'
          // })
          autoUpdater.checkForUpdates() // 点击时检查更新
        }
      }
    ]
  }
]
