import React, { useRef, useState } from 'react';
import { Dropdown, Modal, Space, Tree, message } from 'antd';
import type { GetProps, MenuProps, TreeDataNode, UploadProps } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import CreateDbForm from './CreateDbFrom';
import ConnectionForm from './ConnectionForm';
const { confirm } = Modal;

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

type pgConfig = {
  name: string
  config: any
  id: string
}

type selfProps = {
  connection: pgConfig
  key: number
  cid: number
  updateSlider: Function
  getTableDataByName: Function
  setDbInfo: Function
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
}

let rightClickItemKey: string = ''
let backupDbName = null
let restoreType = 2 // 1-struct 2-struct and data

const ConnectionItem: React.FC<selfProps> = (props) => {

  const selectSqlFile = useRef()

  const [showCreateFrom, setShowCreateFrom] = useState(false)
  const [showEditConnectionForm, setShowEditConnectionForm] = useState(false)
  const SP = '@'

  const [treeData, setTreeData] = useState<NodeData[]>([{
    title: props.connection.name,
    key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`,
  }])

  const handleOk = () => {
    setShowCreateFrom(false)
  };
  const handleCancel = () => {
    setShowCreateFrom(false)
  };
  const editHandleOk = () => {
    setShowEditConnectionForm(false)
  };
  const editHandleCancel = () => {
    setShowEditConnectionForm(false)
  };


  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info, props.connection);
    console.log('treeData Select', treeData);

    let treeNow = treeData[0]

    let key = String(keys[0])

    let parseKeys = key.split(SP)

    let nodeType = parseKeys[0]
    console.log('node type: ', parseKeys)
    if (nodeType === 'connection') {
      window.api.getSchema(props.connection).then(tables => {
        treeNow.children = [{
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
        }]

        props.setDbInfo([
          props.connection.name,
          props.connection.config.database
        ])

        setTreeData([treeNow])

      })
    } else if (nodeType === 'schema') {
      window.api.getTables({ ...props.connection, schema: parseKeys[1] }).then(tables => {

        console.log('api getSchema tables ', tables)

        let schemas = treeNow.children

        console.log('schemas length ', schemas?.length, schemas)
        if (!schemas?.length) {
          return false
        }
        let schema = schemas[0].children?.find(el => el.key === key)
        console.log('now schema key: ', key)
        if (schema) {
          console.log('right shcema: ', schema)
          schema.isLeaf = false
          schema.children = tables.map((el, index) => {
            return {
              isLeaf: true,
              key: `table${SP}${el.table_name}${SP}${parseKeys[1]}${SP}${parseKeys[2]}${SP}${new Date().getTime()}`,
              title: el.table_name
            }
          })
        } else {
          console.log('not find schema')
        }

        props.setDbInfo([
          props.connection.name,
          props.connection.config.database,
          parseKeys[1]
        ])
        setTreeData([treeNow])
      })

    } else if (nodeType === 'table') {

      const sql = `
      select * from ${parseKeys[1]}
      `

      console.log('table sql: ', sql)
      props.getTableDataByName({ id: props.connection.id, tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3], sql })
      // window.api.getTableData(sql).then(data => {

      console.log('props.connectio: ', props.connection)
      // })
      props.setDbInfo([
        props.connection.name,
        props.connection.config.database,
        parseKeys[2]
      ])

    }



  };

  function editConnection (node) {
    console.log('editConnection: ', node, node.key)
    // window.api.editStore(node)

    // props.getTableDataByName({})

    let parseKeys = node.key.split(SP)

    let nodeType = parseKeys[0]
    console.log('editConnection node type: ', parseKeys)
    if (nodeType === 'connection') {
      setShowEditConnectionForm(true)
      // setConDefaultValues({
      //   name: 
      // })
    } else if (nodeType === 'table') {
      // tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3], sql
      props.getTableDataByName({ id: props.connection.id, tableName: parseKeys[1], type: 2, schema: parseKeys[2], dbName: parseKeys[3] })
    }
  }

  function delConnection (node) {
    console.log('delConnection aa', node)

    confirm({
      title: `Do you want to delete the ${node.title} connection?`,
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk () {
        window.api.delStore(node.key).then(res => {
          console.log('del connection res: ', res)
          props.updateSlider()
        })
      },
      onCancel () {
        console.log('Cancel');
      },
    });



  }

  const items: MenuProps['items'] = [
    {
      label: 'Create Database',
      key: '10',
    },
    {
      type: 'divider',
    },
    {
      label: 'Backup',
      key: '20',
    },
    {
      type: 'divider',
    },
    {
      label: 'Restore struct',
      key: '30',
    },
    {
      label: 'Restore struct and data',
      key: '31',
    }

  ];

  //export PGPASSWORD='postgres' && pg_dump -U postgres -h 127.0.0.1 -p 5432 -Fc jogo_gaming_dev > /Users/apple/Documents/dbBackup/testdata.sql

  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql
  //下面只恢复表结构
  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 -s --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql

  function rightMenuHandler (e) {
    console.log('rightMenuHandler e: ', e)
    e.domEvent.stopPropagation()
    console.log('rightClickItemKey: ', rightClickItemKey)

    if (!rightClickItemKey) {
      return
    }
    let keyArr = rightClickItemKey.split(SP)

    if (+e.key === 10) {
      setShowCreateFrom(true)


    } else if (+e.key === 20) {
      window.api.dbBackup({ type: 1, name: keyArr[1], config: props.connection }).then((res, a, b) => {
        console.log('client backup res: ', res, typeof res, res?.exitCode)
        if (res === 0) {
          message.success({
            type: 'success',
            content: 'Backup success',
          })
        } else {
          message.error({
            type: 'error',
            content: 'Backup error',
          });
        }
      })

    } else if (+e.key === 30) {
      console.log('select file: ')
      backupDbName = keyArr[1]
      restoreType = 1
      selectSqlFile.current.click()
    } else if (+e.key === 31) {
      console.log('select file: ')
      restoreType = 2
      backupDbName = keyArr[1]
      selectSqlFile.current.click()
    }
  }

  function selectFile (e) {
    console.log('selectFile: ', e)
    console.log('selectFile path: ', e.target.files[0]?.path)

    window.api.dbRestore({ type: restoreType, dbName: backupDbName, connection: props.connection, sqlPath: e.target.files[0]?.path }).then(res => {
      console.log('client dbRestore res: ', res)
    })
  }

  // node connection-jogo_gaming_dev-1720530577574
  function treeRightHandler ({ event, node }) {
    console.log('treeRightHandler: ', event, node)
    event.stopPropagation()

    rightClickItemKey = node.key

  }

  function titleRender (nodeData) {
    // console.log('title render: ', nodeData)

    let editButtons
    if (!/^schema/.test(nodeData.key)) {

      let delButton

      if (!/^table/.test(nodeData.key)) {
        delButton = (<DeleteOutlined className='marginlr20' onClick={(e) => {
          console.log('delete', e)
          e.stopPropagation()
          delConnection(nodeData)
        }} />)
      }

      editButtons = (<Space className='treeBtn'>
        {delButton}
        <EditOutlined onClick={(e) => {
          console.log('edit connection: ', nodeData)
          e.stopPropagation()

          editConnection(nodeData)
        }} />
      </Space>)
    }

    let item = <div className='treeTitle'>
      <span>{nodeData.title}</span>
      {editButtons}
    </div>
    if (/connection/.test(nodeData.key)) {
      item = <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
        {item}
      </Dropdown>
    }
    return (
      <div>

        <input ref={selectSqlFile} type="file" style={{ display: 'none' }} onChange={selectFile} />
        {item}
      </div>
    )
  }

  async function editConnectionSumit (val) {
    console.log('editConnectionSumit>>>', val)
    window.api.editStore({
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
    }).then(res => {
      console.log('editStore res: ', res)
      props.updateSlider()
      setShowEditConnectionForm(false)

      setTreeData([{
        title: val.name,
        key: `connection${SP}${val.name}${SP}${props.connection.id}`,
      }])
    })
    console.log('after editStore res: ')

  }

  async function addOk (val) {
    console.log('crate db add ok.>>>', val)
    setShowCreateFrom(false)

    window.api.dbCreate({ dbName: val.name, connection: props.connection }).then(res => {
      console.log('client dbCreate res: ', res)
    })
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
      <Modal title="Create database" open={showCreateFrom}
        onOk={handleOk} onCancel={handleCancel}
        footer={[]}>
        <CreateDbForm createDatabase={addOk}></CreateDbForm>
      </Modal>

      <Modal title="Edit connection" open={showEditConnectionForm}
        onOk={editHandleOk} onCancel={editHandleCancel}
        footer={[]}>
        <ConnectionForm defautValues={{ name: props.connection.name, ...props.connection.config }} addConnection={editConnectionSumit}></ConnectionForm>
      </Modal>
    </div >
  );
};

export default ConnectionItem;