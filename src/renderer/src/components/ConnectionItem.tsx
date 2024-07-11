import React, { useState } from 'react';
import { Button, Space, Tree } from 'antd';
import type { GetProps, TreeDataNode } from 'antd';
import { title } from 'process';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Schema } from 'electron-store';

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

const { DirectoryTree } = Tree;

const test: TreeDataNode[] = [
  {
    title: 'test 0',
    key: '0-1',
    children: [
      { title: 'leaf 0-0', key: '0-0-0', isLeaf: true },
      { title: 'leaf 0-1', key: '0-0-1', isLeaf: true },
    ],
  }
];

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
  executeSql: Function
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
}

const ConnectionItem: React.FC<selfProps> = (props) => {
  const [treeData, setTreeData] = useState<NodeData[]>([{
    title: props.connection.name,
    key: `connection-${props.connection.name}-${props.connection.id}`,
  }])
  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info, props.connection);
    console.log('treeData Select', treeData);

    let treeNow = treeData[0]

    let key = String(keys[0])

    let parseKeys = key.split('-')

    let nodeType = parseKeys[0]
    console.log('node type: ', parseKeys)
    if (nodeType === 'connection') {
      window.api.getSchema(props.connection).then(tables => {
        treeNow.children = [{
          isLeaf: false,
          key: `schemas-${props.connection.id}`,
          title: 'schemas',
          children: tables.map((el, index) => {
            return {
              isLeaf: true,
              key: `schema-${el.name}-${new Date().getTime()}`,
              title: el.name
            }
          })
        }]

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
              key: `table-${el.table_name}-${new Date().getTime()}`,
              title: el.table_name
            }
          })
        } else {
          console.log('not find schema')
        }
        setTreeData([treeNow])
      })

    } else if (nodeType === 'table') {

      const sql = `
      select * from ${parseKeys[1]}
      `

      console.log('table sql: ', sql)
      props.executeSql(sql)
      // window.api.getTableData(sql).then(data => {

      //   console.log('query sql res: ', data)
      // })

    }



  };

  const onExpand: DirectoryTreeProps['onExpand'] = (keys, info) => {
    console.log('Trigger Expand', keys, info);
    // fetch('http://localhost:3000/list')
    //   .then(response => response.json())
    //   .then(json => {
    //     console.log('fetch res: ', json.data)
    //     // setData({rows: json.data})
    //   })
  };

  function editConnection (node) {
    console.log('editConnection: ', event)
    window.api.editStore(node)
  }

  function delConnection (node) {
    console.log('delConnection aa', node)

    window.api.delStore(node.key)

    props.updateSlider()

  }

  function titleRender (nodeData) {
    // console.log('title render: ', nodeData)
    return (
      <div className='treeTitle'>
        <span>{nodeData.title}</span>
        <Space className='treeBtn'>

          <DeleteOutlined className='marginlr20' onClick={(e) => {
            //业务的处理函数
            //在这里处理拿到key 去处理一维数组，然后再转二维数组 ，再setState
            console.log('delete', e)
            e.stopPropagation()
            delConnection(nodeData)
          }} />
          <EditOutlined onClick={(e) => {
            console.log('edit')
            //业务的处理函数
            //在这里处理拿到key 去处理一维数组，然后再转二维数组 ，再setState
          }} />
        </Space>
      </div>
    )
  }


  return (
    <div>
      <Tree
        showLine
        blockNode
        // expandAction='doubleClick'
        // switcherIcon={<DownOutlined />}
        defaultExpandedKeys={['0-0-0']}
        onSelect={onSelect}
        treeData={treeData}
        titleRender={titleRender}
      />
    </div>
  );
};

export default ConnectionItem;