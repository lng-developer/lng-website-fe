import React, { useMemo } from 'react';
import { Popover, Timeline, Typography, Space, Button } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import StatusComponent from './StatusComponent';
import { dataColors } from '../utils/dataColors';

const { Text } = Typography;

function formatDateTime(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

export default function OrderLogPopover({ events = [], triggerNode, orderCreatedAt }) {
  const handleShowTitle = (status) => {
    switch (status) {
      case 'UPLOAD_FULFILLMENT_FILES':
        return 'Fulfill Order by';
      case 'SCALE_ORDER_READY':
        return 'QC Order by';
      case 'SEND_TO_VENDOR':
        return 'Send to vendor by';
      case 'UPDATE_STATUS':
        return 'Change status order by';
      case 'SCALE_APPROVE_ITEM':
        return 'Update item by';
      default:
        break;
    }
  };

  const items = useMemo(() => {
    const fixedFirst = {
      key: 'fixed-order-created',
      dot: <CheckCircleFilled style={{ color: '#000' }} />,
      className: 'tl-fixed',
      children: (
        <div>
          <Space size={5} wrap>
            <Text strong>Order created at </Text>
            {orderCreatedAt ? <Text strong>{formatDateTime(orderCreatedAt)}</Text> : null}
          </Space>
        </div>
      ),
    };
    const historyItems = (events || []).map((e) => ({
      key: e._id,
      dot: <CheckCircleFilled style={{ color: '#000' }} />,
      className: 'tl-history',
      children: (
        <div>
          <Space size={5} wrap>
            <Text strong>{handleShowTitle(e.action)}</Text>
            {e.userName ? <span style={{ color: dataColors.process, fontWeight: 600 }}>{e.userName}</span> : null}
            {e.createdAt ? <Text strong>at {formatDateTime(e.createdAt)}</Text> : null}
          </Space>

          <div style={{ marginTop: 5, display: 'flex', gap: 10 }}>
            <StatusComponent title="Success" color={dataColors.success} />
            <Text type="secondary">{e.action === 'UPLOAD_FULFILLMENT_FILES' ? 'Uploaded fulfillment files' : e.description}</Text>
          </div>
        </div>
      ),
    }));
    return [fixedFirst, ...historyItems];
  }, [events, orderCreatedAt]);

  const content = (
    <div style={{ padding: '10px 5px' }}>
      <Timeline items={items} />
    </div>
  );

  return (
    <Popover placement="bottom" title={false} content={content} trigger="click">
      {triggerNode || <Button size="small">Logs</Button>}
    </Popover>
  );
}
