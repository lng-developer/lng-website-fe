import { Modal, Spin, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import { importCostCenter } from '../../apis/vendor';
const { Dragger } = Upload;

const ModalImportCostCenter = ({ isModalOpen, setIsModalOpen, fetchAllProductCostCenter, filters, productId }) => {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);

  const handleCancel = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleOk = async () => {
    const fileFormat = fileList?.[0];
    if (!fileFormat) {
      setCheckErrorUpload(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileFormat);
    formData.append('vendor_product', productId);
    try {
      setLoading(true); // 👉 Hiện màn chờ
      const response = await importCostCenter(formData);
      if (response.status === 201) {
        toast.success('Import success');
        fetchAllProductCostCenter(filters);
      } else {
        toast.error('Import error');
      }
    } catch (error) {
      console.log(error);
      toast.error('Import error');
    } finally {
      setLoading(false); // 👉 Tắt màn chờ
      handleCancel();
    }
  };

  const beforeUpload = (file) => {
    setFileList([file]);
    setCheckErrorUpload(false);
    return false;
  };

  return (
    <Modal
      title="Import Cost Center"
      okText="Import"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={500}
      onCancel={handleCancel}
    >
      <div className="py-2">
        <div>
          <span className="font-medium">Upload an xlsx file to cost center. Template download at </span>{' '}
          <Link
            target="_blank"
            to={'https://docs.google.com/spreadsheets/d/109BSu9B3sn0eX16fjy5tX72lqxaGGocJw5Pl2F8JhYI/edit?gid=2018916661#gid=2018916661'}
          >
            here
          </Link>
        </div>
        <div className="my-3">
          <Dragger beforeUpload={beforeUpload} fileList={fileList} onRemove={() => setFileList([])} accept=".txt,.json,.csv" maxCount={1}>
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">Click to upload or drag and drop .txt file</p>
          </Dragger>
        </div>
        {checkErrorUpload && (
          <div className="my-2">
            <span className="text-[#ff0000]">Please upload file</span>
          </div>
        )}
        <div style={{ color: dataColors.process }}>
          <span>Please check template and sample to fill correct information. Especially, shipping information!!!</span>
        </div>
      </div>
      {loading && <Spin tip="Đang xử lý..." size="large" style={{ color: 'white' }} fullscreen={true} />}
    </Modal>
  );
};

export default ModalImportCostCenter;
