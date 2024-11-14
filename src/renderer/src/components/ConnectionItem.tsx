import React, { useContext, useRef, useState } from 'react'
import { Dropdown, Modal, Space, Spin, Tree } from 'antd'
import type { GetProps, MenuProps, TreeDataNode } from 'antd'
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import CreateDbForm from './CreateDbFrom'
import ConnectionForm from './ConnectionForm'
import CustomContext from '@renderer/utils/context'
import { LogAction, LogType, SliderRightMenu, TableMenu } from '@renderer/utils/constant'
import { addLog } from '@renderer/utils/logHelper'
import { IConnection, IGetTabData } from '@renderer/interface'
import AddSchemaForm from './AddSchemaForm'
import CreateTableForm from './CreateTableForm'
import AddRoleForm from './AddRoleForm'
import moment from 'moment'
import CreateMysqlDbForm from './CreateMysqlDbForm'
const { confirm } = Modal

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>

type CustomProps = {
  connection: IConnection
  key: string
  cid: number
  updateSlider: () => void
  getTableDataByName: (a: IGetTabData) => void
  setDbInfo: (a: string[]) => void
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
  otitle?: string
}

type FormType = {
  database: boolean
  schema: boolean
  connection: boolean
  table: boolean
  role: boolean
}

type RightMenuRef = {
  backupDbName?: string
  restoreType?: number
  nodeData?: NodeData
}

