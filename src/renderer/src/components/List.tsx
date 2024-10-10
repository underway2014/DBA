import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Flex, Table, Tooltip, Modal, Button, message } from 'antd'
import type { TableProps } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import {
  EditOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleFilled,
  DownloadOutlined
} from '@ant-design/icons'
import { LogAction, LogType } from '@renderer/utils/constant'
import CustomContext from '@renderer/utils/context'
import AddRowForm from './AddRowForm'
import { addLog } from '@renderer/utils/logHelper'

const { confirm } = Modal

type TableRowSelection<T> = TableProps<T>['rowSelection']

interface DataType {
  key: React.Key
  name: string
  age: number
  address: string
}

type CustomProps = {
  tabData: any
}

const DataList: React.FC<CustomProps> = (props) => {
  const { logList, setLogList } = useContext(CustomContext)
  const inputRef = useRef(null)
  const defaultSql = props.tabData.sql.trim()
  const [sqlTxt, setSqlTxt] = useState(defaultSql)
  const [currentSchema, setSchema] = useState(props.tabData.schema)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState({
    rows: [],
    page: 1,
    pageSize: 10,
    // pageSizeList:
    total: 0
  })

  const [editRow, setEditRow] = useState({ show: false, data: { content: '', id: 0, field: '' } })

  const [addForm, setAddForm] = useState(false)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  useEffect(() => {
    getAndUpdateTable(listRows)
  }, [])

  function getAndUpdateTable({ page, pageSize }) {
    window.api.getTableData({ ...props.tabData, sql: sqlTxt, page, pageSize }).then((data) => {
      if (/^\s*select/i.test(sqlTxt)) {
        const tableName = getTableName(sqlTxt)
        updateList({ listData: data, tableName: tableName, page, pageSize })
      }
    })
  }

  const [columns, setColumns] = useState<React.Key[]>([])

  function showEditCell(e, data) {
    setEditRow({ data, show: true })
  }

  function updateList({ listData, tableName, page, pageSize }) {
    if (tableName) {
      const a = tableName.split('.')
      let schema = 'public'
      if (a.length > 1) {
        schema = a[0]
        tableName = a[1]
      }
      setTableName(tableName)
      setSchema(schema)
    }

    listData.rows.forEach(
      (el) => (el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)
    )

    listData.rows.forEach((el) => {
      Object.keys(el).forEach((key) => {
        if (el[key] && typeof el[key] === 'object') {
          el[key] = JSON.stringify(el[key])
        } else if (typeof el[key] === 'boolean') {
          el[key] = el[key] ? 'true' : 'false'
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
      setColumns(
        listData.columns.map((el) => {
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
                <div className="cellHover">
                  {s}

                  {
                    <div
                      className="cellPlus"
                      onClick={(e) =>
                        showEditCell(e, { content: address, id: a.id, field: el.name })
                      }
                    >
                      <EditOutlined />
                    </div>
                  }
                </div>
              )
            }
          }
        })
      )
    }
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys)
  }

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
          const newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false
            }
            return true
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      },
      {
        key: 'even',
        text: 'Select Even Row',
        onSelect: (changeableRowKeys) => {
          const newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true
            }
            return false
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      }
    ]
  }

  function editRowOk() {
    const editData = listRows.rows.find((el) => el.id === editRow.data.id)
    if (!editData) {
      setEditRow({ show: false, data: { content: '', id: 0, field: '' } })
      return
    }

    if (editData[editRow.data.field] === editRow.data.content) {
      setEditRow({ show: false, data: { content: '', id: 0, field: '' } })
      return
    }

    window.api
      .updateDate({
        tableName: tableName,
        id: editRow.data.id,
        data: { field: editRow.data.field, value: editRow.data.content },
        type: 2
      })
      .then((data) => {
        // setListRows(newData);

        setEditRow({ show: false, data: { content: '', id: 0, field: '' } })

        window.api.getTableData(props.tabData).then((data) => {
          updateList({ listData: data, tableName: props.tabData.tableName })
        })
      })
      .catch((error) => {
        addDbError({ error })
      })
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

  function editRowCancel() {
    setEditRow({ show: false, data: { content: '', id: 0, field: '' } })
  }

  function runSql() {
    sqlHandler()
  }

  function addRow() {
    setAddForm(true)
  }
  function cancelAddRow() {
    setAddForm(false)
  }

  function getTableName(sql) {
    if (!sql) {
      throw new Error(`${sql} error`)
    }

    const a = sql.replaceAll('\n', '').split(/from/i)
    if (a.length < 2) {
      return ''
    }
    const b = a[1].split(' ')

    return b.find((el) => !!el)
  }

  function exportData() {
    window.api
      .exportFile({ ...props.tabData, sql: sqlTxt })
      .then((res) => {
        console.log('exportData res', res)
        if (res.code === 0) {
          addLog({
            logList,
            setLogList,
            type: LogType.SUCCESS,
            text: `export data success, path: ${res.path}`,
            action: LogAction.EXPORTDATA
          })
        }
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          type: LogType.ERROR,
          text: `export data fail, ${error.message}`,
          action: LogAction.EXPORTDATA
        })
      })
  }

  function sqlHandler() {
    window.api
      .getTableData({ ...props.tabData, sql: sqlTxt })
      .then((data) => {
        console.log('run sql res: ', data)
        if (/^\s*(select|show\s+max_connections)/i.test(sqlTxt)) {
          const tableName = getTableName(sqlTxt)
          updateList({ listData: data, tableName })
        } else {
          message.success({
            type: 'success',
            content: 'Success'
          })
        }
      })
      .catch((error) => {
        addDbError({ error })
      })
  }

  function addRowData(data) {
    setAddForm(false)
    window.api
      .addRow({
        tableName,
        id: props.tabData.id,
        fields: data
      })
      .then((res) => {
        if (/^\s*select/i.test(sqlTxt)) {
          getAndUpdateTable({ page: 1, pageSize: listRows.pageSize })
        }
      })
      .catch((error) => {
        addDbError({ error })
      })
  }

  function delRow() {
    confirm({
      title: 'Do you want to delete these rows?',
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk() {
        const delIds = selectedRowKeys.map((el) => {
          const val = listRows.rows.find((a) => a.key === el)

          return val.id
        })

        console.log('del xx: ', currentSchema, tableName)

        window.api
          .delRows({ ...props.tabData, ids: delIds, schema: currentSchema, tableName: tableName })
          .then((res) => {
            if (/^\s*select/i.test(sqlTxt)) {
              getAndUpdateTable({ page: 1, pageSize: listRows.pageSize })
            }
          })
      },
      onCancel() {}
    })
  }

  function pageChange(page, pageSize) {
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

  return (
    <div style={{ height: window.screen.height - 160 + 'px', overflow: 'auto' }}>
      <TextArea
        rows={4}
        //  value={sqlTxt}
        defaultValue={defaultSql}
        onChange={(e) => {
          setSqlTxt(e.target.value)
        }}
      />
      <Flex gap="small" align="flex-start" vertical style={{ marginLeft: '5px' }}>
        <Flex gap="small" wrap>
          <Tooltip title="run">
            <Button size="small" icon={<CaretRightOutlined />} onClick={runSql} />
          </Tooltip>
          <Tooltip title="add">
            <Button size="small" icon={<PlusOutlined />} onClick={addRow} />
          </Tooltip>
          <Tooltip title="delete">
            <Button size="small" icon={<DeleteOutlined />} onClick={delRow} />
          </Tooltip>
          <Tooltip title="export">
            <Button size="small" icon={<DownloadOutlined />} onClick={exportData} />
          </Tooltip>
        </Flex>
      </Flex>
      <Table
        bordered={true}
        scroll={{ x: 'max-content' }}
        size="small"
        pagination={{
          defaultPageSize: listRows.pageSize,
          pageSize: listRows.pageSize,
          // defaultCurrent: 1,
          current: listRows.page,
          onChange: pageChange,
          total: listRows.total
          // pageSizeOptions: listRows.pageSizeList
        }}
        // components={components}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={listRows.rows}
        ref={inputRef}
      />

      <Modal title="Edit Data" open={editRow.show} onOk={editRowOk} onCancel={editRowCancel}>
        <TextArea
          rows={4}
          value={editRow.data.content}
          onChange={(e) => {
            const data = editRow.data
            data.content = e.target.value
            setEditRow({ ...editRow, data })
          }}
        />
      </Modal>

      <Modal title="Add Row" open={addForm} onCancel={cancelAddRow} footer={[]}>
        <AddRowForm
          addRowData={addRowData}
          fields={columns
            .filter((el) => el.title !== 'id')
            .map((el) => {
              return {
                name: el.title
              }
            })}
        />
      </Modal>
    </div>
  )
}

// export default DataList;
export default forwardRef(DataList)
