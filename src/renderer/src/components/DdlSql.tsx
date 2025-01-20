import React, { forwardRef, useEffect, useState } from 'react'
import { Spin } from 'antd'
import HighlightWithinTextarea from 'react-highlight-within-textarea'
import { IGetTabData } from '@renderer/interface'
import { PGKEYS } from '@renderer/utils/constant'

type CustomProps = {
  tabData: IGetTabData
}

const DdlSql: React.FC<CustomProps> = (props) => {
  const [sqlTxt, setSqlTxt] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getTableData()
  }, [])

  function getTableData() {
    window.api
      .getDDL({
        ...props.tabData
      })
      .then((data) => {
        console.log('data', data)
        setSqlTxt(data)
        setLoading(false)
      })
      .catch((error) => {
        setLoading(false)
      })
  }

  return (
    <div style={{ margin: '0px 40px' }}>
      <Spin spinning={loading}>
        <HighlightWithinTextarea
          value={sqlTxt}
          placeholder=""
          // onChange={onChange}
          highlight={[
            {
              highlight: PGKEYS,
              className: 'chighlight'
            }
          ]}
        />
      </Spin>
    </div>
  )
}

export default forwardRef(DdlSql)
