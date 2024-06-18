import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import ConnectionForm from './ConnectionForm';

const ConnectionWindow: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
    
            <ConnectionForm></ConnectionForm>
      </Modal>
    </>
  );
};

export default ConnectionWindow;