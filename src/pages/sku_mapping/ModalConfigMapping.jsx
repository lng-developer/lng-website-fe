// file: src/pages/SkuMapping/ModalConfigMapping.jsx
import React, { useEffect, useMemo } from 'react';
import { Modal, Form, Select, Switch, Input, Typography, Row, Col } from 'antd';

const { Text } = Typography;
const { Option } = Select;

/**
 * Props:
 * - open: boolean
 * - onCancel: fn
 * - onOk: fn(payload)
 * - loading: boolean
 * - configs: array (list rule configs)
 */
const ModalConfigMapping = ({ open, onCancel, onOk, loading, configs = [] }) => {
  const [form] = Form.useForm();

  const activeConfigs = useMemo(() => {
    return (configs || []).filter((c) => c?.is_active);
  }, [configs]);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        configId: activeConfigs?.[0]?._id,
        orderIds: [],
        dryRun: false,
      });
    } else {
      form.resetFields();
    }
  }, [open, form, activeConfigs]);
  const parseOrderIds = (input = '') => {
    // Nếu input đã là mảng (trường hợp dùng Select/tags cũ), chuẩn hoá và trả về luôn
    if (Array.isArray(input)) {
      return input.map((s) => String(s).trim()).filter(Boolean);
    }

    // Nếu là string (TextArea/Input), parse theo các ký tự phân tách
    if (typeof input === 'string') {
      return input
        .split(/[\n,; \t]+/g) // xuống dòng, dấu phẩy, space, tab
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Các kiểu khác -> trả về mảng rỗng
    return [];
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('value:', values);

      // LUÔN ra mảng []
      const orderIds = parseOrderIds(values.orderIds);
      console.log('orderIds:', orderIds);

      const payload = {
        configId: values.configId,
        scope: {
          orderIds,
        },
        dryRun: Boolean(values.dryRun),
      };

      onOk(payload);
    } catch (e) {
      // antd will show validation errors
    }
  };

  return (
    <Modal
      title="Apply SKU Mapping Config"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Apply"
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="configId"
              label={<span className="font-medium">Config (Rule)</span>}
              rules={[{ required: true, message: 'Please choose a config rule' }]}
            >
              <Select placeholder="Select a config rule" showSearch optionFilterProp="label" size="large" style={{ height: '45px' }}>
                {activeConfigs.map((c) => (
                  <Option key={c._id} value={c._id} label={c.name}>
                    <div className="flex flex-col gap-0">
                      <span className="font-medium text-sm">{c.name}</span>
                      <span className=" text-xs">{c.description}</span>
                      {/* <Text type="secondary">
                        Priority: {c.priority ?? 'N/A'} • Count:{' '}
                        {Object.keys(c.exactMap || {}).length +
                          Object.keys(c.productMap || {}).length +
                          Object.keys(c.employeeMap || {}).length || 0}
                      </Text> */}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="orderIds"
              label={<span className="font-medium">Scope - Order IDs </span>}
              tooltip="Nhập từng orderId và nhấn Enter. Có thể dán nhiều orderId (mỗi cái một dòng) rồi Enter."
              rules={[
                {
                  validator: async (_, v) => {
                    const arr = parseOrderIds(v || '');
                    if (arr.length === 0) {
                      throw new Error('Please input at least 1 Order ID');
                    }
                  },
                },
              ]}
            >
              {/* <Select mode="tags" tokenSeparators={['\n', ',', ';', '\t', ' ']} placeholder="e.g. 114-6783106-1935467" /> */}
              <Input.TextArea
                placeholder={`e.g.\n114-6783106-1935467\n114-1234567-1234567`}
                autoSize={{ minRows: 3, maxRows: 8 }}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="dryRun"
              label={<span className="font-medium">Dry Run</span>}
              valuePropName="checked"
              tooltip="Bật để chạy thử (không ghi dữ liệu). Tắt để apply thật."
            >
              <Switch />
            </Form.Item>

            {/* <Text type="secondary">
              API body sẽ gửi theo format:
              <br />
              <Text code>{'{ configId, scope: { orderIds: [...] }, dryRun }'}</Text>
            </Text> */}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ModalConfigMapping;
