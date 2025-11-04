// file: src/pages/SkuMapping/ModalDeleteConfirm.jsx
import React from 'react';
import { Modal } from 'antd';

const ModalDeleteConfirm = ({ open, onCancel, onOk, loading, record }) => {
  return (
    <Modal
      title="Are you sure you want to delete this rule?"
      open={open}
      onCancel={onCancel} // Sẽ gọi handleCloseModals
      onOk={onOk}       // Sẽ gọi handleDelete
      confirmLoading={loading} // Lấy state 'isDeleting'
      okText="Delete"
      okType="danger" // Tương đương okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <p>
        Rule: <span className='font-medium'>{record?.name || ''}</span>
      </p>
      <p style={{ color: 'red' }}>
        This action cannot be undone.
      </p>
    </Modal>
  );
};

export default ModalDeleteConfirm;