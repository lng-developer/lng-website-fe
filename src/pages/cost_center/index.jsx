import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Flex, Input, Tooltip, Table, Modal, Select, Pagination } from 'antd';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { MdDeleteOutline, MdOutlineRemoveRedEye } from 'react-icons/md';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import ModalView from './ModalView';
import { formatDate } from '../../utils/fomatDate';
import { deleteProductType, deleteProductTypeItem, getAllConfig, reorderProductTypeItems, updateProductType } from '../../apis/config';
import ModalAddProductType from './ModalAddProductType';
import ModalDelete from '../../components/ModalDelete';
import { getALlVendorProduct } from '../../apis/vendor';
import { toast } from 'sonner';

// DnD Kit
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator } from 'react-icons/md';

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

  // DnD UI states
  const [activeRow, setActiveRow] = useState(null);
  const [overId, setOverId] = useState(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Drag handle + sortable row context
  const DragHandleContext = React.createContext(null);

  const DragHandle = () => {
    const ctx = useContext(DragHandleContext);
    if (!ctx) return null;

    const { setActivatorNodeRef, listeners, attributes } = ctx;

    return (
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          cursor: 'grab',
          color: '#64748b',
          borderRadius: 6,
        }}
        title="Drag to reorder"
      >
        <MdDragIndicator size={18} />
      </span>
    );
  };

  const SortableBodyRow = (props) => {
    const { children, ...restProps } = props;
    const rowKey = restProps['data-row-key'];

    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
      id: rowKey,
      transition: {
        duration: 220,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    });

    const style = {
      ...restProps.style,
      transform: CSS.Transform.toString(transform),
      transition,
      ...(isDragging ? { opacity: 0.35 } : null),
    };

    return (
      <DragHandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
        <tr ref={setNodeRef} style={style} {...restProps} className={`${restProps.className || ''} dnd-row`}>
          {children}
        </tr>
      </DragHandleContext.Provider>
    );
  };

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
      if (expandedRowKeys) setExpandedRowKeys([...expandedRowKeys, record.key]);
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
      if (expandedRowKeys2) setExpandedRowKeys2([...expandedRowKeys2, record.key]);
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

  // Reorder Level 2: update UI + call API
  const handleDragEndLevel2 = async ({ active, over }, parentIndex) => {
    if (!over || active.id === over.id) return;

    const parent = dataSource[parentIndex];
    const currentItems = parent?.items || [];

    const oldIndex = currentItems.findIndex((x) => x.key === active.id);
    const newIndex = currentItems.findIndex((x) => x.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Build new array with updated "order"
    const moved = arrayMove(currentItems, oldIndex, newIndex).map((it, idx) => ({
      ...it,
      order: idx + 1,
    }));

    // Payload to backend: { orders: [{ itemId, order }, ...] }
    const ordersPayload = moved.map((it, idx) => ({
      itemId: it?._id || it?.id || it?.key,
      order: idx + 1,
    }));

    const groupId = parent?._id || parent?.id || parent?.key;

    // Update UI immediately
    setDataSource((prev) => {
      const next = [...prev];
      if (!next[parentIndex]?.items) return prev;
      next[parentIndex] = { ...next[parentIndex], items: moved };
      return next;
    });

    // Call API
    try {
      const res = await reorderProductTypeItems(groupId, { orders: ordersPayload });
      if (res.status === 200) {
        toast.success('Reorder success!');
      }
    } catch (err) {
      console.log(err);
      toast.error('Reorder error!');
      fetchAllConfig(filters);
    }
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
            key: k._id || k.id,
            items: k?.items?.map((j) => {
              return {
                ...j,
                key: j._id || j.id,
                payload: {
                  productTypeId: k._id || k.id,
                  cost_centers: j.cost_centers,
                  _id: j._id || j.id,
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
      {/* CSS for DnD visuals */}
      <style>
        {`
          .product-type tr.dnd-over td {
            border-top: 2px solid #3b82f6 !important;
          }
          .dnd-overlay {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.12);
          }
        `}
      </style>

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
              expandedRowRender: (r, index) => {
                const level2Data = dataSource[index]?.items || [];
                const level2Ids = level2Data.map((i) => i.key);

                return (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => {
                      const row = (dataSource[index]?.items || []).find((x) => x.key === active.id);
                      setActiveRow(row || null);
                    }}
                    onDragOver={({ over }) => {
                      setOverId(over?.id || null);
                    }}
                    onDragEnd={(evt) => {
                      setActiveRow(null);
                      setOverId(null);
                      handleDragEndLevel2(evt, index);
                    }}
                    onDragCancel={() => {
                      setActiveRow(null);
                      setOverId(null);
                    }}
                  >
                    <SortableContext items={level2Ids} strategy={verticalListSortingStrategy}>
                      <Table
                        className="no-indent-table product-type"
                        columns={columnsLevel2}
                        dataSource={level2Data}
                        pagination={false}
                        onRow={(record) => ({
                          className: record.key === overId ? 'dnd-over' : '',
                        })}
                        components={{
                          body: {
                            row: SortableBodyRow,
                          },
                        }}
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

                          // Drag icon tách riêng khỏi expand icon
                          expandIcon: ({ expanded, onExpand, record }) => (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                width: '100%',
                              }}
                            >
                              <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                                <DragHandle />
                              </div>

                              <div
                                style={{ width: 24, display: 'flex', justifyContent: 'center' }}
                                className="cursor-pointer"
                                onClick={(e) => onExpand(record, e)}
                                title="Expand"
                              >
                                {!expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                              </div>
                            </div>
                          ),

                          expandedRowKeys: expandedRowKeys2,
                          onExpand: handleExpand2,
                          columnTitle: (
                            <div
                              className="flex justify-center items-center h-full w-full cursor-pointer"
                              onClick={() => handleShowRowKeys2(index)}
                            >
                              <IoIosArrowDown style={{ fontSize: 15 }} />
                            </div>
                          ),
                        }}
                        rowKey="key"
                        style={{ padding: 10 }}
                      />
                    </SortableContext>

                    <DragOverlay>
                      {activeRow ? (
                        <div className="dnd-overlay" style={{ padding: 12, minWidth: 520 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MdDragIndicator size={18} style={{ color: '#64748b' }} />
                            <div style={{ fontWeight: 600 }}>{activeRow.vendor_name}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Product ID: {activeRow.product_id}</div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                );
              },

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