const ConnectionItem: React.FC<CustomProps> = (props) => {
  const { logList, setLogList } = useContext(CustomContext)
  const selectSqlFile = useRef<HTMLInputElement | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const rightClickNodeRef = useRef<RightMenuRef>({ restoreType: 2 }) // 1-struct 2-struct and data
  const [roleData, setRoleData] = useState(null)
  const [showForm, setShowForm] = useState<FormType>({
    database: false,
    schema: false,
    table: false,
    connection: false,
    role: false
  })

  const SP = '@'

  const [treeData, setTreeData] = useState<NodeData[]>([
    {
      title: props.connection.name,
      otitle: props.connection.name,
      key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`
    }
  ])

  const handleOk = () => {
    setShowForm({
      database: false,
      schema: false,
      table: false,
      connection: false,
      role: false
    })

    setRoleData(null)
  }
  const handleCancel = () => {
    handleOk()
  }

  const toggleForm = (k: keyof FormType, v: boolean) => {
    setShowForm({ ...showForm, [k]: v })
  }

  function addDbError({ error }) {
    addLog({
      logList,
      setLogList,
      text: error?.message,
      action: LogAction.DBCONNECTION,
      type: LogType.ERROR
    })
  }

  function checkLoadingKey(key, type?) {
    const treeNow = treeData[0]
    console.log('check key: ', key, treeNow, type)
    function check(obj) {
      if (obj.key && obj.key === key) {
        obj.title = !type ? (
          <span>
            <Spin size="small" /> {obj.otitle}
          </span>
        ) : (
          obj.otitle
        )

        return
      }

      if (obj.children?.length) {
        obj.children.forEach(check)
      }
    }

    check(treeNow)

    setTreeData([treeNow])
  }

  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('on select >>>>', keys, info)
    if (!keys.length) {
      keys = [info.node.key]
    }
    triggerSelect(keys)
  }

  const triggerSelect = (keys) => {
    const treeNow = treeData[0]

    const key = String(keys[0])

    // console.log('on select key: ', keys)

    const parseKeys = key.split(SP)

    const nodeType = parseKeys[0]

    if (['connection', 'schema', 'roles'].includes(nodeType)) {
      checkLoadingKey(key)
    }

    if (nodeType === 'connection') {
      if (props.connection.config.dialect === 'postgres') {
        window.api
          .getSchema(props.connection)
          .then((tables) => {
            let schemaKey = ''
            if (props.connection.config.dialect === 'postgres') {
              schemaKey = `schemas${SP}${props.connection.id}`
              treeNow.children = [
                {
                  isLeaf: false,
                  key: schemaKey,
                  title: 'schemas',
                  children: tables.map((el) => {
                    return {
                      isLeaf: true,
                      key: `schema${SP}${el.name}${SP}${props.connection.name}${SP}${props.connection.id}`,
                      title: el.name,
                      otitle: el.name
                    }
                  })
                },
                {
                  isLeaf: true,
                  key: `roles${SP}${props.connection.name}${SP}${props.connection.id}`,
                  title: 'roles',
                  otitle: 'roles'
                  // children: tables.map((el) => {
                  //   return {
                  //     isLeaf: true,
                  //     key: `schema${SP}${el.name}${SP}${props.connection.name}${SP}${props.connection.id}`,
                  //     title: el.name,
                  //     otitle: el.name
                  //   }
                  // })
                }
              ]
            } else {
              {
                schemaKey = `databases${SP}${props.connection.id}`
                treeNow.children = [
                  {
                    isLeaf: false,
                    key: schemaKey,
                    title: 'databases',
                    children: tables.map((el) => {
                      return {
                        isLeaf: true,
                        key: `database${SP}${el.name}${SP}${props.connection.name}${SP}${props.connection.id}`,
                        title: el.name,
                        otitle: el.name
                      }
                    })
                  }
                ]
              }
            }

            props.setDbInfo([props.connection.name, props.connection.config.database])

            checkLoadingKey(key, 1)
            setTreeData([treeNow])
            setExpandedKeys([schemaKey, key])
            // ...expandedKeys,
          })
          .catch((error) => {
            checkLoadingKey(key, 1)
            addDbError({ error })
          })
      } else {
        getMysqlTables({ key, parseKeys, treeNow, schema: props.connection.config.database })
      }
    } else if (nodeType === 'schema' || nodeType === 'database') {
      getTables({ key, parseKeys, treeNow, schema: parseKeys[1] })
    } else if (nodeType === 'roles') {
      getRoles({ key })
      // window.api.getRoles({ ...props.connection, schema: parseKeys[1] }).then((res) => {
      //   console.log('get roles res: ', res)

      //   const rolesNode = treeData[0].children?.find((el) => el.title === 'roles')
      //   console.log('rolenode: ', rolesNode)

      //   if (rolesNode) {
      //     rolesNode.children = res.map((el) => {
      //       return {
      //         isLeaf: true,
      //         key: `role${SP}${el.rolname}${SP}${props.connection.name}${SP}${props.connection.id}`,
      //         title: el.rolname,
      //         otitle: el.rolname
      //       }
      //     })
      //   }

      //   props.setDbInfo([props.connection.name, props.connection.config.database])
      //   checkLoadingKey(key, 1)
      //   setTreeData([treeNow])
      //   setExpandedKeys([...expandedKeys, rolesNode?.key])
      // })
    } else if (nodeType === 'role') {
      console.log({
        id: props.connection.id,
        roleName: parseKeys[1],
        type: 4
      })
      props.getTableDataByName({
        id: props.connection.id,
        roleName: parseKeys[1],
        type: 4
      })

      // props.setDbInfo([props.connection.name, props.connection.config.database, parseKeys[2]])
    } else if (nodeType === 'table') {
      console.log('parseKeys: ', parseKeys)
      let sql = `
      select * from ${parseKeys[2]}.${parseKeys[1]}
      `
      if (props.connection.config.dialect !== 'postgres') {
        sql = `
        select * from ${parseKeys[1]}
        `
      }
      props.getTableDataByName({
        id: props.connection.id,
        tableName: parseKeys[1],
        type: 1,
        schema: parseKeys[2],
        dbName: parseKeys[3],
        sql
      })

      props.setDbInfo([props.connection.name, props.connection.config.database, parseKeys[2]])
    }
  }

  function getMysqlTables({ parseKeys, treeNow, key, schema }) {
    window.api
      .getTables({ ...props.connection, schema })
      .then((res) => {
        console.log('get tables: ', res, parseKeys, schema, key)

        treeNow.isLeaf = false
        treeNow.children = res.map((el) => {
          const name = el.table_name || el.TABLE_NAME
          return {
            isLeaf: true,
            key: `table${SP}${name}${SP}${parseKeys[1]}${SP}${schema}${SP}${props.connection.id}`,
            title: name,
            otitle: name
          }
        })

        props.setDbInfo([props.connection.name, props.connection.config.database])
        checkLoadingKey(key, 1)

        setTreeData([treeNow])
        setExpandedKeys([...expandedKeys, key])
      })
      .catch((error) => {
        checkLoadingKey(key, 1)
        addDbError({ error })
      })
  }

  function getTables({ parseKeys, treeNow, key, schema }) {
    window.api
      .getTables({ ...props.connection, schema })
      .then((res) => {
        const schemas = treeNow.children
        console.log('get tables: ', res)

        if (!schemas?.length) {
          return false
        }
        const schema = schemas[0].children?.find((el) => el.key === key)

        if (schema) {
          schema.isLeaf = false
          schema.children = res.map((el) => {
            const name = el.table_name || el.TABLE_NAME
            return {
              isLeaf: true,
              key: `table${SP}${name}${SP}${parseKeys[1]}${SP}${parseKeys[2]}${SP}${props.connection.id}`,
              title: name,
              otitle: name
            }
          })
        }

        props.setDbInfo([props.connection.name, props.connection.config.database, parseKeys[1]])
        checkLoadingKey(key, 1)

        setTreeData([treeNow])
        setExpandedKeys([...expandedKeys, key])
      })
      .catch((error) => {
        checkLoadingKey(key, 1)
        addDbError({ error })
      })
  }

  function getRoles({ key }) {
    console.log('get roles key: ', key)
    const treeNow = treeData[0]
    window.api.getRoles({ ...props.connection }).then((res) => {
      console.log('get roles res: ', res)

      const rolesNode = treeNow.children?.find((el) => el.key === key)
      console.log('rolenode: ', rolesNode, treeNow)

      if (rolesNode) {
        rolesNode.isLeaf = false
        rolesNode.children = res.map((el) => {
          return {
            isLeaf: true,
            key: `role${SP}${el.rolname}${SP}${props.connection.name}${SP}${props.connection.id}`,
            title: el.rolname,
            otitle: el.rolname
          }
        })
      }

      props.setDbInfo([props.connection.name, props.connection.config.database])
      checkLoadingKey(key, 1)
      setTreeData([treeNow])
      setExpandedKeys([...expandedKeys, rolesNode?.key])
    })
  }

  function editConnection(node) {
    const parseKeys = node.key.split(SP)
    const nodeType = parseKeys[0]
    console.log('editconnection: ', parseKeys)
    if (nodeType === 'connection') {
      toggleForm('connection', true)
    } else if (nodeType === 'table') {
      props.getTableDataByName({
        id: props.connection.id,
        connection: props.connection,
        tableName: parseKeys[1],
        type: 2,
        schema: parseKeys[2],
        dbName: parseKeys[3]
      })
    } else if (nodeType === 'role') {
      // window.api.getRoles({ id: props.connection.id, roleName: parseKeys[1] }).then((res) => {
      //   console.log('edit role: ', res)
      // })

      console.log('edit connection:', node, rightClickNodeRef.current)

      setRoleData({
        connectionId: props.connection.id,
        roleName: parseKeys[1],
        timeStamp: moment().unix()
      })

      toggleForm('role', true)
    }
  }

  function delConnection(node) {
    console.log('del node: ', node)
    if (/^role/.test(node.key)) {
      confirm({
        title: `Do you want to delete the ${node.title} role?`,
        icon: <ExclamationCircleFilled />,
        content: '',
        onOk() {
          window.api
            .delRole({
              id: props.connection.id,
              roleName: node.title
            })
            .then(() => {
              // props.updateSlider()
              getRoles({ key: `roles${SP}${props.connection.name}${SP}${props.connection.id}` })
            })
        }
      })
    } else {
      confirm({
        title: `Do you want to delete the ${node.title} connection?`,
        icon: <ExclamationCircleFilled />,
        content: '',
        onOk() {
          window.api.delStore(node.key).then(() => {
            props.updateSlider()
          })
        }
      })
    }
  }

  const tableMenuItems: MenuProps['items'] = [
    {
      label: 'Edit indexs',
      key: 10
    },
    {
      type: 'divider'
    },
    {
      label: 'Drop',
      key: 20
    },
    {
      label: 'Truncate table',
      key: 21
    }
  ]

  const schemaAlongItems: MenuProps['items'] = [
    {
      label: 'Create table',
      key: 20
    },
    {
      type: 'divider'
    },
    {
      label: 'Drop Schema',
      key: 10
    }
  ]

  const schemasItems: MenuProps['items'] = [
    {
      label: 'Add Schema',
      key: 10
    }
  ]

  const roleItems: MenuProps['items'] = [
    {
      label: 'Add Role',
      key: 10
    }
  ]

  const items: MenuProps['items'] = [
    {
      label: 'Create Database',
      key: SliderRightMenu.CREATEDB
    },
    {
      type: 'divider'
    },
    {
      label: 'Disconnect',
      key: SliderRightMenu.DISCONNECT
    },
    {
      type: 'divider'
    },
    {
      label: 'Backup',
      key: SliderRightMenu.BACKUP
    },
    {
      type: 'divider'
    },
    {
      label: 'Restore struct',
      key: SliderRightMenu.RESTORESTRUCE
    },
    {
      label: 'Restore struct and data',
      key: SliderRightMenu.RESTOREDATA
    }
  ]

  //export PGPASSWORD='postgres' && pg_dump -U postgres -h 127.0.0.1 -p 5432 -Fc jogo_gaming_dev > /Users/apple/Documents/dbBackup/testdata.sql

  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql
  //下面只恢复表结构
  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 -s --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql

  function schemasRightHandler(e, nodeData) {
    console.log('tableRightMenuHandler: ', e, nodeData)
    e.domEvent.stopPropagation()

    rightClickNodeRef.current.nodeData = nodeData
    toggleForm('schema', true)
  }

  function roleRightHandler(e, nodeData) {
    e.domEvent.stopPropagation()

    rightClickNodeRef.current.nodeData = nodeData

    setRoleData(null)
    toggleForm('role', true)
  }

  function schemaAlongRightHandler(e, nodeData) {
    e.domEvent.stopPropagation()
    rightClickNodeRef.current.nodeData = nodeData
    const keys = nodeData.key.split(SP)
    console.log('keys: ', keys)
    if (+e.key === 10) {
      confirm({
        title: `Do you want to drop ${keys[1]} schema?`,
        icon: <ExclamationCircleFilled />,
        content: '',
        onOk() {
          window.api
            .editSchema({ id: keys[3], schema: keys[1], type: 1 })
            .then((res) => {
              console.log('drop schema res: ', res)
              const treeNow = treeData[0]
              if (treeNow.children && treeNow.children.length) {
                const schemas = treeNow.children[0]
                schemas.children = schemas.children?.filter((el) => el.title !== keys[1])
                setTreeData([treeNow])
              }

              addLog({
                logList,
                setLogList,
                text: `drop ${keys[1]} schema success`,
                type: LogType.SUCCESS,
                action: LogAction.EDITSCHEMA
              })
            })
            .catch((error) => {
              addLog({
                logList,
                setLogList,
                text: error.message,
                type: LogType.ERROR,
                action: LogAction.EDITSCHEMA
              })
            })
        },
        onCancel() {
          console.log('do nothing')
        }
      })
    } else if (+e.key === 20) {
      toggleForm('table', true)
    }
  }

  function addRole(val, oldVal) {
    console.log('addRole: ', val, moment(val).format(), oldVal)

    // return
    window.api
      .createRole({
        id: props.connection.id,
        ...JSON.parse(JSON.stringify(val)),
        oldName: roleData?.roleName
      })
      .then((res) => {
        console.log('createTable res: ', res)

        triggerSelect([rightClickNodeRef.current.nodeData?.key])
        toggleForm('role', false)
        setRoleData(null)
      })
      .catch((error) => {
        console.log('add role error: ', error)
        addLog({
          logList,
          setLogList,
          text: error.message,
          type: LogType.ERROR,
          action: LogAction.EDITTABLE
        })
      })
  }

  function createTable(val) {
    window.api
      .editTable({
        // id: props.connection.id,
        ...val,
        connection: props.connection,
        tableName: val.name,
        type: 3,
        schema: rightClickNodeRef.current.nodeData?.title
      })
      .then(() => {
        // console.log('createTable res: ', res)
        // const schemas = treeData[0].children[0]
        // let schema = schemas[0].children.find(el => el.title === rightClickNodeRef.current.title)
        // schema.children.push({

        // })
        toggleForm('table', false)
        triggerSelect([rightClickNodeRef.current.nodeData?.key])

        addLog({
          logList,
          setLogList,
          text: `create table ${val.name} success`,
          type: LogType.SUCCESS,
          action: LogAction.EDITTABLE
        })
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: error.message,
          type: LogType.ERROR,
          action: LogAction.EDITTABLE
        })
      })
  }

  function tableRightMenuHandler(e, nodeData) {
    //nodeData.key = "table@affiliate_stats@public@m1-local@1727260565573"
    e.domEvent.stopPropagation()
    rightClickNodeRef.current.nodeData = nodeData

    const keys = nodeData.key.split(SP)
    console.log('keys: ', keys)

    if (+e.key === TableMenu.EDITINDEX) {
      props.getTableDataByName({
        id: keys[4],
        tableName: keys[1],
        type: 3,
        schema: keys[2]
      })
    } else if ([TableMenu.TRUNCATE, TableMenu.DROPTABLE].includes(+e.key)) {
      confirm({
        title: `Do you want to ${+e.key === TableMenu.TRUNCATE ? 'truncate' : 'drop'} ${keys[1]}?`,
        icon: <ExclamationCircleFilled />,
        content: '',
        onOk() {
          let type = 1
          if (+e.key === TableMenu.TRUNCATE) {
            type = 2
          }

          window.api
            .editTable({ id: keys[4], schema: keys[2], tableName: keys[1], type })
            .then(() => {
              // console.log('getindexs drop res: ', res, type, rightClickNodeRef.current.key)
              if (type === 1 && rightClickNodeRef.current.nodeData) {
                const schmaKey = String(rightClickNodeRef.current.nodeData.key).replace(
                  /^[^@]*@[^@]*/,
                  'schema'
                )
                triggerSelect([schmaKey])
              }
              addLog({
                logList,
                setLogList,
                text: `${+e.key === TableMenu.TRUNCATE ? 'truncate' : 'drop'} ${keys[1]} success`,
                type: LogType.SUCCESS,
                action: LogAction.EDITTABLE
              })
            })
            .catch((error) => {
              addLog({
                logList,
                setLogList,
                text: error.message,
                type: LogType.ERROR,
                action: LogAction.EDITTABLE
              })
            })
        },
        onCancel() {
          console.log('do nothing')
        }
      })
    }
  }
  function rightMenuHandler(e, nodeData) {
    e.domEvent.stopPropagation()

    rightClickNodeRef.current.nodeData = nodeData
    const keyArr = nodeData.key.split(SP)

    console.log('right node data: ', nodeData)

    if (+e.key === SliderRightMenu.CREATEDB) {
      toggleForm('database', true)
    } else if (+e.key === SliderRightMenu.BACKUP) {
      window.api
        .dbBackup({ type: 1, name: keyArr[1], connection: props.connection })
        .then((res) => {
          if (res.code === 0) {
            addLog({
              logList,
              setLogList,
              text: `database: ${res.dbName} backup success, filePath: ${res.path}`,
              action: LogAction.DBBACKUP,
              type: LogType.SUCCESS
            })
          } else {
            addLog({
              logList,
              setLogList,
              text: `database: ${res.dbName} backup fail`,
              action: LogAction.DBBACKUP,
              type: LogType.ERROR
            })
          }
        })
        .catch((error) => {
          addLog({
            logList,
            setLogList,
            text: `database: ${props.connection.config.database} backup fail, ${error?.message}`,
            action: LogAction.DBBACKUP,
            type: LogType.ERROR
          })
        })
    } else if (+e.key === SliderRightMenu.RESTORESTRUCE) {
      rightClickNodeRef.current.backupDbName = keyArr[1]
      rightClickNodeRef.current.restoreType = 1
      selectSqlFile.current?.click()
    } else if (+e.key === SliderRightMenu.RESTOREDATA) {
      rightClickNodeRef.current.restoreType = 2
      rightClickNodeRef.current.backupDbName = keyArr[1]
      console.log('selectSqlFile.current: ', selectSqlFile.current)
      selectSqlFile.current?.click()
    } else if (+e.key === SliderRightMenu.DISCONNECT) {
      window.api.closeConnections({ id: keyArr[2] }).then((res) => {
        console.log('disconnect res: ', res)
        setTreeData([
          {
            title: props.connection.name,
            otitle: props.connection.name,
            key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`
            // children: []
          }
        ])
      })
    } else if (+e.key === SliderRightMenu.CREATETABLE) {
      toggleForm('table', true)
    }
  }

  function selectFile(e) {
    window.api
      .dbRestore({
        type: rightClickNodeRef.current.restoreType,
        dbName: rightClickNodeRef.current.backupDbName,
        connection: props.connection,
        sqlPath: e.target.files[0]?.path
      })
      .then((res) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${res.dbName} restore success, filePath: ${res.path}`,
          action: LogAction.DBRESTORE,
          type: LogType.SUCCESS
        })
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${rightClickNodeRef.current.backupDbName} restore fail, ${error?.message}`,
          action: LogAction.DBRESTORE,
          type: LogType.ERROR
        })
      })
  }

  // node connection-jogo_gaming_dev-1720530577574
  function treeRightHandler({ event }) {
    event.stopPropagation()
  }

  function titleRender(nodeData) {
    let editButtons
    if (!/^schema/.test(nodeData.key)) {
      let delButton

      if (!/^table/.test(nodeData.key)) {
        delButton = (
          <DeleteOutlined
            className="marginlr20"
            onClick={(e) => {
              e.stopPropagation()
              delConnection(nodeData)
            }}
          />
        )
      }

      editButtons = (
        <Space className="treeBtn">
          {delButton}
          <EditOutlined
            onClick={(e) => {
              e.stopPropagation()

              editConnection(nodeData)
            }}
          />
        </Space>
      )
    }

    let item = (
      <div className="treeTitle">
        <span>{nodeData.title}</span>
        {editButtons}
      </div>
    )
    if (/connection/.test(nodeData.key)) {
      item = (
        <div>
          <Dropdown
            menu={{
              items:
                props.connection.config.dialect === 'postgres'
                  ? items
                  : [
                    ...items,
                    {
                      label: 'Create table',
                      key: SliderRightMenu.CREATETABLE
                    }
                  ],
              onClick: (e) => rightMenuHandler(e, nodeData)
            }}
            trigger={['contextMenu']}
          >
            {item}
          </Dropdown>

          <div
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <input
              ref={selectSqlFile}
              type="file"
              style={{ display: 'none' }}
              onChange={selectFile}
            />
          </div>
        </div>
      )
    } else if (/schemas/.test(nodeData.key)) {
      item = (
        <Dropdown
          menu={{ items: schemasItems, onClick: (e) => schemasRightHandler(e, nodeData) }}
          trigger={['contextMenu']}
        >
          {item}
        </Dropdown>
      )
    } else if (/roles/.test(nodeData.key)) {
      item = (
        <Dropdown
          menu={{ items: roleItems, onClick: (e) => roleRightHandler(e, nodeData) }}
          trigger={['contextMenu']}
        >
          {item}
        </Dropdown>
      )
    } else if (/schema/.test(nodeData.key)) {
      item = (
        <Dropdown
          menu={{ items: schemaAlongItems, onClick: (e) => schemaAlongRightHandler(e, nodeData) }}
          trigger={['contextMenu']}
        >
          {item}
        </Dropdown>
      )
    } else if (/table/.test(nodeData.key)) {
      item = (
        <Dropdown
          menu={{ items: tableMenuItems, onClick: (e) => tableRightMenuHandler(e, nodeData) }}
          trigger={['contextMenu']}
        >
          {item}
        </Dropdown>
      )
    }
    return <div>{item}</div>
  }

  async function editSchema(val) {
    window.api
      .editSchema({
        schema: val.name,
        id: props.connection.id,
        type: 2
      })
      .then(() => {
        toggleForm('schema', false)

        const treeNow = treeData[0]
        if (treeNow.children && treeNow.children.length) {
          const schemas = treeNow.children[0]
          schemas.children?.push({
            isLeaf: true,
            title: val.name,
            key: `schema${SP}${val.name}${SP}${props.connection.name}${SP}${props.connection.id}`
          })

          setTreeData([treeNow])
        }
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${val.name} create fail, ${error?.message}`,
          action: LogAction.EDITSCHEMA,
          type: LogType.ERROR
        })
      })
  }

  async function editConnectionSumit(val) {
    window.api
      .editStore({
        name: val.name,
        id: props.connection.id,
        config: {
          host: val.host,
          port: val.port,
          username: val.username,
          password: val.password,
          dialect: val.dialect,
          database: val.database
        }
      })
      .then(() => {
        props.updateSlider()
        toggleForm('connection', false)
      })
  }

  async function createDatabase(val) {
    toggleForm('database', false)

    window.api
      .dbCreate({ ...val, connection: props.connection, dbName: val.name })
      .then((res) => {
        if (res.code === 0) {
          addLog({
            logList,
            setLogList,
            text: `database: ${res.dbName} create success`,
            action: LogAction.DBCREATE,
            type: LogType.SUCCESS
          })
        }
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${val.name} create fail, ${error?.message}`,
          action: LogAction.DBCREATE,
          type: LogType.ERROR
        })
      })
  }

  function onExpand(keys) {
    console.log('on expand keys: ', keys)
    setExpandedKeys(keys)
  }

  return (
    <div>
      <Tree
        showLine
        blockNode
        virtual
        motion={false}
        expandedKeys={expandedKeys}
        onExpand={onExpand}
        onRightClick={treeRightHandler}
        onSelect={onSelect}
        treeData={treeData}
        titleRender={titleRender}
        rootStyle={{ borderRadius: 0 }}
      />
      <Modal
        title="Create database"
        open={showForm.database}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        {props.connection.config.dialect === 'postgres' ? (
          <CreateDbForm createDatabase={createDatabase}></CreateDbForm>
        ) : (
          <CreateMysqlDbForm createDatabase={createDatabase}></CreateMysqlDbForm>
        )}
      </Modal>
      <Modal
        title="Add schema"
        open={showForm.schema}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <AddSchemaForm editSchema={editSchema}></AddSchemaForm>
      </Modal>

      <Modal
        title="Create table"
        open={showForm.table}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <CreateTableForm
          createTable={createTable}
          isMysql={props.connection.config.dialect !== 'postgres'}
        ></CreateTableForm>
      </Modal>
      <Modal
        title="Create role"
        open={showForm.role}
        width={700}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <AddRoleForm defautValues={roleData} addRole={addRole}></AddRoleForm>
      </Modal>

      <Modal
        title="Edit connection"
        open={showForm.connection}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <ConnectionForm
          defautValues={{
            name: props.connection.name,
            ...props.connection.config,
            id: props.connection.id
          }}
          addConnection={editConnectionSumit}
        ></ConnectionForm>
      </Modal>
    </div>
  )
}

export default ConnectionItem
