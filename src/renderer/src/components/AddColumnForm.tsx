import React, { useState } from 'react';
import { Button, Form, Input, Select } from 'antd';

type LayoutType = Parameters<typeof Form>[0]['layout'];
type selfProps = {
  addColumn: Function
}

const AddColumnForm: React.FC<selfProps> = (props) => {
  const [form] = Form.useForm();
  const [formLayout, setFormLayout] = useState<LayoutType>('horizontal');
  const { addColumn } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout);
  };

  const formItemLayout =
    formLayout === 'horizontal' ? { labelCol: { span: 6 }, wrapperCol: { span: 14 } } : null;

  const buttonItemLayout =
    formLayout === 'horizontal' ? { wrapperCol: { span: 14, offset: 4 } } : null;

  function submit (val) {
    console.log('submit: ', form.getFieldsValue(), val)

    addColumn(form.getFieldsValue())
  }
  return (
    <Form
      {...formItemLayout}
      layout={formLayout}
      form={form}
      initialValues={{ layout: formLayout }}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: formLayout === 'inline' ? 'none' : 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item label="type" name="type" rules={[{ required: true }]}>
        <Select>
          <Select.Option value="int2">int2</Select.Option>
          <Select.Option value="int4">int4</Select.Option>
          <Select.Option value="int8">int8</Select.Option>
          <Select.Option value="json">json</Select.Option>
          <Select.Option value="jsonb">jsonb</Select.Option>
          <Select.Option value="timestamptz">timestamptz</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="default" name="default">
        <Input value="" />
      </Form.Item>
      <Form.Item label="comment" name="comment">
        <Input value="" />
      </Form.Item>
      <Form.Item {...buttonItemLayout}>
        <Button type="primary" onClick={submit}>Submit</Button>
      </Form.Item>
    </Form>
  );
};

export default AddColumnForm;