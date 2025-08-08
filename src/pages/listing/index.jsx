import { Link, useOutletContext } from 'react-router-dom';
import { dataFilterListing, dataFilterStatusFulfillment } from '../../utils/dataFilter';
import { useState } from 'react';
import { dataColors } from '../../utils/dataColors';
import DateRangePicker from '../../components/DateRangePicker';
import { Flex, Image, Input, Pagination, Select, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { FaDollarSign, FaBitcoin, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import NoImage from '../../assets/NoImage.jpg';
import StatusComponent from '../../components/StatusComponent';
import { GoDotFill } from 'react-icons/go';
import ItemAction from './table/ItemAction';
import { MdAdd } from 'react-icons/md';

const stats = [
  {
    icon: <FaDollarSign className="w-4 h-4 text-gray-600" />,
    label: 'Total Asin',
    value: '1860',
    bgColor: 'bg-gray-100',
  },
  {
    icon: <FaBitcoin className="w-4 h-4 text-orange-600" />,
    label: 'Anonymous Asin',
    value: '12',
    bgColor: 'bg-orange-100',
  },
  {
    icon: <FaCheckCircle className="w-4 h-4 text-green-600" />,
    label: 'PSD Available',
    value: '896',
    bgColor: 'bg-green-100',
  },
  {
    icon: <FaTimesCircle className="w-4 h-4 text-red-600" />,
    label: 'No PSD',
    value: '65',
    bgColor: 'bg-red-100',
  },
];

const dataSource = [
  {
    id: 1,
    date: '25/07/2025',
    productInfo: {
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop',
      productCode: 'BOE882D4S7',
    },
    template: {
      style: 'GG-Napkins',
      designProduct: 'IKb2HVDno8R',
      variant: 'Available',
    },
    psd: {
      psdId: 'IKb2PlV0ndtR',
      psdStatus: 'Available',
    },
    platform: 'Amazon',
    assignee: 'Nguyễn Thị Lan Anh',
    config: 'No config',
    total: 150,
    store: 'Acc 166',
  },
  {
    id: 2,
    date: '25/07/2025',
    productInfo: {
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop',
      productCode: 'BOE882D4S7',
    },
    template: {
      style: 'GG-Napkins',
      designProduct: 'KbMTbdWpV2V',
      variant: 'Available',
    },
    psd: {
      psdId: 'IKb2PlV0ndtR',
      psdStatus: 'Available',
    },
    platform: 'Amazon',
    assignee: 'Nguyễn Thị Lan Anh',
    config: 'No config',
    total: 200,
    store: 'Acc 166',
  },
  {
    id: 3,
    date: '26/07/2025',
    productInfo: {
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop',
      productCode: 'BOE882D4S7',
    },
    template: {
      style: 'GG-Towels',
      designProduct: 'XYZ789ABC1',
      variant: 'Available',
    },
    psd: {
      psdId: 'IKb2PlV0ndtR',
      psdStatus: 'Available',
    },
    platform: 'Amazon',
    assignee: 'Trần Văn Nam',
    config: 'Custom config',
    total: 300,
    store: 'Acc 166',
  },
  {
    id: 4,
    date: '27/07/2025',
    productInfo: {
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop',
      productCode: 'BOE882D4S7',
    },
    template: {
      style: 'GG-Placemats',
      designProduct: 'PQR456DEF7',
      variant: 'Out of Stock',
    },
    psd: {
      psdId: 'IKb2PlV0ndtR',
      psdStatus: 'Available',
    },
    platform: 'Shopify',
    assignee: 'Lê Thị Mai',
    config: 'No config',
    status: 'Priority',
    total: 75,
    store: 'Acc 166',
  },
  {
    id: 5,
    date: '28/07/2025',
    productInfo: {
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop',
      productCode: 'BOE882D4S7',
    },
    template: {
      style: 'GG-Coasters',
      designProduct: 'STU123JKL8',
      variant: 'Available',
    },
    psd: {
      psdId: 'IKb2PlV0ndtR',
      psdStatus: 'Available',
    },
    platform: 'Amazon',
    assignee: 'Phạm Minh Tuấn',
    config: 'Advanced config',
    total: 120,
    store: 'Acc 166',
  },
];

const Listing = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusFulfillment[0]);

  const handleClickButton = (item) => {
    setIsActivefilter(item);
  };

  const renderColor = (stt) => {
    switch (stt) {
      case 'All':
        return dataColors.black;
      case 'FirstSale':
        return dataColors.success;
      case 'Normal':
        return dataColors.process;
      case 'Outline':
        return dataColors.pending;
      case 'CustomImage':
        return dataColors.asin;
      case 'PODLovers':
        return dataColors.purple;
      case 'Style':
        return dataColors.pink;
      case 'Tool':
        return dataColors.yellow;
      case 'AutoFulfill':
        return dataColors.success;
      case 'Others':
        return dataColors.cancelled;
      default:
        return dataColors.pending;
    }
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Date</span>,
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      render: (data) => (
        <Flex vertical={true} justify="center">
          <span className="font-medium">{data}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            (7 days ago)
          </span>
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Asin / Product ID</span>,
      dataIndex: 'productInfo',
      key: 'productInfo',
      align: 'center',
      render: (data) => (
        <Flex vertical={true} justify="center">
          <div>
            <Image width={100} src={data?.image ? data?.image : NoImage} className="rounded-lg" />
          </div>
          <Link to={''}> {data?.productCode} </Link>
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Total</span>,
      dataIndex: 'total',
      key: 'total',
      align: 'center',
      render: (data) => <span className="font-medium">{data}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Template</span>,
      dataIndex: 'template',
      key: 'template',
      align: 'center',
      children: [
        {
          title: <span style={{ color: dataColors.title }}>Style</span>,
          dataIndex: 'template',
          key: 'templateStyle',
          align: 'center',
          render: (data) => <StatusComponent title={data?.style} color={dataColors.default} isDefault={true} />,
        },
        {
          title: <span style={{ color: dataColors.title }}>Design Product</span>,
          dataIndex: 'template',
          key: 'templateDesign',
          align: 'center',
          render: (data) => <StatusComponent title={data?.designProduct} color={dataColors.asin} />,
        },
        {
          title: <span style={{ color: dataColors.title }}>Variant</span>,
          dataIndex: 'template',
          key: 'templateVariant',
          align: 'center',
          render: (data) => <StatusComponent title={data?.variant} color={dataColors.process} />,
        },
      ],
    },
    {
      title: <span style={{ color: dataColors.title }}>PSD</span>,
      dataIndex: 'psd',
      key: 'psd',
      align: 'center',
      children: [
        {
          title: <span style={{ color: dataColors.title }}>PSD ID</span>,
          dataIndex: 'psd',
          key: 'psdId',
          align: 'center',
          render: (data) => <StatusComponent title={data?.psdId} color={dataColors.purple} />,
        },
        {
          title: <span style={{ color: dataColors.title }}>PSD Status</span>,
          dataIndex: 'psd',
          key: 'psdStt',
          align: 'center',
          render: (data) => (
            <div
              className="flex gap-2 items-center"
              style={{ color: data.psdStatus === 'Available' ? dataColors.success : dataColors.cancelled }}
            >
              <GoDotFill />
              <span className="font-medium">{data.psdStatus}</span>
            </div>
          ),
        },
      ],
    },
    {
      title: <span style={{ color: dataColors.title }}>Store</span>,
      dataIndex: 'store',
      key: 'store',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.default} isDefault={true} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Platform</span>,
      dataIndex: 'platform',
      key: 'platform',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.success} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Seller</span>,
      dataIndex: 'assignee',
      key: 'assignee',
      align: 'center',
      render: (data) => (
        <SelectFilter
          title={data}
          ListData={[
            'Nguyễn Trọng Phương',
            'Vũ Thị Uyên',
            'Dương Thị Như Nguyệt',
            'Nguyễn Thị Ngát',
            'Nguyễn Thị Lan Anh',
            'Nguyễn Huy Hoàng',
          ]}
          isSeller={true}
          value={data}
        />
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Thread Color </span>,
      dataIndex: 'thread',
      key: 'thread',
      align: 'center',
      render: (data) => (
        <div
          className="px-2 py-2 rounded-md flex justify-between items-center border cursor-pointer"
          style={{ borderColor: dataColors.default }}
        >
          <span style={{ color: dataColors.title, marginRight: 5 }}>Add Config</span>
          <MdAdd size={20} color="black" />
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Asin Type</span>,
      dataIndex: 'asinType',
      key: 'asinType',
      align: 'asinType',
      render: (data) => (
        <Flex vertical gap={4}>
          <Select
            defaultValue="PODLovers"
            style={{ width: 120 }}
            options={[
              { value: 'Normal', label: 'Normal' },
              { value: 'POD', label: 'PODLovers' },
            ]}
          />
          <span className="font-medium mt-2 text-sm">Orther Config</span>
          <Select
            defaultValue="Normal"
            style={{ width: 120 }}
            options={[
              { value: 'Normal', label: 'Normal' },
              { value: 'POD', label: 'PODLovers' },
            ]}
          />
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      render: (data) => <ItemAction />,
      fixed: 'right',
    },
  ];

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Listing
          </h1>
          <div className="flex justify-center items-center">
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{
                selected: 'my-selected',
                range_middle: 'my-range-middle',
              }}
              modifiersStyles={{
                range_middle: {
                  backgroundColor: '#f3f4f6', // màu xám nhạt
                  fontWeight: 'normal', // không in đậm
                },
              }}
              // updateFilter={updateFilter}
            />
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex items-center gap-4 w-full">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
              {/* Icon Circle */}
              <div className={`${stat.bgColor} rounded-full p-2 flex items-center justify-center`}>{stat.icon}</div>

              {/* Text Content & Value */}
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 items-center mt-4">
          {dataFilterListing.map((item, index) => (
            <button
              key={index}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-2 cursor-pointer hover:bg-[#f1f5f9]"
              style={{
                borderColor: isActiveFilter?.key === item?.key ? dataColors.pending : '#e2e8f0',
                backgroundColor: isActiveFilter?.key === item?.key ? dataColors.backgroundHover : '',
              }}
              onClick={() => handleClickButton(item)}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                {item?.title}
              </span>
              <div
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors font-medium ml-[3px]"
                style={{ backgroundColor: renderColor(item.status) }}
              >
                <span className="truncate font-bold text-white">{3}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              // onChange={handleSearch}
              placeholder="Search orders by ID, Customer..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Shipping Type"
                ListData={['Second Day', 'Ground', 'Overnight', 'Economy', 'Standard', 'Expedited']}
                // value={shippingType}
                // onChange={(val) => {
                //   setShippingType(val);
                //   updateFilter({ shippingType: val });
                // }}
              />
              <SelectFilter
                title="Shop"
                // ListData={shops.map((item) => item.name)}
                // value={selectShop}
                // onChange={(val) => {
                //   console.log(val);

                //   setSelectShop(val);
                //   updateFilter({ shopName: val });
                // }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={50}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={10}
              defaultCurrent={1}
              // onChange={handlePageChange}
              // onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table columns={columns} dataSource={dataSource} rowKey="key" bordered={true} pagination={false} scroll={{ x: 'max-content' }} />
        </div>
      </div>
    </div>
  );
};

export default Listing;
