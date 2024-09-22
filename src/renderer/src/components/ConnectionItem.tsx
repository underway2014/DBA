import React, { useContext, useRef, useState } from 'react'
import { Dropdown, Modal, Space, Tree } from 'antd'
import type { GetProps, MenuProps, TreeDataNode } from 'antd'
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import CreateDbForm from './CreateDbFrom'
import ConnectionForm from './ConnectionForm'
import CustomContext from '@renderer/utils/context'
import { LogAction, LogType, SliderRightMenu } from '@renderer/utils/constant'
import { addLog } from '@renderer/utils/logHelper'
const { confirm } = Modal

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>

type ConnectionItemConfig = {
  name: string
  config: any
  id: string
}

type CustomProps = {
  connection: ConnectionItemConfig
  key: string
  cid: number
  updateSlider: Function
  getTableDataByName: Function
  setDbInfo: Function
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
}

let rightClickItemKey: string = ''
let backupDbName = ''
let restoreType = 2 // 1-struct 2-struct and data

const ConnectionItem: React.FC<CustomProps> = (props) => {
  const { logList, setLogList } = useContext(CustomContext)
  const selectSqlFile = useRef<HTMLInputElement | null>(null)

  const [showCreateFrom, setShowCreateFrom] = useState(false)
  const [showEditConnectionForm, setShowEditConnectionForm] = useState(false)
  const SP = '@'

  const [treeData, setTreeData] = useState<NodeData[]>([
    {
      title: props.connection.name,
      key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`
    }
  ])

  const handleOk = () => {
    setShowCreateFrom(false)
  }
  const handleCancel = () => {
    setShowCreateFrom(false)
  }
  const editHandleOk = () => {
    setShowEditConnectionForm(false)
  }
  const editHandleCancel = () => {
    setShowEditConnectionForm(false)
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

  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    const treeNow = treeData[0]

    const key = String(keys[0])

    const parseKeys = key.split(SP)

    const nodeType = parseKeys[0]

    if (nodeType === 'connection') {
      window.api
        .getSchema(props.connection)
        .then((tables) => {
          treeNow.children = [
            {
              isLeaf: false,
              key: `schemas${SP}${props.connection.id}`,
              title: 'schemas',
              children: tables.map((el, index) => {
                return {
                  isLeaf: true,
                  key: `schema${SP}${el.name}${SP}${props.connection.name}${SP}${new Date().getTime()}`,
                  title: el.name
                }
              })
            }
          ]

          props.setDbInfo([props.connection.name, props.connection.config.database])

          setTreeData([treeNow])
        })
        .catch((error) => {
          addDbError({ error })
        })
    } else if (nodeType === 'schema') {
      window.api
        .getTables({ ...props.connection, schema: parseKeys[1] })
        .then((tables) => {
          const schemas = treeNow.children

          if (!schemas?.length) {
            return false
          }
          const schema = schemas[0].children?.find((el) => el.key === key)

          if (schema) {
            schema.isLeaf = false
            schema.children = tables.map((el, index) => {
              return {
                isLeaf: true,
                key: `table${SP}${el.table_name}${SP}${parseKeys[1]}${SP}${parseKeys[2]}${SP}${new Date().getTime()}`,
                title: el.table_name
              }
            })
          } else {
          }

          props.setDbInfo([props.connection.name, props.connection.config.database, parseKeys[1]])
          setTreeData([treeNow])
        })
        .catch((error) => {
          addDbError({ error })
        })
    } else if (nodeType === 'table') {
      const sql = `
      select * from ${parseKeys[1]}
      `
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

  function editConnection(node) {
    const parseKeys = node.key.split(SP)
    const nodeType = parseKeys[0]

    if (nodeType === 'connection') {
      setShowEditConnectionForm(true)
    } else if (nodeType === 'table') {
      props.getTableDataByName({
        id: props.connection.id,
        tableName: parseKeys[1],
        type: 2,
        schema: parseKeys[2],
        dbName: parseKeys[3]
      })
    }
  }

  function delConnection(node) {
    confirm({
      title: `Do you want to delete the ${node.title} connection?`,
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk() {
        window.api.delStore(node.key).then((res) => {
          props.updateSlider()
        })
      },
      onCancel() {}
    })
  }

  const items: MenuProps['items'] = [
    {
      label: 'Create Database',
      key: SliderRightMenu.CREATEDB
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

  function rightMenuHandler(e) {
    e.domEvent.stopPropagation()

    if (!rightClickItemKey) {
      return
    }
    const keyArr = rightClickItemKey.split(SP)

    if (+e.key === SliderRightMenu.CREATEDB) {
      setShowCreateFrom(true)
    } else if (+e.key === SliderRightMenu.BACKUP) {
      window.api
        .dbBackup({ type: 1, name: keyArr[1], config: props.connection })
        .then((res, a, b) => {
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
      backupDbName = keyArr[1]
      restoreType = 1
      selectSqlFile.current?.click()
    } else if (+e.key === SliderRightMenu.RESTOREDATA) {
      restoreType = 2
      backupDbName = keyArr[1]
      selectSqlFile.current?.click()
    }
  }

  function selectFile(e) {
    window.api
      .dbRestore({
        type: restoreType,
        dbName: backupDbName,
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
          text: `database: ${backupDbName} restore fail, ${error?.message}`,
          action: LogAction.DBRESTORE,
          type: LogType.ERROR
        })
      })
  }

  // node connection-jogo_gaming_dev-1720530577574
  function treeRightHandler({ event, node }) {
    event.stopPropagation()

    rightClickItemKey = node.key
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
        <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
          {item}
        </Dropdown>
      )
    }
    return (
      <div>
        <input ref={selectSqlFile} type="file" style={{ display: 'none' }} onChange={selectFile} />
        {item}
      </div>
    )
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
      .then((res) => {
        props.updateSlider()
        setShowEditConnectionForm(false)

        setTreeData([
          {
            title: val.name,
            key: `connection${SP}${val.name}${SP}${props.connection.id}`
          }
        ])
      })
  }

  async function addOk(val) {
    setShowCreateFrom(false)

    window.api.dbCreate({ dbName: val.name, connection: props.connection }).then((res) => {})
  }

  return (
    <div>
      <Tree
        showLine
        blockNode
        virtual={false}
        motion={false}
        // expandAction='doubleClick'
        // switcherIcon={<DownOutlined />}
        defaultExpandedKeys={['0-0-0']}
        onRightClick={treeRightHandler}
        onSelect={onSelect}
        treeData={treeData}
        titleRender={titleRender}
      />
      <Modal
        title="Create database"
        open={showCreateFrom}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <CreateDbForm createDatabase={addOk}></CreateDbForm>
      </Modal>

      <Modal
        title="Edit connection"
        open={showEditConnectionForm}
        onOk={editHandleOk}
        onCancel={editHandleCancel}
        footer={[]}
      >
        <ConnectionForm
          defautValues={{ name: props.connection.name, ...props.connection.config }}
          addConnection={editConnectionSumit}
        ></ConnectionForm>
      </Modal>
    </div>
  )
}

export default ConnectionItem
