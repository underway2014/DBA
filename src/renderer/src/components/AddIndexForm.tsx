import React, { useState } from 'react'
import { Button, Form, Input, Select, Switch } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  editIndex: Function
  isMysql: boolean
  columns: Array
}

const AddIndexForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { editIndex } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = (values) => {
    editIndex(form.getFieldsValue())

    form.resetFields()
  }

  const onFinishFailed = (errorInfo) => { }

  form.setFieldsValue(props.defautValues)
  const IndexTypeOptions = props.isMysql
    ? [{ value: 'btree' }, { value: 'hash' }, { value: 'rtree' }]
    : [
      { value: 'btree' },
      { value: 'hash' },
      { value: 'gist' },
      { value: 'spgist' },
      { value: 'gin' },
      { value: 'brin' }
    ]

  const handleChange = (value: string[]) => {
    console.log(`selected ${value}`)
  }

  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ type: 'btree' }}
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item label="columns" name="columns" rules={[{ required: true }]}>
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Please select"
          // defaultValue={['a10', 'c12']}
          onChange={handleChange}
          options={props.columns}
        />
      </Form.Item>
      <Form.Item label="unique" name="unique">
        <Switch />
      </Form.Item>
      <Form.Item label="type" name="type">
        <Select
          allowClear
          style={{ width: '100%' }}
          // defaultValue="btree"
          onChange={handleChange}
          options={IndexTypeOptions}
        />
      </Form.Item>
      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default AddIndexForm
