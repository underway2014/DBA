import { describe, it, expect, vi, beforeEach } from 'vitest'
import Postgres from '../src/server/postgres'
let ddlOut = ''
vi.mock('../src/server/db', () => ({
  execa: (opts: any) => {
    return (strings: TemplateStringsArray, ...values: any[]) => ({ stdout: ddlOut })
  },
}))

vi.mock('../src/server/common', () => ({
  default: {
    getPostgresToolPath: vi.fn().mockResolvedValue('/pg_dump'),
  },
}))

describe('Postgres getDDL', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('parses DDL, primary key, index and comments', async () => {
    ddlOut = `
CREATE TABLE public.users (
    id integer NOT NULL,
    name text
);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

COMMENT ON COLUMN public.users.name IS 'username';

CREATE INDEX users_name_idx ON public.users USING btree (name);
`

    const sql = await Postgres.getDDL({ connection: { config: { username: 'u', password: 'p', host: 'h', port: 5432, database: 'd' } }, tableName: 'users', schema: 'public' })
    expect(sql).toContain('CREATE TABLE public.users')
    expect(sql).toContain('PRIMARY KEY')
    expect(sql).toContain('CREATE INDEX')
    expect(sql).toContain('COMMENT ON COLUMN')
  })
})
