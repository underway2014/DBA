# DBA

[English](README.en.md) | [简体中文](README.md)

## Overview
- Electron-based desktop DB management tool for PostgreSQL and MySQL
- Includes connection management, schema/table editing, index operations, SQL editor, backup/restore, and role permissions

## Features
- Connections: add/edit/delete, persisted locally
- Schemas & tables: browse `schemas/tables/columns`, create/drop/truncate, add/alter columns
- Indexes: create/drop unique/BTREE, parse and display index columns
- SQL editor: keyword highlight, formatting, pagination, EXPLAIN/ANALYZE, favorite SQL, export Excel
- DDL view (Postgres): parse table structure, PK, comments and index SQL
- Backup/Restore: integrated `pg_dump/pg_restore/createdb` and `mysqldump/mysql` (macOS/Windows/Linux)
- Role permissions (Postgres): create/edit/grant, schema-level batch grants
- Theme & updates: light/dark mode, auto-updater

## Getting Started
1. Install: `npm install`
2. Dev: `npm run dev`
3. Preview: `npm run start`
4. Build: `npm run build` (or `build:win/mac/linux`)

## Download
- Prebuilt binaries: <a href="https://github.com/underway2014/DBA/releases">GitHub Releases</a>

## Screenshots
- See `screenshot/` (connections, SQL editor, DDL, indexes, role permissions, etc.)

## Tests & Quality
- Tests: `npm run test` / `npm run test:watch` / `npm run test:coverage`
- Lint/format: `npm run lint`, `npm run format`

## License
- MIT License
