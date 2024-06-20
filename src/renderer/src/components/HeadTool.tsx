import { Button, Modal } from "antd"
import { Header } from "antd/es/layout/layout"
import { useState } from "react"
import { PlusOutlined } from '@ant-design/icons';
import ConnectionForm from "./ConnectionForm";


type selfProps = {
    showForm: Function
    updateSlider: Function
}

const HeaderTool: React.FC<selfProps> = (props) => {
    const [data, setData] = useState({ isModalOpen: false })

    // const { showForm } = props
    function addConnection () {
        console.log('add connection')
        setData({ isModalOpen: true })
    }
    const handleOk = () => {
        setData({ isModalOpen: false })
    };
    const handleCancel = () => {
        setData({ isModalOpen: false })
    };

    async function addOk (val) {
        console.log('add ok.>>>', val)
        setData({ isModalOpen: false })

        window.api.setStore({
            "name": "local-pg",
            "config": {
                "host": "127.0.0.1",
                "port": 5432,
                "username": "postgres",
                "password": "postgres",
                "dialect": "postgres",
                "database": "jogo_gaming_dev"
            }
        })

        // let storeVal = await window.api.getStore('age')
        // console.log('storeVal: ', storeVal)
        props.updateSlider()

    }

    return (
        <div>
            <Header>
                <Button
                    type="dashed"
                    onClick={() => addConnection()}
                    style={{ width: '60%' }}
                    icon={<PlusOutlined />}
                >
                    Add Connection
                </Button>
            </Header>
            <Modal title="Basic Modal" open={data.isModalOpen}
                onOk={handleOk} onCancel={handleCancel}
                footer={[]}>
                <ConnectionForm addConnection={addOk}></ConnectionForm>
            </Modal>
        </div>
    )
}

export default HeaderTool