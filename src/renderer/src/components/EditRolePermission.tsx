import React, { forwardRef } from 'react'
import { Flex, Splitter, Typography } from 'antd'
import AddRoleForm from './AddRoleForm'

const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => (
  <Flex justify="center" align="center" style={{ height: '100' }}>
    <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
      {props.text}
    </Typography.Title>
  </Flex>
)

const EditRolePermission: React.FC = () => {
  function addrole() {}

  return (
    <Splitter
      layout="vertical"
      style={{
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        height: window.screen.height - 64 - 86 + 'px',
        overflow: 'auto'
      }}
    >
      <Splitter.Panel style={{ height: '275px' }}>
        <AddRoleForm addRole={addrole}></AddRoleForm>
      </Splitter.Panel>
      <Splitter.Panel>
        <Splitter>
          <Splitter.Panel defaultSize="40%" min="20%" max="70%">
            <Desc text="First" />
          </Splitter.Panel>
          <Splitter.Panel>
            <Desc text="Second" />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
    </Splitter>
  )
}

export default forwardRef(EditRolePermission)
