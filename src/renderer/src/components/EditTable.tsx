import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { Button, Flex, Modal, Table, Tooltip } from 'antd';
import { CaretRightOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType, TableProps } from 'antd';
import AddColumnForm from './AddColumnForm';
import { ExclamationCircleFilled } from '@ant-design/icons';
import CustomContext from '@renderer/utils/context';

const { confirm } = Modal;
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

const EditTable: React.FC<selfProps> = (props, parentRef) => {
  const [alterModal, setAlterModal] = useState({
    add: false,
    alter: false,
    del: false,
    editData: {}
  })

  const { logList, setLogList } = useContext(CustomContext)
  console.log('edittable logList: ', logList)

  const columnsStr = ['column_name', 'column_default', 'is_nullable', 'data_type', 'character_maximum_length', 'numeric_precision', 'numeric_precision_radix', 'udt_name']
  const editColumns: TableColumnsType<DataType> = columnsStr.map(el => {
    return {
      title: el,
      dataIndex: el
    }
  })

  const inputRef = useRef(null);
  let sql = `
  SELECT
      ${columnsStr}
  FROM
  information_schema.columns
  WHERE
  table_name = '${props.tabData.tableName}' LIMIT 500
  `
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState([])
  const selectKeys = []

  console.log('tableName: ', tableName)
  // console.log('init current sql: ', currentSql)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    console.log('use effect sqlTxt: ', sql)
    getTableData()
  }, [])

  function getTableData () {
    window.api.getTableData({
      ...props.tabData,
      // fields: columnsStr,
      sql
    }).then(data => {

      console.log('executeSql query sql res: ', sql)
      updateList({ listData: data, tableName: props.tabData.tableName })
    })
  }


  const [columns, setColumns] = useState<React.Key[]>([]);

  function updateList ({ listData, tableName }) {
    setTableName(tableName)

    listData.rows.forEach(el => el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)

    console.log('column rows: ', listData.columns, listData.rows)
    // { title: 'Action', key: 'operation', render: () => <a>Publish</a> },

    let cms = editColumns.map(el => {
      return {
        title: el.title,
        dataIndex: el.dataIndex,
        key: el.title,
        // with: '50px',
        render: (text) => {
          return <div style={{ maxWidth: "150px" }}>{text}</div>
        }
      }
    })

    cms.push({
      title: 'operater',
      key: 'operater',
      with: '100px',
      dataIndex: 100,
      render: (s, record) => {
        return <a onClick={() => editHandler(record)}>Edit</a>
      }
    })

    setColumns(cms)

    setListRows(listData.rows)

  }

  function editHandler (record) {

    console.log('editHandler: ', record)

    setAlterModal({
      ...alterModal, alter: true, editData: {
        name: record.column_name,
        type: record.udt_name,
        notnull: record.is_nullable === 'YES' ? true : false,
        default: record.column_default,
      }
    })
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);

    selectKeys.length = 0
    selectKeys.push(...newSelectedRowKeys)
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


  function addField () {
    setAlterModal({ ...alterModal, add: true })
  }

  function delField () {
    confirm({
      title: 'Do you want to delete these columns?',
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk () {
        console.log('del OK', listRows, selectKeys, selectedRowKeys);

        let delFields = []
        let leftRows = []
        for (let el of listRows) {
          if (selectedRowKeys.includes(el.key)) {
            delFields.push(el.column_name)
          } else {
            leftRows.push(el)
          }
        }

        console.log('delFields: ', delFields)
        let opt = {
          tableName: tableName,
          column: delFields,
          type: 2
        }
        window.api.alterTable(opt).then(res => {
          console.log('client del field res: ', res)
          selectKeys.length = 0
          setListRows(leftRows)
        })

      },
      onCancel () {
        console.log('Cancel');
      },
    });
  }

  const handleOk = () => {
    setAlterModal({ ...alterModal, add: false })
  };
  const handleCancel = () => {
    setAlterModal({ ...alterModal, add: false, alter: false, editData: {} })
  };

  function addColumn (val, oldValue) {
    console.log('addColumn: ', val, oldValue)
    const type = alterModal.add ? 1 : 3
    setAlterModal({ ...alterModal, add: false, alter: false })
    //type 1-add 2-del  3-alter
    let opt = {
      tableName: tableName,
      column: val.name,
      dataType: val.type,
      comment: val.comment,
      defaultValue: val.default,
      notnull: val.notnull,
      type
    }

    if (oldValue) {
      opt = {
        ...opt, oldValue: {
          tableName: tableName,
          column: oldValue.name,
          dataType: oldValue.type,
          comment: oldValue.comment,
          defaultValue: oldValue.default,
          notnull: oldValue.notnull
        }
      }
    }

    window.api.alterTable(opt).then(res => {
      console.log('client alterTable res: ', res)

      getTableData()
    })
  }

  return (
    <div style={{ height: window.screen.height - 64 - 160 + 'px', overflow: 'auto' }}>
      <Flex gap="small" align="flex-start" vertical style={{ marginLeft: '5px' }}>
        <Flex gap="small" wrap>
          <Tooltip title="add">
            <Button size='small' icon={<PlusOutlined />} onClick={addField} />
          </Tooltip>
          <Tooltip title="delete">
            <Button size='small' icon={<DeleteOutlined />} onClick={delField} />
          </Tooltip>
        </Flex>
      </Flex>

      <Table scroll={{ x: 'max-content' }} size='small' pagination={false}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={listRows} ref={inputRef} />

      <Modal title="Add Column" open={alterModal.add}
        onOk={handleOk} onCancel={handleCancel}
        footer={[]}>
        <AddColumnForm addColumn={addColumn}></AddColumnForm>
      </Modal>

      <Modal title="Edit Column" open={alterModal.alter}
        onOk={handleOk} onCancel={handleCancel}
        footer={[]}>
        <AddColumnForm defautValues={alterModal.editData} addColumn={addColumn}  ></AddColumnForm>
      </Modal>
    </div >
  )
}

// export default EditTable;
export default forwardRef(EditTable);