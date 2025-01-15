import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Flex, Table, Tooltip, Modal, Button } from 'antd'
import type { TableProps } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import {
  EditOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleFilled,
  DownloadOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { LogAction, LogType } from '@renderer/utils/constant'
import CustomContext from '@renderer/utils/context'
import AddRowForm from './AddRowForm'
import { addLog } from '@renderer/utils/logHelper'
import HighlightWithinTextarea from 'react-highlight-within-textarea'
import { IGetTabData } from '@renderer/interface'

const { confirm } = Modal

type TableRowSelection<T> = TableProps<T>['rowSelection']

interface DataType {
  key: React.Key
  name: string
  age: number
  address: string
}

type CustomProps = {
  tabData: IGetTabData
}

const pgKeyWords =
  /\b(select|from|order\s+by|inner\s+join|and|join|right\s+join|left\s+join|union\s+all|drop\scolumn|modify\scolumn|limit|offset|asc|desc|group\s+by|pg_terminate_backend|alter\s+table|nextval|alter|SEQUENCE|column|on|update|set|insert\s+into|delete\s+from|where|count|show\s+max_connections)\b/gi

const DataList: React.FC<CustomProps> = (props) => {
  const { logList, setLogList, isDark } = useContext(CustomContext)
  const inputRef = useRef(null)
  const defaultSql = props.tabData.sql?.trim() || ''
  const [sqlTxt, setSqlTxt] = useState(defaultSql)
  const [currentSchema, setSchema] = useState(props.tabData.schema)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [isloading, setIsloading] = useState(false)
  const [listRows, setListRows] = useState({
    rows: [],
    page: 1,
    pageSize: 10,
    // pageSizeList:
    total: 0
  })

  const [editRow, setEditRow] = useState({ show: false, data: { content: '', id: 0, field: '' } })

  const [addForm, setAddForm] = useState(false)
  const [addSqlForm, setAddSqlForm] = useState(false)
  const [sqlNote, setSqlNote] = useState('')

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  useEffect(() => {
    getAndUpdateTable(listRows)
  }, [])

  function getAndUpdateTable({ page, pageSize } = {}) {
    setIsloading(true)
    console.log('props.tabData: ', props.tabData)
    window.api
      .getTableData({ ...props.tabData, sql: sqlTxt, page, pageSize })
      .then((data) => {
        if (/^\s*(SELECT[\s\S]*?FROM|show\s+max_connections|select\s+nextval)/i.test(sqlTxt)) {
          const tableName = getTableName(sqlTxt)
          updateList({ listData: data, tableName: tableName, page, pageSize })
        } else {
          addLog({
            type: LogType.SUCCESS,
            logList,
            setLogList,
            sql: sqlTxt,
            affectRows: data?.length > 1 ? data[1] : null,
            text: 'success',
            action: LogAction.EDITTABLE
          })
        }
        setIsloading(false)
      })
      .catch((err) => {
        addLog({
          type: LogType.ERROR,
          logList,
          sql: sqlTxt,
          setLogList,
          text: err.message,
          action: LogAction.EDITTABLE
        })
        setIsloading(false)
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

    console.log('update list listRows: ', listRows)
    if (listRows.page === 1) {
      setColumns(
        listData.columns.map((el) => {
          return {
            title: el.name,
            dataIndex: el.name,
            key: el.name,
            // ellipsis: true,
            width: 100,
            render: (address, a) => {
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

    console.log('edit row: ', props.tabData)
    window.api
      .updateDate({
        tableName: tableName,
        dataId: editRow.data.id,
        data: { field: editRow.data.field, value: editRow.data.content },
        type: 2,
        id: props.tabData.id
      })
      .then(() => {
        // setListRows(newData);
        setEditRow({ show: false, data: { content: '', id: 0, field: '' } })

        getAndUpdateTable(listRows)
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

  function saveSqlShow() {
    setAddSqlForm(true)
  }

  function saveSql() {
    window.api
      .addStore({
        data: {
          content: sqlTxt,
          note: sqlNote
        },
        type: 2
      })
      .then((res) => {
        console.log('save res', res)
        setAddSqlForm(false)
        setSqlNote('')
        addLog({
          logList,
          setLogList,
          type: LogType.SUCCESS,
          text: `save success `,
          action: LogAction.SAVESQL
        })
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          type: LogType.ERROR,
          text: `save data fail, ${error.message}`,
          action: LogAction.EXPORTDATA
        })
      })
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
    getAndUpdateTable()
  }

  function addRowData(data) {
    setAddForm(false)
    console.log('add row data: ', props.tabData)
    window.api
      .addRow({
        tableName,
        id: props.tabData.id,
        fields: data,
        schema: props.tabData.schema
      })
      .then(() => {
        if (/^\s*\bselect\b/i.test(sqlTxt)) {
          getAndUpdateTable({ page: 1, pageSize: listRows.pageSize })
        }
      })
      .catch((error) => {
        addDbError({ error })
      })
  }

  function delRow() {
    // if (!selectedRowKeys.length) {
    //     <Alert
    //     message="Warning"
    //     description="Please select the data first"
    //     type="warning"
    //     showIcon
    //     closable
    //   />
    // }
    confirm({
      title: 'Do you want to delete these rows?',
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk() {
        const delIds = selectedRowKeys.map((el) => {
          const val = listRows.rows.find((a) => a.key === el)

          return val.id
        })

        window.api
          .delRows({ ...props.tabData, ids: delIds, schema: currentSchema, tableName: tableName })
          .then((data) => {
            if (/^\s*select/i.test(sqlTxt)) {
              getAndUpdateTable({ page: 1, pageSize: listRows.pageSize })
            }

            addLog({
              type: LogType.SUCCESS,
              logList,
              setLogList,
              affectRows: data?.length > 1 ? data[1] : null,
              text: 'success',
              action: LogAction.DELETEROWS
            })
          })
          .catch((error) => {
            addDbError({ error })
          })
      },
      onCancel() { }
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
  const onChange = (value) => setSqlTxt(value)
  const sqlRemarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.log('Change:', e.target.value)
    setSqlNote(e.target.value)
  }
  return (
    <div style={{ height: window.screen.height - 160 + 'px', overflow: 'auto' }}>
      <div
        style={{
          backgroundColor: isDark ? '#1C1C1C' : 'white',
          minHeight: '100px',
          maxHeight: '300px',
          overflow: 'auto',
          marginBottom: '8px',
          padding: '5px'
        }}
      >
        <HighlightWithinTextarea
          value={sqlTxt}
          onChange={onChange}
          highlight={[
            {
              highlight: pgKeyWords,
              className: 'chighlight'
            }
          ]}
        />
      </div>
      <Flex gap="small" align="flex-start" vertical style={{ marginLeft: '5px' }}>
        <Flex gap="small" wrap>
          <Tooltip title="run">
            <Button size="small" icon={<CaretRightOutlined />} onClick={runSql} />
          </Tooltip>
          <Tooltip title="add">
            <Button size="small" icon={<PlusOutlined />} onClick={addRow} />
          </Tooltip>
          <Tooltip title="delete">
            <Button
              size="small"
              disabled={selectedRowKeys.length === 0}
              icon={<DeleteOutlined />}
              onClick={delRow}
            />
          </Tooltip>
          <Tooltip title="export">
            <Button
              size="small"
              disabled={sqlTxt?.length === 0}
              icon={<DownloadOutlined />}
              onClick={exportData}
            />
          </Tooltip>
          <Tooltip title="save sql">
            <Button
              size="small"
              disabled={sqlTxt?.length === 0}
              icon={<SaveOutlined />}
              onClick={saveSqlShow}
            />
          </Tooltip>
        </Flex>
      </Flex>
      <Table
        bordered={true}
        scroll={{ x: 'max-content' }}
        size="small"
        loading={isloading}
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
      <Modal
        title="Save Sql"
        open={addSqlForm}
        onOk={saveSql}
        onCancel={() => {
          setAddSqlForm(false)
        }}
      >
        <TextArea
          maxLength={70}
          onChange={sqlRemarkChange}
          placeholder="add a note, max length is 70"
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
