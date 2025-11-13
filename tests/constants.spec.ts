import { describe, it, expect } from 'vitest'
import { PGKEYS } from '../src/renderer/src/utils/constant'

describe('PGKEYS regex', () => {
  it('matches SELECT keyword', () => {
    const sql = 'select * from t'
    const res = sql.match(PGKEYS)
    expect(res && res.length).toBeGreaterThan(0)
  })
})
