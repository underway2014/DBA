import React, { useState } from 'react';
import { Tree } from 'antd';
import type { GetProps, TreeDataNode } from 'antd';

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

const { DirectoryTree } = Tree;

// const treeData: TreeDataNode[] = [
// {
//   title: 'parent 0',
//   key: '0-0',
//   children: [
//     { title: 'leaf 0-0', key: '0-0-0', isLeaf: true },
//     { title: 'leaf 0-1', key: '0-0-1', isLeaf: true },
//   ],
// }
// ];

type pgConfig = {
  name: string
  config: any
  id: string
}

type selfProps = {
  connection: pgConfig
}

const ConnectionItem: React.FC<selfProps> = (props) => {
  const [treeData] = useState<TreeDataNode[]>([{
    title: props.connection.name,
    key: props.connection.id
  }])
  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info, props.connection);
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
    <DirectoryTree
      multiple
      defaultExpandAll
      onSelect={onSelect}
      onExpand={onExpand}
      treeData={treeData}
    />
  );
};

export default ConnectionItem;