import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as DB from '../src/server/db'
import Mysql from '../src/server/mysql'

let lastSql = ''
let lastOpt: any = null

vi.mock('sequelize', () => {
  class MockSequelize {
    async query(sql: string, opt: any) {
      lastSql = sql
      lastOpt = opt
      if (opt?.type === 'RAW') {
        return [
          [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' }
          ],
          { fields: [{ name: 'id' }, { name: 'name' }] }
        ]
      }
      return [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' }
      ]
    }
    async close() {}
    async transaction() {
      return { commit: async () => {}, rollback: async () => {} }
    }
  }
  return {
    Sequelize: MockSequelize as any,
    QueryTypes: { SELECT: 'SELECT', RAW: 'RAW', UPDATE: 'UPDATE' }
  }
})

describe('db query and table data', () => {
  beforeEach(() => {
    lastSql = ''
    lastOpt = null
  })

  it('appends limit/offset for SELECT (postgres path)', async () => {
    const id = 'pg1'
    await DB.initDb({ id, config: { dialect: 'postgres' } as any })
    const sql = 'select id, name from users'
    const res = await DB.getTableData({ sql, id, page: 2, pageSize: 10 })
    expect(Array.isArray(res.rows)).toBe(true)
    expect(res.columns).toEqual([{ name: 'id' }, { name: 'name' }])
    expect(lastSql.toLowerCase()).toContain('limit 10')
    expect(lastSql.toLowerCase()).toContain('offset 10')
    expect(lastOpt?.type).toBe('RAW')
  })

  it('mysql select returns columns from row keys', async () => {
    const id = 'my1'
    await DB.initDb({ id, config: { dialect: 'mysql' } as any })
    const sql = 'select id, name from users'
    const res = await DB.getTableData({ sql, id, page: 1, pageSize: 5 })
    expect(res.columns.map((c: any) => c.name)).toEqual(['id', 'name'])
    expect(lastOpt?.type).toBe('SELECT')
  })

  it('mysql select with empty rows falls back to getColums', async () => {
    const id = 'my2'
    await DB.initDb({ id, config: { dialect: 'mysql' } as any })
    const spy = vi.spyOn(Mysql, 'getColums').mockResolvedValue([{ name: 'id' }, { name: 'name' }])
    const sql = 'select id, name from empty_table'
    const querySpy = vi.spyOn(DB, 'query').mockResolvedValueOnce([] as any)
    const res = await DB.getTableData({
      sql,
      id,
      page: 1,
      pageSize: 5,
      tableName: 'empty_table',
      dbName: 'testdb',
      schema: 'public'
    })
    expect(res.columns).toEqual([{ name: 'id' }, { name: 'name' }])
    querySpy.mockRestore()
  })

  it('query sets UPDATE type for update/delete', async () => {
    const id = 'pg2'
    const mod = await import('sequelize')
    const spy = vi
      .spyOn((mod as any).Sequelize.prototype, 'query')
      .mockImplementation(async (sql: string, opt: any) => {
        expect(opt?.type).toBe('UPDATE')
        return []
      })
    await DB.query({ id, sql: "update users set name='x'" })
    spy.mockRestore()
  })

  it('getExportData returns rows and columns from RAW', async () => {
    const id = 'pg3'
    const data = await DB.getExportData({ sql: 'select id, name from users', id })
    expect(Array.isArray(data.rows)).toBe(true)
    expect(data.columns).toEqual([{ name: 'id' }, { name: 'name' }])
  })
})
