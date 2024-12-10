import { app } from 'electron'
import path from 'path'

export default class Common {
  static getAppPath() {
    let appPath = app.getAppPath()
    if (process.env.NODE_ENV !== 'development') {
      appPath += '.unpacked'
    }

    return appPath
  }
  static getPlatform() {
    switch (process.platform) {
      case 'win32':
        return 'win'
      default:
        return 'mac'
    }
  }

  static async getMysqlPath({ type }) {
    const appPath = this.getAppPath()
    const os = this.getPlatform()

    let tool = 'mysqldump'
    switch (type) {
      case 1:
        break
      case 2:
        tool = 'mysql'
        break
    }

    let toolPath = ''
    if (os === 'win') {
      tool += '.exe'
      toolPath = path.join(appPath, 'resources', 'mysql', os, '8', tool)
    } else {
      toolPath = path.join(appPath, 'resources', 'mysql', os, '8', 'bin', tool)
    }

    return toolPath
  }

  static async getPostgresToolPath({ type }) {
    const appPath = this.getAppPath()
    const os = this.getPlatform()
    let tool = ''
    switch (type) {
      case 1:
        tool = 'createdb'
        break
      case 2:
        tool = 'pg_dump'
        break
      case 3:
        tool = 'pg_restore'
        break
      default:
        break
    }

    // const version = '17'
    let toolPath = ''
    if (os === 'win') {
      tool += '.exe'
      toolPath = path.join(appPath, 'resources', 'postgres', os, '16', tool)
    } else {
      toolPath = path.join(appPath, 'resources', 'postgres', os, '17', 'bin', tool)
    }

    return toolPath
  }
}
