import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd'; 
// SỬA: Import icon 'x' (CloseOutlined)
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

const AddTeamModal = ({ open, onCancel, onOk, loading, allUsers = [] }) => {
  const [form] = Form.useForm();
  const members = Form.useWatch('members', form);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (info) {
      console.log('Validate Failed:', info);
      message.error('Please correct the form errors.');
    }
  };

  const userOptions = allUsers
    .filter(user => 
      user && 
      user._id && 
      user.full_name &&
      !user.team_id
    ) 
    .map((user) => ({
      label: user.full_name,
      value: user._id,
    }));

  const selectedIds = new Set(members?.map(m => m?.userId).filter(Boolean));

  return (
    <Modal
      title="Add New Team"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Create"
      cancelText="Cancel"
      width={450}
    >
      <Form 
        form={form} 
        layout="vertical" 
        name="add_team_form"
        initialValues={{ members: [{}] }} 
      >
        <Form.Item
          name="name"
          label={<div style={{ marginBottom: 4, fontWeight: 500, marginTop: 8 }}>Team Name</div>}
          rules={[{ required: true, message: 'Please enter the team name!' }]}
          className="font-medium mt-4"
        >
          <Input className="font-medium mb-4" placeholder="Enter team name" />
        </Form.Item>

        <Form.Item
          name="leaderId"
          label={<div style={{ marginBottom: 4, fontWeight: 500, marginTop: 8 }}>Leader</div>}
          rules={[{ required: true, message: 'Please select a team leader!' }]}
          className="font-medium"
        >
          <Select
            placeholder="Select Team Leader"
            options={userOptions}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            showSearch
          />
        </Form.Item>

        <label className="font-medium mt-2.5"><div style={{ marginBottom: 8, fontWeight: 500, marginTop: 8 }}>Team Members:</div></label>

        <Form.List name="members">
          {(fields, { add, remove }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16,  }}>
              {fields.map(({ key, name, ...restField }, index) => {
                
                const currentValue = members?.[index]?.userId;
                const dynamicOptions = userOptions.map(option => ({
                  ...option,
                  disabled: selectedIds.has(option.value) && option.value !== currentValue
                }));
                
                return (
                  // 1. SỬA CSS CỦA KHỐI BAO
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: '16px',
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      position: 'relative', // <-- Thêm 'relative'
                    }}
                  >
                    {/* 2. THÊM NÚT XÓA 'x' VÀO ĐÂY */}
                    {index > 0 && ( // Vẫn ẩn nút xóa của Leader
                      <CloseOutlined
                        onClick={() => remove(name)}
                        style={{
                          fontSize: 14,
                          color: '#888',
                          position: 'absolute', // <-- Đặt vị trí tuyệt đối
                          top: 10,
                          right: 10,
                          cursor: 'pointer',
                        }}
                      />
                    )}

                    <span style={{ fontWeight: 'bold', color: '#1677ff', marginBottom: 4 }}>
                      {index === 0 ? '1. Leader' : `${index + 1}. Team Member`}
                    </span>

                    {/* 3. XÓA BỎ DIV BAO QUANH */}
                    <Form.Item
                      {...restField}
                      name={[name, 'userId']}
                      rules={[{ 
                        required: true, 
                        message: index === 0 ? 'Please select a leader!' : 'Please select a member!'
                      }]}
                      style={{ flex: 1, margin: 0 }}
                    >
                      <Select
                        placeholder={index === 0 ? 'Select Team Leader' : 'Select Team Member'}
                        options={dynamicOptions} 
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        showSearch
                      />
                    </Form.Item>
                    
                    {/* Icon xóa cũ đã bị gỡ bỏ khỏi đây */}
                  </div>
                );
              })}
              
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Member
                </Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default AddTeamModal;