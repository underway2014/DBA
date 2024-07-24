import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { Form, Input, Table } from 'antd';

import type { FormInstance, InputRef, TableColumnsType, TableProps } from 'antd';

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

type selfProps = {
  tabData: any
}

const editColumns: TableColumnsType<DataType> = 'column_name, column_default, is_nullable, data_type,character_maximum_length,numeric_precision, numeric_precision_radix,udt_name'.split(',').map(el => {
  return {
    title: el,
    dataIndex: el
  }
})

const EditTable: React.FC<selfProps> = (props, parentRef) => {
  const inputRef = useRef(null);
  let sql = `
  SELECT
      column_name, column_default, is_nullable, data_type,
      character_maximum_length,numeric_precision, numeric_precision_radix,udt_name
  FROM
  information_schema.columns
  WHERE
  table_name = '${props.tabData.tableName}' LIMIT 200
  `
  const [tableName, setTableName] = useState(props.tabData.tableName)
  const [listRows, setListRows] = useState([])

  console.log('tableName: ', tableName)
  // console.log('init current sql: ', currentSql)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    console.log('use effect sqlTxt: ', sql)
    window.api.getTableData(sql).then(data => {

      console.log('executeSql query sql res: ', sql)
      updateList({ listData: data, tableName: props.tabData.tableName })
    })
  }, [])


  const [columns, setColumns] = useState<React.Key[]>(editColumns.map(el => {
    return {
      title: el.title,
      dataIndex: el.dataIndex,
      with: '100px',
      onCell: (record: DataType) => ({
        record,
        editable: true,
        dataIndex: el.title,
        title: el.title,
        handleSave,
      })
    }
  }));
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
    setListRows(listData.rows)


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

  return (
    <div style={{ height: window.screen.height - 64 - 160 + 'px', overflow: 'auto' }}>
      <Table size='small' pagination={false} scroll={{ x: 'max-content' }} components={components} rowSelection={rowSelection} columns={columns} dataSource={listRows} ref={inputRef} />;
    </div >
  )
};

// export default EditTable;
export default forwardRef(EditTable);