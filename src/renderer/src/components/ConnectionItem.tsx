import React, { useState } from 'react';
import { Button, Space, Tree } from 'antd';
import type { GetProps, TreeDataNode } from 'antd';
import { title } from 'process';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

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
}

const ConnectionItem: React.FC<selfProps> = (props) => {
  const [treeData, setTreeData] = useState<TreeDataNode[]>([{
    title: props.connection.name,
    key: `${props.connection.id}`,
  }])
  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info, props.connection);

    window.api.getTables(props.connection).then(tables => {

      console.log('getTables res ', tables)

      let treeNow = treeData[0]

      treeNow.children = tables.map((el, index) => {
        return {
          isLeaf: true,
          key: `${el.table_name}-${index}`,
          title: el.table_name
        }
      })

      // console.log('new treeNow.children: ', treeNow)

      setTreeData([treeNow])
    })
  };

  const onExpand: DirectoryTreeProps['onExpand'] = (keys, info) => {
    console.log('Trigger Expand', keys, info);
    fetch('http://localhost:3000/list')
      .then(response => response.json())
      .then(json => {
        console.log('fetch res: ', json.data)
        // setData({rows: json.data})
      })
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
    console.log('title render: ', nodeData)
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
    // <DirectoryTree
    //   multiple
    //   defaultExpandAll
    //   onSelect={onSelect}
    //   onExpand={onExpand}
    //   treeData={treeData}
    // />
    <div>

      <Tree
        showLine
        blockNode
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