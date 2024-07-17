import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';

type LayoutType = Parameters<typeof Form>[0]['layout'];
type selfProps = {
  createDatabase: Function
}

const CreateDbForm: React.FC<selfProps> = (props) => {
  const [form] = Form.useForm();
  const [formLayout, setFormLayout] = useState<LayoutType>('horizontal');
  const { createDatabase } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout);
  };

  const formItemLayout =
    formLayout === 'horizontal' ? { labelCol: { span: 6 }, wrapperCol: { span: 14 } } : null;

  const buttonItemLayout =
    formLayout === 'horizontal' ? { wrapperCol: { span: 14, offset: 4 } } : null;

  function submit (val) {
    console.log('submit: ', form.getFieldsValue(), val)

    createDatabase(form.getFieldsValue())
  }
  return (
    <Form
      {...formItemLayout}
      layout={formLayout}
      form={form}
      initialValues={{ layout: formLayout, owner: 'postgres', encoding: 'UTF8' }}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: formLayout === 'inline' ? 'none' : 700 }}
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
      <Form.Item {...buttonItemLayout}>
        <Button type="primary" onClick={submit}>Submit</Button>
      </Form.Item>
    </Form>
  );
};

export default CreateDbForm;