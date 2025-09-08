import { Link, useOutletContext } from 'react-router-dom';
import { dataFilterListing } from '../../utils/dataFilter';
import { useEffect, useMemo, useState } from 'react';
import { dataColors } from '../../utils/dataColors';
import DateRangePicker from '../../components/DateRangePicker';
import { Flex, Image, Input, Pagination, Select, Table, Tooltip } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { FaDollarSign, FaBitcoin, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import NoImage from '../../assets/NoImage.jpg';
import StatusComponent from '../../components/StatusComponent';
import { GoDotFill } from 'react-icons/go';
import ItemAction from './table/ItemAction';
import { MdAdd } from 'react-icons/md';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { toast } from 'sonner';
import { getAllListing } from '../../apis/listing';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import { LuImport } from 'react-icons/lu';
import ModalAddListing from './ModalAddListing';
import ModalImportListing from './ModalImportListing';
const PAGE_SIZE = 10;
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

const ASIN_TYPE_OPTS = [
  { label: 'PODLovers', value: 'PODLovers' },
  { label: 'First Sale', value: 'First Sale' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Outline', value: 'Outline' },
  { label: 'Style', value: 'Style' },
  { label: 'Tool', value: 'Tool' },
  { label: 'Custom Image', value: 'Custom Image' },
  { label: 'Auto Fulfill', value: 'Auto Fulfill' },
  { label: 'Other', value: 'Other' },
];

const Listing = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterListing[0]);
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableHeight, setTableHeight] = useState(0);
  const [tabFilter, setTabFilter] = useState(dataFilterListing);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalImport, setOpenModalImport] = useState(false);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    scale_status: '',
    from: defaultFrom,
    to: defaultTo,
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
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: (data) => (
        <Flex vertical={true}>
          <span className="font-medium whitespace-nowrap">{formatDate(data)}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            ({formatDistanceToNow(data, { addSuffix: true })})
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
          <div
            className="w-[100px] h-[100px] rounded-lg overflow-hidden"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <Image width={100} src={data?.product_image ? data?.product_image : NoImage} className="rounded-lg" />
          </div>
          <Link target="_blank" className="hover:underline font-medium mt-2" to={`http://amazon.com/gp/product/${data?.asin}`}>
            {data?.asin}
          </Link>
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Total</span>,
      dataIndex: 'total_sales',
      key: 'total_sales',
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
          render: (data) => <StatusComponent title={data?.design_product} color={dataColors.asin} />,
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
          render: (data) => <StatusComponent title={data?.psd_id || 'No data'} color={dataColors.purple} />,
        },
        {
          title: <span style={{ color: dataColors.title }}>PSD Status</span>,
          dataIndex: 'psd',
          key: 'psdStt',
          align: 'center',
          render: (data) => (
            <div
              className="flex gap-2 items-center"
              style={{ color: data.status === 'Available' ? dataColors.success : dataColors.cancelled }}
            >
              <GoDotFill />
              <span className="font-medium">{data.status}</span>
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
      render: (data) => <StatusComponent title={data?.name} color={dataColors.pending} />,
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
      dataIndex: 'seller',
      key: 'seller',
      align: 'center',
      render: (data) => <StatusComponent title={data?.full_name} color={dataColors.process} />,
    },
    // {
    //   title: <span style={{ color: dataColors.title }}>Thread Color </span>,
    //   dataIndex: 'thread',
    //   key: 'thread',
    //   align: 'center',
    //   render: (data) => (
    //     <div
    //       className="px-2 py-2 rounded-md flex justify-between items-center border cursor-pointer"
    //       style={{ borderColor: dataColors.default }}
    //     >
    //       <span style={{ color: dataColors.title, marginRight: 5 }}>Add Config</span>
    //       <MdAdd size={20} color="black" />
    //     </div>
    //   ),
    // },
    {
      title: <span style={{ color: dataColors.title }}>Asin Type</span>,
      dataIndex: 'asin_type',
      key: 'asin_type',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.asin} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      render: (data) => <ItemAction asin={data?.asin} fetchAllListing={fetchAllListing} filters={filters} />,
      fixed: 'right',
    },
  ];

  const fetchAllListing = async (params) => {
    setLoading(true);
    try {
      const response = await getAllListing(params);
      if (response.status === 200) {
        const result = response.data?.listings?.map((item) => {
          return {
            ...item,
            productInfo: {
              product_image: item?.product_image,
              asin: item?.asin,
            },
            actions: {
              asin: item?.asin,
            },
          };
        });
        setDataSource(result);
        setTotalCount(response.data?.total);
      } else {
        toast.error(response.data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce(async (keyword) => {
        if (!keyword) {
          updateFilter({ search: '' });
          return;
        }
        updateFilter({ search: keyword });
      }, 300),
    []
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 265; // Chiều cao header nếu có
      const marginBottom = 20;

      const availableHeight = window.innerHeight - headerHeight - marginBottom;
      setTableHeight(availableHeight);
    };

    handleResize(); // Gọi lần đầu
    window.addEventListener('resize', handleResize); // Lắng nghe resize

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchAllListing(filters);
  }, [filters]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Listing
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalImport(true)}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Listing
              </span>
              <div style={{ color: 'black' }}>
                <LuImport size={15} />
              </div>
            </button>
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalAdd(true)}
            >
              <div style={{ color: 'black' }}>
                <MdAdd size={15} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Listing
              </span>
            </button>
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
              updateFilter={updateFilter}
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
              onChange={handleSearch}
              placeholder="Search orders by ID, Customer..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Seller"
                ListData={['Chu Quang Hào', 'Tạ Khánh Tùng']}
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
            className="no-indent-table listing"
            columns={columns}
            dataSource={dataSource}
            bordered={true}
            pagination={false}
            loading={loading}
            scroll={{ x: 'max-content', y: tableHeight }}
          />
        </div>
      </div>
      <ModalAddListing open={openModalAdd} onClose={() => setOpenModalAdd(false)} fetchAllListing={fetchAllListing} filters={filters} />
      <ModalImportListing isModalOpen={openModalImport} setIsModalOpen={setOpenModalImport} />
    </div>
  );
};

export default Listing;
