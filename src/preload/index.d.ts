import { ElectronAPI } from '@electron-toolkit/preload'

type DBReturn = Promise<unknown>

interface ApiFunction {
  addStore: (val) => DBReturn
  editStore: (val) => DBReturn
  delStore: (val) => DBReturn
  getStore: () => DBReturn
  getTables: (val) => DBReturn
  getSchema: (val) => DBReturn
  querySql: (val) => DBReturn
  getTableData: (val) => DBReturn
  updateDate: (val) => DBReturn
  dbCreate: (val) => DBReturn
  dbBackup: (val) => DBReturn
  dbRestore: (val) => DBReturn
  alterTable: (val) => DBReturn
  editConnection: (val) => DBReturn
  addRow: (val) => DBReturn
  delRows: (val) => DBReturn
  closeConnections: (val) => DBReturn
  getIndexs: (val) => DBReturn
  editIndex: (val) => DBReturn
  getColums: (val) => DBReturn
  editTable: (val) => DBReturn
  toggleTheme: (val) => DBReturn
  exportFile: (val) => DBReturn
  editSchema: (val) => DBReturn
  getRoles: (val) => DBReturn
  createRole: (val) => DBReturn
  grantRolePermission: (val) => DBReturn
  getRolePermission: (val) => DBReturn
  delRole: (val) => DBReturn
  getDDL: (val) => DBReturn
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiFunction
  }
}
