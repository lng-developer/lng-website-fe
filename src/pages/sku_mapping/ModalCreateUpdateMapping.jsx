import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, InputNumber, Space, Tooltip, Checkbox, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, ArrowRightOutlined } from '@ant-design/icons';
// import { toast } from 'sonner';

const { Option } = Select;
const { TextArea } = Input;

// Hàm helper để tìm ra map type từ data (nếu ở chế độ "Update")
const getMapType = (record) => {
  if (record?.exactMap && Object.keys(record.exactMap).length > 0) return 'exactMap';
  if (record?.productMap && Object.keys(record.productMap).length > 0) return 'productMap';
  if (record?.employeeMap && Object.keys(record.employeeMap).length > 0) return 'employeeMap';
  return 'exactMap'; // Mặc định là 'exactMap' khi tạo mới
};

// Hàm helper để format data cho Form.List
const formatMapToList = (record) => {
  const mapType = getMapType(record);
  const mapData = record?.[mapType] || {};
  return Object.entries(mapData).map(([from, to]) => ({ from, to }));
};

const ModalCreateUpdateMapping = ({ open, onCancel, onOk, loading, initialData }) => {
  const [form] = Form.useForm();
  const isUpdateMode = !!initialData; // Kiểm tra xem đây là "Update" hay "Create"

  useEffect(() => {
    if (open && isUpdateMode) {
      // Chế độ "Update": Điền dữ liệu
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        mapType: getMapType(initialData),
        mappings: formatMapToList(initialData),
      });
    } else if (open && !isUpdateMode) {
      // Chế độ "Create": Đặt giá trị mặc định
      form.setFieldsValue({
        mapType: 'exactMap',
        priority: 10,
        options: {
          upperProduct: false,
          dateOptional: false,
          useToday: false,
          minSeqDigits: 2,
        },
        mappings: [],
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, initialData, form, isUpdateMode]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Chuyển đổi Form.List (mảng) về dạng object (map)
      const mapData = (values.mappings || []).reduce((acc, curr) => {
        if (curr.from && curr.to) {
          acc[curr.from] = curr.to;
        }
        return acc;
      }, {});

      // Tạo payload cuối cùng
      const payload = {
        name: values.name,
        description: values.description,
        priority: values.priority,
        options: values.options,
        exactMap: values.mapType === 'exactMap' ? mapData : {},
        productMap: values.mapType === 'productMap' ? mapData : {},
        employeeMap: values.mapType === 'employeeMap' ? mapData : {},
      };

      onOk(payload); // Gửi payload về component cha
    } catch (info) {
      console.log('Validate Failed:', info);
    }
  };

  return (
    <Modal
      title={isUpdateMode ? 'Update SKU Mapping Rule' : 'Create SKU Mapping Rule'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText={isUpdateMode ? 'Update' : 'Create'}
      width={400} // Cần modal rộng
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="sku_mapping_form">
        <Row gutter={20} className='p-2'>
          <Col span={24}>
            <Form.Item name="name" label={<span className='font-medium'>Rule Name</span>} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={20} className='p-2'>
          <Col span={24}>
            <Form.Item name="description" label={<span className='font-medium'>Description</span>}>
              <TextArea rows={1} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} className='p-2'>
          <Col span={24}>
            <Form.Item name="mapType" label={<span className='font-medium'>Map Type</span>} rules={[{ required: true }]}>
              <Select
              // disabled={isUpdateMode}
              >
                <Option value="exactMap" ><span className='font-medium'>Exact Map</span></Option>
                <Option value="productMap"><span className='font-medium'>Product Map</span></Option>
                <Option value="employeeMap"><span className='font-medium'>Employee Map</span></Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.List name="mappings">
          {(fields, { add, remove }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <Row gutter={16} className='p-2 font-medium'>
                <Col span={12}>
                  <span>Mappings</span>
                </Col>
                <Col span={12}>
                  <Form.Item>
                    <Button  type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                     <span className='font-medium'> Add Mapping</span>
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
              {fields.map(({ key, name, ...restField }) => (
                <Space className='p-2' key={key} align="baseline" style={{ display: 'flex' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'from']}
                    rules={[{ required: true, message: 'From is required' }]}
                    style={{ flex: 1 }}
                  >
                    <Input placeholder="From" />
                  </Form.Item>
                  <ArrowRightOutlined />
                  <Form.Item {...restField} name={[name, 'to']} rules={[{ required: true, message: 'To is required' }]} style={{ flex: 1 }}>
                    <Input placeholder="To" />
                  </Form.Item>
                  <DeleteOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                </Space>
              ))}
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default ModalCreateUpdateMapping;
