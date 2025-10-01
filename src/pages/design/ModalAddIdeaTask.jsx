import { Input, Modal, Select, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { createIdeaTask } from '../../apis/psdTask';
import { toast } from 'sonner';
const { TextArea } = Input;
const { Text } = Typography;

const ModalAddIdeaTask = ({ showCreateModal, setShowCreateModal, fetchAllTask, filters }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    referenceLink: '',
    image: '',
    productType: '',
  });

  const handleCreateTask = async () => {
    try {
      const response = await createIdeaTask(formData);
      if (response.status === 200) {
        toast.success('Create task success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Create task error!');
    } finally {
      fetchAllTask(filters);
      setShowCreateModal(false);
    }
  };
  return (
    <Modal
      title="Create Idea Task New"
      open={showCreateModal}
      onOk={handleCreateTask}
      onCancel={() => setShowCreateModal(false)}
      okText="Create Task"
      cancelText="Cancel"
      width={450}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong>Title task</Text>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter title task"
            style={{ marginTop: '8px' }}
          />
        </div>
        <div>
          <Text strong>Mô tả ý tưởng</Text>
          <TextArea
            value={formData.description}
            spellCheck={false}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            rows={2}
            style={{ marginTop: '8px' }}
          />
        </div>
        <div>
          <Text strong>Link image product</Text>
          <Input
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://example.com/image.jpg"
            style={{ marginTop: '8px' }}
          />
        </div>
        <div>
          <Text strong>Link product</Text>
          <Input
            value={formData.referenceLink}
            onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
            placeholder="https://example.com/image.jpg"
            style={{ marginTop: '8px' }}
          />
        </div>
        <div>
          <div>
            <Text strong>Product type</Text>
          </div>
          <Select
            showSearch
            onChange={(value) => setFormData({ ...formData, productType: value })}
            placeholder="Select Product type"
            optionFilterProp="label"
            style={{ marginTop: '8px', width: '100%' }}
            options={[
              {
                label: 'T-Shirt',
                value: 'T-Shirt',
              },
              {
                label: 'Napkins',
                value: 'Napkins',
              },
              {
                label: 'Sweatshirt',
                value: 'Sweatshirt',
              },
              {
                label: 'Hoodie',
                value: 'Hoodie',
              },
              {
                label: 'Baby Bodysuit',
                value: 'Baby Bodysuit',
              },
              {
                label: 'Stained Glass',
                value: 'Stained Glass',
              },
              {
                label: 'Accent Mug',
                value: 'Accent Mug',
              },
            ]}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ModalAddIdeaTask;
