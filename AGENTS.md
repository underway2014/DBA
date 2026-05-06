# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

- **Type**: Electron desktop application (v0.7.0)
- **Purpose**: Database administration tool for PostgreSQL and MySQL
- **Stack**: TypeScript, React 18, Ant Design, electron-vite
- **Author**: viki

## Common Commands

```bash
# Development
npm run dev              # Start development with hot reload
npm run start            # Preview production build

# Build
npm run build            # Build for production
npm run build:win        # Build for Windows
npm run build:mac        # Build for macOS
npm run build:linux      # Build for Linux

# Quality
npm run lint             # Run ESLint with auto-fix
npm run format           # Run Prettier formatting
npm run typecheck        # Type check all code
npm run typecheck:node   # Type check main/preload/server
npm run typecheck:web    # Type check renderer

# Testing
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

## Architecture

### Three-Process Electron Model

| Directory | Purpose |
|-----------|---------|
| `src/main/` | Electron main process - window creation, IPC handlers, database connections |
| `src/preload/` | Preload script - exposes safe APIs via contextBridge |
| `src/renderer/` | React UI - Ant Design components |
| `src/server/` | Database layer - PostgreSQL and MySQL drivers |

### Main Entry Points

- `src/main/index.ts` - Main process: BrowserWindow, IPC handlers, menu, auto-updater
- `src/preload/index.ts` - Bridges main process to renderer via `window.api`
- `src/renderer/src/main.tsx` - React entry point
- `src/server/db.ts` - Core database operations
- `src/server/postgres.ts` - PostgreSQL driver
- `src/server/mysql.ts` - MySQL driver

### IPC Communication

The preload script exposes these APIs to renderer:
- Store: `addStore`, `getStore`, `editStore`, `delStore`
- Database: `getTables`, `getSchema`, `querySql`, `getTableData`
- Table: `alterTable`, `addRow`, `delRows`, `editTable`
- Index: `getIndexs`, `editIndex`
- Backup: `dbBackup`, `dbRestore`, `dbCreate`
- Roles: `getRoles`, `createRole`, `grantRolePermission`, `delRole`
- Export: `exportFile`

### Database Support

- PostgreSQL (more complete)
- MySQL (in development)

### Config Storage

- macOS: `~/Library/Application Support/DBA/config.json`
- Windows: `%APPDATA%/Application Support/DBA/config.json`

## Key Files

- `electron.vite.config.ts` - Vite bundler configuration
- `electron-builder.yml` - App packaging configuration
- `tsconfig.node.json` - TypeScript config for main/preload/server
- `tsconfig.web.json` - TypeScript config for renderer
- `vitest.config.ts` - Test configuration
- `.eslintrc.cjs` - ESLint rules
- `.prettierrc.yaml` - Prettier: single quotes, no semicolons, 100 char width
