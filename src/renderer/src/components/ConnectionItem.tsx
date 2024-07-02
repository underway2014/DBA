import React, { useState } from 'react';
import { Tree } from 'antd';
import type { GetProps, TreeDataNode } from 'antd';
import { title } from 'process';
import { DownOutlined } from '@ant-design/icons';

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
}

const ConnectionItem: React.FC<selfProps> = (props) => {
  const [treeData, setTreeData] = useState<TreeDataNode[]>([{
    title: props.connection.name,
    key: `${props.cid}-${props.connection.name}`
  }])
  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info, props.connection);

    window.api.getTables(props.connection).then(tables => {

      console.log('getTables res ', tables)

      let treeNow = treeData[0]

      treeNow.children = tables.map((el, index) => {
        return {
          isLeaf: true,
          key: `0-${index}`,
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


  return (
    // <DirectoryTree
    //   multiple
    //   defaultExpandAll
    //   onSelect={onSelect}
    //   onExpand={onExpand}
    //   treeData={treeData}
    // />
    <Tree
      showLine
      switcherIcon={<DownOutlined />}
      defaultExpandedKeys={['0-0-0']}
      onSelect={onSelect}
      treeData={treeData}
    />
  );
};

export default ConnectionItem;