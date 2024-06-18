import { Button, Modal } from "antd"
import { Header } from "antd/es/layout/layout"
import { useState } from "react"
import { PlusOutlined } from '@ant-design/icons';
import ConnectionForm from "./ConnectionForm";


type selfProps = {
    showForm: Function
}

const HeaderTool: React.FC<selfProps> = (props) => {
    const [data, setData] = useState({ isModalOpen: false })

    const { showForm } = props
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

    function addOk (val) {
        console.log('add ok.>>>', val)
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
            <Modal title="Basic Modal" open={data.isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <ConnectionForm addConnection={addOk}></ConnectionForm>
            </Modal>
        </div>
    )
}

export default HeaderTool