import React, { useEffect, useState } from 'react';
// import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout } from 'antd';
import DataList from './List';
import ConnectionItem from './ConnectionItem';
import HeaderTool from './HeadTool';

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

  return (
    <div>
      <HeaderTool showForm={getAddCon} updateSlider={updateSlider}></HeaderTool>
      <Layout>
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          onBreakpoint={(broken) => {
            console.log(broken);
          }}
          onCollapse={(collapsed, type) => {
            console.log(collapsed, type);
          }}
        >
          {
            data.connections.map((el, index) => {
              return <ConnectionItem key={index} connection={el}></ConnectionItem>
            })
          }
        </Sider>
        <Layout>
          <Content style={{ margin: '24px 16px 0' }}>
            {
              <DataList></DataList>
            }
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default CLayout;