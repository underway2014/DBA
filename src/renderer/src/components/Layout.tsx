import React, { useEffect, useState, useRef } from 'react';
// import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout } from 'antd';
// import DataList from './List';
import ConnectionItem from './ConnectionItem';
import HeaderTool from './HeadTool';
// import SqlContent from './SqlContent';
// import SqlToolBar from './SqlToolBar';
import TabelContent from './TabelContent';
import { Header } from 'antd/es/layout/layout';

const { Content, Sider } = Layout;

// const items = [UserOutlined, VideoCameraOutlined, UploadOutlined, UserOutlined].map(
//   (icon, index) => ({
//     key: String(index + 1),
//     icon: React.createElement(icon),
//     label: `nav ${index + 1}`,
//   }),
// );

// const headerStyle: React.CSSProperties = {
//   textAlign: 'center',
//   color: '#fff',
//   height: 30,
//   paddingInline: 48,
//   lineHeight: '64px',
//   backgroundColor: '#4096ff',
// };

type SqlRef = {

}
const CLayout: React.FC = () => {
  // const {
  //   token: { colorBgContainer, borderRadiusLG },
  // } = theme.useToken();
  const [data, setData] = useState({
    showForm: false, connections: [
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
    ]
  })

  const tabsRef = useRef<any>()

  function getAddCon () {
    console.log('getAddCon', data.showForm)
    let connections = data.connections
    // connections.push({ url: 1 })
    setData({ showForm: !data.showForm, connections })
    console.log('22 getAddCon', data.showForm)
  }


  useEffect(() => {
    console.log('useEffect')
    updateSlider()
  }, [])

  function updateSlider () {
    window.api.getStore('age').then(connections => {

      console.log('updateSlider begin connections: ', connections)
      setData({ showForm: !data.showForm, connections })
    })
  }

  function getTableDataByName (val) {
    console.log('layout getTableDataByName: ', val)

    // let tableName = getTableName(val)

    // window.api.getTableData(val).then(data => {

    //   console.log('getTableDataByName query sql res: ', data)
    //   // listRef.current.updateList({ listData: data, tableName })
    // })
    // type 1-查看表数据 2-编辑表
    tabsRef.current.updateList(val)
  }

  return (
    <div>
      <Header>
        <HeaderTool showForm={getAddCon} updateSlider={updateSlider}></HeaderTool>


      </Header>

      <Layout>
        <div style={{ height: window.screen.height - 64 - 60 + 'px', overflow: 'auto' }}>
          <Sider
            breakpoint="lg"
            collapsedWidth="0"
            onBreakpoint={(broken) => {
              console.log(broken);
            }}
            width={300}
            onCollapse={(collapsed, type) => {
              console.log(collapsed, type);
            }}
          >
            {
              data.connections.map((el, index) => {
                return <ConnectionItem getTableDataByName={getTableDataByName} cid={index} key={index} connection={el} updateSlider={updateSlider}></ConnectionItem>
              })
            }
          </Sider>
        </div>
        <Layout>
          <Content style={{ margin: '24px 16px 0' }}>
            <TabelContent ref={tabsRef}></TabelContent>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default CLayout;