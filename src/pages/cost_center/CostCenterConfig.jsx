import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import SelectFilter from '../../components/SelectFilter';
import { Col, Flex, Input, Pagination, Row, Switch, Table, Tooltip } from 'antd';
import { dataColors } from '../../utils/dataColors';
import { MdHistory, MdOutlineArrowBack } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import { IoCopyOutline } from 'react-icons/io5';
import StatusComponent from '../../components/StatusComponent';

const dataSource = [
  {
    configId: '12321312',
    status: 'Active',
    code: 'WS',
    customize_size_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_color_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_product_type_size_key: ['Size', 'Choose Size', 'Select Size'],
    customize_product_type_key: ['Select Product Type'],
    customize_product_type_color_key: ['Select Product Type & Color'],
    combination_product_type_key: ['Select Product Type/Select print type'],
    isSet: 'InActive',
    isPack: 'InActive',
    sizePosition: 0,
    colorPosition: 0,
    product_for_seller: 'Custom 2 Layer Wooden Art',
    country: 'United States',
    product_type_from: 'Women Jersey/Front Side',
  },
  {
    configId: '12321312',
    status: 'Active',
    code: 'WS',
    customize_size_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_color_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_product_type_size_key: ['Size', 'Choose Size', 'Select Size'],
    customize_product_type_key: ['Select Product Type'],
    customize_product_type_color_key: ['Select Product Type & Color'],
    combination_product_type_key: ['Select Product Type/Select print type'],
    isSet: 'InActive',
    isPack: 'InActive',
    sizePosition: 0,
    colorPosition: 0,
    product_for_seller: 'Custom 2 Layer Wooden Art',
    country: 'United States',
    product_type_from: 'Women Jersey/Front Side',
  },
  {
    configId: '12321312',
    status: 'Active',
    code: 'WS',
    customize_size_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_color_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_product_type_size_key: ['Size', 'Choose Size', 'Select Size'],
    customize_product_type_key: ['Select Product Type'],
    customize_product_type_color_key: ['Select Product Type & Color'],
    combination_product_type_key: ['Select Product Type/Select print type'],
    isSet: 'InActive',
    isPack: 'InActive',
    sizePosition: 0,
    colorPosition: 0,
    product_for_seller: 'Custom 2 Layer Wooden Art',
    country: 'United States',
    product_type_from: 'Women Jersey/Front Side',
  },
  {
    configId: '12321312',
    status: 'Active',
    code: 'WS',
    customize_size_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_color_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_product_type_size_key: ['Size', 'Choose Size', 'Select Size'],
    customize_product_type_key: ['Select Product Type'],
    customize_product_type_color_key: ['Select Product Type & Color'],
    combination_product_type_key: ['Select Product Type/Select print type'],
    isSet: 'InActive',
    isPack: 'InActive',
    sizePosition: 0,
    colorPosition: 0,
    product_for_seller: 'Custom 2 Layer Wooden Art',
    country: 'United States',
    product_type_from: 'Women Jersey/Front Side',
  },
  {
    configId: '12321312',
    status: 'Active',
    code: 'WS',
    customize_size_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_color_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_product_type_size_key: ['Size', 'Choose Size', 'Select Size'],
    customize_product_type_key: ['Select Product Type'],
    customize_product_type_color_key: ['Select Product Type & Color'],
    combination_product_type_key: ['Select Product Type/Select print type'],
    isSet: 'InActive',
    isPack: 'InActive',
    sizePosition: 0,
    colorPosition: 0,
    product_for_seller: 'Custom 2 Layer Wooden Art',
    country: 'United States',
    product_type_from: 'Women Jersey/Front Side',
  },
  {
    configId: '12321312',
    status: 'Active',
    code: 'WS',
    customize_size_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_color_key: ['Size', 'Choose Size', 'Select Size', 'Choose Your Size'],
    customize_product_type_size_key: ['Size', 'Choose Size', 'Select Size'],
    customize_product_type_key: ['Select Product Type'],
    customize_product_type_color_key: ['Select Product Type & Color'],
    combination_product_type_key: ['Select Product Type/Select print type'],
    isSet: 'InActive',
    isPack: 'InActive',
    sizePosition: 0,
    colorPosition: 0,
    product_for_seller: 'Custom 2 Layer Wooden Art',
    country: 'United States',
    product_type_from: 'Women Jersey/Front Side',
  },
];

const CostCenterConfig = () => {
  const { collapsed } = useOutletContext();

  const tabs = [
    { id: 'amazon', label: 'Amazon', value: 'amazon' },
    { id: 'etsy', label: 'Etsy', value: 'etsy' },
    { id: 'shopify', label: 'Shopify', value: 'shopify' },
  ];

  const [activeTab, setActiveTab] = useState('amazon');

  const handleTabClick = (tabValue) => {
    setActiveTab(tabValue);
    console.log('Selected tab:', tabValue);
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      align: 'center',
      fixed: 'left',
      render: () => (
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
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
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
      render: (text) => <Switch checked={text === 'Active' ? true : false} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Code</span>,
      dataIndex: 'code',
      key: 'code',
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
      dataIndex: 'isSet',
      key: 'isSet',
      align: 'center',
      render: (text) => <Switch checked={text === 'Active' ? true : false} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Is Pack</span>,
      dataIndex: 'isPack',
      key: 'isPack',
      align: 'center',
      render: (text) => <Switch checked={text === 'Active' ? true : false} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Size Position</span>,
      dataIndex: 'sizePosition',
      key: 'sizePosition',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Color Position</span>,
      dataIndex: 'colorPosition',
      key: 'colorPosition',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Product For Seller</span>,
      dataIndex: 'product_for_seller',
      key: 'product_for_seller',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
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
      dataIndex: 'product_type_from',
      key: 'product_type_from',
      align: 'center',
      fixed: 'right',
      render: (text) => <StatusComponent title={text} color={dataColors.default} isDefault={true} />,
    },
  ];

  const handleSearch = () => {};
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
              //   onClick={handleClickAdd}
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
              <SelectFilter
                title="Product Type"
                ListData={['Second Day', 'Ground', 'Overnight', 'Economy', 'Standard', 'Expedited']}
                value={'Second Day'}
                // onChange={(val) => {
                //   setShippingType(val);
                //   updateFilter({ shippingType: val });
                // }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={40}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={10}
              defaultCurrent={1}
              // onChange={handlePageChange}
              // onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table"
            columns={columns}
            dataSource={dataSource}
            rowKey="key"
            bordered={true}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CostCenterConfig;
