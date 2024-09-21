export const menuTemplate = [
  {
    label: 'DBA',
    submenu: [
      {
        label: 'about',
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'hide',
        role: 'hide'
      },
      {
        label: 'hideOthers',
        role: 'hideOthers'
      },
      {
        type: 'separator'
      },
      {
        label: 'quit',
        role: 'quit'
      }
    ]
  },
  {
    label: 'edit',
    submenu: [
      {
        label: 'undo',
        role: 'undo'
      },
      {
        label: 'redo',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'cut',
        role: 'cut'
      },
      {
        label: 'copy',
        role: 'copy'
      },
      {
        label: 'paste',
        role: 'paste'
      },
      {
        label: 'delete',
        role: 'delete'
      },
      {
        label: 'selectAll',
        role: 'selectAll'
      }
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'minimize',
        role: 'minimize'
      },
      {
        label: 'close',
        role: 'close'
      },
      {
        label: 'togglefullscreen',
        role: 'togglefullscreen'
      }
    ]
  }
]
