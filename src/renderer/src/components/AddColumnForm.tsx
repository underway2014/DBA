import React, { useState } from 'react';
import { AutoComplete, Button, Checkbox, Flex, Form, Input } from 'antd';

type LayoutType = Parameters<typeof Form>[0]['layout'];
type selfProps = {
  addColumn: Function
  defautValues?: Object
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

    form.resetFields()
  }

  const options = [
    { value: 'int2' },
    { value: 'int4' },
    { value: 'int8' },
    { value: 'bit(6)' },
    { value: 'varbit(6)' },
    { value: 'boolean' },
    { value: 'box' },
    { value: 'bytea' },
    { value: 'char(6)' },
    { value: 'varchar(255)' },
    { value: 'cidr' },
    { value: 'circle' },
    { value: 'date' },
    { value: 'float4' },
    { value: 'float8' },
    { value: 'inet' },
    { value: 'interval' },
    { value: 'json' },
    { value: 'jsonb' },
    { value: 'line' },
    { value: 'lseg' },
    { value: 'macaddr' },
    { value: 'macaddr8' },
    { value: 'money' },
    { value: 'numeric(12,4)' },
    { value: 'point' },
    { value: 'smallserial' },
    { value: 'serial' },
    { value: 'bigserial' },
    { value: 'text' },
    { value: 'timestamptz' },
    { value: 'tsquery' },
    { value: 'tsvector' },
    { value: 'txid_snapshot' },
    { value: 'uuid' },
    { value: 'xml' }
  ];

  return (
    // <Form
    //   {...formItemLayout}
    //   layout={formLayout}
    //   form={form}
    //   initialValues={{ layout: formLayout, ...props.defautValues }}
    //   onValuesChange={onFormLayoutChange}
    //   style={{ maxWidth: formLayout === 'inline' ? 'none' : 700 }}
    // >
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      form={form}
      onValuesChange={onFormLayoutChange}
      // size={componentSize as SizeType}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item label="type" name="type" rules={[{ required: true }]}>
        <AutoComplete
          style={{ width: 100 }}
          options={options}
          placeholder=""
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 16 }} style={{ marginTop: "-20px" }} name="notnull" valuePropName="checked">
        <Checkbox>Not Null</Checkbox>
      </Form.Item>
      <Form.Item label="default" name="default">
        <Input value="" />
      </Form.Item>
      <Form.Item label="comment" name="comment">
        <Input value="" />
      </Form.Item>
      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        {/* <Form.Item {...buttonItemLayout}> */}
        <Button type="primary" onClick={submit}>Submit</Button>
      </Form.Item>
    </Form>
  );
};

export default AddColumnForm;