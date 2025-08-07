import { Modal, Radio, Select, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getALlShop, importOrderByFile } from '../../apis/order';
import { toast } from 'react-toastify';
const { Dragger } = Upload;

const ModalImportOrder = ({ isModalOpen, setIsModalOpen }) => {
  const [shops, setShops] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [shopId, setShopId] = useState('');
  const [checkErrorShop, setCheckErrorShop] = useState(false);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);
  const [typeOrder, setTypeOrder] = useState('New');

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

  const handleCancel = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleOk = async () => {
    if (!shopId) {
      setCheckErrorShop(true);
      return;
    }
    const fileFormat = fileList?.[0];
    if (!fileFormat) {
      setCheckErrorUpload(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileFormat);
    formData.append('shopId', shopId);
    formData.append('type', typeOrder);
    try {
      const response = await importOrderByFile(formData);
      if (response.status === 200) {
        toast.success('Import success');
      } else {
        toast.error('Import error');
      }
    } catch (error) {
      console.log(error);
      toast.error('Import error');
    } finally {
      handleCancel();
    }
  };

  const beforeUpload = (file) => {
    setFileList([file]);
    setCheckErrorUpload(false);
    return false;
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
      title="Import Orders"
      okText="Import"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={400}
      onCancel={handleCancel}
    >
      <div className="py-2">
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
        <div>
          <div>
            <span className="font-medium">Import Type:</span>
          </div>
          <div>
            <div className="flex gap-2 items-center">
              <Radio.Group onChange={(e) => setTypeOrder(e.target.value)} value={typeOrder} optionType="default">
                <Radio checked={true} value="New">
                  New
                </Radio>
                <Radio value="Latest ship date">Latest ship date</Radio>
              </Radio.Group>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModalImportOrder;
