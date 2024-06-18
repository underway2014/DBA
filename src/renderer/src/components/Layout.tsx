import React, { useState } from 'react';
import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import DataList from './List';
import ConnectionItem from './ConnectionItem';
import HeaderTool from './HeadTool';
import ConnectionWindow from './ConectionWindow';

const { Header, Content, Sider } = Layout;

const items = [UserOutlined, VideoCameraOutlined, UploadOutlined, UserOutlined].map(
  (icon, index) => ({
    key: String(index + 1),
    icon: React.createElement(icon),
    label: `nav ${index + 1}`,
  }),
);

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 30,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#4096ff',
};

const CLayout: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [data, setData] = useState({showForm: false, connections: []})

  function getAddCon() {
    console.log('getAddCon', data.showForm)
    let connections = data.connections
    connections.push({url: 1})
    setData({showForm: !data.showForm, connections})
    console.log('22 getAddCon', data.showForm)


  }

  return (
    <div>
    <HeaderTool showForm={getAddCon}></HeaderTool>
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
          data.connections.map(el => {
            return <ConnectionItem></ConnectionItem>
          })
        }
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px 0'  }}>
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