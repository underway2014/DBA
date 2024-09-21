import React, { useEffect, useState, useRef } from 'react'
import {
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Flex,
  Layout,
  List,
  MenuProps,
  Modal,
  Tooltip
} from 'antd'
import ConnectionItem from './ConnectionItem'
import TabelContent from './TabelContent'
import { Header } from 'antd/es/layout/layout'
import ConnectionForm from './ConnectionForm'
import CreateDbForm from './CreateDbFrom'
import { EyeOutlined } from '@ant-design/icons'
import * as _ from 'lodash'
import CustomContext from '@renderer/utils/context'
import { ILogItem } from '../interface'
const { Content, Sider } = Layout

const CLayout: React.FC = () => {
  const [connections, setConnections] = useState([])
  const [data, setData] = useState({
    showForm: false,
    connections: [
      // {
      //   "name": "local-pg233",
      //   "config": {
      //     "host": "127.0.0.1",
      //     "port": 5432,
      //     "username": "postgres",
      //     "password": "postgres",
      //     "dialect": "postgres",
      //     "database": "jogo_gaming_dev"
      //   }
      // }
    ],
    connectionForm: false,
    createdbFrom: false,
    dbInfo: [
      // {
      //   title: 'Home',
      // },
      // {
      //   title: 'Application Center',
      //   href: '',
      // }
    ]
  })

  const tabsRef = useRef<any>()

  useEffect(() => {
    console.log('useEffect')
    updateSlider()
  }, [])

  function updateSlider () {
    window.api.getStore().then((connections) => {
      console.log('get new connections:', connections)
      setConnections(connections)
    })
  }

  function getTableDataByName (val) {
    // type 1-查看表数据 2-编辑表
    tabsRef.current.updateList(val)
  }

  function rightMenuHandler (e) {
    console.log('rightMenuHandler e: ', e)
    e.domEvent.stopPropagation()

    if (+e.key === 5) {
      setData({ ...data, connectionForm: true })
    } else if (+e.key === 10) {
      setData({ ...data, createdbFrom: true })
    }
  }

  const items: MenuProps['items'] = [
    {
      label: 'Add Connection',
      key: '5'
    }
  ]

  function conOk () {
    setData({ ...data, connectionForm: false })
  }

  function conCancel () {
    setData({ ...data, connectionForm: false })
  }

  function createdbCacel () {
    setData({ ...data, createdbFrom: false })
  }

  function createdbOk () {
    setData({ ...data, createdbFrom: false })
  }

  function conAddOk (val) {
    window.api.addStore({
      name: val.name,
      config: {
        host: val.host,
        port: val.port,
        username: val.username,
        password: val.password,
        dialect: val.dialect,
        database: val.database
      }
    })

    setData({ ...data, connectionForm: false })
    updateSlider()
  }
  function addDbOk () {
    setData({ ...data, createdbFrom: false })
  }

  function setDbInfo (val) {
    console.log('set db info: ', val)
    const a = val.map((el) => {
      return {
        title: el
      }
    })
    setData({ ...data, dbInfo: a })
  }

  const [logOpen, setLogOpen] = useState(false)
  function logClose () {
    setLogOpen(false)
  }

  function showLog () {
    setLogOpen(true)
  }

  const [logList, setLogList] = useState<ILogItem[]>([])

  return (
    <div>
      <CustomContext.Provider value={{ logList, setLogList }}>
        <Header style={{ backgroundColor: 'white', height: '30px' }}>
          <Flex justify={'space-between'} align={'center'}>
            <Breadcrumb style={{ marginLeft: '250px' }} separator=">" items={data.dbInfo} />

            <Tooltip title="show log">
              <Button size="small" shape="circle" icon={<EyeOutlined />} onClick={showLog} />
            </Tooltip>
          </Flex>
        </Header>

        <Layout>
          <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
            <div style={{ height: window.screen.height - 64 - 60 + 'px', overflow: 'auto' }}>
              <Sider
                breakpoint="lg"
                collapsedWidth="0"
                onBreakpoint={(broken) => {
                  console.log(broken)
                }}
                width={300}
                onCollapse={(collapsed, type) => {
                  console.log(collapsed, type)
                }}
                style={{ backgroundColor: 'white' }}
              >
                {connections.map((el, index) => {
                  return (
                    <ConnectionItem
                      setDbInfo={setDbInfo}
                      getTableDataByName={getTableDataByName}
                      cid={index}
                      key={el.id}
                      connection={el}
                      updateSlider={updateSlider}
                    ></ConnectionItem>
                  )
                })}
              </Sider>
            </div>
          </Dropdown>
          <Layout>
            <Content style={{ height: window.screen.height - 64 - 60 - 200 + 'px' }}>
              <TabelContent ref={tabsRef}></TabelContent>
            </Content>
          </Layout>
        </Layout>

        <Drawer title={`LOG`} placement="right" size={'large'} onClose={logClose} open={logOpen}>
          <List
            size="small"
            // bordered
            dataSource={logList}
            renderItem={(item) => {
              return (
                <p style={{ fontSize: 14, margin: 0 }}>
                  [{item.type}] [{item.date}] {item.text}
                </p>
              )
            }}
          />
        </Drawer>

        <Modal
          title="Add connection"
          open={data.connectionForm}
          onOk={conOk}
          onCancel={conCancel}
          footer={[]}
        >
          <ConnectionForm addConnection={conAddOk}></ConnectionForm>
        </Modal>

        <Modal
          title="Create database"
          open={data.createdbFrom}
          onOk={createdbOk}
          onCancel={createdbCacel}
          footer={[]}
        >
          <CreateDbForm createDatabase={addDbOk}></CreateDbForm>
        </Modal>
      </CustomContext.Provider>
    </div>
  )
}

export default CLayout
