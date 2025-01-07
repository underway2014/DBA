import React, { useState } from 'react'
import { AutoComplete, Button, Checkbox, Form, Input } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  addColumn: (values, defaultvalues) => void
  defautValues?: object
  isMysql: boolean
}

const AddColumnForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { addColumn } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = () => {
    addColumn(form.getFieldsValue(), props.defautValues)

    form.resetFields()
  }

  const onFinishFailed = () => { }

  form.setFieldsValue(props.defautValues)

  const options = props.isMysql
    ? [
      { value: 'tinyint' },
      { value: 'smallint' },
      { value: 'mediumint' },
      { value: 'int' },
      { value: 'integer' },
      { value: 'bigint' },
      { value: 'float' },
      { value: 'double' },
      { value: 'decimal' },
      { value: 'bit' },
      { value: 'date' },
      { value: 'time' },
      { value: 'year' },
      { value: 'datetime' },
      { value: 'timestamp' },
      { value: 'char' },
      { value: 'varchar' },
      { value: 'tinytext' },
      { value: 'text' },
      { value: 'mediumtext' },
      { value: 'longtext' },
      { value: 'binary' },
      { value: 'varbinary' },
      { value: 'tinyblob' },
      { value: 'blob' },
      { value: 'mediumblob' },
      { value: 'longblob' },
      { value: 'enum' },
      { value: 'set' },
      { value: 'json' }
    ]
    : [
      { value: 'int2' },
      { value: 'int4' },
      { value: 'int8' },
      { value: 'bit(6)' },
      { value: 'varbit(6)' },
      { value: 'boolean' },
      { value: 'box' },
      { value: 'bytea' },
      { value: 'char(6)' },
      { value: 'varchar(255)' },
      { value: 'cidr' },
      { value: 'circle' },
      { value: 'date' },
      { value: 'float4' },
      { value: 'float8' },
      { value: 'inet' },
      { value: 'interval' },
      { value: 'json' },
      { value: 'jsonb' },
      { value: 'line' },
      { value: 'lseg' },
      { value: 'macaddr' },
      { value: 'macaddr8' },
      { value: 'money' },
      { value: 'numeric(12,4)' },
      { value: 'point' },
      { value: 'smallserial' },
      { value: 'serial' },
      { value: 'bigserial' },
      { value: 'text' },
      { value: 'timestamptz' },
      { value: 'tsquery' },
      { value: 'tsvector' },
      { value: 'txid_snapshot' },
      { value: 'uuid' },
      { value: 'xml' }
    ]

  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ ...props.defautValues }}
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item label="type" name="type" rules={[{ required: true }]}>
        <AutoComplete
          style={{ width: 200 }}
          options={options}
          placeholder=""
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
        />
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 6, span: 16 }}
        style={{ marginTop: '-20px' }}
        name="notnull"
        valuePropName="checked"
      >
        <Checkbox>Not Null</Checkbox>
      </Form.Item>
      <Form.Item label="default" name="default">
        <Input value="" />
      </Form.Item>
      <Form.Item label="comment" name="comment">
        <Input value="" />
      </Form.Item>
      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default AddColumnForm
