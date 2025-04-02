import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Button, Flex, Modal, Table, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import AddColumnForm from './AddColumnForm'
import { ExclamationCircleFilled } from '@ant-design/icons'
import CustomContext from '@renderer/utils/context'
import { addLog } from '@renderer/utils/logHelper'
import { LogAction, LogType } from '@renderer/utils/constant'
import { IConnection, IGetTabData } from '@renderer/interface'

const { confirm } = Modal
type TableRowSelection<T> = TableProps<T>['rowSelection']

type DataType = {
  title: string
  dataIndex: string
  key: string
  width: string
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
  schema?: string
  id: string
  connection?: IConnection
}

type RowDataType = {
  column_name: string
  column_default: string
  is_nullable: string
  data_type: string
  character_maximum_length: number
  numeric_precision: number
  numeric_precision_radix: number
  udt_name: string
  key: string
}

type CustomProps = {
  tabData: IGetTabData
}

const EditTable: React.FC<CustomProps> = (props) => {
  const [isloading, setIsloading] = useState(true)

  const [alterModal, setAlterModal] = useState({
    add: false,
    alter: false,
    del: false,
    editData: {}
  })

  const { logList, setLogList } = useContext(CustomContext)

  const columnsStr =
    props.tabData.connection?.config.dialect === 'postgres'
      ? [
          'column_name',
          'data_type',
          'column_default',
          'is_nullable',
          'character_maximum_length',
          'numeric_precision',
          'numeric_precision_radix',
          'udt_name'
        ]
      : ['COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE', 'COLUMN_DEFAULT', 'COLUMN_KEY'].map((el) =>
          el.toLowerCase()
        )

  const inputRef = useRef(null)
  // SELECT
  //     ${columnsStr}
  // FROM
  // information_schema.columns
  // WHERE
  // table_name = '${props.tabData.tableName}' LIMIT 500
  const sql =
    props.tabData.connection?.config.dialect === 'postgres'
      ? `
      SELECT
      column_name,
          data_type,
          column_default,
          is_nullable,
          character_maximum_length,
          numeric_precision,
          numeric_precision_radix,
          udt_name,
            CASE
                WHEN column_default IS NULL THEN NULL
                ELSE TRIM(BOTH '''' FROM REGEXP_REPLACE(column_default, '::[^)]+$', ''))
            END as column_default
        FROM
            information_schema.columns
        WHERE
            table_schema = '${props.tabData.schema}'
            AND table_name = '${props.tabData.tableName}'
        ORDER BY
            ordinal_position
        limit 500
  `
      : `
  SELECT ${columnsStr.map((el) => `LOWER(${el}) as ${el.toLowerCase()}`)}
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '${props.tabData.dbName}' AND TABLE_NAME = '${props.tabData.tableName}' LIMIT 500;
  `

  console.log('edit sql: ', sql)
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState<RowDataType[]>([])
  const [columns, setColumns] = useState<DataType[]>([])

  const selectKeys: React.Key[] = []

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    console.log('get aaa: ', JSON.stringify(props.tabData, null, 2))
    getTableData()
  }, [])

  function getTableData() {
    window.api
      .getTableData({
        ...props.tabData,
        sql
      })
      .then((data) => {
        updateList({
          listData: data,
          tableName: props.tabData.tableName
        })
        setIsloading(false)
      })
      .catch((error) => {
        setIsloading(false)
      })
  }

  function updateList({ listData, tableName }) {
    setTableName(tableName)

    listData.rows.forEach(
      (el) => (el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)
    )

    const cms = columnsStr.map((el) => {
      return {
        title: el,
        dataIndex: el,
        key: el,
        width: '50px',
        render: (text, _) => {
          return <div style={{ maxWidth: '150px' }}>{text}</div>
        }
      }
    })

    cms.push({
      title: 'operater',
      key: 'operater',
      width: '100px',
      dataIndex: '100',
      render: (_, record) => {
        return (
          <div>
            <a onClick={() => editHandler(record)}>Edit</a>
          </div>
        )
      }
    })

    setColumns(cms)

    setListRows(listData.rows)
  }

  function editHandler(record) {
    console.log('editHandler: ', record, alterModal)
    setAlterModal({
      ...alterModal,
      alter: true,
      editData: {
        name: record.column_name,
        type: record.udt_name || record.data_type,
        notnull: record.is_nullable.toLowerCase() === 'yes' ? true : false,
        default: record.column_default
      }
    })
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
      title: 'Do you want to delete these columns?',
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk() {
        const delFields: Array<string> = []
        const leftRows: RowDataType[] = []
        for (const el of listRows) {
          if (selectedRowKeys.includes(el.key)) {
            delFields.push(el.column_name)
          } else {
            leftRows.push(el)
          }
        }

        const opt = {
          tableName: tableName,
          column: delFields,
          type: 2,
          id: props.tabData.id,
          connection: props.tabData.connection
        }
        window.api.alterTable(opt).then((res) => {
          selectKeys.length = 0
          setListRows(leftRows)
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

  function addColumn(val, oldValue) {
    const type = alterModal.add ? 1 : 3
    setAlterModal({ ...alterModal, add: false, alter: false })
    //type 1-add 2-del  3-alter
    let opt: AddRowType = {
      tableName: tableName,
      column: val.name,
      dataType: val.type,
      comment: val.comment,
      defaultValue: val.default,
      notnull: val.notnull,
      type,
      schema: props.tabData.schema,
      id: props.tabData.id,
      connection: props.tabData.connection
    }

    if (oldValue) {
      opt = {
        ...opt,
        oldValue: {
          tableName: tableName,
          column: oldValue.name,
          dataType: oldValue.type,
          comment: oldValue.comment,
          defaultValue: oldValue.default,
          notnull: oldValue.notnull
        }
      }
    }

    window.api
      .alterTable(opt)
      .then((res) => {
        getTableData()
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          action: LogAction.ALTERCOLUMN,
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
        loading={isloading}
        pagination={false}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={listRows}
        ref={inputRef}
      />

      <Modal
        title="Add Column"
        open={alterModal.add}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <AddColumnForm
          isMysql={props.tabData.connection.config.dialect !== 'postgres'}
          addColumn={addColumn}
        ></AddColumnForm>
      </Modal>

      <Modal
        title="Edit Column"
        open={alterModal.alter}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <AddColumnForm
          isMysql={props.tabData.connection.config.dialect !== 'postgres'}
          defautValues={alterModal.editData}
          addColumn={addColumn}
        ></AddColumnForm>
      </Modal>
    </div>
  )
}

export default forwardRef(EditTable)
