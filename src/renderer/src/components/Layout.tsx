import React, { useEffect, useState, useRef } from 'react'
import {
  Breadcrumb,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Flex,
  Layout,
  List,
  MenuProps,
  Modal,
  Splitter,
  theme,
  Tooltip
} from 'antd'
import ConnectionItem from './ConnectionItem'
import TabelContent from './TabelContent'
import { Header } from 'antd/es/layout/layout'
import ConnectionForm from './ConnectionForm'
import CreateDbForm from './CreateDbFrom'
import { EyeOutlined, BulbOutlined } from '@ant-design/icons'
import CustomContext from '@renderer/utils/context'
import { IConnection, IGetTabData, ILogItem } from '../interface'
import { LogAction, LogType } from '@renderer/utils/constant'
import moment from 'moment'

const { Content, Sider } = Layout

type DbInfo = {
  title: string
}

type ConItem = {
  showForm: boolean
  connections: IConnection[]
  connectionForm: boolean
  createdbFrom: boolean
  dbInfo: DbInfo[]
}

type TabContent = {
  updateList: (d: IGetTabData) => void
  changeTheme: (a: boolean) => void
}

const CLayout: React.FC = () => {
  const [connections, setConnections] = useState([])
  const [noCons, setNoCons] = useState(true)
  const [data, setData] = useState<ConItem>({
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
      // }
    ]
  })

  const [isDark, setIsDark] = useState(false)

  const tabsRef = useRef<TabContent>(null)

  useEffect(() => {
    updateSlider()
  }, [])

  function changeTheme() {
    window.api.toggleTheme(isDark ? 'light' : 'dark')
    setIsDark(!isDark)
  }

  function updateSlider() {
    window.api.getStore().then((res) => {
      setConnections(res.connections)
      if (res.connections.length) {
        setNoCons(false)
      }

      if (res.theme) {
        setIsDark(res.theme === 'dark' ? true : false)
        window.api.toggleTheme(res.theme)
      }
    })
  }

  function getTableDataByName(val) {
    // type 1-查看表数据 2-编辑表 3-indexs
    tabsRef.current?.updateList(val)
  }

  function rightMenuHandler(e) {
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

  function conOk() {
    setData({ ...data, connectionForm: false })
  }

  function conCancel() {
    setData({ ...data, connectionForm: false })
  }

  function createdbCacel() {
    setData({ ...data, createdbFrom: false })
  }

  function createdbOk() {
    setData({ ...data, createdbFrom: false })
  }

  function conAddOk(val) {
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
  function addDbOk() {
    setData({ ...data, createdbFrom: false })
  }

  function setDbInfo(val: string[]) {
    const a = val.map((el) => {
      return {
        title: el
      }
    })
    setData({ ...data, dbInfo: a })
  }

  const [logOpen, setLogOpen] = useState(false)
  function logClose() {
    setLogOpen(false)
  }

  function showLog() {
    setLogOpen(true)
  }

  const [logList, setLogList] = useState<ILogItem[]>([
    {
      text: 'Here will output some operation logs',
      type: LogType.NORMAL,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      action: LogAction.INIT
    }
  ])

  return (
    <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : undefined }}>
      <div>
        <CustomContext.Provider value={{ logList, setLogList }}>
          <Header style={{ height: '30px', backgroundColor: isDark ? '#000' : '#fff' }}>
            <Flex justify={'space-between'} align={'center'} style={{ height: '30px', padding: 0 }}>
              <Breadcrumb style={{ marginLeft: '250px' }} separator=">" items={data.dbInfo} />

              <div>
                <Tooltip title="show log">
                  <Button size="small" shape="circle" icon={<EyeOutlined />} onClick={showLog} />
                </Tooltip>
                <Tooltip title={isDark ? 'light' : 'dark'}>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<BulbOutlined />}
                    onClick={changeTheme}
                  />
                </Tooltip>
              </div>
            </Flex>
          </Header>

          <Layout>
            <Splitter>
              <Splitter.Panel defaultSize={300} min={50} max={400} collapsible>
                <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
                  <div
                    style={{
                      height: window.screen.height - 63 - 20 + 'px',
                      overflow: 'auto'
                      // backgroundColor: '#ffaaff'
                    }}
                  >
                    <Sider
                      breakpoint="lg"
                      collapsedWidth="0"
                      // onBreakpoint={(broken) => {}}
                      width={400}
                      // onCollapse={(collapsed, type) => {}}
                      // style={{ width: '300px' }}
                    >
                      {noCons ? (
                        <p
                          style={{
                            fontSize: '16px',
                            padding: '10px',
                            backgroundColor: isDark ? '#000' : '#f8f8f8',
                            color: isDark ? 'rgba(235, 235, 245, 0.38)' : '#32363f'
                          }}
                        >
                          Right click to add connection
                        </p>
                      ) : (
                        connections.map((el, index) => {
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
                        })
                      )}
                    </Sider>
                  </div>
                </Dropdown>
              </Splitter.Panel>
              <Splitter.Panel>
                <Content style={{ height: window.screen.height - 64 - 30 + 'px' }}>
                  <TabelContent ref={tabsRef}></TabelContent>
                </Content>
              </Splitter.Panel>
            </Splitter>
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
    </ConfigProvider>
  )
}

export default CLayout
