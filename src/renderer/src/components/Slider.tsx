import { Button } from "antd"
import {  PlusOutlined } from '@ant-design/icons';
import { useState } from "react";

type selfProps = {
  showForm: Function
}

const CSlider : React.FC<selfProps> = (props) => {
  const [data, setData] = useState({rows: [{id: 1, name: 'test name'}]})

    const {showForm} = props
    function addConnection() {
        console.log('add connection')
        showForm()
    }

    function getData() {
      fetch('http://localhost:3000/list')
      .then(response => response.json())
      .then(json => {
        console.log('fetch res: ', json.data, data)
        setData({rows: json.data})
      })
  
  
    //   axios.get(`http://localhost:3000/list`)
    //     .then(res => {
    //       console.log('client: ', res, res.data)
    //       this.setState(state => {
    //         return {rows: res.data}
    //       })
    //     })
    }

    return (
        <Button
                type="dashed"
                onClick={() => addConnection()}
                style={{ width: '60%' }}
                icon={<PlusOutlined />}
              >
                Add Connection
              </Button>
    )
}

export default CSlider