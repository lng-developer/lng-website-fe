import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Flex, Input, Pagination, Switch, Table, Tooltip } from 'antd';
import { dataColors } from '../../utils/dataColors';
import { MdHistory } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import { IoCopyOutline } from 'react-icons/io5';
import StatusComponent from '../../components/StatusComponent';
import { createConfigCost, getAllConfig, getConfigCost, updateConfigCost } from '../../apis/config';
import SelectProductType from '../../components/SelectProductType';
import ModalAddConfig from './ModalAddConfig';
import ModalEditConfig from './ModalEditConfig';
import { toast } from 'sonner';
const PAGE_SIZE = 10;

const CostCenterConfig = () => {
  const { collapsed } = useOutletContext();
  const [activeTab, setActiveTab] = useState('amazon');
  const [configs, setConfigs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [productTypes, setProductTypes] = useState([]);
  const [valueFilter, setValueFilter] = useState('');
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [idEdit, setIdEdit] = useState('');
  const [openModalEdit, setOpenModalEdit] = useState(false);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    search: '',
    product_for_seller: '',
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    updateFilter({ page: page, perPage: pageSize });
  };

  const tabs = [
    { id: 'amazon', label: 'Amazon', value: 'amazon' },
    { id: 'etsy', label: 'Etsy', value: 'etsy' },
    { id: 'shopify', label: 'Shopify', value: 'shopify' },
  ];

  const handleTabClick = (tabValue) => {
    setActiveTab(tabValue);
    console.log('Selected tab:', tabValue);
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: '_id',
      key: 'actions',
      align: 'center',
      fixed: 'left',
      render: (record) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="View History">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              // onClick={() => {
              //   setDataView(record?.items);
              //   setIsOpenModal(true);
              // }}
            >
              <MdHistory size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Edit">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setOpenModalEdit(true);
                setIdEdit(record);
              }}
            >
              <BiSolidEdit size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Duplicate">
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
              <IoCopyOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      fixed: 'left',
      render: (text) => (
        <Switch
          checked={text?.status === 'Active' ? true : false}
          onChange={(val) => handleUpdateStatus(text?._id, { status: val === true ? 'Active' : 'inActive' })}
        />
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Code</span>,
      dataIndex: 'config_code',
      key: 'config_code',
      align: 'center',
      fixed: 'left',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Customize Size Key</span>,
      dataIndex: 'customize_size_key',
      key: 'customize_size_key',
      align: 'center',
      render: (text) => (
        <div className="pill-grid">
          {text?.map((k) => (
            <StatusComponent title={k} color={dataColors.asin} />
          ))}
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Customize Color Key</span>,
      dataIndex: 'customize_color_key',
      key: 'customize_color_key',
      align: 'center',
      render: (text) => (
        <div className="pill-grid">
          {text?.map((item) => (
            <StatusComponent title={item} color={dataColors.success} />
          ))}
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Customize Product Type Key</span>,
      dataIndex: 'customize_product_type_key',
      key: 'customize_product_type_key',
      align: 'center',
      render: (text) => (
        <div className="pill-grid">
          {text?.map((item) => (
            <StatusComponent title={item} color={dataColors.asin} />
          ))}
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Customize Product Type Color Key</span>,
      dataIndex: 'customize_product_type_color_key',
      key: 'customize_product_type_color_key',
      align: 'center',
      render: (text) => (
        <div className="pill-grid">
          {text?.map((item) => (
            <StatusComponent title={item} color={dataColors.pending} />
          ))}
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Combination Product Type Key</span>,
      dataIndex: 'combination_product_type_key',
      key: 'combination_product_type_key',
      align: 'center',
      render: (text) => (
        <div className="pill-grid">
          {text?.map((item) => (
            <StatusComponent title={item} color={dataColors.pink} />
          ))}
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Is Set</span>,
      dataIndex: 'is_set',
      key: 'is_set',
      align: 'center',
      render: (text) => <Switch checked={text?.is_set} onChange={(val) => handleUpdateStatus(text?._id, { is_set: val })} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Is Pack</span>,
      dataIndex: 'is_pack',
      key: 'is_pack',
      align: 'center',
      render: (text) => <Switch checked={text?.is_pack} onChange={(val) => handleUpdateStatus(text?._id, { is_pack: val })} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Size Position</span>,
      dataIndex: 'size_position',
      key: 'size_position',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Color Position</span>,
      dataIndex: 'color_position',
      key: 'color_position',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Product For Seller</span>,
      dataIndex: 'product_for_seller',
      key: 'product_for_seller',
      align: 'center',
      render: (text) => <span className="font-medium">{text?.name}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Country</span>,
      dataIndex: 'country',
      key: 'country',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Product Type From Platform</span>,
      dataIndex: 'product_type_from_platform',
      key: 'product_type_from_platform',
      align: 'center',
      fixed: 'right',
      render: (text) => {
        return text ? <StatusComponent title={text} color={dataColors.default} isDefault={true} /> : <></>;
      },
    },
  ];

  const fetchAllConfig = async (params) => {
    try {
      const response = await getConfigCost(params);
      if (response.status === 200) {
        const result = response.data?.items?.map((item) => {
          return {
            ...item,
            status: {
              _id: item?._id,
              status: item?.status,
            },
            is_set: {
              _id: item?._id,
              is_set: item?.is_set,
            },
            is_pack: {
              _id: item?._id,
              is_pack: item?.is_pack,
            },
          };
        });
        setConfigs(result);
        setTotalCount(response.data?.total);
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearch = (e) => {
    if (!e.target.value) {
      updateFilter({ search: '' });
      return;
    }
    updateFilter({ search: e.target.value });
  };

  const fetchAllProductType = async () => {
    try {
      const response = await getAllConfig();
      if (response.status === 200) {
        const result = response.data?.items?.map((k) => {
          return {
            value: k?._id,
            label: k?.name,
          };
        });
        setProductTypes(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddConfig = async (values) => {
    const arrayFields = [
      'customize_size_key',
      'customize_color_key',
      'customize_product_type_key',
      'customize_product_type_size_key',
      'customize_product_type_color_key',
      'combination_product_type_key',
    ];

    arrayFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        values[field] = values[field]
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }
    });

    try {
      const response = await createConfigCost(values);
      if (response.status === 201) {
        toast.success('Create success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Create error!');
    } finally {
      setOpenModalAdd(false);
      fetchAllConfig();
    }
  };

  const handleEditConfig = async (values) => {
    const arrayFields = [
      'customize_size_key',
      'customize_color_key',
      'customize_product_type_key',
      'customize_product_type_size_key',
      'customize_product_type_color_key',
      'combination_product_type_key',
    ];

    arrayFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        values[field] = values[field]
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }
    });

    try {
      const response = await updateConfigCost(idEdit, values);
      if (response.status === 200) {
        toast.success('Update success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Update error!');
    } finally {
      setOpenModalEdit(false);
      fetchAllConfig();
    }
  };

  const handleUpdateStatus = async (id, params) => {
    try {
      const response = await updateConfigCost(id, params);
      if (response.status === 200) {
        toast.success('Update success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Update error!');
    } finally {
      setOpenModalEdit(false);
      fetchAllConfig();
    }
  };

  useEffect(() => {
    fetchAllProductType();
  }, []);

  useEffect(() => {
    fetchAllConfig(filters);
  }, [filters]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Config Cost Center New
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalAdd(true)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Config
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex flex-wrap gap-2 bg-[#f1f5f9] p-2 rounded-lg w-[207px]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.value)}
              className={`px-2 py-1 rounded-md !text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.value ? 'bg-white text-gray-900 shadow-sm' : '!text-[#64748b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              onChange={handleSearch}
              placeholder="Search by name, code"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectProductType
                title="Product Type"
                ListData={productTypes}
                value={valueFilter}
                onChange={(val) => {
                  setValueFilter(val);
                  updateFilter({ product_for_seller: val });
                }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
              defaultCurrent={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table"
            columns={columns}
            dataSource={configs}
            rowKey="key"
            bordered={true}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </div>
      <ModalAddConfig
        open={openModalAdd}
        onCancel={() => setOpenModalAdd(false)}
        onSubmit={handleAddConfig}
        sellerProductOptions={productTypes}
      />
      <ModalEditConfig
        open={openModalEdit}
        onCancel={() => setOpenModalEdit(false)}
        onSubmit={handleEditConfig}
        sellerProductOptions={productTypes}
        idEdit={idEdit}
      />
    </div>
  );
};

export default CostCenterConfig;
