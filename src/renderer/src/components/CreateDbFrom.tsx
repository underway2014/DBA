import React, { useState } from 'react'
import { Button, Form, Input } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  createDatabase: Function
}

const CreateDbForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { createDatabase } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = (values) => {
    console.log('Success:', values)
    createDatabase(form.getFieldsValue())
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }
  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={{ owner: 'postgres', encoding: 'UTF8' }}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="Database name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item label="Owner" name="owner">
        <Input value="postgres" />
      </Form.Item>
      <Form.Item label="Encoding" name="encoding">
        <Input value="UTF8" />
      </Form.Item>
      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default CreateDbForm
