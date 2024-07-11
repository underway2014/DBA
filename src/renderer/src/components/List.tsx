import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Table } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';

type TableRowSelection<T> = TableProps<T>['rowSelection'];

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

// const columns: TableColumnsType<DataType> = [
//   {
//     title: 'Name',
//     dataIndex: 'name',
//   },
//   {
//     title: 'Age',
//     dataIndex: 'age',
//   },
//   {
//     title: 'Address',
//     dataIndex: 'address',
//   },
// ];

// const data: DataType[] = [];
// for (let i = 0; i < 46; i++) {
//   data.push({
//     key: i,
//     name: `Edward King ${i}`,
//     age: 32,
//     address: `London, Park Lane no. ${i}`,
//   });
// }
const scroll = {
  x: '100vw', y: 240
}
const DataList: React.FC = (props, parentRef) => {
  const inputRef = useRef(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [data, setData] = useState<React.Key[]>([]);
  const [columns, setColumns] = useState<React.Key[]>([]);

  useImperativeHandle(parentRef, () => {
    return {
      updateList (listData) {
        let rows = listData.rows.map((el, index) => {
          // el.key = 
          return {
            key: index,
            name: el.user_name || el.name,
            address: el.id,
            age: el.id
          }

        })
        listData.rows.forEach(el => el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)

        console.log('column rows: ', listData.columns, listData.rows)
        setData(listData.rows)

        setColumns(listData.columns.map(el => {
          return {
            title: el.column_name,
            dataIndex: el.column_name,
          }
        }))
      }
    }
  })

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: 'odd',
        text: 'Select Odd Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: 'even',
        text: 'Select Even Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true;
            }
            return false;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  return <Table scroll={{ x: 'max-content' }} rowSelection={rowSelection} columns={columns} dataSource={data} ref={inputRef} />;
};

// export default DataList;
export default forwardRef(DataList);