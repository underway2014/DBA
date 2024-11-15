export enum LogType {
  NORMAL = 1,
  ERROR,
  WARN,
  SUCCESS
}

export const DataBase = {
  MYSQL: 'mysql',
  POSTGRES: 'postgres'
}

export const LogAction = {
  INIT: 'init',
  DBCONNECTION: 'connection',
  DBBACKUP: 'backup',
  DBRESTORE: 'restore',
  ALTERCOLUMN: 'alter',
  DBCREATE: 'create',
  DBEDITINDEX: 'editindex',
  EDITTABLE: 'edittable',
  EXPORTDATA: 'export data',
  EDITSCHEMA: 'editschema',
  ROLEPERMISSION: 'edit permission'
}

export const SliderRightMenu = {
  CREATEDB: 10,
  BACKUP: 20,
  RESTORESTRUCE: 30,
  RESTOREDATA: 31,
  DISCONNECT: 40,
  CREATETABLE: 50
}

export const TableMenu = {
  EDITINDEX: 10,
  DROPTABLE: 20,
  TRUNCATE: 21
}

// export const RolePermissionKey = [
//   'rolcanlogin',
//   'rolcreatedb',
//   'rolcreaterole',
//   'rolsuper',
//   'rolreplication',
//   'rolinherit'
// ]

export const RolePermissionVal = [
  'LOGIN', // 允许角色登录
  'SUPERUSER', // 授予超级用户权限
  'CREATEDB', // 允许角色创建数据库
  'CREATEROLE', // 允许角色创建其他角色
  'INHERIT', // 角色会继承其父角色的权限
  // 'NOINHERIT', // 角色不会继承其父角色的权限
  'REPLICATION' // 允许角色进行复制
  // 'PASSWORD' // 为角色设置密码
  // 'VALID UNTIL' // 设置角色的有效期限
]

export const RolePermissionMap = {
  rolcanlogin: 'LOGIN',
  rolcreatedb: 'CREATEDB',
  rolcreaterole: 'CREATEROLE',
  rolsuper: 'SUPERUSER',
  rolreplication: 'REPLICATION',
  rolinherit: 'INHERIT'
}

// export const RolePermssionKey = Object.keys(RolePermissionMap)

console.log(RolePermissionMap['rolcanlogin'])
