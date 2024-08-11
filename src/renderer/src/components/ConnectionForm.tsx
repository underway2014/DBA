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

  const formItemLayout =
    formLayout === 'horizontal' ? { labelCol: { span: 4 }, wrapperCol: { span: 14 } } : null;

  const buttonItemLayout =
    formLayout === 'horizontal' ? { wrapperCol: { span: 14, offset: 4 } } : null;

  function submit (val) {
    console.log('submit: ', form.getFieldsValue(), val)

    addConnection(form.getFieldsValue())
  }

  // host: '35.220.166.96',
  //     port: '8001',
  //     username: 'postgres',
  //     password: 'ZLKLMqzHy2308jU6',
  //     dialect: 'postgres',
  //     database: 'postgres'
  return (
    <Form
      {...formItemLayout}
      layout={formLayout}
      form={form}
      initialValues={{ layout: formLayout, ...props.defautValues }}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: formLayout === 'inline' ? 'none' : 600 }}
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
      <Form.Item {...buttonItemLayout}>
        <Button type="primary" onClick={submit}>Submit</Button>
      </Form.Item>
    </Form>
  );
};

export default ConnectionForm;