import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';

type LayoutType = Parameters<typeof Form>[0]['layout'];
type selfProps = {
  addConnection: Function
  defautValues?: Object
}

const ConnectionForm: React.FC<selfProps> = (props) => {
  console.log('ConnectionForm ', props.defautValues)
  const [form] = Form.useForm();
  const [formLayout, setFormLayout] = useState<LayoutType>('horizontal');
  const { addConnection } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout);
  };

  function submit (val) {
    console.log('submit: ', form.getFieldsValue(), val)

    addConnection(form.getFieldsValue())
  }

  // host: '35.221.166.196',
  //     port: '8002',
  //     username: 'postgres',
  //     password: 'ZLKLMqzHy2308jU6',
  //     dialect: 'postgres',
  //     database: 'postgres'
  return (
    <Form
      initialValues={{ ...props.defautValues }}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name">
        <Input placeholder="connection name" />
      </Form.Item>
      <Form.Item label="host" name="host">
        <Input placeholder="input placeholder" />
      </Form.Item>
      <Form.Item label="port" name="port">
        <Input placeholder="5432" />
      </Form.Item>
      <Form.Item label="username" name="username">
        <Input placeholder="username" />
      </Form.Item>
      <Form.Item label="password" name="password">
        <Input placeholder="password" />
      </Form.Item>
      <Form.Item label="database" name="database">
        <Input placeholder="database" />
      </Form.Item>
      <Form.Item label="dialect" name="dialect">
        <Input placeholder="postgres" />
      </Form.Item>
      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button type="primary" onClick={submit}>Submit</Button>
      </Form.Item>
    </Form>
  );
};

export default ConnectionForm;