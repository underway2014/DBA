import React from 'react';
import { Button, Form, Input } from 'antd';


interface FieldData {
  name: string | number | (string | number)[];
  value?: any;
  touched?: boolean;
  validating?: boolean;
  errors?: string[];
}


type selfProps = {
  fields: FieldData[]
  addRowData: Function
}

const AddRowForm: React.FC<selfProps> = (props) => {
  const [form] = Form.useForm();

  const items = props.fields.map(el => {
    return <Form.Item label={el.name} name={el.name} key={Math.random()}>
      <Input />
    </Form.Item>
  })


  function submit (val) {
    console.log('submit: ', form.getFieldsValue(), val)
    props.addRowData(form.getFieldsValue())
  }

  return (
    <Form
      form={form}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      style={{ maxWidth: 700 }}
    >
      {items}

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button onClick={submit}>Submit</Button>
      </Form.Item>

    </Form>
  );
};

export default AddRowForm;