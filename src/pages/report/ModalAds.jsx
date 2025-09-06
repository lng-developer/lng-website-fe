import { DatePicker, Flex, Modal, Radio, Select, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { toast } from 'sonner';
import { importAds } from '../../apis/report';
const { Dragger } = Upload;

const ModalAds = ({ isModalOpen, setIsModalOpen, fetchAllReport, filters }) => {
  const [fileList, setFileList] = useState([]);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);
  const [date, setDate] = useState('');
  const [checkErrorDate, setCheckErrorDate] = useState(false);

  const handleResetValue = () => {
    setFileList([]);
    setIsModalOpen(false);
    setCheckErrorDate(false);
    setCheckErrorUpload(false);
  };

  const handleOk = async () => {
    if (!date) {
      setCheckErrorDate(true);
      return;
    }
    const fileFormat = fileList?.[0];
    if (!fileFormat) {
      setCheckErrorUpload(true);
      return;
    }

    const formData = new FormData();
    formData.append('day', date);
    formData.append('file', fileFormat);
    try {
      const response = await importAds(formData);
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

  const onChange = (date, dateString) => {
    setDate(dateString);
  };

  return (
    <Modal
      title="Import Ads"
      okText="Import"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={400}
      onCancel={handleResetValue}
    >
      <div className="">
        <Flex vertical={true} gap={5} style={{ marginBottom: 10 }}>
          <div>
            <div>
              <span className="font-medium">Select Date</span>
            </div>
            <div className="w-full">
              <DatePicker onChange={onChange} />
            </div>
          </div>
          {checkErrorDate && (
            <div>
              <span className="text-[#ff0000]">Please select date</span>
            </div>
          )}
        </Flex>
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
            <p className="ant-upload-text">Click to upload or drag and drop file</p>
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

export default ModalAds;
