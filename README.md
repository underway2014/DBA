# DBA

[English](README.en.md) | [简体中文](README.md)

## 项目简介
- 基于 Electron 的桌面数据库管理工具，支持 PostgreSQL 与 MySQL
- 集连接管理、结构与索引编辑、SQL 执行、备份与恢复、角色权限管理等能力
- PostgreSQL功能比较完善，MySQL还在完善中

## 主要功能
- 连接管理：新增/编辑/删除连接，自动保存到本地配置
- 模式与表：浏览 `schemas`/`tables`/`columns`，支持创建/删除/截断/新增字段/修改字段
- 索引管理：创建/删除唯一/BTREE 等索引，解析与展示索引列
- SQL 编辑器：关键词高亮、格式化、分页查询、EXPLAIN/ANALYZE、常用 SQL 收藏、导出 Excel
- DDL 展示：Postgres 解析表结构、主键、注释与索引 SQL
- 备份与恢复：集成 `pg_dump/pg_restore/createdb` 与 `mysqldump/mysql`，跨平台运行（macOS/Windows/Linux）
- 角色权限：Postgres 角色创建/编辑/授权，批量基于 schema 授权
- 主题与更新：明暗主题切换，集成自动更新

## 快速开始
1. 安装依赖：`npm install`
2. 开发运行：`npm run dev`
3. 预览：`npm run start`
4. 构建：`npm run build`（或 `build:win/mac/linux`）

## 配置文件位置
- mac: `/Users/apple/Library/Application Support/DBA/config.json`
- window: `C:\Users\apple\AppData\Roaming\Application Support\DBA\config.json`

## 下载
- 预编译版本：<a href="https://github.com/underway2014/DBA/releases">GitHub Releases</a>

## 截图
- 见 `screenshot/` 目录（连接管理、SQL 编辑器、DDL、索引、角色权限等）

## 测试与质量
- 单元测试：`npm run test` / `npm run test:watch` / `npm run test:coverage`
- 代码质量：`npm run lint`、`npm run format`

## 许可证
- MIT License
