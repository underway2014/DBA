import React, { useState } from 'react'
import { Button, Form, Input, Select } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  createTable: Function
  isMysql: boolean
}

const CreateTableForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { createTable } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = (values) => {
    createTable(form.getFieldsValue())

    form.resetFields()
  }

  const onFinishFailed = (errorInfo) => { }

  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>

      {props.isMysql && (
        <Form.Item label="engine" name="engine" rules={[{ required: true }]}>
          <Select
            style={{ width: '100%' }}
            // defaultValue={}
            options={[{ value: 'InnoDB' }, { value: 'MyISAM' }, { value: 'MEMORY' }]}
          />
        </Form.Item>
      )}

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default CreateTableForm
