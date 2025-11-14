import React, { useEffect, useState, useRef } from 'react'
import {
  Breadcrumb,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Flex,
  Input,
  Layout,
  List,
  MenuProps,
  message,
  Modal,
  Popconfirm,
  Space,
  Splitter,
  Table,
  theme,
  Tooltip,
  Typography
} from 'antd'
import ConnectionItem from './ConnectionItem'
import TabelContent from './TabelContent'
import { Header } from 'antd/es/layout/layout'
import ConnectionForm from './ConnectionForm'
import CreateDbForm from './CreateDbFrom'
import { EyeOutlined, BulbOutlined, HeartOutlined, SearchOutlined } from '@ant-design/icons'
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
  const [sqlListData, setSqlListData] = useState({
    show: false,
    isLoading: false,
    list: [
      // { id: '3', content: 'select *', note: 'updaccccte user data', date: 112131313 },
    ]
  })

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
      } else {
        setNoCons(true)
        setData((d) => ({ ...d, connectionForm: true }))
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

  function logRightmenuHandler(e) {
    e.domEvent.stopPropagation()

    setLogList([])
  }

  const items: MenuProps['items'] = [
    {
      label: 'Add Connection',
      key: '5'
    }
  ]

  const logRightItems: MenuProps['items'] = [
    {
      label: 'Clear',
      key: '1'
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
    const config = {
      host: val.host,
      port: val.port,
      username: val.username,
      password: val.password,
      dialect: val.dialect,
      database: val.database
    }

    if (val.dialect === 'postgres' && val.ssl) {
      Object.assign(config, {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      })
    }

    window.api.addStore({
      data: {
        name: val.name,
        config
      },
      type: 1
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

  function showSqlList() {
    setSqlListData({ ...sqlListData, show: true, isLoading: true })
    getSqlList()
  }

  function getSqlList() {
    window.api.getStore().then((res) => {
      setSqlListData({ ...sqlListData, isLoading: false, list: res.sqls, show: true })
    })
  }
  const [logList, setLogList] = useState<ILogItem[]>([
    {
      text: 'Here will output some logs',
      type: LogType.NORMAL,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      action: LogAction.INIT,
      sql: ''
    }
  ])

  function delSql(data) {
    window.api.delStore({ data: data.id, type: 2 }).then(() => {
      getSqlList()
      message.success('Delete success')
    })
  }

  function copySql(data) {
    navigator.clipboard.writeText(data.content).then(() => {
      message.success('Copy success')
    })
  }

  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = (clearFilters, confirm) => {
    clearFilters()
    setSearchText('')
    confirm()
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 100 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 100 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : false
    // render: (text) =>
    //   searchedColumn === dataIndex ? (
    //     <span style={{ fontWeight: 'bold', background: '#ffc069', padding: 0 }}>{text}</span>
    //   ) : (
    //     text
    //   )
  })

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : undefined,
        token: {
          colorPrimary: '#6f7af7',
          colorInfo: '#6f7af7',
          borderRadius: 8,
          fontSize: 13,
          controlHeight: 28,
          colorBgContainer: isDark ? '#0f0f0f' : '#ffffff',
          colorText: isDark ? 'rgba(235,235,245,0.86)' : '#1b1b1f',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif'
        },
        components: {
          Table: {
            headerBg: isDark ? '#141414' : '#fafafa',
            headerColor: isDark ? 'rgba(235,235,245,0.86)' : '#1b1b1f',
            rowHoverBg: isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: isDark ? '#262626' : '#f0f0f0'
          },
          Modal: {
            headerBg: isDark ? '#121212' : '#ffffff',
            contentBg: isDark ? '#0f0f0f' : '#ffffff',
            borderRadiusLG: 12
          },
          Button: {
            borderRadius: 8
          }
        }
      }}
    >
      <div>
        <CustomContext.Provider value={{ logList, setLogList, isDark }}>
          <Header style={{ height: '30px', backgroundColor: isDark ? '#000' : '#fff' }}>
            <Flex justify={'space-between'} align={'center'} style={{ height: '30px', padding: 0 }}>
              <Breadcrumb style={{ marginLeft: '250px' }} separator=">" items={data.dbInfo} />

              <div>
                <Tooltip title="Common SQL">
                  <Button
                    size="small"
                    shape="circle"
                    icon={<HeartOutlined />}
                    onClick={showSqlList}
                  />
                </Tooltip>
                <Tooltip title="Logs">
                  <Button size="small" shape="circle" icon={<EyeOutlined />} onClick={showLog} />
                </Tooltip>
                <Tooltip title={isDark ? 'Light' : 'Dark'}>
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

          <Layout style={{ height: 'calc(100vh - 30px)' }}>
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
                <Content style={{ height: '100%', backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }}>
                  <TabelContent ref={tabsRef} setDbInfo={setDbInfo}></TabelContent>
                </Content>
              </Splitter.Panel>
            </Splitter>
          </Layout>

          <Drawer title={`LOG`} placement="right" size={'large'} onClose={logClose} open={logOpen}>
            <Dropdown
              menu={{ items: logRightItems, onClick: logRightmenuHandler }}
              trigger={['contextMenu']}
            >
              <div>
                <List
                  size="small"
                  dataSource={logList}
                  renderItem={(item) => {
                    return (
                      <div style={{ fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>[{item.type}]</span>
                        <span>
                          [{item.date}] {item.text}
                        </span>
                        <span style={{ marginLeft: 10 }}>
                          {item.affectRows || item.affectRows === 0
                            ? `AffectRows: ${item.affectRows}`
                            : ''}
                        </span>
                        <span>{item.sql ? <p>SQL: {item.sql}</p> : ''}</span>
                      </div>
                    )
                  }}
                />
              </div>
            </Dropdown>
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
          <Modal
            title="Common SQL"
            open={sqlListData.show}
            width={1000}
            footer={[]}
            onCancel={() => {
              console.log('on cancel')
              setSqlListData({ ...sqlListData, show: false })
            }}
          >
            <Table
              columns={[
                {
                  title: <span style={{ fontWeight: 600 }}>Note</span>,
                  key: 'note',
                  dataIndex: 'note',
                  width: 300,
                  ...getColumnSearchProps('note')
                },
                {
                  title: 'Date',
                  key: 'date',
                  dataIndex: 'date',
                  width: 180,
                  render: (text) => {
                    return <span>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</span>
                  }
                },
                {
                  title: 'Content',
                  key: 'content',
                  dataIndex: 'content',
                  // ellipsis: true,
                  render: (text) => {
                    return (
                      <Tooltip title={text} overlayStyle={{ maxWidth: '500px' }}>
                        <span>{text?.substring(0, 70)}</span>
                      </Tooltip>
                    )
                  }
                },
                {
                  title: 'Operater',
                  key: 'id',
                  dataIndex: 'operate',
                  width: 130,
                  render: (_, record) => {
                    return (
                      <span>
                        <Typography.Link
                          onClick={() => copySql(record)}
                          style={{ marginInlineEnd: 8 }}
                        >
                          Copy
                        </Typography.Link>
                        <Popconfirm title="Sure to delete?" onConfirm={() => delSql(record)}>
                          <a>Delete</a>
                        </Popconfirm>
                      </span>
                    )
                  }
                }
              ]}
              // rowSelection={{}}
              dataSource={sqlListData.list}
              rowKey="id"
            />
          </Modal>
        </CustomContext.Provider>
      </div>
    </ConfigProvider>
  )
}

export default CLayout
