import React, { useMemo } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { trackingOrder } from '../../../apis/order';
import { toast } from 'sonner';
import { TbEdit } from 'react-icons/tb';
const { TextArea } = Input;

const SubItemTracking = ({ orderId = '', tracking_info = {}, fetchAllOrder, filters, fetchCountStatus, orderItemId, status }) => {
  const [form] = Form.useForm();

  // Giá trị mặc định (giống ảnh: Status = New)
  const initialValues = {
    fulfillment: tracking_info?.fulfillment,
    tracking: tracking_info?.tracking,
    status: status,
    note: tracking_info?.note,
  };

  // Watch toàn bộ field để tính "dirty"
  const allValues = Form.useWatch([], form);

  const hasErrors = useMemo(
    () => form.getFieldsError().some(({ errors }) => errors.length),
    [allValues] // mỗi lần đổi giá trị, antd sẽ tính lại validate
  );

  // so sánh nông các key trong object
  const isSame = (a = {}, b = {}) => Object.keys({ ...a, ...b }).every((k) => String(a[k] ?? '') === String(b[k] ?? ''));

  const isDirty = useMemo(() => !isSame(initialValues, allValues || {}), [allValues]);

  const onFinish = async (values) => {
    try {
      const response = await trackingOrder(orderId, orderItemId, values);

      if (response.status == 200) {
        toast.success('Update tracking success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Update tracking error!');
    } finally {
      fetchAllOrder(filters);
      fetchCountStatus();
    }
  };

  return (
    <div style={{ maxWidth: 320 }}>
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish} size="middle">
        <Form.Item name="fulfillment" rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}>
          <Input placeholder="Fulfillment" allowClear style={{ marginBottom: 10 }} />
        </Form.Item>

        <Form.Item name="tracking" rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}>
          <Input placeholder="Tracking" allowClear style={{ marginBottom: 10 }} />
        </Form.Item>

        <Form.Item name="status" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
          <Select
            options={[
              { value: 'New', label: 'New' },
              { value: 'Fulfilled', label: 'Fulfilled' },
              { value: 'Shipped', label: 'Shipped' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
            placeholder="Status"
            style={{ marginBottom: 10 }}
          />
        </Form.Item>

        <Form.Item name="note" rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}>
          <TextArea rows={2} placeholder="Note" maxLength={200} allowClear style={{ marginBottom: 10 }} />
        </Form.Item>

        <Form.Item shouldUpdate>
          {() => (
            <Button block icon={<TbEdit />} htmlType="submit" disabled={!isDirty || hasErrors} style={{ width: '33%' }}>
              Update
            </Button>
          )}
        </Form.Item>
      </Form>
    </div>
  );
};

export default SubItemTracking;
