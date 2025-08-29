// CreateListingModal.jsx
import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, Spin } from 'antd';
import { getALlShop } from '../../apis/order';
import { createListing } from '../../apis/listing';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const STYLE_OPTS = [
  { label: 'T-Shirt', value: 'T-Shirt' },
  { label: 'Hoodie', value: 'Hoodie' },
  { label: 'Sweatshirt', value: 'Sweatshirt' },
];

const DESIGN_PRODUCT_OPTS = [
  { label: 'Halloween Cat', value: 'Halloween Cat' },
  { label: 'Floral Nurse', value: 'Floral Nurse' },
  { label: 'Sports Mom', value: 'Sports Mom' },
];

const VARIANT_OPTS = [
  { label: 'All', value: 'All' },
  { label: 'Black', value: 'Black' },
  { label: 'White', value: 'White' },
  { label: 'XL', value: 'XL' },
];

const PLATFORM_OPTS = [
  { label: 'Amazon', value: 'Amazon' },
  { label: 'Etsy', value: 'Etsy' },
  { label: 'eBay', value: 'eBay' },
  { label: 'Shopify', value: 'Shopify' },
];

const ASIN_TYPE_OPTS = [
  { label: 'PODLovers', value: 'PODLovers' },
  { label: 'First Sale', value: 'First Sale' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Outline', value: 'Outline' },
  { label: 'Style', value: 'Style' },
  { label: 'Tool', value: 'Tool' },
  { label: 'Custom Image', value: 'Custom Image' },
  { label: 'Auto Fulfill', value: 'Auto Fulfill' },
  { label: 'Other', value: 'Other' },
];

export default function ModalAddListing({ open, onClose, fetchAllListing, filters }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const response = await getALlShop();
        if (response.status === 200) {
          const result = response.data?.map((item) => {
            return {
              label: item?.name,
              value: item?._id,
            };
          });
          setShops(result);
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }, [open]);

  const handleSubmit = async (v) => {
    const payload = {
      asin: v.asin.trim(),
      product_image: v.product_image?.trim() || undefined,
      platform: v.platform,
      asin_type: v.asin_type,
      store: v.store,
      template: {
        style: v.style,
        design_product: v.design_product,
        variant: v.variant,
      },
      seller: user?.id,
    };
    setLoading(true);
    try {
      setSubmitting(true);
      const response = await createListing(payload);
      if (response.status === 200) {
        toast.success('Created listing successfully');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Create failed');
    } finally {
      setSubmitting(false);
      form.resetFields();
      fetchAllListing(filters);
      onClose();
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          onClose();
        }}
        title="Create Listing"
        footer={null}
        width={650}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            platform: 'Amazon',
            asin_type: 'Normal',
          }}
        >
          <Row gutter={16}>
            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Asin</span>}
                name="asin"
                rules={[
                  { required: true, message: 'Asin is required' },
                  { pattern: /^[A-Z0-9]{10}$/i, message: 'ASIN phải 10 ký tự chữ/số' },
                ]}
              >
                <Input placeholder="B0XXXXXXX1" allowClear />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Product Image (URL)</span>}
                name="product_image"
                rules={[{ required: true, message: 'Product Image  is required' }]}
              >
                <Input placeholder="https://.../image.jpg" allowClear />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Style</span>}
                name="style"
                rules={[{ required: true, message: 'Style is required' }]}
              >
                <Select options={STYLE_OPTS} placeholder="Select style" showSearch />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Design Product</span>}
                name="design_product"
                //   rules={[{ required: true, message: 'Design Product is required' }]}
              >
                {/* <Select options={DESIGN_PRODUCT_OPTS} placeholder="Select design" showSearch /> */}
                <Input placeholder="Floral Nurse..." allowClear />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Variant</span>}
                name="variant"
                //   rules={[{ required: true, message: 'Variant is required' }]}
              >
                <Select options={VARIANT_OPTS} placeholder="Select variant" showSearch />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Store</span>}
                name="store"
                rules={[{ required: true, message: 'Store is required' }]}
              >
                <Select options={shops} placeholder="Select store" showSearch optionFilterProp="label" allowClear />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Platform</span>}
                name="platform"
                rules={[{ required: true, message: 'Platform is required' }]}
              >
                <Select defaultValue={'Amazon'} options={PLATFORM_OPTS} />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Asin Type</span>}
                name="asin_type"
                rules={[{ required: true, message: 'Asin is required' }]}
              >
                <Select options={ASIN_TYPE_OPTS} />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>
      {loading && <Spin fullscreen tip="Processing..." />}
    </>
  );
}
