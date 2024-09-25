export enum LogType {
  NORMAL = 1,
  ERROR,
  WARN,
  SUCCESS
}

export const LogAction = {
  INIT: 'init',
  DBCONNECTION: 'connection',
  DBBACKUP: 'backup',
  DBRESTORE: 'restore',
  ALTERCOLUMN: 'alter',
  DBCREATE: 'create'
}

export const SliderRightMenu = {
  CREATEDB: 10,
  BACKUP: 20,
  RESTORESTRUCE: 30,
  RESTOREDATA: 31
}
