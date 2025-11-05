// file: src/pages/User/ModalManageAccount.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Typography, Spin, Result, Descriptions, Button } from 'antd'; // Thêm Spin, Result, Descriptions, Button

const { Text, Title } = Typography;

const ModalManageAccount = ({ 
  open, 
  onCancel, 
  onOk,       
  onReset,    
  loading,    
  userData, 
  accountData,
  apiResponse 
}) => {
  
  const [form] = Form.useForm();
  
  const [tempPassword, setTempPassword] = useState(null); 
  
  const isUpdateMode = !!accountData; 

  useEffect(() => {
    if (apiResponse) {
      setTempPassword(apiResponse.temp_password);
    } else {
      setTempPassword(null);
    }

    if (open && isUpdateMode) {
      form.setFieldsValue({
        username: accountData.username,
        user_id: userData._id,
      });
    } else if (open && !isUpdateMode) {
      form.setFieldsValue({
        username: userData?.email, 
        password: '',
        user_id: userData?._id, 
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, userData, accountData, form, isUpdateMode, apiResponse]);

  const handleOk = async () => {
    if (loading) return;

    if (isUpdateMode) {
      onReset();
    } else {
      try {
        const values = await form.validateFields();
        onOk(values);
      } catch (info) {
        console.log('Validate Failed:', info);
      }
    }
  };

  return (
    <Modal
      title={isUpdateMode ? 'Reset Password' : 'Create Account'}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {tempPassword ? 'Close' : 'Cancel'}
        </Button>,
        !tempPassword && (
          <Button 
            key="ok" 
            type="primary" 
            loading={loading} 
            onClick={handleOk}
            danger={isUpdateMode} 
          >
            {isUpdateMode ? 'Reset' : 'Create'}
          </Button>
        )
      ]}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {tempPassword && apiResponse ? (
          <Result
            status="success"
            title="Password Reset Successfully!"
            subTitle={`Please provide this temporary password to the user.`}
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Username">
                {apiResponse.username}
              </Descriptions.Item>
              <Descriptions.Item label="Temporary Password">
                <Text strong copyable>{tempPassword}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Result>
          
        ) : (
          
          <Form form={form} layout="vertical" name="account_manage_form">
            
            <span className='font-medium'>User: {userData?.full_name}</span>
            
            <Form.Item
              name="username"
              label={<span className='font-medium mt-2'>Username</span>}
              rules={[{ required: true, message: 'Please enter a username' }]}
              
            >
              <Input disabled={isUpdateMode} />
            </Form.Item>

            {!isUpdateMode && (
              <Form.Item
                name="password"
                label={<span className='font-medium mt-2'>Password</span>}
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password />
              </Form.Item>
            )}

            {isUpdateMode && (
              <p className='pt-2'>
                Clicking "Reset" will generate a new temporary password for <strong>{userData?.full_name}</strong>.
              </p>
            )}

            <Form.Item name="user_id" style={{ display: 'none' }}>
              <Input />
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
};

export default ModalManageAccount;