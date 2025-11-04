import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Flex, Input, Tooltip, Table, Modal, Select, Pagination } from 'antd';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { MdDeleteOutline, MdOutlineRemoveRedEye } from 'react-icons/md';
import { useCallback, useEffect, useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import ModalView from './ModalView';
import { formatDate } from '../../utils/fomatDate';
import { deleteProductType, deleteProductTypeItem, getAllConfig, updateProductType } from '../../apis/config';
import ModalAddProductType from './ModalAddProductType';
import ModalDelete from '../../components/ModalDelete';
import { getALlVendorProduct } from '../../apis/vendor';
import { toast } from 'sonner';
const PAGE_SIZE = 10;

const CostCenterProductTypes = () => {
  const { collapsed } = useOutletContext();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [expandedRowKeys2, setExpandedRowKeys2] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [isShowRowkeys2, setIsShowRowKeys2] = useState(true);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [dataView, setDataView] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [dataFilter, setDataFilter] = useState([]);
  const [dataViewFilter, setDataViewFilter] = useState([]);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [isShowModalDelete, setIsShowModalDelete] = useState(false);
  const [idDelete, setIdDelete] = useState('');
  const [isShowModalDeleteItem, setIsShowModalDeleteItem] = useState(false);
  const [idDeleteItem, setIdDeleteItem] = useState('');
  const [vendorProducts, setVendorProducts] = useState([]);
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  const [idSelectVendor, setIdSelectVendor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    search: '',
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

  const handlePageChange = (page, pageSize) => {
    updateFilter({ page: page, perPage: pageSize });
    setCurrentPage(page);
  };

  const handleExpand = (expanded, record) => {
    if (expanded) {
      if (expandedRowKeys) {
        setExpandedRowKeys([...expandedRowKeys, record.key]);
      }
    } else {
      setExpandedRowKeys(expandedRowKeys?.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys = () => {
    if (isShowRowkeys) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(dataSource.map((item) => item.key));
    }
    setIsShowRowKeys((prev) => !prev);
  };

  const handleExpand2 = (expanded, record) => {
    if (expanded) {
      if (expandedRowKeys2) {
        setExpandedRowKeys2([...expandedRowKeys2, record.key]);
      }
    } else {
      setExpandedRowKeys2(expandedRowKeys2?.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys2 = (index) => {
    if (isShowRowkeys2) {
      setExpandedRowKeys2([]);
    } else {
      setExpandedRowKeys2(dataSource[index]?.items?.map((item) => item.key));
    }
    setIsShowRowKeys2((prev) => !prev);
  };

  const columnLevel1 = [
    {
      title: <span style={{ color: dataColors.title }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Date</span>,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => <span className="font-medium text-md">{formatDate(text)}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: '_id',
      key: 'actions',
      align: 'center',
      render: (record) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="Create">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setIdDelete(record);
                setIsShowModalUpdate(true);
              }}
            >
              <MdAdd size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Delete">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setIdDelete(record);
                setIsShowModalDelete(true);
              }}
            >
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      ),
    },
  ];

  const columnsLevel2 = [
    {
      title: <span style={{ color: dataColors.title }}>No</span>,
      dataIndex: 'order',
      key: 'order',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Vendor</span>,
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      align: 'center',
      render: (text) => <span className="font-medium text-md">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Product ID</span>,
      dataIndex: 'product_id',
      key: 'product_id',
      align: 'center',
      render: (text) => <span className="font-medium text-md">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Is Variant</span>,
      dataIndex: 'is_variant',
      key: 'is_variant',
      align: 'center',
      render: (text) => <span className="font-medium text-md">{text === true ? 'TRUE' : 'FALSE'}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (text) => <StatusComponent title={text} color={dataColors.success} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: 'payload',
      key: 'actions',
      align: 'center',
      render: (record) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="View">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                const result = record?.cost_centers?.map((item, index) => ({ ...item, stt: index + 1 }));
                setDataView(result);
                setDataViewFilter(result);
                setIsOpenModal(true);
              }}
            >
              <MdOutlineRemoveRedEye size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Edit">
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
              <MdAdd size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Delete">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setIdDelete(record?.productTypeId);
                setIdDeleteItem(record?._id);
                setIsShowModalDeleteItem(true);
              }}
            >
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      ),
    },
  ];

  // Columns cho bảng con (SKU)
  const skuColumns = [
    {
      title: <span style={{ color: dataColors.title }}>SKU</span>,
      dataIndex: 'sku',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Size</span>,
      dataIndex: 'vendor_size',
      width: 200,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Color</span>,
      dataIndex: 'vendor_color',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Size</span>,
      dataIndex: 'standard_size',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Color</span>,
      dataIndex: 'standard_color',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      width: 80,
      align: 'center',
      render: () => (
        <Tooltip placement="top" title="Delete">
          <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
            <MdDeleteOutline size={20} />
          </button>
        </Tooltip>
      ),
    },
  ];

  const fetchAllConfig = useCallback(async (params) => {
    setLoading(true);
    try {
      const response = await getAllConfig(params);
      if (response.status === 200) {
        const result = response.data?.items?.map((k) => {
          return {
            ...k,
            key: k._id,
            items: k?.items?.map((j) => {
              return {
                ...j,
                key: j._id,
                payload: {
                  productTypeId: k._id,
                  cost_centers: j.cost_centers,
                  _id: j._id,
                },
              };
            }),
          };
        });
        setDataSource(result);
        setDataFilter(result);
        setTotalCount(response.data?.total);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (value) => {
    if (!value) {
      setDataSource(dataFilter);
      return;
    }
    const results = dataFilter.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));
    setDataSource(results);
  };

  const handleDeleteProductType = async () => {
    try {
      const response = await deleteProductType(idDelete);
      if (response.status === 200) {
        toast.success('Delete success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Delete error!');
    } finally {
      fetchAllConfig(filters);
      setIsShowModalDelete(false);
    }
  };

  const handleDeleteProductTypeItem = async () => {
    try {
      const response = await deleteProductTypeItem(idDelete, idDeleteItem);
      if (response.status === 200) {
        toast.success('Delete success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Delete error!');
    } finally {
      fetchAllConfig(filters);
      setIsShowModalDeleteItem(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await updateProductType(idDelete, {
        vendor_product: idSelectVendor,
      });
      if (response.status === 201) {
        toast.success('Create product type success');
      }
    } catch (error) {
      console.log(error);
      toast.error('Create error!');
    } finally {
      fetchAllConfig(filters);
      setIsShowModalUpdate(false);
    }
  };

  const fetchAllVendor = async () => {
    try {
      const response = await getALlVendorProduct({
        all: true,
      });
      if (response.status === 200) {
        const result = response.data?.data?.map((item) => {
          return {
            value: item?._id,
            label: `${item?.vendor?.name} - ${item?.product_name}`,
          };
        });
        setVendorProducts(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllVendor();
  }, []);

  useEffect(() => {
    fetchAllConfig(filters);
  }, [filters]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Product Type Groups
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalAdd(true)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Create Product Type
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center">
          <Input
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={10}
              defaultCurrent={1}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table product-type"
            columns={columnLevel1}
            dataSource={dataSource}
            expandable={{
              indentSize: 0,
              expandedRowRender: (r, index) => (
                <Table
                  className="no-indent-table product-type"
                  columns={columnsLevel2}
                  dataSource={dataSource[index]?.items}
                  pagination={false}
                  expandable={{
                    indentSize: 0,
                    expandedRowRender: (r, index2) => (
                      <Table
                        className="no-indent-table product-type"
                        columns={skuColumns}
                        dataSource={dataSource[index]?.items[index2]?.cost_centers}
                        pagination={true}
                        rowKey="key"
                        style={{ padding: 10 }}
                      />
                    ),
                    expandIcon: ({ expanded, onExpand, record }) => (
                      <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                        {!expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                      </div>
                    ),
                    expandedRowKeys: expandedRowKeys2,
                    onExpand: handleExpand2,
                    columnTitle: (
                      <div
                        className="flex justify-center items-center  h-full w-full cursor-pointer"
                        onClick={() => handleShowRowKeys2(index)}
                      >
                        <IoIosArrowDown style={{ fontSize: 15 }} />
                      </div>
                    ),
                  }}
                  rowKey="key"
                  style={{ padding: 10 }}
                />
              ),
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
              expandedRowKeys: expandedRowKeys,
              onExpand: handleExpand,
              columnTitle: (
                <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={handleShowRowKeys}>
                  {isShowRowkeys ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
            }}
            pagination={false}
            rowKey="key"
            loading={loading}
          />
        </div>
      </div>
      <ModalView
        isOpenModal={isOpenModal}
        setIsOpenModal={setIsOpenModal}
        dataSource={dataViewFilter}
        setDataView={setDataView}
        dataView={dataView}
      />
      <ModalAddProductType
        open={openModalAdd}
        onCancel={() => setOpenModalAdd(false)}
        vendorProducts={vendorProducts}
        fetchAllConfig={fetchAllConfig}
      />
      <ModalDelete
        title="Delete Product Type"
        isShowModalDelete={isShowModalDelete}
        setIsShowModalDelete={setIsShowModalDelete}
        handleDelete={handleDeleteProductType}
        text={'product type'}
      />
      <ModalDelete
        title="Delete Vendor Product"
        isShowModalDelete={isShowModalDeleteItem}
        setIsShowModalDelete={setIsShowModalDeleteItem}
        handleDelete={handleDeleteProductTypeItem}
        text={'vendor product'}
      />
      <Modal
        open={isShowModalUpdate}
        title="Add New Vendor Product"
        onCancel={() => setIsShowModalUpdate(false)}
        onOk={handleUpdate}
        okText="Save"
        cancelText="Cancel"
        width={500}
        maskClosable={false}
        style={{ top: '20%' }}
      >
        <div>
          <span className="font-medium">Vendor product:</span>
          <Select
            placeholder="Select Vendor Product"
            options={vendorProducts}
            showSearch
            optionFilterProp="label"
            allowClear
            style={{ width: 450, marginTop: 5 }}
            onChange={(value) => setIdSelectVendor(value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CostCenterProductTypes;
