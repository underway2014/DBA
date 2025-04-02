import React from 'react'
import { Button, Form, Input, Select, Switch } from 'antd'

interface IndexFormValues {
  name: string
  columns: string[]
  unique: boolean
  type: string
}

interface CustomProps {
  editIndex: (values: IndexFormValues) => void
  isMysql: boolean
  columns: Array<{ value: string; label: string }>
  defaultValues?: Partial<IndexFormValues>
}

const AddIndexForm: React.FC<CustomProps> = ({ editIndex, isMysql, columns, defaultValues }) => {
  const [form] = Form.useForm<IndexFormValues>()

  const onFinish = () => {
    const values = form.getFieldsValue()
    editIndex(values)
    form.resetFields()
  }

  const onFinishFailed = () => {
    // 可以添加错误处理逻辑
  }

  if (defaultValues) {
    form.setFieldsValue(defaultValues)
  }

  const IndexTypeOptions = isMysql
    ? [{ value: 'btree' }, { value: 'hash' }, { value: 'rtree' }]
    : [
        { value: 'btree' },
        { value: 'hash' },
        { value: 'gist' },
        { value: 'spgist' },
        { value: 'gin' },
        { value: 'brin' }
      ]

  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ type: 'btree' }}
      form={form}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="Please input index name" />
      </Form.Item>

      <Form.Item label="columns" name="columns" rules={[{ required: true }]}>
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Please select columns"
          options={columns}
        />
      </Form.Item>

      <Form.Item label="unique" name="unique" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="type" name="type">
        <Select
          allowClear
          style={{ width: '100%' }}
          placeholder="Please select index type"
          options={IndexTypeOptions}
        />
      </Form.Item>

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  )
}

export default AddIndexForm
