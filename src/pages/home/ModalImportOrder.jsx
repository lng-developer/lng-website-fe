import { Checkbox, Modal, Select, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getALlShop, importOrderByFile } from '../../apis/order';
const { Dragger } = Upload;

const ModalImportOrder = ({ isModalOpen, setIsModalOpen }) => {
  const [shops, setShops] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [shopId, setShopId] = useState('');
  const fetchAllShop = async () => {
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
        console.log('data', formatData);

        setShops(formatData);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleCancel = () => {
    setIsModalOpen((prev) => !prev);
  };
  console.log('data file', fileList);

  const handleOk = async () => {
    const file = fileList[0]?.originFileObj;

    const formData = new FormData();
    formData.append('file', file);

    const response = await importOrderByFile(shopId, formData);
    if (response.status === 200) {
      console.log('oke');
    }
  };

  const props = {
    name: 'file',
    multiple: true,
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
    beforeUpload(file) {
      setFileList([file]);
    },
    onRemove() {
      setFileList([]);
    },
  };

  useEffect(() => {
    fetchAllShop();
  }, []);
  return (
    <Modal
      title="Import Orders"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={400}
      onCancel={handleCancel}
    >
      <div className="py-4">
        <div>
          <span className="font-medium">Store:</span>
        </div>
        <Select
          showSearch
          placeholder="Select Shop"
          style={{ width: 350 }}
          optionFilterProp="label"
          onChange={(value) => {
            console.log(value);

            // setShopId(value.id);
          }}
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
        <div className="my-3">
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click to uploador drag and drop .txt file</p>
          </Dragger>
        </div>
        <div>
          <div>
            <span className="font-medium">Import Type:</span>
          </div>
          <div>
            <div className="flex gap-2 items-center">
              <Checkbox>New</Checkbox>
              <Checkbox>Latest ship date</Checkbox>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModalImportOrder;
