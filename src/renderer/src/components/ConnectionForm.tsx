import React, { useState } from 'react'
import { Button, Form, Input, Select, Switch } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  addConnection: Function
  defautValues?: Object
}

const ConnectionForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const [dbType, setDbType] = useState(props.defautValues?.dialect || 'postgres')
  const { addConnection } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = (values) => {
    console.log('form values: ', form.getFieldsValue())
    addConnection({ ...form.getFieldsValue(), id: props.defautValues?.id })
  }

  const onFinishFailed = (errorInfo) => { }

  const changeHandler = (value) => {
    console.log('db value: ', value)

    setDbType(value)
  }

  // host: '35.221.166.196',
  //     port: '8002',
  //     username: 'postgres',
  //     password: 'ZLKLMqzHy2308jU6',
  //     dialect: 'postgres',
  //     database: 'postgres'
  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={{
        dialect: 'postgres',
        port: '5432',
        ...props.defautValues,
        ssl: props.defautValues?.dialectOptions?.ssl?.require
      }}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
      autoComplete="off"
    >
      <Form.Item label="dialect" name="dialect" rules={[{ required: true }]}>
        <Select
          style={{ width: '100%' }}
          // defaultValue="postgres"
          options={[{ value: 'postgres' }, { value: 'mysql' }]}
          onChange={changeHandler}
        />
      </Form.Item>
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="host" name="host" rules={[{ required: true }]}>
        <Input placeholder="host" />
      </Form.Item>
      <Form.Item label="port" name="port" rules={[{ required: true }]}>
        <Input value="5432" />
      </Form.Item>
      <Form.Item label="username" name="username" rules={[{ required: true }]}>
        <Input placeholder="username" />
      </Form.Item>
      <Form.Item label="password" name="password" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </Form.Item>
      <Form.Item label="database" name="database" rules={[{ required: true }]}>
        <Input placeholder="database" />
      </Form.Item>
      {dbType === 'postgres' && (
        <Form.Item label="ssl" name="ssl">
          <Switch />
        </Form.Item>
      )}

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <div style={{ textAlign: 'center' }}>
          <Button htmlType="submit">Submit</Button>
        </div>
      </Form.Item>
    </Form>
  )
}

export default ConnectionForm
