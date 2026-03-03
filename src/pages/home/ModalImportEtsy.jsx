import { Modal, Select, Upload, Spin } from 'antd';
import { CloudUploadOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getALlShop } from '../../apis/order';
import { importEtsyOrders } from '../../apis/etsy';
import { toast } from 'sonner';

const { Dragger } = Upload;

const ModalImportEtsy = ({ isModalOpen, setIsModalOpen, onImportSuccess }) => {
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [soldOrdersFile, setSoldOrdersFile] = useState(null);    // EtsySoldOrders CSV
  const [soldOrderItemsFile, setSoldOrderItemsFile] = useState(null); // EtsySoldOrderItems CSV
  const [loading, setLoading] = useState(false);

  // Validation errors
  const [errorShop, setErrorShop] = useState('');
  const [errorFile1, setErrorFile1] = useState('');
  const [errorFile2, setErrorFile2] = useState('');

  const resetState = () => {
    setShopId('');
    setSoldOrdersFile(null);
    setSoldOrderItemsFile(null);
    setErrorShop('');
    setErrorFile1('');
    setErrorFile2('');
  };

  const handleCancel = () => {
    resetState();
    setIsModalOpen(false);
  };

  // Fetch danh sách shop khi mở modal
  const fetchShops = async () => {
    if (!isModalOpen) return;
    try {
      const result = await getALlShop({ merchant: 'etsy' });
      if (result.status === 200) {
        const formatted = result.data.map((item) => ({
          value: item._id,
          label: item.name,
        }));
        setShops(formatted);
      }
    } catch (error) {
      console.error(error);
      toast.error('Cannot load shop list');
    }
  };

  useEffect(() => {
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // Validate file chỉ cho phép CSV
  const validateCsvFile = (file) => {
    const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
    if (!isCsv) {
      toast.error(`"${file.name}" is not a CSV file`);
      return false;
    }
    return true;
  };

  // Handler cho file 1: EtsySoldOrders
  const beforeUploadFile1 = (file) => {
    if (!validateCsvFile(file)) return Upload.LIST_IGNORE;
    if (!file.name.includes('EtsySoldOrders')) {
      toast.error('File name must contain "EtsySoldOrders" (e.g. EtsySoldOrders2026.csv)');
      setErrorFile1('File name must contain "EtsySoldOrders"');
      return Upload.LIST_IGNORE;
    }
    setSoldOrdersFile(file);
    setErrorFile1('');
    return false;
  };

  // Handler cho file 2: EtsySoldOrderItems
  const beforeUploadFile2 = (file) => {
    if (!validateCsvFile(file)) return Upload.LIST_IGNORE;
    if (!file.name.includes('EtsySoldOrderItems')) {
      toast.error('File name must contain "EtsySoldOrderItems" (e.g. EtsySoldOrderItems2026.csv)');
      setErrorFile2('File name must contain "EtsySoldOrderItems"');
      return Upload.LIST_IGNORE;
    }
    setSoldOrderItemsFile(file);
    setErrorFile2('');
    return false;
  };

  const handleOk = async () => {
    // Validate
    let hasError = false;
    if (!shopId) {
      setErrorShop('Please select a shop');
      hasError = true;
    }
    if (!soldOrdersFile) {
      setErrorFile1('Please upload EtsySoldOrders CSV file');
      hasError = true;
    }
    if (!soldOrderItemsFile) {
      setErrorFile2('Please upload EtsySoldOrderItems CSV file');
      hasError = true;
    }
    if (hasError) return;

    // Build FormData theo đúng format API:
    // files[0] = EtsySoldOrders2026-x.csv
    // files[1] = EtsySoldOrderItems2026-x.csv
    // shopId   = <id>
    const formData = new FormData();
    formData.append('files', soldOrdersFile);
    formData.append('files', soldOrderItemsFile);
    formData.append('shopId', shopId);

    setLoading(true);
    try {
      const response = await importEtsyOrders(formData);
      if (response.status === 200 || response.status === 201) {
        toast.success('Import Etsy orders successfully!');
        resetState();
        setIsModalOpen(false);
        if (typeof onImportSuccess === 'function') onImportSuccess();
      } else {
        toast.error(response.data?.message || 'Import failed. Please try again.');
      }
    } catch (error) {
      console.error(error);
      const serverMessage = error?.response?.data?.message;
      // toast.error(serverMessage || 'System error during import!');
    } finally {
      setLoading(false);
    }
  };

  // Render file tag đã chọn
  const FileTag = ({ file, onRemove }) => {
    if (!file) return null;
    return (
      <div
        className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md border"
        style={{ borderColor: '#91caff', background: '#e6f4ff', fontSize: 12 }}
      >
        <FileTextOutlined style={{ color: '#1677ff', fontSize: 14 }} />
        <span className="flex-1 truncate" style={{ color: '#0958d9', maxWidth: 260 }}>
          {file.name}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer"
          style={{ color: '#ff4d4f', lineHeight: 1 }}
        >
          <DeleteOutlined />
        </button>
      </div>
    );
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          Import Etsy Orders
        </span>
      }
      okText={loading ? 'Importing...' : 'Import'}
      cancelText="Cancel"
      closable={{ 'aria-label': 'Close' }}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      width={480}
      okButtonProps={{ loading, disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      maskClosable={!loading}
      destroyOnClose
    >
      <Spin spinning={loading} tip="Importing, please wait...">
        <div className="py-2 flex flex-col gap-4">

          {/* ===== Shop selector ===== */}
          <div>
            <div className="mb-1">
              <span className="font-medium text-sm">
                Store <span style={{ color: '#ff4d4f' }}>*</span>
              </span>
            </div>
            <Select
              showSearch
              placeholder="Select Etsy Shop"
              style={{ width: '100%' }}
              optionFilterProp="label"
              value={shopId || undefined}
              onChange={(value) => {
                setShopId(value);
                setErrorShop('');
              }}
              options={shops}
              filterSort={(a, b) =>
                (a?.label ?? '').toLowerCase().localeCompare((b?.label ?? '').toLowerCase())
              }
            />
            {errorShop && (
              <span className="text-xs mt-1 block" style={{ color: '#ff4d4f' }}>
                {errorShop}
              </span>
            )}
          </div>

          {/* ===== File 1: EtsySoldOrders ===== */}
          <div>
            <div className="mb-1">
              <span className="font-medium text-sm">
                EtsySoldOrders CSV <span style={{ color: '#ff4d4f' }}>*</span>
              </span>
              <span className="text-xs ml-2" style={{ color: '#8c8c8c' }}>
                (e.g. EtsySoldOrders2026.csv)
              </span>
            </div>
            {soldOrdersFile ? (
              <FileTag file={soldOrdersFile} onRemove={() => setSoldOrdersFile(null)} />
            ) : (
              <Dragger
                beforeUpload={beforeUploadFile1}
                fileList={[]}
                accept=".csv"
                maxCount={1}
                showUploadList={false}
                style={{ padding: '8px 0' }}
                disabled={loading}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
                  <CloudUploadOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 13 }}>
                  Click or drag <strong>EtsySoldOrders</strong> CSV here
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 11 }}>
                  Only .csv files are accepted
                </p>
              </Dragger>
            )}
            {errorFile1 && (
              <span className="text-xs mt-1 block" style={{ color: '#ff4d4f' }}>
                {errorFile1}
              </span>
            )}
          </div>

          {/* ===== File 2: EtsySoldOrderItems ===== */}
          <div>
            <div className="mb-1">
              <span className="font-medium text-sm">
                EtsySoldOrderItems CSV <span style={{ color: '#ff4d4f' }}>*</span>
              </span>
              <span className="text-xs ml-2" style={{ color: '#8c8c8c' }}>
                (e.g. EtsySoldOrderItems2026.csv)
              </span>
            </div>
            {soldOrderItemsFile ? (
              <FileTag file={soldOrderItemsFile} onRemove={() => setSoldOrderItemsFile(null)} />
            ) : (
              <Dragger
                beforeUpload={beforeUploadFile2}
                fileList={[]}
                accept=".csv"
                maxCount={1}
                showUploadList={false}
                style={{ padding: '8px 0' }}
                disabled={loading}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
                  <CloudUploadOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 13 }}>
                  Click or drag <strong>EtsySoldOrderItems</strong> CSV here
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 11 }}>
                  Only .csv files are accepted
                </p>
              </Dragger>
            )}
            {errorFile2 && (
              <span className="text-xs mt-1 block" style={{ color: '#ff4d4f' }}>
                {errorFile2}
              </span>
            )}
          </div>

          {/* ===== Ghi chú ===== */}
          <div
            className="text-xs px-3 py-2 rounded-md"
            style={{ background: '#fffbe6', border: '1px solid #ffe58f', color: '#7c5700' }}
          >
            ⚠️ Please upload <strong>both</strong> CSV files exported from Etsy (Sold Orders &amp; Sold Order Items) and select the correct shop before importing.
          </div>

        </div>
      </Spin>
    </Modal>
  );
};

export default ModalImportEtsy;
