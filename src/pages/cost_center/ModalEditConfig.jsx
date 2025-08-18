import { Modal, Form, Input, Select, Switch, Row, Col, InputNumber, Tooltip, Button } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { getConfigCostById } from '../../apis/config';

const ModalEditConfig = ({ open, loading, onCancel, onSubmit, sellerProductOptions, idEdit }) => {
  const [form] = Form.useForm();

  const platformOptions = [
    { value: 'Etsy', label: 'Etsy' },
    { value: 'Shopify', label: 'Shopify' },
    { value: 'Amazon', label: 'Amazon' },
  ];
  const colorOptions = [
    { value: 'black', label: 'Black' },
    { value: 'white', label: 'White' },
  ];

  const handleOk = () => form.submit();

  const handleFinish = async (values) => {
    // payload gửi API
    await onSubmit(values);
    // form.resetFields();
  };

  const fetchConfigById = async () => {
    try {
      const response = await getConfigCostById(idEdit);
      if (response.status === 200) {
        const result = response.data?.data;
        form.setFieldsValue({
          platform: result?.platform,
          config_code: result?.config_code,
          size_position: result?.size_position,
          color_position: result?.color_position,
          is_set: result?.is_set,
          is_pack: result?.is_pack,
          customize_size_key: result?.customize_size_key,
          customize_color_key: result?.customize_color_key,
          customize_product_type_key: result?.customize_product_type_key,
          customize_product_type_size_key: result?.customize_product_type_size_key,
          customize_product_type_color_key: result?.customize_product_type_color_key,
          combination_product_type_key: result?.combination_product_type_key,
          product_for_seller: result?.product_for_seller?._id,
          default_color: result?.default_color,
          country: result?.country,
          product_type_from_platform: result?.product_type_from_platform,
        });
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchConfigById();
  }, [idEdit]);

  return (
    <Modal
      open={open}
      title="Update Config Cost Center"
      onCancel={onCancel}
      width={900}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk} loading={!!loading}>
          Update
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={[16, 12]}>
          {/* Platform (required) */}
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-medium">Platform</span>}
              name="platform"
              rules={[{ required: true, message: 'Please select a platform' }]}
            >
              <Select placeholder="Platform..." options={platformOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>

          {/* Config Code (required) */}
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-medium">Config Code</span>}
              name="config_code"
              rules={[{ required: true, message: 'Please enter config code' }]}
            >
              <Input placeholder="Config Code" />
            </Form.Item>
          </Col>

          {/* Customize Size Key */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Customize Size Key</span>} name="customize_size_key">
              <Input placeholder="Customize Size Key" />
            </Form.Item>
          </Col>

          {/* Customize Color Key */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Customize Color Key</span>} name="customize_color_key">
              <Input placeholder="Customize Color Key" />
            </Form.Item>
          </Col>

          {/* Customize Product Type Key */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Customize Product Type Key</span>} name="customize_product_type_key">
              <Input placeholder="Customize Product Type Key" />
            </Form.Item>
          </Col>

          {/* Customize Product Type / Size Key */}
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-medium">Customize Product Type / Size Key</span>}
              name="customize_product_type_size_key"
            >
              <Input placeholder="Customize Product Type / Size Key" />
            </Form.Item>
          </Col>

          {/* Customize Product Type / Color Key */}
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-medium">Customize Product Type / Color Key</span>}
              name="customize_product_type_color_key"
            >
              <Input placeholder="Customize Product Type / Color Key" />
            </Form.Item>
          </Col>

          {/* Combination Product Type Key + tooltip */}
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="font-medium">
                  Combination Product Type Key{' '}
                  <Tooltip title="Format must have (/): XXX / YYY Ex: Select Style / Select Material">
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </span>
              }
              name="combination_product_type_key"
            >
              <Input placeholder="Combination Product Type Key" />
            </Form.Item>
          </Col>

          {/* Size Position (number) */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Size Position</span>} name="size_position">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" controls={false} />
            </Form.Item>
          </Col>

          {/* Color Position (number) */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Color Position</span>} name="color_position">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" controls={false} />
            </Form.Item>
          </Col>

          {/* Product Type From Platform */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Product Type From Platform</span>} name="product_type_from_platform">
              <Input placeholder="Product Type From Platform" />
            </Form.Item>
          </Col>

          {/* Country (required) */}
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-medium">Country</span>}
              name="country"
              rules={[{ required: true, message: 'Please enter country' }]}
            >
              <Input placeholder="Country" />
            </Form.Item>
          </Col>

          {/* Product For Seller (Select, required) */}
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-medium">Product For Seller</span>}
              name="product_for_seller"
              rules={[{ required: true, message: 'Please select product type' }]}
            >
              <Select placeholder="Product type..." options={sellerProductOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>

          {/* Default Color (Select + tooltip) */}
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="font-medium">
                  Default Color{' '}
                  <Tooltip title="Default color value if no color configuration is found">
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </span>
              }
              name="default_color"
            >
              <Select placeholder="Default Color..." options={colorOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>

          {/* Switches */}
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Is Set</span>} name="is_set" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label={<span className="font-medium">Is Pack</span>} name="is_pack" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ModalEditConfig;
