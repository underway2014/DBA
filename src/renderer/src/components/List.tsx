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
  SaveOutlined,
  AlignCenterOutlined,
  ConsoleSqlOutlined,
  ExperimentOutlined
} from '@ant-design/icons'
import { LogAction, LogType, PGKEYS } from '@renderer/utils/constant'
import CustomContext from '@renderer/utils/context'
import AddRowForm from './AddRowForm'
import { addLog } from '@renderer/utils/logHelper'
import HighlightWithinTextarea from 'react-highlight-within-textarea'
import { IGetTabData } from '@renderer/interface'
import { format } from 'sql-formatter'

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
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainResult, setExplainResult] = useState('')

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  useEffect(() => {
    if (sqlTxt && sqlTxt.trim()) {
      getAndUpdateTable(listRows)
    }
  }, [])

  function getAndUpdateTable({
    page,
    pageSize,
    overrideSql
  }: { page?: number; pageSize?: number; overrideSql?: string } = {}) {
    setIsloading(true)
    const start = performance.now()
    const curSql = overrideSql || sqlTxt
    window.api
      .getTableData({ ...props.tabData, sql: curSql, page, pageSize, schema: currentSchema })
      .then((data) => {
        const duration = Math.ceil(performance.now() - start)
        if (/^\s*explain\b/i.test(curSql)) {
          let text = ''
          try {
            if (
              Array.isArray(data) &&
              data.length &&
              data[0] &&
              (data[0]['QUERY PLAN'] || data[0]['Query Plan'])
            ) {
              const v = data[0]['QUERY PLAN'] || data[0]['Query Plan']
              const plan = typeof v === 'string' ? JSON.parse(v) : v
              text = JSON.stringify(plan, null, 2)
            } else {
              text = JSON.stringify(data, null, 2)
            }
          } catch (e) {
            if (Array.isArray(data)) {
              const lines = data.map((el) => (el && (el['QUERY PLAN'] || el['Query Plan'])) || '')
              text = lines.join('\n')
            } else {
              text = JSON.stringify(data, null, 2)
            }
          }
          setExplainResult(text)
          setExplainOpen(true)
          addLog({
            type: LogType.SUCCESS,
            logList,
            setLogList,
            sql: curSql,
            text: `success (${duration}ms)`,
            action: LogAction.EDITTABLE,
            toast: false
          })
        } else if (
          /^\s*(SELECT[\s\S]*?FROM|show\s+max_connections|select\s+pg_terminate_backend|SELECT\s+pg_cancel_backend|select\s+now\(|select\s+nextval|with\s+)/i.test(
            curSql
          )
        ) {
          const tableName = getTableName(curSql)
          updateList({ listData: data, tableName: tableName, page, pageSize })
          addLog({
            type: LogType.SUCCESS,
            logList,
            setLogList,
            sql: curSql,
            affectRows: Array.isArray(data?.rows) ? data.rows.length : null,
            text: `success (${duration}ms)`,
            action: LogAction.EDITTABLE,
            toast: false
          })
        } else {
          addLog({
            type: LogType.SUCCESS,
            logList,
            setLogList,
            sql: curSql,
            affectRows: data?.length > 1 ? data[1] : null,
            text: `success (${duration}ms)`,
            action: LogAction.EDITTABLE,
            toast: !!curSql.trim().length
          })
        }
        setIsloading(false)
      })
      .catch((err) => {
        addLog({
          type: LogType.ERROR,
          logList,
          sql: curSql,
          setLogList,
          text: err.message,
          action: LogAction.EDITTABLE
        })
        setIsloading(false)
      })
  }

  const [columns, setColumns] = useState<React.Key[]>([])

  function stripQuotesIfDate(text: string) {
    if (!text) return text || ''
    const m = text.match(/^(["'])(.*)\1$/)
    if (!m) return text
    const inner = m[2]
    const isDate =
      /^(\d{4}-\d{2}-\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(
        inner
      )
    return isDate ? inner : text
  }

  function showEditCell(e, data) {
    setEditRow({ data, show: true })
  }

  function updateList({ listData, tableName, page, pageSize }) {
    if (tableName) {
      const a = tableName.split('.')
      let schema = currentSchema || props.tabData.schema || 'public'
      if (a.length > 1) {
        schema = a[0]
        tableName = a[1]
      }
      setTableName(tableName)
      setSchema(schema)
    }

    listData.rows.forEach((el, index) => {
      // 如果有id则使用id，否则使用索引
      el.key = el.id ? String(el.id) : `row_${index}_${new Date().getTime()}_${Math.random()}`
    })

    listData.rows.forEach((el) => {
      Object.keys(el).forEach((key) => {
        if (el[key] === undefined) {
          el[key] = null
        } else if (el[key] === null) {
        } else if (typeof el[key] === 'object') {
          el[key] = JSON.stringify(el[key])
        } else if (typeof el[key] === 'boolean') {
          el[key] = el[key] ? 'true' : 'false'
        } else {
          el[key] = String(el[key])
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
              if (address === null) {
                const color = isDark ? 'rgba(235, 235, 245, 0.38)' : '#999'
                return (
                  <div className="cellHover">
                    <span style={{ color, fontStyle: 'italic' }}>NULL</span>
                    <div
                      className="cellPlus"
                      onClick={(e) =>
                        showEditCell(e, { content: 'NULL', id: a.id, field: el.name })
                      }
                    >
                      <EditOutlined />
                    </div>
                  </div>
                )
              }
              let s = address || ''
              if (typeof s === 'string') {
                s = stripQuotesIfDate(s)
              }
              if (s.length > 50) {
                s = s.substring(0, 45) + '...  '
              }
              return (
                <div className="cellHover">
                  {s}
                  <div
                    className="cellPlus"
                    onClick={(e) => {
                      let content = address || ''
                      if (typeof content === 'string') {
                        content = stripQuotesIfDate(content)
                      }
                      showEditCell(e, { content, id: a.id, field: el.name })
                    }}
                  >
                    <EditOutlined />
                  </div>
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
    let val: any = editRow.data.content
    if (typeof val === 'string' && /^\s*NULL\s*$/i.test(val)) {
      val = null
    }
    window.api
      .updateDate({
        tableName: tableName,
        dataId: editRow.data.id,
        data: { field: editRow.data.field, value: val },
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

  function runExplain() {
    const s = sqlTxt.trim()
    if (!s) return
    const explainSql = `EXPLAIN ${s}`
    getAndUpdateTable({ overrideSql: explainSql })
  }

  function runAnalyze() {
    const s = sqlTxt.trim()
    if (!s) return
    const explainSql = `EXPLAIN ANALYZE ${s}`
    getAndUpdateTable({ overrideSql: explainSql })
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
        schema: currentSchema
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

  function formatSql() {
    const formatRes = format(sqlTxt, {
      language: 'postgresql',
      tabWidth: 2,
      keywordCase: 'upper',
      linesBetweenQueries: 2
    })
    setSqlTxt(formatRes)
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
        const delIds = selectedRowKeys

        window.api
          .delRows({ ...props.tabData, ids: delIds, schema: currentSchema, tableName: tableName })
          .then((data) => {
            const needRefresh = /^\s*select/i.test(sqlTxt)
            if (needRefresh) {
              getAndUpdateTable({ page: 1, pageSize: listRows.pageSize })
            }

            addLog({
              type: LogType.SUCCESS,
              logList,
              setLogList,
              affectRows: data?.length > 1 ? data[1] : null,
              text: 'success',
              action: LogAction.DELETEROWS,
              toast: !needRefresh
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
      // pageSize changed, reset to page 1
      getAndUpdateTable({ page: 1, pageSize })
    } else {
      // only page changed
      if (!/\blimit\b/i.test(sqlTxt)) {
        getAndUpdateTable({ page, pageSize })
      } else {
        setListRows((a) => {
          return { ...a, page }
        })
      }
    }
  }
  const onChange = (value: string) => setSqlTxt(value || '')
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
          placeholder=""
          onChange={onChange}
          highlight={[
            {
              highlight: PGKEYS,
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
          <Tooltip title="explain">
            <Button size="small" icon={<ConsoleSqlOutlined />} onClick={runExplain} />
          </Tooltip>
          <Tooltip title="analyze">
            <Button size="small" icon={<ExperimentOutlined />} onClick={runAnalyze} />
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
          <Tooltip title="sql format">
            <Button size="small" icon={<AlignCenterOutlined />} onClick={formatSql} />
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
        rowKey={(record) => record.key || `row_${new Date().getTime()}_${Math.random()}`}
        pagination={{
          defaultPageSize: 10,
          pageSize: listRows.pageSize,
          current: listRows.page,
          onChange: pageChange,
          total: listRows.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        // components={components}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={listRows.rows}
        ref={inputRef}
      />

      <Modal
        title="Execution Plan"
        open={explainOpen}
        onOk={() => setExplainOpen(false)}
        onCancel={() => setExplainOpen(false)}
        width={900}
      >
        <TextArea rows={16} value={explainResult} readOnly />
      </Modal>
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
export default React.memo(forwardRef(DataList))
