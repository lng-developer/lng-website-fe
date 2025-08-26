import { Flex, Modal, Select, Spin, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import { importVendorProduct } from '../../apis/vendor';
import { toast } from 'sonner';
const { Dragger } = Upload;

const ModalImportVendor = ({ isModalOpen, setIsModalOpen, fetchAllProductCostCenter, filters, vendors }) => {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);
  const [selectVendor, setSelectVendor] = useState('');

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
    formData.append('vendor_id', selectVendor);
    try {
      setLoading(true); // 👉 Hiện màn chờ
      const response = await importVendorProduct(formData);
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
      title="Import Vendor Product"
      okText="Import"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={450}
      onCancel={handleCancel}
    >
      <Flex vertical={true} gap={10} className="py-2">
        <div>
          <div>
            <span className="font-medium">Vendor</span>
          </div>
          <Select
            showSearch
            placeholder="Select vendor"
            optionFilterProp="label"
            onChange={(value) => setSelectVendor(value)}
            options={vendors}
            className="w-full"
          />
        </div>
        <div>
          <span className="font-medium">Upload an xlsx file. Template download at </span>{' '}
          <Link target="_blank" to={'https://docs.google.com/spreadsheets/d/13uTYBMxuQ59dwOKoIZoVdKk6mR2OhYdKclFSWxPg7Ok/edit?gid=0#gid=0'}>
            here
          </Link>
        </div>
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
            <p className="ant-upload-text">Click to upload or drag and drop .xlsx file</p>
          </Dragger>
        </div>
        {checkErrorUpload && (
          <div>
            <span className="text-[#ff0000]">Please upload file</span>
          </div>
        )}
        <div style={{ color: dataColors.process }}>
          <span>Please check template and sample to fill correct information.</span>
        </div>
      </Flex>
      {loading && <Spin tip="Đang xử lý..." size="large" style={{ color: 'white' }} fullscreen={true} />}
    </Modal>
  );
};

export default ModalImportVendor;
