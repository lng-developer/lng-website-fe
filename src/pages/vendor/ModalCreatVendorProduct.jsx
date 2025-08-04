import { Flex, Input, Modal, Select } from 'antd';
import React, { useState } from 'react';
import { dataColors } from '../../utils/dataColors';
import { addVendorProduct } from '../../apis/vendor';
import { toast } from 'react-toastify';

const ModalCreatVendorProduct = ({ isShowModalAdd, setIsShowModalAdd, fetchAllProductCostCenter, filters, vendors }) => {
  const [valueProductName, setValueProductName] = useState('');
  const [productId, setProductId] = useState('');
  const [image, setImage] = useState('');
  const [selectVendor, setSelectVendor] = useState('');
  // const [productType, setProductType] = useState('');

  const handleAddVendorProduct = async () => {
    try {
      const response = await addVendorProduct({
        vendor_id: selectVendor,
        image: image,
        product_id: productId,
        product_name: valueProductName,
      });

      if (response.status === 201) {
        toast.success('Add vendor product success!');
        fetchAllProductCostCenter(filters);
      }
    } catch (error) {
      console.log(error);
      toast.error('Add vendor product error!');
    } finally {
      setIsShowModalAdd(false);
    }
  };

  return (
    <Modal
      title="Create Vendor Product"
      width={400}
      style={{ top: '15%' }}
      okText="Create"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isShowModalAdd}
      onOk={handleAddVendorProduct}
      onCancel={() => setIsShowModalAdd(false)}
    >
      <Flex vertical={true} gap={10} style={{ paddingBottom: 10 }}>
        <Flex vertical={true} gap={2} className="my-2">
          <span className="font-medium">
            Vendor<span className="text-red-500">*</span>
          </span>
          <Select
            showSearch
            onChange={(value) => setSelectVendor(value)}
            placeholder="Select Vendor"
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={vendors}
          />
        </Flex>
        <Flex vertical={true} gap={2}>
          <span className="font-medium">Product Name</span>
          <Input
            value={valueProductName}
            placeholder="Product Name"
            onChange={(e) => setValueProductName(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
          />
        </Flex>
        <Flex vertical={true} gap={2}>
          <span className="font-medium">Product ID</span>
          <Input
            value={productId}
            placeholder="Product ID"
            onChange={(e) => setProductId(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
          />
        </Flex>
        <Flex vertical={true} gap={2}>
          <span className="font-medium">Image</span>
          <Input
            value={image}
            placeholder="Link to image"
            onChange={(e) => setImage(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
          />
        </Flex>
        <Flex vertical={true} gap={2}>
          <span className="font-medium">
            Product Type For Design <span className="text-red-500">*</span>
          </span>
          <Select
            placeholder="Product Type For Design"
            options={[
              { value: 'API', label: 'API' },
              { value: 'Manual', label: 'Manual' },
              { value: 'Shopify', label: 'Shopify' },
            ]}
          />
        </Flex>
        <div className="font-medium">
          <span>Is PSD Variant</span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs transition-colors font-medium text-foreground border-1 ml-2"
            style={{ color: dataColors.process, borderColor: dataColors.process }}
          >
            No
          </span>
        </div>
      </Flex>
    </Modal>
  );
};

export default ModalCreatVendorProduct;
