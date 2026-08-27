import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const ModalCreateUpdateUser = ({ open, onCancel, onOk, loading, initialData, allRoles = [] }) => {
  const [form] = Form.useForm();
  const isUpdateMode = !!initialData;
  const selectedRoleId = Form.useWatch('role_id', form);
  const isSeller = allRoles.some((role) => role._id === selectedRoleId && role.name === 'Seller');

  useEffect(() => {
    if (open && isUpdateMode) {
      // Chế độ "Update User"
      form.setFieldsValue({
        full_name: initialData.full_name,
        email: initialData.email,
        employee_id: initialData.employee_id,
        role_id: initialData.role_id?._id,
        end_seller: initialData.end_seller ? dayjs(initialData.end_seller) : null,
      });
    } else if (open && !isUpdateMode) {
      // Chế độ "Create User"
      form.setFieldsValue({
        full_name: '',
        email: '',
        employee_id: '',
        role_id: null,
        end_seller: null,
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, initialData, form, isUpdateMode]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({
        ...values,
        end_seller: values.end_seller?.hour(12).toISOString() || null,
      });
    } catch (info) {
      console.log('Validate Failed:', info);
    }
  };

  // Tạo options cho Role
  const roleOptions = allRoles.map(role => ({
    label: role.name,
    value: role._id,
  }));

  return (
    <Modal
      title={isUpdateMode ? 'Update User' : 'Create New User'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText={isUpdateMode ? 'Update' : 'Create'}
      width={400}
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="user_form">
        <Form.Item
          name="full_name"
          label={<span className='font-medium mt-2'>Full Name</span>}
          rules={[{ required: true, message: 'Please enter full name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className='font-medium mt-2'>Email</span>}
          rules={[{ required: true, message: 'Please enter an email' }]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item
          name="employee_id"
          label={<span className='font-medium mt-2'>Employee ID</span>}
          rules={[{ required: true, message: 'Please enter an Employee ID' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="role_id"
          label={<span className='font-medium mt-2'>Role</span>}
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select
            showSearch
            placeholder="Select a role"
            options={roleOptions}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {isUpdateMode && isSeller && (
          <Form.Item
            name="end_seller"
            label={<span className='font-medium mt-2'>Seller inactive date</span>}
            extra="No opCost is charged from this date. Clear it to reactivate the seller."
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ModalCreateUpdateUser;
