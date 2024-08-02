import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Button, Tabs } from 'antd';
import { UnorderedListOutlined, EditOutlined } from '@ant-design/icons';

import List from './List';
import EditTable from './EditTable';

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

const defaultPanes = new Array(2).fill(null).map((_, index) => {
    const id = String(index + 1);
    return { label: `Tab ${id}`, children: `Content of Tab Pane ${index + 1}`, key: id };
});

const TabelContent: React.FC = (props, parentRef) => {
    const [activeKey, setActiveKey] = useState(defaultPanes[0].key);
    const [items, setItems] = useState(defaultPanes);
    const newTabIndex = useRef(0);
    // const listRef = useRef<any>()

    useImperativeHandle(parentRef, () => {
        return {
            updateList (tabData) {
                // listRef.current.updateList({ listData, tableName })

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

    return (
        <div>
            <Tabs
                hideAdd
                onChange={onChange}
                activeKey={activeKey}
                type="editable-card"
                onEdit={onEdit}
                items={items}
            />
        </div>
    );
};

export default forwardRef(TabelContent);