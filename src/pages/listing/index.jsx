import { Link, useOutletContext } from 'react-router-dom';
import { dataFilterListing } from '../../utils/dataFilter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataColors } from '../../utils/dataColors';
import { Flex, Image, Input, Pagination, Table, Tooltip } from 'antd';
import { FaBitcoin, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import NoImage from '../../assets/NoImage.jpg';
import StatusComponent from '../../components/StatusComponent';
import { GoDotFill } from 'react-icons/go';
import ItemAction from './table/ItemAction';
import { MdAdd } from 'react-icons/md';
import { formatDate } from '../../utils/fomatDate';
import { toast } from 'sonner';
import { getAllListing, getListingStatictisc } from '../../apis/listing';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import { LuImport } from 'react-icons/lu';
import ModalAddListing from './ModalAddListing';
import ModalImportListing from './ModalImportListing';
import { IoGiftOutline } from 'react-icons/io5';
import ModalUpdateListing from './ModalUpdateListing';
import ButtonFilter from '../../components/ButtonFilter';
import { getAllSellers } from '../../apis/user';
import SelectSeller from '../../components/SelectSeller';
import { getALlShop } from '../../apis/order';
import { useAuth } from '../../context/AuthContext';
const PAGE_SIZE = 10;

const Listing = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterListing[0]);
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabFilter, setTabFilter] = useState(dataFilterListing);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalImport, setOpenModalImport] = useState(false);
  const [counts, setCounts] = useState({});
  const [openModalUpdate, setOpenModalUpdate] = useState(false);
  const [dataEdit, setDataEdit] = useState({});
  const [sellers, setSellers] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [shops, setShops] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    search: '',
    asinType: '',
    psdStatus: '',
    store: '',
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
    if (item?.status === 'All') {
      updateFilter({ asinType: '' });
      return;
    }
    updateFilter({ asinType: item?.status });
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
            (
            {formatDistanceToNow(data, { addSuffix: true })
              .replace(/^about /, '')
              .replace(/^less than /, '')}
            )
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
        <div className="">
          <div className="flex justify-center mb-2">
            <div
              className="w-[100px] h-[100px] rounded-lg overflow-hidden"
              style={{
                boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
              }}
            >
              <Image width={100} height={100} src={data?.product_image ? data?.product_image : NoImage} className="rounded-lg" />
            </div>
          </div>
          <Link target="_blank" className="hover:underline font-medium" to={`http://amazon.com/gp/product/${data?.asin}`}>
            {data?.asin}
          </Link>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Total</span>,
      dataIndex: 'total_sales',
      key: 'total_sales',
      align: 'center',
      sorter: (a, b) => a.total_sales - b.total_sales, 
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
      render: (data) => (
        <ItemAction
          id={data?._id}
          asin={data?.asin}
          fetchAllListing={fetchAllListing}
          filters={filters}
          setOpenModalUpdate={setOpenModalUpdate}
          data={data}
          setDataEdit={setDataEdit}
        />
      ),
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
              ...item,
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

  // fetch count order by status
  const fetchCountStatus = useCallback(async () => {
    try {
      const response = await getListingStatictisc(filters);
      if (response.status === 200) {
        const resultTabFilter = dataFilterListing.map(({ key, title, status }) => ({
          key,
          title,
          status,
          count: response.data?.asinTypeCounts[key] ?? 0,
        }));
        setTabFilter(resultTabFilter);
        setCounts(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [filters]);

  const fetchAllSellers = async () => {
    try {
      const res = await getAllSellers();
      if (res.status === 200) {
        const result = res.data?.map((item) => {
          return {
            label: item?.full_name,
            value: item?._id,
          };
        });
        setSellers(result);
      } else {
        toast.error(res.data?.message || 'Fetch error');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unexpected error');
    }
  };

  const fetchAllShop = async () => {
    try {
      const res = await getALlShop();
      if (res.status === 200) {
        const result = res.data?.map((item) => {
          return {
            label: item?.name,
            value: item?._id,
          };
        });
        setShops(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllShop();
  }, []);

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchAllSellers();
    }
  }, []);

  useEffect(() => {
    fetchCountStatus();
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
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            {/* Icon Circle */}
            <div className={`bg-gray-100 rounded-full p-2 flex items-center justify-center`}>
              <IoGiftOutline className="w-4 h-4 text-gray-600" />
            </div>

            {/* Text Content & Value */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">Total Asin</span>
              <div className="text-2xl font-bold text-gray-800">{counts?.totalAsin || 0}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            {/* Icon Circle */}
            <div className={`bg-orange-100 rounded-full p-2 flex items-center justify-center`}>
              <FaBitcoin className="w-4 h-4 text-orange-600" />
            </div>

            {/* Text Content & Value */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">Anonymous Asin</span>
              <div className="text-2xl font-bold text-gray-800">{counts?.anonymousAsin || 0}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            {/* Icon Circle */}
            <div className={`bg-green-100 rounded-full p-2 flex items-center justify-center`}>
              <FaCheckCircle className="w-4 h-4 text-green-600" />
            </div>

            {/* Text Content & Value */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">PSD Available</span>
              <div className="text-2xl font-bold text-gray-800">{counts?.psdAvailable || 0}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            {/* Icon Circle */}
            <div className={`bg-red-100 rounded-full p-2 flex items-center justify-center`}>
              <FaTimesCircle className="w-4 h-4 text-red-600" />
            </div>

            {/* Text Content & Value */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">No PSD</span>
              <div className="text-2xl font-bold text-gray-800">{counts?.noPsd || 0}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center mt-4">
          {tabFilter.map((item, index) => (
            <ButtonFilter
              key={index}
              item={item}
              isActive={isActiveFilter?.key}
              handleFilterForStatus={() => handleClickButton(item)}
              setIsActivefilter={setIsActivefilter}
              count={item?.count}
            />
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
              {user?.role === 'Admin' && (
                <SelectSeller
                  title="Seller"
                  ListData={sellers}
                  value={selectSeller}
                  onChange={(val) => {
                    setSelectSeller(val);
                    updateFilter({ seller: val });
                    fetchCountStatus();
                  }}
                />
              )}
              <SelectSeller
                title="Shop"
                ListData={shops}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ store: val });
                  fetchCountStatus();
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
            className="no-indent-table listing"
            columns={columns}
            dataSource={dataSource}
            bordered={true}
            pagination={false}
            loading={loading}
          />
        </div>
      </div>
      <ModalAddListing open={openModalAdd} onClose={() => setOpenModalAdd(false)} fetchAllListing={fetchAllListing} filters={filters} />
      <ModalImportListing isModalOpen={openModalImport} setIsModalOpen={setOpenModalImport} />
      <ModalUpdateListing
        open={openModalUpdate}
        onClose={() => setOpenModalUpdate(false)}
        fetchAllListing={fetchAllListing}
        filters={filters}
        listing={dataEdit}
        fetchCountStatus={fetchCountStatus}
      />
    </div>
  );
};

export default Listing;
