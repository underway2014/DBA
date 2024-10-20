import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Col, DatePicker, Form, Input, Row } from 'antd'
import { RolePermissionMap, RolePermissionVal } from '@renderer/utils/constant'
import dayjs from 'dayjs'

type LayoutType = Parameters<typeof Form>[0]['layout']
type RoleData = {
  connectionId: string
  roleName: string
  timeStamp: number
}
type CustomProps = {
  addRole: Function
  defautValues?: RoleData
}

const AddRoleForm: React.FC<CustomProps> = (props) => {
  const [form] = Form.useForm()
  const [_, setFormLayout] = useState<LayoutType>('horizontal')
  const { addRole } = props
  const onFormLayoutChange = ({ layout }: { layout: LayoutType }) => {
    setFormLayout(layout)
  }
  const [defaultValue, setDefaultValue] = useState(null)
  form.resetFields()
  const onFinish = (values) => {
    addRole(form.getFieldsValue())
  }

  useEffect(() => {
    getRoleInfo()
  }, [
    props.defautValues?.connectionId,
    props.defautValues?.roleName,
    props.defautValues?.timeStamp
  ])

  function getRoleInfo() {
    console.log('getRole info execute', props.defautValues)
    if (props.defautValues?.roleName && props.defautValues.connectionId) {
      window.api
        .getRoles({ id: props.defautValues.connectionId, roleName: props.defautValues.roleName })
        .then((res) => {
          const ps: string[] = []
          Object.keys(RolePermissionMap).forEach((el) => {
            if (res[0][el]) {
              ps.push(RolePermissionMap[el])
            }
          })

          console.log(
            'get role data: ',
            res[0].rolvaliduntil,
            typeof res[0].rolvaliduntil,
            ' check: ',
            isFinite(res[0].rolvaliduntil)
          )

          setDefaultValue({
            name: res[0].rolname,
            password: res[0].rolpassword,
            permissions: ps,
            // validuntil: res[0].rolvaliduntil ? moment(res[0].rolvaliduntil) : null
            validuntil: res[0].rolvaliduntil
              ? isFinite(res[0].rolvaliduntil)
                ? dayjs(res[0].rolvaliduntil)
                : null
              : null
          })
        })
    } else {
      form.resetFields()
    }
  }

  const onFinishFailed = (errorInfo) => {}

  form.setFieldsValue(defaultValue)

  function onChange(date, str) {
    console.log('onChange: ', date, str)
  }

  return (
    <Form
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ defaultValue }}
      form={form}
      onValuesChange={onFormLayoutChange}
      style={{ maxWidth: 700 }}
    >
      <Form.Item label="name" name="name" rules={[{ required: true }]}>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item label="password" name="password" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </Form.Item>
      <Form.Item name="permissions" label="permissions">
        <Checkbox.Group>
          <Row>
            {RolePermissionVal.map((el, index) => {
              return (
                <Col span={8} key={index}>
                  <Checkbox value={el} style={{ lineHeight: '32px' }}>
                    {el}
                  </Checkbox>
                </Col>
              )
            })}
          </Row>
        </Checkbox.Group>
      </Form.Item>
      <Form.Item name="validuntil" label="valid until">
        <DatePicker showTime onChange={onChange} format={'YYYY-MM-DD HH:mm:ss'} />
      </Form.Item>

      <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
        <Button htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default AddRoleForm
