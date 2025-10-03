import { DatePicker, Flex, Modal, Radio, Select, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { importAds } from '../../apis/report';
import { getALlShop } from '../../apis/order';
const { Dragger } = Upload;

const ModalAds = ({ isModalOpen, setIsModalOpen, fetchAllReport, filters }) => {
  const [fileList, setFileList] = useState([]);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);
  const [date, setDate] = useState('');
  const [checkErrorDate, setCheckErrorDate] = useState(false);
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [checkErrorShop, setCheckErrorShop] = useState(false);

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
    formData.append('shopId', shopId);
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

  const fetchAllShop = async () => {
    if (!isModalOpen) {
      return;
    }
    try {
      const result = await getALlShop();
      if (result.status === 200) {
        const formatData = result.data.map((item) => {
          return {
            value: item.name,
            label: item.name,
            id: item?._id,
          };
        });
        setShops(formatData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChangeSelect = (value) => {
    const result = shops.find((shop) => shop.value === value);
    setShopId(result?.id);
    setCheckErrorShop(false);
  };

  useEffect(() => {
    fetchAllShop();
  }, [isModalOpen]);

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
      <Flex gap={5} vertical={true}>
        <div>
          <div>
            <span className="font-medium">Select Date</span>
          </div>
          <div className="w-full">
            <DatePicker onChange={onChange} className="w-full" />
          </div>
          {checkErrorDate && (
            <div>
              <span className="text-[#ff0000]">Please select date</span>
            </div>
          )}
        </div>
        <div className="mb-2">
          <div>
            <span className="font-medium">Store:</span>
          </div>
          <Select
            showSearch
            placeholder="Select Shop"
            style={{ width: 350 }}
            optionFilterProp="label"
            onChange={handleChangeSelect}
            filterSort={(optionA, optionB) => {
              var _a, _b;
              return ((_a = optionA === null || optionA === void 0 ? void 0 : optionA.label) !== null && _a !== void 0 ? _a : '')
                .toLowerCase()
                .localeCompare(
                  ((_b = optionB === null || optionB === void 0 ? void 0 : optionB.label) !== null && _b !== void 0 ? _b : '').toLowerCase()
                );
            }}
            options={shops}
          />
          {checkErrorShop && (
            <div className="my-2">
              <span className="text-[#ff0000]">Please select shop</span>
            </div>
          )}
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
            <p className="ant-upload-text">Click to upload or drag and drop file</p>
          </Dragger>
        </div>
        {checkErrorUpload && (
          <div className="my-2">
            <span className="text-[#ff0000]">Please upload file</span>
          </div>
        )}
      </Flex>
    </Modal>
  );
};

export default ModalAds;
