// MappingUpsertModal.jsx
import React, { useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, Switch, InputNumber, Row, Col } from 'antd';

const DEFAULTS = {
  id: undefined, // dùng khi edit (ẩn)
  configCode: undefined,
  key: '',
  matchType: undefined,
  matchValue: '',
  mappedValue: '',
  priority: 1,
  active: true,
};

export default function MappingUpsertModal({
  open,
  mode = 'add',
  initialValues,
  onCancel,
  onSubmit,
  loading = false,
  matchTypeOptions = [],
}) {
  const [form] = Form.useForm();

  const title = useMemo(() => (mode === 'edit' ? 'Update Mapping' : 'Add Mapping'), [mode]);
  const okText = mode === 'edit' ? 'Update' : 'Create';

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ ...DEFAULTS, ...initialValues });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, active: !!values.active };
      await onSubmit?.(payload);
      form.resetFields();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      width={600}
      onCancel={() => {
        form.resetFields();
        onCancel?.();
      }}
      onOk={handleOk}
      okText={okText}
      cancelText="Cancel"
      confirmLoading={loading}
      className="mapping-modal"
    >
      <Form form={form} layout="vertical" initialValues={DEFAULTS}>
        <Row gutter={[10, 10]}>
          <Col span={12}>
            <Form.Item
              label={<span className="font-medium">Config Code</span>}
              name="config_code"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Please select Config Code' }]}
            >
              <Input placeholder="Eg: OS, NK" allowClear />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={<span className="font-medium">Key</span>}
              name="key"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Please enter Key' }]}
            >
              <Select
                placeholder="Select match type"
                options={[
                  { label: 'Color', value: 'color' },
                  { label: 'Size', value: 'size' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={<span className="font-medium">Match Type</span>}
              name="match_type"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Please select Match Type' }]}
            >
              <Select
                placeholder="Select match type"
                options={matchTypeOptions}
                showSearch
                filterOption={(i, opt) => (opt?.label ?? '').toLowerCase().includes(i.toLowerCase())}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={<span className="font-medium">Match Value</span>}
              name="match_value"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Please enter Match Value' }]}
            >
              <Input placeholder='Eg: "New Born", "Natural/Sand", "12 Months"' allowClear />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={<span className="font-medium">Mapped Value</span>}
              name="mapped_value"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Please enter Mapped Value' }]}
            >
              <Input placeholder='Eg: "NB", "Natural", "12M"' allowClear />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={<span className="font-medium">Priority</span>}
              name="priority"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Please enter Priority' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Active" name="active" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
