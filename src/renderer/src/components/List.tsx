import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { Flex, Form, Input, Table, Tooltip, Modal } from 'antd';

import type { FormInstance, InputRef, TableProps } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { AddIcon, MinusIcon, RunIcon } from '@renderer/assets/icons/icon';
import { ZoomInOutlined } from '@ant-design/icons';

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

type selfProps = {
  tabData: any
}


const DataList: React.FC<selfProps> = (props, parentRef) => {
  const inputRef = useRef(null);
  let defaultSql = `select * from ${props.tabData.tableName}`
  const [sqlTxt, setSqlTxt] = useState(defaultSql)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState({
    rows: [],
    page: 1,
    pageSize: 10,
    total: 0
  })
  // const [editCell, setEditCell] = useState({ show: true, content: '' })

  const [editRow, setEditRow] = useState({ show: false, data: { content: '', id: 0, field: '' } })

  console.log('tableName: ', tableName)
  // console.log('init current sql: ', defaultSql)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  console.log('aaa')

  useEffect(() => {
    console.log('use effect sqlTxt: ', sqlTxt)
    getAndUpdateTable()
  }, [])

  function getAndUpdateTable ({ page, pageSize } = {}) {
    console.log('page bbb: ', page)

    window.api.getTableData({ ...props.tabData, sql: sqlTxt, page: page || listRows.page, pageSize: pageSize || listRows.pageSize }).then(data => {

      console.log('executeSql query sql res: ', data)
      if (/^\s*select/i.test(sqlTxt)) {
        console.log('page ccc111: ', listRows.page, page)
        let tableName = getTableName(sqlTxt)
        updateList({ listData: data, tableName: tableName })
        setListRows((a) => {
          return { ...a, page: page }
        })
        console.log('page ccc222: ', listRows.page, page)
      }
    })
  }


  const [columns, setColumns] = useState<React.Key[]>([]);
  console.log(' bbbbb  page', listRows.page)

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

  function showEditCell (e, data) {
    console.log('showEditCell cell: ', e, data)

    setEditRow({ data, show: true })
  }


  function updateList ({ listData, tableName }) {
    console.log('page dddddd: ', listRows.page)
    setTableName(tableName)

    listData.rows.forEach(el => el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)

    console.log('column rows: ', listData, listData.page, listRows.page)
    listData.rows.forEach(el => {
      Object.keys(el).forEach(key => {
        if (el[key] && typeof el[key] === 'object') {
          el[key] = JSON.stringify(el[key])
        }
      })
    })

    setListRows({
      ...listRows,
      rows: listData.rows,
      total: listData.total,
      page: listRows.page,
      pageSize: listData.pageSize || listRows.pageSize
    })

    setColumns(listData.columns.map(el => {
      return {
        title: el.name,
        dataIndex: el.name,
        key: el.name,
        // ellipsis: true,
        width: 100,
        render: (address, a, b, c) => {
          if (el.name === 'id') return address
          if (!address) address = ''
          let s = address
          if (address.length > 50) {
            s = address.substring(0, 45) + '...  '
          }
          return (< Tooltip placement="topLeft" title={address} >
            <div className='cellHover'>
              {s}
              {<div className='cellPlus' onClick={e => showEditCell(e, { content: address, id: a.id, field: el.name })}>
                <ZoomInOutlined />
              </div>}
            </div>
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

  function editRowOk () {

    window.api.updateDate({ tableName: tableName, id: editRow.data.id, data: { field: editRow.data.field, value: editRow.data.content }, type: 2 }).then(data => {

      console.log('query sql res: ', data)
      // setListRows(newData);

      setEditRow({ show: false, data: { content: '', id: 0, field: '' } })

      window.api.getTableData(props.tabData).then(data => {

        console.log('executeSql query sql res: ', data)
        updateList({ listData: data, tableName: props.tabData.tableName })
      })
    })
  }

  function editRowCancel () {
    setEditRow({ show: false, data: { content: '', id: 0, field: '' } })

  }

  function runSql () {
    sqlHandler()
  }


  function getTableName (sql) {
    if (!sql) {
      throw new Error(`${sql} error`)
    }

    let a = sql.replaceAll('\n', '').split(/from/i)
    let b = a[1].split(' ')

    return b.find(el => !!el)
  }

  function resetListRows () {
    setListRows((a) => {
      return { ...a, page: 1, pageSize: 10, total: 0 }
    })
  }

  function sqlHandler () {
    console.log('sqlHandler: ', sqlTxt, defaultSql)

    // if(sqlTxtRef && sqlTxtRef.current && sqlTxtRef.current.getTxt === 'function') {
    // setSqlTxt(sqlTxt)

    window.api.getTableData(
      { ...props.tabData, sql: sqlTxt }
    ).then(data => {
      console.log('query sql res: ', data, listRows.page)
      if (/^\s*select/i.test(sqlTxt)) {
        let tableName = getTableName(sqlTxt)
        updateList({ listData: data, tableName })
        // resetListRows()
        setListRows((a) => {
          return { ...a, page: 1 }
        })
      }
    })


  }

  function pageChange (page, pageSize) {
    console.log('page num: ', page, pageSize)

    if (!/\blimit\b/i.test(sqlTxt)) {
      getAndUpdateTable({ page, pageSize })
    } else {
      setListRows((a) => {
        return { ...a, page }
      })
    }
  }

  return (
    <div style={{ height: window.screen.height - 64 - 360 + 'px', overflow: 'auto' }}>
      <TextArea rows={4}
        //  value={sqlTxt} 
        defaultValue={defaultSql}
        onChange={e => {
          console.log('sql txt:', e.target.value)
          setSqlTxt(e.target.value)
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
        size='small'
        pagination={{
          defaultPageSize: listRows.pageSize,
          // defaultCurrent: 1,
          current: listRows.page,
          onChange: pageChange, total: listRows.total
        }}
        components={components} rowSelection={rowSelection} columns={columns} dataSource={listRows.rows} ref={inputRef} />


      <Modal title="Edit Data" open={editRow.show}
        onOk={editRowOk} onCancel={editRowCancel}>
        <TextArea rows={4} value={editRow.data.content} onChange={e => {
          let data = editRow.data
          data.content = e.target.value
          setEditRow({ ...editRow, data })
        }} />

      </Modal>
    </div >
  )
};

// export default DataList;
export default forwardRef(DataList);