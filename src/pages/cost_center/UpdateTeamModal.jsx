import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd'; 
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { toast } from 'sonner';

const UpdateTeamModal = ({ open, onCancel, onOk, loading, allUsers = [], teamData }) => {
  const [form] = Form.useForm();

  // 1. Tự động điền dữ liệu của team vào Form khi modal mở
  useEffect(() => {
    if (open && teamData) {
      // 1a. Điền tên team
      form.setFieldsValue({
        name: teamData.name,
      });

      // 1b. Điền danh sách members
      // (Dữ liệu members của team là object, cần đổi thành dạng Form.List)
      const formattedMembers = teamData.members.map(member => ({
        userId: member._id // Lấy _id của member
      }));
      
      form.setFieldsValue({
        members: formattedMembers,
      });

    } else if (!open) {
      form.resetFields();
    }
  }, [open, teamData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values); // Gửi 'values' (trạng thái cuối cùng) về component cha
    } catch (info) {
      console.log('Validate Failed:', info);
      toast.error('Please correct the form errors.');
    }
  };

  const userOptions = allUsers
    .filter(user => user && user._id && user.full_name) 
    .map((user) => ({
      label: user.full_name,
      value: user._id,
    }));

  return (
    <Modal
      title={`Update Team: ${teamData?.name || ''}`} // Tiêu đề modal
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Update" // Đổi chữ nút
      cancelText="Cancel"
      width={600}
      destroyOnClose // Tự hủy form khi đóng
    >
      <Form form={form} layout="vertical" name="update_team_form">
        <Form.Item
          name="name"
          label="Team Name"
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
                  {/* Yêu cầu: Tiêu đề (tương tự create) */}
                  <span style={{ fontWeight: 'bold', color: '#1677ff', marginBottom: 4 }}>
                    {index + 1}. Team Member
                  </span>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Form.Item
                      {...restField}
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

                    {/* Yêu cầu: Nút 'x' (Delete) */}
                    <DeleteOutlined
                      onClick={() => remove(name)}
                      style={{ color: 'red', fontSize: 16 }}
                    />
                  </div>
                </div>
              ))}
              
              {/* Yêu cầu: Nút "Add Member" */}
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

export default UpdateTeamModal;