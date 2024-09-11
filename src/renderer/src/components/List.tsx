import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { Flex, Table, Tooltip, Modal, Button } from 'antd';
import type { TableProps } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { EditOutlined, CaretRightOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { LogAction } from '@renderer/utils/constant';
import { addErrorLog } from '@renderer/utils/errorHelper';
import CustomContext from '@renderer/utils/context';
import AddRowForm from './AddRowForm';

type TableRowSelection<T> = TableProps<T>['rowSelection'];

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

type selfProps = {
  tabData: any
}

const DataList: React.FC<selfProps> = (props, parentRef) => {
  const { logList, setLogList } = useContext(CustomContext)
  const inputRef = useRef(null);
  let defaultSql = `select * from ${props.tabData.tableName}`
  const [sqlTxt, setSqlTxt] = useState(defaultSql)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState({
    rows: [],
    page: 1,
    pageSize: 10,
    // pageSizeList: 
    total: 0
  })

  console.time('tabcontent')
  const [editRow, setEditRow] = useState({ show: false, data: { content: '', id: 0, field: '' } })

  const [addForm, setAddForm] = useState(false)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  console.time('useEffect')
  useEffect(() => {
    console.log('use effect sqlTxt: ', sqlTxt)
    getAndUpdateTable(listRows)
  }, [])

  console.timeEnd('useEffect')

  console.time('getAndUpdateTable')
  function getAndUpdateTable ({ page, pageSize }) {
    console.log('page bbb: ', page)

    window.api.getTableData({ ...props.tabData, sql: sqlTxt, page, pageSize }).then(data => {

      console.log('executeSql query sql res: ', data)
      if (/^\s*select/i.test(sqlTxt)) {
        console.log('page ccc111: ', listRows.page, page)
        let tableName = getTableName(sqlTxt)
        updateList({ listData: data, tableName: tableName, page, pageSize })
      }
    })
  }

  console.timeEnd('getAndUpdateTable')

  const [columns, setColumns] = useState<React.Key[]>([]);

  function showEditCell (e, data) {
    console.log('showEditCell cell: ', e, data)

    setEditRow({ data, show: true })
  }


  function updateList ({ listData, tableName, page, pageSize }) {
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
      page: page || 1,
      pageSize: pageSize || listRows.pageSize
    })

    if (listRows.page === 1) {
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
            return (
              <div className='cellHover'>
                {s}

                {<div className='cellPlus' onClick={e => showEditCell(e, { content: address, id: a.id, field: el.name })}>
                  <EditOutlined />
                </div>}
              </div>
            )
          }
        }
      }))
    }
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  console.time('rowSelection')
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
  }

  console.timeEnd('rowSelection')

  function editRowOk () {

    let editData = listRows.rows.find(el => el.id === editRow.data.id)
    if (!editData) {
      console.log(`table: ${tableName} edit id: ${editRow.data.id} not exist`)
      setEditRow({ show: false, data: { content: '', id: 0, field: '' } })
      return
    }

    if (editData[editRow.data.field] === editRow.data.content) {
      console.log(`table: ${tableName} edit id: ${editRow.data.id} data same`)
      setEditRow({ show: false, data: { content: '', id: 0, field: '' } })
      return
    }

    window.api.updateDate({ tableName: tableName, id: editRow.data.id, data: { field: editRow.data.field, value: editRow.data.content }, type: 2 }).then(data => {

      console.log('query sql res: ', data)
      // setListRows(newData);

      setEditRow({ show: false, data: { content: '', id: 0, field: '' } })

      window.api.getTableData(props.tabData).then(data => {

        console.log('executeSql query sql res: ', data)
        updateList({ listData: data, tableName: props.tabData.tableName })
      })
    }).catch(error => {
      addDbError({ error })
    })
  }

  function addDbError ({ error }) {
    addErrorLog({ logList, setLogList, text: error?.message, action: LogAction.DBCONNECTION })
  }

  function editRowCancel () {
    setEditRow({ show: false, data: { content: '', id: 0, field: '' } })

  }

  function runSql () {
    sqlHandler()
  }

  function addRow () {
    setAddForm(true)
  }
  function cancelAddRow () {
    setAddForm(false)
  }

  function getTableName (sql) {
    if (!sql) {
      throw new Error(`${sql} error`)
    }

    let a = sql.replaceAll('\n', '').split(/from/i)
    let b = a[1].split(' ')

    return b.find(el => !!el)
  }

  function sqlHandler () {
    console.log('sqlHandler: ', sqlTxt, defaultSql)

    window.api.getTableData(
      { ...props.tabData, sql: sqlTxt }
    ).then(data => {
      console.log('query sql res: ', data, listRows.page)
      if (/^\s*select/i.test(sqlTxt)) {
        let tableName = getTableName(sqlTxt)
        updateList({ listData: data, tableName })
      }
    })


  }

  function addRowData (data) {
    window.api.addRow(
      {
        tableName,
        id: props.tabData.id,
        fields: data
      }
    ).then(res => {
      console.log('addRowData res: ', res,)
      // if (/^\s*select/i.test(sqlTxt)) {
      //   let tableName = getTableName(sqlTxt)
      //   updateList({ listData: data, tableName })
      // }
    }).catch(error => {
      addDbError({ error })
    })
  }

  function pageChange (page, pageSize) {
    console.log('page num: ', page, pageSize)

    if (pageSize !== listRows.pageSize) {
      page = 1
    }

    if (!/\blimit\b/i.test(sqlTxt)) {
      getAndUpdateTable({ page, pageSize })
    } else {
      setListRows((a) => {
        return { ...a, page }
      })
    }
  }

  console.timeEnd('tabcontent')

  return (
    <div style={{ height: window.screen.height - 160 + 'px', overflow: 'auto' }}>
      <TextArea rows={4}
        //  value={sqlTxt} 
        defaultValue={defaultSql}
        onChange={e => {
          console.log('sql txt:', e.target.value)
          setSqlTxt(e.target.value)
        }} />
      <Flex gap="small" align="flex-start" vertical style={{ marginLeft: '5px' }}>
        <Flex gap="small" wrap>
          <Tooltip title="run">
            <Button size='small' icon={<CaretRightOutlined />} onClick={runSql} />
          </Tooltip>
          <Tooltip title="add">
            <Button size='small' icon={<PlusOutlined />} onClick={addRow} />
          </Tooltip>
          <Tooltip title="delete">
            <Button size='small' icon={<DeleteOutlined />} onClick={runSql} />
          </Tooltip>
        </Flex>
      </Flex>
      <Table bordered={true}
        scroll={{ x: 'max-content' }}
        size='small'
        pagination={{
          defaultPageSize: listRows.pageSize,
          pageSize: listRows.pageSize,
          // defaultCurrent: 1,
          current: listRows.page,
          onChange: pageChange, total: listRows.total,
          // pageSizeOptions: listRows.pageSizeList
        }}
        // components={components}
        rowSelection={rowSelection}
        columns={columns} dataSource={listRows.rows} ref={inputRef} />


      <Modal title="Edit Data" open={editRow.show}
        onOk={editRowOk} onCancel={editRowCancel}>
        <TextArea rows={4} value={editRow.data.content} onChange={e => {
          let data = editRow.data
          data.content = e.target.value
          setEditRow({ ...editRow, data })
        }} />

      </Modal>

      <Modal title="Add Row" open={addForm}
        onCancel={cancelAddRow}
        footer={[]}>
        <AddRowForm addRowData={addRowData} fields={columns.filter(el => el.title !== 'id').map(el => {
          return {
            name: el.title
          }
        })} />

      </Modal>


    </div >
  )
};

// export default DataList;
export default forwardRef(DataList);