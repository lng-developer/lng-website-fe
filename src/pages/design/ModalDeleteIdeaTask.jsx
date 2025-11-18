// file: src/pages/design/ModalDeleteIdeaTask.jsx
import React from 'react';
import { Modal } from 'antd';

const ModalDeleteIdeaTask = ({ open, onCancel, onOk, loading, record }) => {
  return (
    <Modal
      title="Are you sure you want to delete this task?"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={loading}
      okText="Delete"
      okType="danger"
      destroyOnClose
    >
      <p>
        Task: <strong>{record?.title || ''}</strong>
      </p>
      <p style={{ color: 'red' }}>This action cannot be undone.</p>
    </Modal>
  );
};

export default ModalDeleteIdeaTask;
