import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Button, Flex, Modal, Table, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import CustomContext from '@renderer/utils/context'
import { addLog } from '@renderer/utils/logHelper'
import { LogAction, LogType } from '@renderer/utils/constant'
import AddIndexForm from './AddIndexForm'

const { confirm } = Modal
type TableRowSelection<T> = TableProps<T>['rowSelection']

type DataType = {
  title: string
  dataIndex: string
  key: string
  with: string
  // render: Function;
}

type AddRowType = {
  tableName: string
  column: string
  dataType: string
  comment: string
  defaultValue: string
  notnull: boolean
  type?: number
  oldValue?: AddRowType
}

type RowDataType = {
  index_name: string
  column_default: string
  is_nullable: string
  data_type: string
  character_maximum_length: number
  numeric_precision: number
  numeric_precision_radix: number
  udt_name: string
  key: string
}

type SelectColumns = {
  value: string
}

type CustomProps = {
  tabData: any
}

const EditIndex: React.FC<CustomProps> = (props) => {
  console.log('EditIndex: ', props.tabData)
  const [alterModal, setAlterModal] = useState({
    add: false,
    alter: false,
    del: false,
    editData: {}
  })

  const { logList, setLogList } = useContext(CustomContext)

  const inputRef = useRef(null)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState<RowDataType[]>([])
  const [columns, setColumns] = useState<DataType[]>([])
  const [tableColumns, setTableColumns] = useState<SelectColumns>([])

  const selectKeys: React.Key[] = []

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    getTableData()
  }, [])

  function getTableData() {
    // { id: keys[4], schema: keys[2], tableNmae: keys[1] }
    window.api.getIndexs(props.tabData).then((data) => {
      console.log('getindexs res: ', data)
      updateList({ listData: data, tableName: props.tabData.tableName })
    })

    window.api.getColums(props.tabData).then((data) => {
      setTableColumns(
        data.map((el) => {
          return { value: el.column_name }
        })
      )
    })
  }

  function updateList({ listData, tableName }) {
    setTableName(tableName)

    listData.rows.forEach(
      (el) => (el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)
    )

    const cms = listData.columns.map((el) => {
      return {
        title: el.name,
        dataIndex: el.name,
        key: el.name,
        with: '50px',
        render: (text, _) => {
          console.log('text: ', text, typeof text)
          return (
            <div style={{ maxWidth: '150px' }}>
              {typeof text === 'boolean' ? (text ? 'true' : 'false') : text}
            </div>
          )
        }
      }
    })

    setColumns(cms)

    setListRows(listData.rows)
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys)

    selectKeys.length = 0
    selectKeys.push(...newSelectedRowKeys)
  }

  const rowSelection: TableRowSelection<RowDataType> = {
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

  function addField() {
    setAlterModal({ ...alterModal, add: true })
  }

  function delField() {
    confirm({
      title: 'Do you want to delete these indexes?',
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk() {
        const delFields: Array<string> = []
        const leftRows: RowDataType[] = []
        console.log('selectedRowKeys: ', selectedRowKeys)
        console.log('listRows: ', listRows)
        for (const el of listRows) {
          if (selectedRowKeys.includes(el.key)) {
            delFields.push(el.index_name)
          } else {
            leftRows.push(el)
          }
        }

        const opt = {
          indexName: delFields.join(','),
          type: 2
        }
        console.log('del index opt: ', opt)
        window.api
          .editIndex(opt)
          .then((res) => {
            console.log('del index res: ', res)
            selectKeys.length = 0
            setListRows(leftRows)
          })
          .catch((error) => {
            addLog({
              logList,
              setLogList,
              text: error.message,
              action: LogAction.DBEDITINDEX,
              type: LogType.ERROR
            })
          })
      },
      onCancel() {}
    })
  }

  const handleOk = () => {
    setAlterModal({ ...alterModal, add: false })
  }
  const handleCancel = () => {
    setAlterModal({ ...alterModal, add: false, alter: false, editData: {} })
  }

  function editIndex(val) {
    console.log('editIndex val: ', val)
    setAlterModal({ ...alterModal, add: false })
    window.api
      .editIndex({
        type: 1,
        unique: val.unique,
        indexName: val.name,
        schema: props.tabData.schema,
        tableName: props.tabData.tableName,
        indexType: val.type,
        columns: val.columns
      })
      .then((res) => {
        getTableData()
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          action: LogAction.DBEDITINDEX,
          text: error.message,
          type: LogType.ERROR
        })
      })
  }

  return (
    <div style={{ height: window.screen.height - 64 - 86 + 'px', overflow: 'auto' }}>
      <Flex gap="small" align="flex-start" vertical style={{ marginLeft: '5px' }}>
        <Flex gap="small" wrap>
          <Tooltip title="add">
            <Button size="small" icon={<PlusOutlined />} onClick={addField} />
          </Tooltip>
          <Tooltip title="delete">
            <Button size="small" icon={<DeleteOutlined />} onClick={delField} />
          </Tooltip>
        </Flex>
      </Flex>

      <Table
        scroll={{ x: 'max-content' }}
        size="small"
        pagination={false}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={listRows}
        ref={inputRef}
      />

      <Modal
        title="Add Index"
        open={alterModal.add}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <AddIndexForm editIndex={editIndex} columns={tableColumns}></AddIndexForm>
      </Modal>

      {/* <Modal
        title="Edit Column"
        open={alterModal.alter}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <AddColumnForm defautValues={alterModal.editData} addColumn={addColumn}></AddColumnForm>
      </Modal> */}
    </div>
  )
}

export default forwardRef(EditIndex)
