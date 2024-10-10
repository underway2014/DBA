import React, { useState } from 'react'
import { Button, Form, Input } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  editSchema: Function
}

const AddSchemaForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { editSchema } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = (values) => {
    editSchema(form.getFieldsValue())

    form.resetFields()
  }

  const onFinishFailed = (errorInfo) => {}

  // form.setFieldsValue(props.defautValues)

  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      // initialValues={{ type: 'btree' }}
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default AddSchemaForm
