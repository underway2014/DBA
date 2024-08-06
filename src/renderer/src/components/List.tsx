import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button, Flex, Form, Input, Table, Tooltip } from 'antd';
import { PlusOutlined, CaretRightOutlined, MinusOutlined } from '@ant-design/icons';

import type { FormInstance, InputRef, TableColumnsType, TableProps } from 'antd';
import SqlContent from './SqlContent';
import TextArea from 'antd/es/input/TextArea';
import { AddIcon, MinusIcon, RunIcon } from '@renderer/assets/icons/icon';

type TableRowSelection<T> = TableProps<T>['rowSelection'];
const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}


interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: any;
  record: any;
  handleSave: (record: any) => void;
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

type selfProps = {
  tabData: any
}

const DataList: React.FC<selfProps> = (props, parentRef) => {
  const inputRef = useRef(null);
  const [sqlTxt, setSqlTxt] = useState(`select * from ${props.tabData.tableName}`)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState([])

  console.log('tableName: ', tableName)
  // console.log('init current sql: ', currentSql)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  console.log('aaa')

  useEffect(() => {
    console.log('use effect sqlTxt: ', sqlTxt)
    window.api.getTableData(props.tabData).then(data => {

      console.log('executeSql query sql res: ', data)
      updateList({ listData: data, tableName: props.tabData.tableName })
    })
  }, [])


  const [columns, setColumns] = useState<React.Key[]>([]);
  console.log('bbb')

  const handleSave = ({ row, opt }) => {
    const newData = listRows;
    console.log('handleSave row: ', row, opt)
    const index = newData.findIndex((item) => row.id === item.id);
    const item = newData[index];
    console.log('handleSave item: ', item, index)
    newData.splice(index, 1, {
      ...item,
      ...row
    });

    window.api.updateDate({ tableName: tableName, id: row.id, data: opt }).then(data => {

      console.log('query sql res: ', data)
      setListRows(newData);

    })
  };


  function updateList ({ listData, tableName }) {
    setTableName(tableName)

    listData.rows.forEach(el => el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)

    console.log('column rows: ', listData.columns, listData.rows)
    listData.rows.forEach(el => {
      Object.keys(el).forEach(key => {
        if (el[key] && typeof el[key] === 'object') {
          el[key] = JSON.stringify(el[key])
        }
      })
    })
    setListRows(listData.rows)

    setColumns(listData.columns.map(el => {
      return {
        title: el.name,
        dataIndex: el.name,
        key: el.name,
        // ellipsis: true,
        width: '100px',
        render: (address) => {
          if (!address) return address
          let s = address
          if (address.length > 100) {
            s = address.substring(0, 100)
          }
          return (< Tooltip placement="topLeft" title={address} >
            {s}
          </Tooltip >
          )
        },
        // onCell: (record: DataType) => ({
        //   record,
        //   editable: true,
        //   dataIndex: el.name,
        //   title: el.name,
        //   handleSave,
        // })
      }
    }))
  }

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


  interface EditableRowProps {
    index: number;
  }

  const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };


  const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
      }
    }, [editing]);

    const toggleEdit = () => {
      setEditing(!editing);
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
      try {
        const values = await form.validateFields();

        console.log('values: ', values)

        toggleEdit();
        handleSave({ row: { ...record, ...values }, opt: values });
      } catch (errInfo) {
        console.log('Save failed:', errInfo);
      }
    };

    let childNode = children;

    if (editable) {
      childNode = editing ? (
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[
            {
              required: true,
              message: `${title} is required.`,
            },
          ]}
        >
          <Input ref={inputRef} onPressEnter={save} onBlur={save} />
        </Form.Item>
      ) : (
        <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onDoubleClick={toggleEdit}>
          {children}
        </div>
      );
    }

    return <td {...restProps}>{childNode}</td>;
  }

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  function runSql () {
    sqlHandler()
  }


  function getTableName (sql) {
    if (!sql) {
      throw new Error(`${sql} error`)
    }

    let a = sql.replaceAll('\n', '').split('from')
    let b = a[1].split(' ')

    return b.find(el => !!el)
  }

  function sqlHandler () {
    console.log('sqlHandler: ', sqlTxt)

    // if(sqlTxtRef && sqlTxtRef.current && sqlTxtRef.current.getTxt === 'function') {
    setSqlTxt(sqlTxt)
    let tableName = getTableName(sqlTxt)
    window.api.getTableData(
      { ...props.tabData, sql: sqlTxt }
    ).then(data => {

      console.log('query sql res: ', data)
      updateList({ listData: data, tableName })
    })
  }

  return (
    <div style={{ height: window.screen.height - 64 - 160 + 'px', overflow: 'auto' }}>
      <TextArea rows={4} value={sqlTxt} onChange={e => {
        console.log('sql txt:', e.target.value)
        setSqlTxt(e.target.value)
        // currentSql = e.target.value
      }} />
      <Flex gap="small" align="flex-start" vertical>
        <Flex gap="small" wrap>
          <div onClick={() => runSql()} style={{ width: '50px' }}>
            <RunIcon></RunIcon>
          </div>
          <div onClick={() => runSql()} style={{ width: '50px' }}>
            <AddIcon></AddIcon>
          </div>
          <div onClick={() => runSql()} style={{ width: '50px' }}>
            <MinusIcon></MinusIcon>
          </div>


        </Flex>
      </Flex>
      <Table bordered={true}
        scroll={{ x: 'max-content' }}
        components={components} rowSelection={rowSelection} columns={columns} dataSource={listRows} ref={inputRef} />;
    </div >
  )
};

// export default DataList;
export default forwardRef(DataList);