import React, { useEffect } from 'react';
// 1. Xóa Checkbox khỏi import
import { Modal, Form, Input, Select, Button, message } from 'antd'; 
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const AddTeamModal = ({ open, onCancel, onOk, loading, allUsers = [] }) => {
  const [form] = Form.useForm();
    console.log("all user",allUsers)
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

  // 2. Thêm "Phòng thủ" (Defensive code)
  // Lọc ra các user CÓ ID và CÓ TÊN
  const userOptions = allUsers
    .filter(user => user && user._id && user.full_name) 
    .map((user) => ({
      label: user.full_name,
      value: user._id,
    }));
    console.log("option",userOptions)


  return (
    <Modal
      title="Add New Team"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Create"
      cancelText="Cancel"
      width={600}
    >
      <Form form={form} layout="vertical" name="add_team_form">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter the team name!' }]}
        >
          <Input placeholder="Enter team name" />
        </Form.Item>

        <label>Team Members:</label>

        <Form.List name="members">
          {(fields, { add, remove }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '16px',
                    border: '1px dashed #d9d9d9',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: '#1677ff', marginBottom: 4 }}>
                    {index + 1}. Team Member
                  </span>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Form.Item
                      {...restField} // <-- Bug đã được sửa (vì chỉ còn 1 Form.Item)
                      name={[name, 'userId']}
                      rules={[{ required: true, message: 'Please select a member!' }]}
                      style={{ flex: 1, margin: 0 }}
                    >
                      <Select
                        placeholder="Select Team Member"
                        options={userOptions}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        showSearch
                      />
                    </Form.Item>

                    <DeleteOutlined
                      onClick={() => remove(name)}
                      style={{ color: 'red', fontSize: 16 }}
                    />
                  </div>

                </div>
              ))}
              
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