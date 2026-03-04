import React, { forwardRef, useContext, useEffect, useState } from 'react'
import { Button, Flex, Modal, Table, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import CustomContext from '@renderer/utils/context'
import { addLog } from '@renderer/utils/logHelper'
import { LogAction, LogType } from '@renderer/utils/constant'

const { confirm } = Modal
type TableRowSelection<T> = TableProps<T>['rowSelection']

type DataType = {
  title: string
  dataIndex: string
  key: string
  with: string
}

type RowDataType = {
  constraint_name: string
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
  key: string
}

type CustomProps = {
  tabData: any
}

const EditForeignKey: React.FC<CustomProps> = (props) => {
  const { logList, setLogList } = useContext(CustomContext)
  const [isloading, setIsloading] = useState(true)

  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState<RowDataType[]>([])
  const [columns, setColumns] = useState<DataType[]>([])

  const selectKeys: React.Key[] = []

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    getTableData()
  }, [])

  function getTableData() {
    const dbName = props.tabData.database || props.tabData.config?.database || ''
    window.api
      .getForeignKeys({
        id: props.tabData.id,
        schema: props.tabData.schema || 'public',
        tableName: props.tabData.tableName,
        dbName
      })
      .then((data) => {
        updateList({ listData: data, tableName: props.tabData.tableName })
        setIsloading(false)
      })
      .catch(() => {
        setIsloading(false)
      })
  }

  function updateList({ listData, tableName }) {
    setTableName(tableName)

    listData.rows.forEach(
      (el) => (el.key = el.constraint_name || `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)
    )

    const cms = listData.columns.map((el) => {
      return {
        title: el.name,
        dataIndex: el.name,
        key: el.name,
        with: '150px',
        render: (text) => {
          return (
            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text || '-'}
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
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE]
  }

  function delForeignKey() {
    confirm({
      title: 'Do you want to delete these foreign keys?',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: 'This operation cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk() {
        const delConstraints: Array<string> = []
        const leftRows: RowDataType[] = []

        for (const el of listRows) {
          if (selectedRowKeys.includes(el.key)) {
            delConstraints.push(el.constraint_name)
          } else {
            leftRows.push(el)
          }
        }

        const deletePromises = delConstraints.map((constraintName) => {
          return window.api.delForeignKey({
            id: props.tabData.id,
            schema: props.tabData.schema || 'public',
            tableName: props.tabData.tableName,
            constraintName
          })
        })

        Promise.all(deletePromises)
          .then(() => {
            selectKeys.length = 0
            setListRows(leftRows)
            addLog({
              logList,
              setLogList,
              text: 'Foreign keys deleted successfully',
              action: LogAction.DBEDITINDEX,
              type: LogType.SUCCESS
            })
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
      onCancel() { }
    })
  }

  return (
    <div style={{ height: window.screen.height - 64 - 86 + 'px', overflow: 'auto' }}>
      <Flex gap="small" align="flex-start" vertical style={{ marginLeft: '5px' }}>
        <Flex gap="small" wrap>
          <Tooltip title="delete">
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={delForeignKey}
              disabled={selectedRowKeys.length === 0}
            />
          </Tooltip>
        </Flex>
      </Flex>

      <Table
        scroll={{ x: 'max-content' }}
        size="small"
        pagination={false}
        loading={isloading}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={listRows}
        locale={{ emptyText: 'No foreign keys found' }}
      />
    </div>
  )
}

export default forwardRef(EditForeignKey)
