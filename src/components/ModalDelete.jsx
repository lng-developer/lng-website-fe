import { Modal } from 'antd';

const ModalDelete = ({ isShowModalDelete, setIsShowModalDelete, handleDelete, title = '' }) => {
  return (
    <Modal
      title={title}
      width={500}
      style={{ top: '30%' }}
      okText="Confirm"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isShowModalDelete}
      onOk={handleDelete}
      onCancel={() => setIsShowModalDelete(false)}
    >
      <span className="font-medium text-[#64748b]">Are you sure you want to delete this product type? This action cannot be undone.</span>
    </Modal>
  );
};

export default ModalDelete;
