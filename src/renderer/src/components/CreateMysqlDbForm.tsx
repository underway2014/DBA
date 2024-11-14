import React, { useState } from 'react'
import { Button, Form, Input, Select } from 'antd'

type LayoutType = Parameters<typeof Form>[0]['layout']
type CustomProps = {
  createDatabase: Function
}

const CreateMysqlDbForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { createDatabase } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }

  const onFinish = (values) => {
    createDatabase(form.getFieldsValue())
  }

  const handleChange = (value: string[]) => {
    console.log(`selected ${value}`)
  }

  const characters = [
    { value: 'utf8' },
    { value: 'utf8mb4' },
    { value: 'latin1' },
    { value: 'ascii' },
    { value: 'gbk' },
    { value: 'big5' },
    { value: 'cp1251' },
    { value: 'ucs2' },
    { value: 'binary' }
  ]
  const collates = [
    { value: 'utf8mb4_general_ci' },
    { value: 'utf8mb4_unicode_ci' },
    { value: 'utf8mb4_unicode_520_ci' },
    { value: 'utf8mb4_bin' },
    { value: 'utf8mb4_0900_ai_ci' },
    { value: 'utf8_general_ci' },
    { value: 'utf8_unicode_ci' },
    { value: 'utf8_bin' },
    { value: 'latin1_swedish_ci' },
    { value: 'latin1_general_ci' },
    { value: 'latin1_bin' },
    { value: 'ascii_general_ci' },
    { value: 'ascii_bin' },
    { value: 'gbk_chinese_ci' },
    { value: 'gbk_bin' },
    { value: 'big5_chinese_ci' },
    { value: 'big5_bin' },
    { value: 'ucs2_general_ci' },
    { value: 'ucs2_unicode_ci' },
    { value: 'ucs2_bin' },
    { value: 'binary' }
  ]

  const onFinishFailed = (errorInfo) => { }
  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={{ character: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }}
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
      <Form.Item label="character" name="character">
        <Select
          allowClear
          style={{ width: '100%' }}
          // defaultValue="btree"
          onChange={handleChange}
          options={characters}
        />
      </Form.Item>
      <Form.Item label="collate" name="collate">
        <Select allowClear style={{ width: '100%' }} onChange={handleChange} options={collates} />
      </Form.Item>

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default CreateMysqlDbForm
