// AddSellerProductTypeModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Checkbox, Button, Card, Space } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { getALlVendorProduct } from '../../apis/vendor';
import { createProductType } from '../../apis/config';
import { toast } from 'react-toastify';

function ModalAddProductType({ open, loading, onCancel, fetchAllConfig }) {
  const [vendorProduct, setVendorProduct] = useState([]);
  const [form] = Form.useForm();

  const handleOk = () => form.submit();

  const handleFinish = async (values) => {
    try {
      const response = await createProductType(values);
      if (response.status === 201) {
        toast.success('Create product type success');
      }
    } catch (error) {
      console.log(error);
      toast.error('Create error!');
    } finally {
      form.resetFields();
      onCancel();
      fetchAllConfig();
    }
  };

  const fetchAllVendor = async () => {
    try {
      const response = await getALlVendorProduct();
      if (response.status === 200) {
        const result = response.data?.data?.map((item) => {
          return {
            value: item?._id,
            label: item?.product_name,
          };
        });
        setVendorProduct(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllVendor();
  }, []);

  return (
    <Modal
      open={open}
      title="Add New Product Type For Seller"
      onCancel={onCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
      confirmLoading={!!loading}
      width={450}
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ items: [{}] }}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
          <Input placeholder="Enter name" />
        </Form.Item>

        <div style={{ marginBottom: 8, fontWeight: 500 }}>Vendor Products:</div>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, idx) => (
                <Card
                  key={field.key}
                  size="small"
                  className="border-dashed border-[#e2e8f0]"
                  style={{ marginBottom: 12, borderStyle: 'dashed', borderColor: '#e2e8f0' }}
                  title={<span style={{ color: '#1677ff' }}>{idx + 1}. Vendor Product</span>}
                  extra={
                    fields.length > 1 && <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => remove(field.name)} />
                  }
                >
                  <Form.Item name={[field.name, 'vendor_product']} rules={[{ required: true, message: 'Please select vendor product' }]}>
                    <Select placeholder="Select Vendor Product" options={vendorProduct} showSearch optionFilterProp="label" allowClear />
                  </Form.Item>

                  <Form.Item valuePropName="checked" style={{ marginTop: 10 }}>
                    <Checkbox>Is Variant Vendor Product</Checkbox>
                  </Form.Item>
                </Card>
              ))}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <Button icon={<PlusOutlined />} onClick={() => add({})} />
              </div>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}

export default ModalAddProductType;
