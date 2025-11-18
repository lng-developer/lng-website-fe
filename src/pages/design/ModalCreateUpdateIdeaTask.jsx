import { Input, Modal, Select, Space, Typography, Form } from 'antd';
import React, { useEffect, useState } from 'react';
import { createIdeaTask, updateIdeaTask } from '../../apis/psdTask';
import { toast } from 'sonner';

const { TextArea } = Input;
const { Text } = Typography;

const ModalCreateUpdateIdeaTask = ({ open, onCancel, fetchAllTask, filters, initialData }) => {
  const [form] = Form.useForm();
  const isUpdateMode = !!initialData;

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const checkValidity = () => {
    const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);

    const values = form.getFieldsValue(['title', 'productType']);

    const hasMissingRequired = !values.title || !values.productType;

    if (isUpdateMode) {
      setIsSubmitDisabled(hasErrors);
    } else {
      setIsSubmitDisabled(hasErrors || hasMissingRequired);
    }
  };

  useEffect(() => {
    if (open && isUpdateMode) {
      form.setFieldsValue({
        title: initialData.title,
        description: initialData.description,
        referenceLink: initialData.referenceLink,
        image: initialData.image,
        productType: initialData.productType,
      });
      setTimeout(checkValidity, 100);
    } else if (open && !isUpdateMode) {
      form.resetFields();
      setIsSubmitDisabled(true);
    }
  }, [open, initialData, form, isUpdateMode]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (isUpdateMode) {
        await updateIdeaTask(initialData._id, values);
        toast.success('Task updated successfully!');
      } else {
        await createIdeaTask(values);
        toast.success('Task created successfully!');
      }

      fetchAllTask(filters);
      onCancel();
    } catch (error) {
      console.log(error);
      toast.error('Operation failed!');
    }
  };

  return (
    <Modal
      title={isUpdateMode ? 'Update Idea Task' : 'Create Idea Task New'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: isSubmitDisabled }}
      okText={isUpdateMode ? 'Update' : 'Create'}
      cancelText="Cancel"
      width={450}
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="idea_task_form" onFieldsChange={checkValidity}>
        <Form.Item name="title" label={<Text strong>Title task</Text>} rules={[{ required: true, message: 'Title is required' }]}>
          <Input placeholder="Enter title task" />
        </Form.Item>

        <Form.Item name="description" label={<Text strong>Mô tả ý tưởng</Text>}>
          <TextArea spellCheck={false} placeholder="Description" rows={2} />
        </Form.Item>

        <Form.Item
          name="image"
          label={<Text strong>Link image product</Text>}
          rules={[
            { type: 'url', message: 'This field must be a valid URL!' },
            {
              pattern: /\.(jpeg|jpg|gif|png|webp|svg)$/i,
              message: 'The URL must be a valid image link (.jpg, .png, .gif, etc.)!',
            },
          ]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <Form.Item name="referenceLink" label={<Text strong>Link product</Text>} rules={[{ type: 'url', message: 'Must be a valid URL!' }]}>
          <Input placeholder="https://example.com/product.jpg" />
        </Form.Item>

        <Form.Item
          name="productType"
          label={<Text strong>Product type</Text>}
          rules={[{ required: true, message: 'Product type is required' }]}
        >
          <Select
            showSearch
            placeholder="Select Product type"
            optionFilterProp="label"
            style={{ width: '100%' }}
            options={[
              { label: 'Ornament', value: 'Ornament' },
              { label: 'T-Shirt', value: 'T-Shirt' },
              { label: 'Napkins', value: 'Napkins' },
              { label: 'Sweatshirt', value: 'Sweatshirt' },
              { label: 'Hoodie', value: 'Hoodie' },
              { label: 'Baby Bodysuit', value: 'Baby Bodysuit' },
              { label: 'Stained Glass', value: 'Stained Glass' },
              { label: 'Accent Mug', value: 'Accent Mug' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalCreateUpdateIdeaTask;
