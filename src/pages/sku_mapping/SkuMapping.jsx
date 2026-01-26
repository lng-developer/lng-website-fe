// file: src/pages/SkuMapping/SkuMapping.jsx
import { useOutletContext } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Input, Select, Tag, Space, Typography, Spin, Row, Col, Button, Modal, Switch, Tooltip, Pagination } from 'antd'; // Thêm Button, Modal, Switch
import { CalendarOutlined } from '@ant-design/icons';
import { MdDeleteOutline, MdOutlineRemoveRedEye, MdAdd } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import { toast } from 'sonner';
import {
  getSkuMappingConfig,
  createSkuMappingConfig,
  updateSkuMappingConfig,
  deleteSkuMappingConfig,
  applySkuMappingConfig,
} from '../../apis/skuMapping';

import ModalViewMapping from './ModalViewMapping';
import ModalCreateUpdateMapping from './ModalCreateUpdateMapping';
import ModalDeleteConfirm from './ModalDeleteConfirm';

import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import ModalConfigMapping from './ModalConfigMapping';

const { Title, Text } = Typography;
const { Option } = Select;

const SkuMapping = () => {
  const { collapsed } = useOutletContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // --- STATE MỚI CHO CRUD ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // Dùng cho View, Update, Delete

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.log(error);
      return 'Invalid Date';
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSkuMappingConfig();
      setData(res.data || []);
    } catch (error) {
      console.error('Failed to fetch SKU mapping:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // const filteredData = useMemo(() => {
  //   return data.filter((item) => {
  //     const matchSearch =
  //       item.name.toLowerCase().includes(searchText.toLowerCase()) ||
  //       (item.description || '').toLowerCase().includes(searchText.toLowerCase());
  //     const matchStatus =
  //       statusFilter === 'all' || (statusFilter === 'active' && item.is_active) || (statusFilter === 'inactive' && !item.is_active);
  //     return matchSearch && matchStatus;
  //   });
  // }, [data, searchText, statusFilter]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchText.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || (statusFilter === 'active' && item.is_active) || (statusFilter === 'inactive' && !item.is_active);
      return matchSearch && matchStatus;
    });
  }, [data, searchText, statusFilter]);

  // 3. THÊM useMemo mới để "cắt" dữ liệu
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, PAGE_SIZE]);

  // --- CÁC HÀM XỬ LÝ CRUD ---

  const handleOpenModal = (modalType, record = null) => {
    setSelectedRecord(record); // Nếu 'record' là null, đó là "Create"
    if (modalType === 'view') setIsViewModalOpen(true);
    if (modalType === 'edit') setIsEditModalOpen(true);
    if (modalType === 'config') setIsConfigModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsConfigModalOpen(false);
    setSelectedRecord(null);
  };

  // Xử lý "Create" hoặc "Update"
  const handleFormSubmit = async (payload) => {
    setFormLoading(true);
    try {
      if (selectedRecord?._id) {
        // --- Update ---
        await updateSkuMappingConfig(selectedRecord._id, payload);
        toast.success('Rule updated successfully');
      } else {
        // --- Create ---
        await createSkuMappingConfig(payload);
        toast.success('Rule created successfully');
      }
      fetchData();
      handleCloseModals();
    } catch (error) {
      console.error('Failed to submit form:', error);
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setFormLoading(false);
    }
  };
  const handleApplyConfig = async (payload) => {
    setFormLoading(true);
    try {
      await applySkuMappingConfig(payload);
      toast.success(payload?.dryRun ? 'Dry run applied successfully' : 'Config applied successfully');
      handleCloseModals();
    } catch (error) {
      console.error('Failed to apply config:', error);
      toast.error(error.response?.data?.message || 'Apply config failed');
    } finally {
      setFormLoading(false);
    }
  };

  // Xử lý "Delete"
  const handleDelete = async () => {
    if (!selectedRecord) return;

    setIsDeleting(true);
    try {
      await deleteSkuMappingConfig(selectedRecord._id);
      toast.success('Rule deleted successfully');
      fetchData();
      handleCloseModals();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý bật/tắt "Active"
  // const handleToggleActive = async (record) => {
  //   // Cập nhật UI ngay lập tức (Optimistic Update)
  //   setData(prevData =>
  //     prevData.map(item =>
  //       item._id === record._id ? { ...item, is_active: !item.is_active } : item
  //     )
  //   );
  //   try {
  //     await toggleSkuMappingActive(record._id);
  //     toast.success('Status updated');
  //     // Không cần fetchData() vì đã cập nhật UI
  //   } catch (error) {
  //     toast.error('Failed to update status, reverting...');
  //     // Rollback nếu API lỗi
  //     setData(prevData =>
  //       prevData.map(item =>
  //         item._id === record._id ? { ...item, is_active: !item.is_active } : item
  //       )
  //     );
  //   }
  // };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Rule Name</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <span className="font-medium">{name}</span>
          <br />
          <Text type="secondary">{record.description}</Text>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Map Type</span>,
      key: 'mapType',
      width: 150,
      render: (_, record) => {
        const exactCount = Object.keys(record.exactMap || {}).length;
        const productCount = Object.keys(record.productMap || {}).length;
        const employeeCount = Object.keys(record.employeeMap || {}).length;

        if (exactCount > 0) {
          return <StatusComponent key="exact" title="Exact" color={dataColors.asin} />;
        }
        if (productCount > 0) {
          return <StatusComponent key="product" title="Product" color={dataColors.success} />;
        }
        if (employeeCount > 0) {
          return <StatusComponent key="employee" title="Employee" color={dataColors.process} />;
        }
        return 'N/A';
      },
    },
    {
      title: <span style={{ color: dataColors.title }}>Count</span>,
      key: 'count',
      align: 'center',
      width: 100,
      render: (_, record) => {
        const total =
          Object.keys(record.exactMap || {}).length +
          Object.keys(record.productMap || {}).length +
          Object.keys(record.employeeMap || {}).length;
        return <span className="font-medium">{total}</span>;
      },
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'is_active',
      key: 'status',
      align: 'center',
      width: 120,
      // SỬA: Dùng Switch (Request 5)
      render: (isActive) => (
        <div className="font-medium">
          {isActive ? (
            <Switch checkedChildren="" unCheckedChildren="" defaultChecked disabled />
          ) : (
            <Switch checkedChildren="" unCheckedChildren="" defaultChecked={false} disabled />
          )}
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Created Date</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => (
        <Space className="font-medium">
          <CalendarOutlined />
          {formatDate(date)}
        </Space>
      ),
    },
    // --- THÊM CỘT MỚI (Request 3 & 4) ---
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      align: 'center',
      width: 150,
      fixed: 'right', // Cố định cột
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => handleOpenModal('view', record)}
            >
              <MdOutlineRemoveRedEye size={20} />
            </button>
          </Tooltip>
          <Tooltip title="Update">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => handleOpenModal('edit', record)}
            >
              <BiSolidEdit size={20} />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setSelectedRecord(record);
                setIsDeleteModalOpen(true);
              }}
            >
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            SKU Mapping
          </h1>
          <div className="flex justify-center items-center gap-3  ">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => handleOpenModal('config', null)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Config
              </span>
            </button>
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => handleOpenModal('edit', null)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add New Rule
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center ">
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
          <Pagination
            size="large"
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredData.length}
            onChange={handlePageChange}
            hideOnSinglePage
            showTotal={(total) => `Total ${total} items`}
          />
        </div>
        <Spin spinning={loading}>
          <Table className="no-indent-table mt-4" columns={columns} dataSource={paginatedData} rowKey="_id" bordered pagination={false} />
        </Spin>
      </div>

      <ModalViewMapping open={isViewModalOpen} onCancel={handleCloseModals} record={selectedRecord} />
      <ModalCreateUpdateMapping
        open={isEditModalOpen}
        onCancel={handleCloseModals}
        onOk={handleFormSubmit}
        loading={formLoading}
        initialData={selectedRecord}
      />
      <ModalConfigMapping
        open={isConfigModalOpen}
        onCancel={handleCloseModals}
        onOk={handleApplyConfig}
        loading={formLoading}
        initialData={selectedRecord}
        configs={data}
      />

      <ModalDeleteConfirm
        open={isDeleteModalOpen}
        onCancel={handleCloseModals}
        onOk={handleDelete}
        loading={isDeleting}
        record={selectedRecord}
      />
    </div>
  );
};

export default SkuMapping;
