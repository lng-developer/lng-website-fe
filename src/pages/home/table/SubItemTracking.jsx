import React, { useMemo } from 'react';
import { Form, Input, Select, Button, Tooltip } from 'antd';
import { CopyOutlined, TruckOutlined } from '@ant-design/icons';
import { trackingOrder } from '../../../apis/order';
import { updateEtsyItemTracking } from '../../../apis/etsy';
import { toast } from 'sonner';
import { TbEdit } from 'react-icons/tb';
const { TextArea } = Input;

const SubItemTracking = ({
  orderId = '',
  tracking_info = {},
  fetchAllOrder,
  filters,
  fetchCountStatus,
  orderItemId,
  transactionId,
  status,
  isEtsyOrder = false,
  onTrackingUpdated,
}) => {
  const [form] = Form.useForm();

  const initialValues = {
    fulfillment: tracking_info?.fulfillment,
    tracking: tracking_info?.tracking,
    status,
    note: tracking_info?.note,
  };

  const allValues = Form.useWatch([], form);
  const hasErrors = useMemo(() => form.getFieldsError().some(({ errors }) => errors.length), [allValues]);
  const isSame = (a = {}, b = {}) => Object.keys({ ...a, ...b }).every((k) => String(a[k] ?? '') === String(b[k] ?? ''));
  const isDirty = useMemo(() => !isSame(initialValues, allValues || {}), [allValues]);

  const copyTracking = async () => {
    const v = form.getFieldValue('tracking') || '';
    try {
      await navigator.clipboard.writeText(String(v));
      toast.success('Copied tracking!');
    } catch {
      toast.error('Copy failed!');
    }
  };

  const onFinish = async (values) => {
    try {
      const itemId = transactionId || orderItemId;
      const response = isEtsyOrder
        ? await updateEtsyItemTracking(orderId, itemId, {
            tracking: String(values?.tracking || '').trim(),
            status: values?.status || 'Shipped',
          })
        : await trackingOrder(orderId, orderItemId, values);

      if (response.status === 200) {
        toast.success('Update tracking success!');
        onTrackingUpdated?.(response.data);
      }
    } catch (error) {
      console.log(error);
      const statusCode = error?.response?.status;
      const message = error?.response?.data?.message;
      if (statusCode === 400 && message) {
        toast.error(message);
      } else if (statusCode === 404 && isEtsyOrder) {
        toast.error(message || 'Khong tim thay Etsy order/item');
      } else {
        toast.error(message || 'Update tracking error!');
      }
    } finally {
      fetchAllOrder?.(filters);
      fetchCountStatus?.();
    }
  };

  return (
    <div style={{ maxWidth: 320 }}>
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish} size="middle">
        <Form.Item name="fulfillment" rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}>
          <Input placeholder="Fulfillment" style={{ marginBottom: 10 }} />
        </Form.Item>

        <Form.Item name="tracking" rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}>
          <Input
            placeholder="Tracking"
            style={{ marginBottom: 10 }}
            suffix={
              <>
                {initialValues?.tracking && (
                  <>
                    <Tooltip title="View USPS">
                      <a href={`https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${initialValues?.tracking}`} target="_blank">
                        <TruckOutlined style={{ color: '#666', cursor: 'pointer', marginRight: 5 }} />
                      </a>
                    </Tooltip>

                    <Tooltip title="Copy tracking">
                      <CopyOutlined onClick={copyTracking} style={{ color: '#666', cursor: 'pointer' }} />
                    </Tooltip>
                  </>
                )}
              </>
            }
          />
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
          <TextArea rows={2} placeholder="Note" maxLength={200} style={{ marginBottom: 10 }} />
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
