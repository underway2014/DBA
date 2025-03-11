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
  SAVESQL: 'save sql',
  EDITSCHEMA: 'editschema',
  ROLEPERMISSION: 'edit permission',
  DELETEROWS: 'deleterows'
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
  TRUNCATE: 21,
  SHOWDDL: 30
}

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

export const PGKEYS =
  /\b(select|as|begin|commit|VALUES|comment|public\.|PARTITION\s+OF|FOR\s+VALUES|SERIAL|CREATE\s+TABLE|PARTITION\s+BY\s+RANGE|PRIMARY\s+KEY|RENAME\s+TO|from|order\s+by|inner\s+join|and|join|right\s+join|left\s+join|union\s+all|drop\scolumn|modify\scolumn|limit|offset|asc|desc|group\s+by|pg_terminate_backend|alter\s+table|nextval|alter|SEQUENCE|column|on|update|set|insert\s+into|delete\s+from|where|count|show\s+max_connections|sum)\b/gi
