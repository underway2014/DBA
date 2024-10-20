import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Dropdown, MenuProps, Tabs, TabsProps } from 'antd'
import {
  UnorderedListOutlined,
  EditOutlined,
  HighlightOutlined,
  UserOutlined
} from '@ant-design/icons'

import List from './List'
import EditTable from './EditTable'
import EditIndex from './EditIndex'
import { IGetTabData } from '@renderer/interface'
import EditRolePermission from './EditRolePermission'

type TargetKey = React.MouseEvent | React.KeyboardEvent | string
type TabItem = {
  label: string | JSX.Element
  children: JSX.Element
  key: string
  icon?: JSX.Element
}

const defaultPanes = new Array(1).fill(null).map((_, index) => {
  const id = String(index + 1)
  return {
    label: `Welcome`,
    children: `
      Hi there,Welcome to my open-source database tool! I'm thrilled to share this project with you all. If you encounter any issues or have suggestions while using it, please feel free to raise an issue on GitHub. Our goal is to improve this tool together, making it more powerful and user-friendly. Looking forward to your contributions!
    `,
    key: id
  }
})

const TabelContent: React.FC = (_, parentRef) => {
  const [activeKey, setActiveKey] = useState(defaultPanes[0].key)
  const [items, setItems] = useState<TabItem[]>([])
  const newTabIndex = useRef(0)
  const nowItems = useRef(items)

  useImperativeHandle(parentRef, () => {
    return {
      updateList(tabData: IGetTabData) {
        addTab(tabData)
      }
    }
  })

  const onChange = (key: string) => {
    setActiveKey(key)
  }

  function rightMenuHandler(e, key) {
    e.domEvent.stopPropagation()

    let newItems: TabItem[] = []
    if (+e.key === 5) {
      newItems = nowItems.current.filter((el) => el.key !== key)

      if (newItems.length) {
        setActiveKey(newItems[0].key)
      }
    } else if (+e.key === 6) {
      newItems = nowItems.current.filter((el) => {
        return el.key === key
      })

      if (newItems.length) {
        setActiveKey(key)
      }
    }

    setItems(newItems)
    nowItems.current = newItems
  }

  const tabRightItems: MenuProps['items'] = [
    {
      label: 'Close',
      key: 5
    },
    {
      label: 'Close Others',
      key: 6
    },
    {
      label: 'Close All',
      key: 7
    }
  ]
  const genTabTitle = function ({ title, key }) {
    return (
      <Dropdown
        // menu={{ items: tabRightItems, onClick: rightMenuHandler }}
        menu={{ items: tabRightItems, onClick: (e) => rightMenuHandler(e, key, items) }}
        trigger={['contextMenu']}
      >
        <span style={{ userSelect: 'none', width: '100%', display: 'inline-block' }}>{title}</span>
      </Dropdown>
    )
  }

  const addTab = (data: IGetTabData) => {
    const newActiveKey = `tab${newTabIndex.current++}`
    // setItems([...items, { label: 'New Tab', children: 'abcd', key: newActiveKey }]);

    console.log('table content data: ', data)
    const newItems = [...items]
    if (data.type === 1) {
      newItems.push({
        label: genTabTitle({ title: data.tableName, key: newActiveKey }),
        icon: <UnorderedListOutlined />,
        children: <List tabData={data}></List>,
        key: newActiveKey
      })
    } else if (data.type === 2) {
      newItems.push({
        label: genTabTitle({ title: data.tableName, key: newActiveKey }),
        icon: <EditOutlined />,
        children: <EditTable tabData={data}></EditTable>,
        key: newActiveKey
      })
    } else if (data.type === 3) {
      newItems.push({
        label: genTabTitle({ title: data.tableName, key: newActiveKey }),
        icon: <HighlightOutlined />,
        children: <EditIndex tabData={data}></EditIndex>,
        key: newActiveKey
      })
    } else if (data.type === 4) {
      console.log('tab data: ', data)
      //edit role
      newItems.push({
        label: genTabTitle({ title: data.roleName, key: newActiveKey }),
        icon: <UserOutlined />,
        children: <EditRolePermission connection={data}></EditRolePermission>,
        key: newActiveKey
      })
    }
    setActiveKey(newActiveKey)
    setItems(newItems)

    nowItems.current = newItems
  }

  const remove = (targetKey: TargetKey) => {
    const targetIndex = items.findIndex((pane) => pane.key === targetKey)
    const newPanes = items.filter((pane) => pane.key !== targetKey)
    if (newPanes.length && targetKey === activeKey) {
      const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex]
      setActiveKey(key)
    }
    setItems(newPanes)
    nowItems.current = newPanes
  }

  const onEdit = (targetKey: TargetKey, action: 'add' | 'remove') => {
    if (action === 'add') {
      // add();
    } else {
      remove(targetKey)
    }
  }

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => {
    return (
      <div id={props.activeKey} data-a={props.activeKey}>
        <DefaultTabBar {...props} />
      </div>
    )
  }

  return (
    <div>
      <Tabs
        renderTabBar={renderTabBar}
        hideAdd
        onChange={onChange}
        activeKey={activeKey}
        type="editable-card"
        onEdit={onEdit}
        // onTabClick={tabRightClick}
        items={items}
      />
    </div>
  )
}

export default forwardRef(TabelContent)
