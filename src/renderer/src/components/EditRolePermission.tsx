import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  CheckboxProps,
  Col,
  Divider,
  Row,
  Spin,
  Splitter,
  Tree,
  TreeDataNode,
  TreeProps
} from 'antd'

import { IGetTabData } from '@renderer/interface'
import * as _ from 'lodash'
import { addLog } from '@renderer/utils/logHelper'
import CustomContext from '@renderer/utils/context'
import { LogAction, LogType } from '@renderer/utils/constant'

type CustomProps = {
  connection: IGetTabData
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
  otitle?: string
}

const EditRolePermission: React.FC<CustomProps> = (props) => {
  const { logList, setLogList } = useContext(CustomContext)
  const [treeData, setTreeData] = useState<NodeData[]>([])
  const permisstionMap = useRef({}) // 1-struct 2-struct and data
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSchemas()
  }, [props.connection.id])

  const SP = '@'

  function getSchemas() {
    console.log('get schema:', props.connection)
    window.api.getSchema(props.connection).then((res) => {
      const schemas = res.map((el) => {
        return {
          isLeaf: false,
          key: `schemas${SP}${el.name}${SP}${props.connection.id}`,
          title: el.name,
          otitle: el.name
        }
      })
      setTreeData(schemas)
    })

    window.api.getRolePermission(props.connection).then((res) => {
      // {table_name: 'sdfs', grantee: 'u1', table_schema: 'ss', string_agg: 'SELECT,UPDATE'}
      console.log('permission: ', res)

      //['table@sdfs@ss@1728706996013', 'schemas@ss@1728706996013', 'table@t1@ss@1728706996013']

      // let keys = res.map(el => {

      // })

      const keys: string[] = []
      const mp = {}
      for (const item of res) {
        const key = `table@${item.table_name}@${item.table_schema}@${props.connection.id}`

        keys.push(key)
        mp[key] = item.string_agg.split(',')
      }

      permisstionMap.current = mp

      setCheckedKeys(keys)
      setLoading(false)
    })
  }

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true)

  const onExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    console.log('onExpand', expandedKeysValue, expandedKeys)
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.

    const { add } = getNewExpandKey(expandedKeysValue)
    if (add.length) {
      getTables(add[0]).then((res) => {
        setExpandedKeys(expandedKeysValue)
        setAutoExpandParent(false)
      })
    } else {
      setExpandedKeys(expandedKeysValue)
    }
  }

  function getKey(key) {
    const a = key.split(SP)

    return a[1]
  }

  function getNewExpandKey(newKeys) {
    const nk = newKeys.map(getKey)
    const ok = expandedKeys.map(getKey)

    console.log('keys: ', _.difference(nk, ok), nk, ok)
    return { add: _.difference(nk, ok), del: _.difference(ok, nk) }
  }

  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    console.log('onCheck', checkedKeysValue)
    setCheckedKeys(checkedKeysValue as React.Key[])
  }

  const onSelect: TreeProps['onSelect'] = (selectedKeysValue, info) => {
    console.log('onSelect', selectedKeysValue, info, permisstionMap.current[info.node.key])
    setSelectedKeys(selectedKeysValue)

    setCheckedList(permisstionMap.current[info.node.key] || [])
  }

  async function getTables(schemaName) {
    return new Promise((resolve, reject) => {
      window.api.getTables({ id: props.connection.id, schema: schemaName }).then((res) => {
        console.log('get tables: ', res)
        const schema = treeData.find((el) => el.title === schemaName)
        console.log('get tables22: ', schema)

        if (!schema) {
          return false
        }

        if (schema) {
          schema.isLeaf = false
          schema.children = res.map((el) => {
            return {
              isLeaf: true,
              key: `table${SP}${el.table_name}${SP}${schemaName}${SP}${props.connection.id}`,
              title: el.table_name,
              otitle: el.table_name
            }
          })
        }

        setTreeData([...treeData])

        resolve(true)
      })
    })
  }

  const plainOptions = ['TRIGGER', 'REFERENCES', 'TRUNCATE', 'DELETE', 'UPDATE', 'SELECT', 'INSERT']
  const [checkedList, setCheckedList] = useState([])
  const [checkedListAll, setCheckedListAll] = useState([])
  const checkAll = plainOptions.length === checkedList.length
  const checkAllAll = plainOptions.length === checkedListAll.length
  const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length
  const indeterminateAll = checkedListAll.length > 0 && checkedListAll.length < plainOptions.length

  const onChange = (checkedValues) => {
    console.log('on change checkedValues: ', checkedValues)
    setCheckedList(checkedValues)
  }
  const onChangeAll = (checkedValues) => {
    console.log('on change checkedValues: ', checkedValues)
    setCheckedListAll(checkedValues)
  }

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedList(e.target.checked ? plainOptions : [])
  }
  const onCheckAllChangeAll: CheckboxProps['onChange'] = (e) => {
    setCheckedListAll(e.target.checked ? plainOptions : [])
  }
  //  'table@t1@ss@1728706996013', 'schemas@ss@1728706996013'
  function formatCheckKeys(keys) {
    const schemaKeys = keys.filter((el) => /^schemas@/.test(el))

    const schemas: string[] = []
    for (const el of schemaKeys) {
      const schema = el.split('@')[1]
      schemas.push(schema)
      keys = keys.filter((k) => !new RegExp(`@${schema}@`).test(k))
    }

    keys = keys.map((el) => {
      const a = el.split('@')
      return `${a[2]}.${a[1]}`
    })

    return { tables: keys, schemas }
  }

  function saveSinglePermission() {
    const { schemas, tables } = formatCheckKeys(selectedKeys)
    setLoading(true)
    window.api
      .grantRolePermission({
        id: props.connection.id,
        schemas,
        tables,
        roleName: props.connection.roleName,
        type: 2,
        permissions: checkedList
      })
      .then((res) => {
        console.log('grant res: ', res)
        getSchemas()
      })
      .catch((e) => {
        console.log('grant error: ', e)
        setLoading(false)
      })
  }

  function savePermission() {
    console.log('setCheckedKeys: ', checkedKeys)
    console.log('checkedList: ', checkedList)

    const { schemas, tables } = formatCheckKeys(checkedKeys)

    console.log('schemas: ', schemas, tables)
    // return
    window.api
      .grantRolePermission({
        id: props.connection.id,
        schemas,
        tables,
        roleName: props.connection.roleName,
        type: 1,
        permissions: checkedListAll
      })
      .then((res) => {
        addLog({
          logList,
          setLogList,
          text: 'success',
          type: LogType.SUCCESS,
          action: LogAction.ROLEPERMISSION
        })
        getSchemas()
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: error.message,
          type: LogType.ERROR,
          action: LogAction.ROLEPERMISSION
        })
      })
  }

  return (
    <div>
      <Spin spinning={loading}>
        <Splitter
          style={{
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            height: window.screen.height - 64 - 86 + 'px',
            overflow: 'auto'
          }}
        >
          <Splitter.Panel defaultSize="40%" min="20%" max="50%" resizable={false}>
            <Tree
              showLine
              blockNode
              virtual={false}
              motion={false}
              checkable
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              // autoExpandParent={autoExpandParent}
              onCheck={onCheck}
              checkedKeys={checkedKeys}
              onSelect={onSelect}
              selectedKeys={selectedKeys}
              treeData={treeData}
              // titleRender={titleRender}
              rootStyle={{ borderRadius: 0 }}
            />
          </Splitter.Panel>
          <Splitter.Panel defaultSize="30%" min="20%" max="30%" resizable={false}>
            <div style={{ margin: '20px' }}>
              <Checkbox
                indeterminate={indeterminateAll}
                onChange={onCheckAllChangeAll}
                checked={checkAllAll}
              >
                Check All
              </Checkbox>
              <Divider />
              <Checkbox.Group value={checkedListAll} onChange={onChangeAll}>
                <Row>
                  {plainOptions.map((el, i) => {
                    return (
                      <Col span={24} key={i}>
                        <Checkbox value={el}>{el}</Checkbox>
                      </Col>
                    )
                  })}
                </Row>
              </Checkbox.Group>
              <Button style={{ marginTop: '15px' }} onClick={savePermission}>
                Save
              </Button>

              <Divider />
              <Alert
                showIcon
                description={
                  <>
                    The permissions above are applied to all currently{' '}
                    <span style={{ color: 'red', fontWeight: 700 }}>checked</span> tables.
                  </>
                }
                type="warning"
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel defaultSize="30%" min="20%" max="30%" resizable={false}>
            <div style={{ margin: '20px' }}>
              <Checkbox
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
              >
                Check All
              </Checkbox>
              <Divider />
              <Checkbox.Group value={checkedList} onChange={onChange}>
                <Row>
                  {plainOptions.map((el, i) => {
                    return (
                      <Col span={24} key={i}>
                        <Checkbox value={el}>{el}</Checkbox>
                      </Col>
                    )
                  })}
                </Row>
              </Checkbox.Group>
              <Button style={{ marginTop: '15px' }} onClick={saveSinglePermission}>
                Save
              </Button>
              <Divider />
              <Alert
                showIcon
                description={
                  <>
                    The permissions above are applied to the currently
                    <span style={{ color: 'red', fontWeight: 700 }}>selected</span> tables.
                  </>
                }
                type="warning"
              />
            </div>
          </Splitter.Panel>
        </Splitter>
      </Spin>
    </div>
  )
}

export default forwardRef(EditRolePermission)
