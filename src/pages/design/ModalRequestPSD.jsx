import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';

const { TextArea } = Input;

const ModalRequestPSD = ({ open, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  // Tự động reset form khi modal đóng
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      // 'values' sẽ là { note: "..." }
      const values = await form.validateFields();
      onOk(values.note); 
    } catch (info) {
      console.log('Validate Failed:', info);
    }
  };

  return (
    <Modal
      title="Request PSD"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Request"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="request_psd_form">
        <Form.Item
          name="note"
          label="Note"
         
          rules={[{ required: false, message: 'Please enter a note for the designer!' }]}
        >
          <TextArea rows={4} placeholder="Enter your request note..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalRequestPSD;