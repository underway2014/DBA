import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as storageHelper from '../src/server/lib/storageHelper'
import * as db from '../src/server/db'
import {
  storeAdd,
  storeDel,
  searchSql,
  changeMode,
  addConnection,
  delConnection
} from '../src/server/lib/connectionJson'

describe('connectionJson storage', () => {
  const mem: any = {
    version: '1.0',
    theme: 'light',
    connections: [],
    sqls: []
  }

  beforeEach(() => {
    vi.spyOn(storageHelper, 'readFile').mockImplementation(() => ({ ...mem }))
    vi.spyOn(storageHelper, 'writeFile').mockImplementation((_f, data: any) => {
      Object.assign(mem, data)
    })
    vi.spyOn(db, 'clearDb' as any).mockResolvedValue(true)
  })

  it('add and search sql', () => {
    storeAdd({ type: 2, data: { note: 'find user', content: 'select * from users' } })
    storeAdd({ type: 2, data: { note: 'update role', content: 'update roles set a=1' } })
    const res = searchSql('user')
    expect(res.length).toBe(1)
    expect(mem.sqls[0].date).toBeTypeOf('number')
  })

  it('add and delete connection', async () => {
    addConnection({
      data: {
        name: 'local',
        config: {
          host: '127.0.0.1',
          port: 5432,
          username: 'u',
          password: 'p',
          dialect: 'postgres',
          database: 'db'
        }
      }
    } as any)
    expect(mem.connections.length).toBe(1)
    const key = `connection@local@${mem.connections[0].id}`
    await storeDel({ type: 1, data: key })
    expect(mem.connections.length).toBe(0)
  })

  it('change mode light/dark', () => {
    changeMode('dark')
    expect(mem.theme).toBe('dark')
  })
})
