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
  DBCREATE: 'create',
  DBEDITINDEX: 'editindex',
  EDITTABLE: 'edittable',
  EXPORTDATA: 'export data',
  EDITSCHEMA: 'editschema'
}

export const SliderRightMenu = {
  CREATEDB: 10,
  BACKUP: 20,
  RESTORESTRUCE: 30,
  RESTOREDATA: 31,
  DISCONNECT: 40
}

export const TableMenu = {
  EDITINDEX: 10,
  DROPTABLE: 20,
  TRUNCATE: 21
}
