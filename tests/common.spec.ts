import { describe, it, expect, beforeEach, vi } from 'vitest'
import Common from '../src/server/common'

describe('Common tools path', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mock('electron', () => ({
      app: {
        getAppPath: () => '/app'
      }
    }))
  })

  it('getMysqlPath on mac development mysqldump', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    process.env.NODE_ENV = 'development'
    const p = await Common.getMysqlPath({ type: 1 })
    expect(p).toBe('/app/resources/mysql/mac/8/bin/mysqldump')
  })

  it('getMysqlPath on mac production mysql', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    process.env.NODE_ENV = 'production'
    const p = await Common.getMysqlPath({ type: 2 })
    expect(p).toBe('/app.unpacked/resources/mysql/mac/8/bin/mysql')
  })

  it('getPostgresToolPath on mac pg_dump', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    process.env.NODE_ENV = 'development'
    const p = await Common.getPostgresToolPath({ type: 2 })
    expect(p).toBe('/app/resources/postgres/mac/17/bin/pg_dump')
  })

  it('getPostgresToolPath on win pg_restore exe', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })
    process.env.NODE_ENV = 'production'
    const p = await Common.getPostgresToolPath({ type: 3 })
    expect(p).toBe('/app.unpacked/resources/postgres/win/16/pg_restore.exe')
  })
})
