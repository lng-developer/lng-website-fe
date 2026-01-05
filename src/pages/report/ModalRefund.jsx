import { Modal, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { toast } from 'sonner';
import { importRefund } from '../../apis/report';
const { Dragger } = Upload;

const ModalRefund = ({ isModalOpen, setIsModalOpen, fetchAllReport, filters }) => {
  const [fileList, setFileList] = useState([]);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);

  const handleResetValue = () => {
    setFileList([]);
    setIsModalOpen(false);
  };

  const handleOk = async () => {
    const fileFormat = fileList?.[0];
    if (!fileFormat) {
      setCheckErrorUpload(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileFormat);
    try {
      const response = await importRefund(formData);
      if (response.status === 200) {
        toast.success('Import success!');
        handleResetValue();
      } else {
        toast.error('Import error');
      }
    } catch (error) {
      console.log(error);
      toast.error('Import error');
    } finally {
      fetchAllReport(filters);
    }
  };

  const beforeUpload = (file) => {
    setFileList([file]);
    setCheckErrorUpload(false);
    return false;
  };

  return (
    <Modal
      title="Import Refund"
      okText="Import"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={400}
      onCancel={handleResetValue}
    >
      <div className="py-2">
        <div>
          <Dragger
            beforeUpload={beforeUpload}
            fileList={fileList}
            onRemove={() => setFileList([])}
            accept=".txt,.json,.csv"
            maxCount={1}
            style={{ padding: 16 }}
          >
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
      </div>
    </Modal>
  );
};

export default ModalRefund;
