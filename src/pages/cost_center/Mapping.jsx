import { Flex, Input, Modal, Pagination, Switch, Table, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import { MdDeleteOutline, MdAdd } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import StatusComponent from '../../components/StatusComponent';
import { createMapping, deleteMapping, getAllMapping, updateMapping } from '../../apis/config';
import { toast } from 'sonner';
import ModalAddMapping from './ModalAddMapping';
import { debounce } from 'lodash';
const PAGE_SIZE = 10;

const Mapping = () => {
  const { collapsed } = useOutletContext();
  const [dataSource, setDataSource] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState('add');
  const [editing, setEditing] = useState(null);
  const [idSelect, setIdSelect] = useState(null);
  const [isShowModalDelete, setIsShowModalDelete] = useState(false);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    search: '',
  });

  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      // Nếu newValues có page thì dùng page đó, nếu không thì giữ nguyên page hiện tại
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : prev.page,
    }));
  }, []);

  const handlePageChange = (page, pageSize) => {
    updateFilter({ page: page, perPage: pageSize });
    setCurrentPage(page);
  };

  const openEdit = (row) => {
    setMode('edit');
    setIdSelect(row._id);
    setEditing({
      config_code: row.config_code,
      key: row.key,
      match_type: row.match_type,
      match_value: row.match_value,
      mapped_value: row.mapped_value,
      priority: row.priority ?? 1,
      active: !!row.active,
    });
    setOpenModal(true);
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Config Code</span>,
      dataIndex: 'config_code',
      key: 'config_code',
      align: 'center',
      render: (data) => <span className="font-medium">{data}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Key</span>,
      dataIndex: 'key',
      key: 'key',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.success} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Match Type</span>,
      dataIndex: 'match_type',
      key: 'match_type',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.pending} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Match Value</span>,
      dataIndex: 'match_value',
      key: 'match_value',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.asin} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Mapped Value</span>,
      dataIndex: 'mapped_value',
      key: 'mapped_value',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.cancelled} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Priority</span>,
      dataIndex: 'priority',
      key: 'priority',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.default} isDefault={true} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Active</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (data) => (
        <Switch
          checked={data?.active}
          onClick={(value) => {
            handleChangeActive(data._id, { active: value });
          }}
        />
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Action</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      render: (data) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="Edit">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => openEdit(data)}
            >
              <BiSolidEdit size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Delete">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setIdSelect(data?._id);
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

  const fetchAllMapping = useCallback(async (params) => {
    try {
      const response = await getAllMapping(params);
      if (response.status === 200) {
        const result = response.data?.data?.map((item) => {
          return {
            ...item,
            actions: item,
            status: {
              _id: item._id,
              active: item?.active,
            },
          };
        });
        setDataSource(Array.isArray(result) ? [...result] : []);
        setTotalCount(response.data?.total ?? 0);
      } else {
        toast.error('Get mapping error!');
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (keyword) => {
        if (!keyword) {
          updateFilter({ search: '', page: 1 });
          return;
        }
        updateFilter({ search: keyword, page: 1 });
      }, 300),
    [updateFilter]
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const matchTypeOptions = [
    { label: 'Equals', value: 'equals' },
    { label: 'Contains', value: 'contains' },
    { label: 'Regex', value: 'regex' },
    { label: 'Regex Replace', value: 'regex_replace' },
  ];

  const handleSubmit = async (payload) => {
    if (mode === 'add') {
      try {
        const res = await createMapping(payload);
        if (res.status === 200) {
          toast.success('Created success!');
        } else {
          toast.error(res.data?.message);
        }
      } catch (error) {
        console.log(error);
      } finally {
        fetchAllMapping(filters);
        setOpenModal(false);
      }
    } else {
      try {
        const res = await updateMapping(idSelect, payload);
        if (res.status === 200) {
          toast.success('Updated success!');
        } else {
          toast.error(res.data?.message);
        }
      } catch (error) {
        console.log(error);
      } finally {
        fetchAllMapping(filters);
        setOpenModal(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteMapping(idSelect);
      if (res.status === 200) {
        toast.success('Delete success!');
      } else {
        toast.error(res.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      fetchAllMapping(filters);
      setIsShowModalDelete(false);
    }
  };

  const handleChangeActive = async (id, payload) => {
    try {
      const res = await updateMapping(id, payload);
      if (res.status === 200) {
        toast.success('Updated success!');
      } else {
        toast.error(res.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      fetchAllMapping(filters); // Truyền filters để giữ nguyên trạng thái filter hiện tại
    }
  };

  useEffect(() => {
    // Clear debounce on unmount để tránh memory leak
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    // Đồng bộ currentPage với filters.page
    setCurrentPage(filters.page);
  }, [filters.page]);

  useEffect(() => {
    fetchAllMapping(filters);
  }, [filters, fetchAllMapping]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Mapping Cost Center
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => {
                setMode('add');
                setOpenModal(true);
              }}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Mapping
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center mt-4">
          <Input
            onChange={handleSearch}
            placeholder="Search..."
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
              current={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table"
            columns={columns}
            dataSource={dataSource}
            rowKey={(record) => record._id}
            bordered={true}
            pagination={false}
          />
        </div>
      </div>
      <ModalAddMapping
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        matchTypeOptions={matchTypeOptions}
        mode={mode}
        initialValues={editing}
      />
      <Modal
        title="Delete Vendor"
        width={500}
        style={{ top: '30%' }}
        okText="Confirm"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalDelete}
        onOk={handleDelete}
        onCancel={() => setIsShowModalDelete(false)}
      >
        <span className="font-medium text-[#64748b]">Are you sure you want to delete this mapping? This action cannot be undone.</span>
      </Modal>
    </div>
  );
};

export default Mapping;
