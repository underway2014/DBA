import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Dropdown, MenuProps, Tabs, TabsProps } from 'antd';
import { UnorderedListOutlined, EditOutlined } from '@ant-design/icons';

import List from './List';
import EditTable from './EditTable';

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

const defaultPanes = new Array(1).fill(null).map((_, index) => {
    const id = String(index + 1);
    return {
        label: `Welcome`, children: `
      Hi there,Welcome to my open-source database tool! I'm thrilled to share this project with you all. If you encounter any issues or have suggestions while using it, please feel free to raise an issue on GitHub. Our goal is to improve this tool together, making it more powerful and user-friendly. Looking forward to your contributions!
    `, key: id
    };
});

const TabelContent: React.FC = (props, parentRef) => {
    const [activeKey, setActiveKey] = useState(defaultPanes[0].key);
    const [items, setItems] = useState(defaultPanes);
    const newTabIndex = useRef(0);

    useImperativeHandle(parentRef, () => {
        return {
            updateList (tabData) {
                addTab(tabData)

            }
        }
    })

    const onChange = (key: string) => {
        console.log('tab onchane key: ', key)
        setActiveKey(key);
    };

    const addTab = (data) => {
        const newActiveKey = `newTab${newTabIndex.current++}`;
        // setItems([...items, { label: 'New Tab', children: 'abcd', key: newActiveKey }]);
        console.log('add data: ', data)
        if (data.type === 1) {
            setItems([...items, { label: data.tableName, icon: <UnorderedListOutlined />, children: <List tabData={data} ></List>, key: newActiveKey }]);

        } else if (data.type === 2) {
            setItems([...items, { label: data.tableName, icon: <EditOutlined />, children: <EditTable tabData={data} ></EditTable>, key: newActiveKey }]);
        }
        setActiveKey(newActiveKey);
    };

    const remove = (targetKey: TargetKey) => {
        const targetIndex = items.findIndex((pane) => pane.key === targetKey);
        const newPanes = items.filter((pane) => pane.key !== targetKey);
        if (newPanes.length && targetKey === activeKey) {
            const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex];
            setActiveKey(key);
        }
        setItems(newPanes);
    };

    const onEdit = (targetKey: TargetKey, action: 'add' | 'remove') => {
        if (action === 'add') {
            // add();
        } else {
            remove(targetKey);
        }
    };

    function rightMenuHandler (e) {
        console.log('tab content rightMenuHandler: ', e)
    }
    function tabRightClick (e) {
        console.log('tab content tabRightClick: ', e, e.target.id)
        console.log('tab content tabRightClick2: ', e.currentTarget)
        // console.log('tab content tabRightClick3: ', e.target.__reactFiber$nh8hlbxh0nq.return.key, e.target.__reactFiber$nh8hlbxh0nq.return.return.key, e.target.__reactFiber$nh8hlbxh0nq.return.return?.key)
        // __reactFiber$nh8hlbxh0nq
    }

    const tabRightItems: MenuProps['items'] = [
        {
            label: 'colose tab',
            key: '5',
        },
    ];
    const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => {
        console.log('tab bar: ', props, props.activeKey)
        return (

            <Dropdown menu={{ items: tabRightItems, onClick: rightMenuHandler }} trigger={['contextMenu']}>
                <div id={props.activeKey} data-a={props.activeKey} onContextMenu={tabRightClick}>
                    <DefaultTabBar {...props} />
                </div>
            </Dropdown>
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
    );
};

export default forwardRef(TabelContent);