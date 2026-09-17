import { Button, Flex, Modal, Select, Spin, Upload } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { dataColors } from '../../utils/dataColors';
import { importVendorProduct } from '../../apis/vendor';
import { toast } from 'sonner';
const { Dragger } = Upload;

const ModalImportVendor = ({ isModalOpen, setIsModalOpen, fetchAllProductCostCenter, filters, vendors }) => {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkErrorUpload, setCheckErrorUpload] = useState(false);
  const [selectVendor, setSelectVendor] = useState('');

  const handleCancel = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleOk = async () => {
    const fileFormat = fileList?.[0];
    if (!fileFormat) {
      setCheckErrorUpload(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileFormat);
    formData.append('vendor_id', selectVendor);
    try {
      setLoading(true); // 👉 Hiện màn chờ
      const response = await importVendorProduct(formData);
      if (response.status === 201) {
        toast.success('Import success');
        fetchAllProductCostCenter(filters);
      } else {
        toast.error('Import error');
      }
    } catch (error) {
      console.log(error);
      toast.error('Import error');
    } finally {
      setLoading(false); // 👉 Tắt màn chờ
      handleCancel();
    }
  };

  const beforeUpload = (file) => {
    setFileList([file]);
    setCheckErrorUpload(false);
    return false;
  };

  const downloadTemplate = () => {
    const headers = [
      'product_id', 'product_name', 'image', 'product_type_design', 'product_status',
      'sku', 'vendor_size', 'vendor_color', 'standard_size', 'standard_color', 'variant_status',
      'base_cost', 'domestic_economy', 'domestic_additional', 'international_economy', 'international_additional',
      'priority_economy', 'priority_additional', 'embroidery_cost', 'two_sided_print_cost',
      'two_position_print_cost', 'printing_method',
    ];
    const worksheet = XLSX.utils.json_to_sheet([
      { product_id: 'G5000', product_name: 'Gildan 5000', image: 'https://example.com/g5000.jpg', product_type_design: 'T-shirt', product_status: 'Active', sku: 'G5000-BLK-S', vendor_size: 'S', vendor_color: 'Black', standard_size: 'S', standard_color: 'Black', variant_status: 'Active', base_cost: 5.5, domestic_economy: 4, domestic_additional: 1, international_economy: 8, international_additional: 2, printing_method: 'DTG' },
      { product_id: 'G5000', product_name: 'Gildan 5000', image: 'https://example.com/g5000.jpg', product_type_design: 'T-shirt', product_status: 'Active', sku: 'G5000-BLK-M', vendor_size: 'M', vendor_color: 'Black', standard_size: 'M', standard_color: 'Black', variant_status: 'Active', base_cost: 5.5, domestic_economy: 4, domestic_additional: 1, international_economy: 8, international_additional: 2, printing_method: 'DTG' },
    ], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products & Variants');
    XLSX.writeFile(workbook, 'vendor-products-variants-template.xlsx');
  };

  return (
    <Modal
      title="Import Products & Variants"
      okText="Import"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      width={450}
      onCancel={handleCancel}
    >
      <Flex vertical={true} gap={10} className="py-2">
        <div>
          <div>
            <span className="font-medium">Vendor</span>
          </div>
          <Select
            showSearch
            placeholder="Select vendor"
            optionFilterProp="label"
            onChange={(value) => setSelectVendor(value)}
            options={vendors}
            className="w-full"
          />
        </div>
        <div>
          <span className="font-medium">Each row is one variant. Required product columns: product_id, product_name.</span>
        </div>
        <Button onClick={downloadTemplate}>Download template</Button>
        <div>
          <Dragger
            beforeUpload={beforeUpload}
            fileList={fileList}
            onRemove={() => setFileList([])}
            accept=".xlsx,.xls"
            maxCount={1}
            style={{ padding: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">Click to upload or drag and drop .xlsx file</p>
          </Dragger>
        </div>
        {checkErrorUpload && (
          <div>
            <span className="text-[#ff0000]">Please upload file</span>
          </div>
        )}
        <div style={{ color: dataColors.process }}>
          <span>Variant columns are optional. When supplied, only sku is required; leave size/color blank for one-size products. Supported pricing columns: base_cost, domestic_economy, domestic_additional, international_economy, international_additional.</span>
        </div>
      </Flex>
      {loading && <Spin tip="Đang xử lý..." size="large" style={{ color: 'white' }} fullscreen={true} />}
    </Modal>
  );
};

export default ModalImportVendor;
