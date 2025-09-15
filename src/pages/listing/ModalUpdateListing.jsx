// UpdateListingModal.jsx
import { useEffect, useState, useMemo } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, Spin } from 'antd';
import { getALlShop } from '../../apis/order';
import { toast } from 'sonner';
import { updateListing } from '../../apis/listing';
import { getAllSellers } from '../../apis/user';

const STYLE_OPTS = [
  { label: 'T-Shirt', value: 'T-Shirt' },
  { label: 'Hoodie', value: 'Hoodie' },
  { label: 'Sweatshirt', value: 'Sweatshirt' },
  { label: 'Napkins', value: 'Napkins' },
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
  { label: 'PODLovers', value: 'POD Lovers' },
  { label: 'First Sale', value: 'First Sale' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Outline', value: 'Outline' },
  { label: 'Style', value: 'Style' },
  { label: 'Tool', value: 'Tool' },
  { label: 'Custom Image', value: 'Custom Image' },
  { label: 'Auto Fulfill', value: 'Auto Fulfill' },
  { label: 'Other', value: 'Other' },
];

export default function ModalUpdateListing({ open, onClose, fetchAllListing, filters, listing = {}, fetchCountStatus }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState([]);

  const initialValues = useMemo(() => {
    const t = listing?.template || {};
    return {
      asin: (listing?.asin || '').toString().trim().toUpperCase(),
      product_image: listing?.product_image || '',
      platform: listing?.platform || 'Amazon',
      asin_type: listing?.asin_type || 'Normal',
      style: t?.style || undefined,
      design_product: t?.design_product || '',
      variant: t?.variant || undefined,
      store: listing?.store?._id || undefined,
      seller: listing?.seller?._id || undefined,
    };
  }, [listing]);

  const fetchSeller = async () => {
    try {
      const response = await getAllSellers();
      if (response.status === 200) {
        const result = response.data?.map((item) => {
          return {
            label: item?.full_name,
            value: item?._id,
          };
        });
        setSellers(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSeller();
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const response = await getALlShop();
        if (response.status === 200) {
          const result = response.data?.map((item) => ({
            label: item?.name,
            value: item?._id,
          }));
          setShops(result || []);
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const handleSubmit = async (v) => {
    const payload = {
      product_image: v.product_image?.trim(),
      platform: v.platform,
      asin_type: v.asin_type,
      store: v.store,
      seller: v.seller,
      template: {
        style: v.style,
        design_product: v.design_product,
        variant: v.variant,
      },
    };

    if (!listing?._id) {
      toast.error('Missing listing id');
      return;
    }

    setLoading(true);
    try {
      setSubmitting(true);
      const response = await updateListing(listing._id, payload);
      if (response.status === 200) {
        toast.success('Updated listing successfully');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Update failed');
    } finally {
      setSubmitting(false);
      fetchAllListing?.(filters);
      fetchCountStatus();
      onClose?.();
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          onClose?.();
        }}
        title="Edit Listing"
        footer={null}
        width={650}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
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
                <Input placeholder="B0XXXXXXX1" allowClear disabled />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Product Image (URL)</span>}
                name="product_image"
                rules={[{ required: true, message: 'Product Image is required' }]}
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
              <Form.Item label={<span className="font-medium">Design Product</span>} name="design_product">
                <Input placeholder="Floral Nurse..." allowClear />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item label={<span className="font-medium">Variant</span>} name="variant">
                <Select options={VARIANT_OPTS} placeholder="Select variant" showSearch allowClear />
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
                <Select options={PLATFORM_OPTS} />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Asin Type</span>}
                name="asin_type"
                rules={[{ required: true, message: 'Asin Type is required' }]}
              >
                <Select options={ASIN_TYPE_OPTS} />
              </Form.Item>
            </Col>

            <Col span={12} style={{ marginBottom: 10 }}>
              <Form.Item
                label={<span className="font-medium">Seller</span>}
                name="seller"
                rules={[{ required: true, message: 'Seller is required' }]}
              >
                <Select options={sellers} placeholder="Select seller" showSearch optionFilterProp="label" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
      {loading && <Spin fullscreen tip="Processing..." />}
    </>
  );
}
