import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Descriptions, Drawer, Empty, Image, Input, Pagination, Table, Tooltip } from 'antd';
import { debounce } from 'lodash';
import { toast } from 'sonner';
import { FaDatabase, FaDollarSign, FaEtsy } from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import { LuImport } from 'react-icons/lu';
import { MdAdd, MdOutlineRefresh } from 'react-icons/md';
import { dataColors } from '../../utils/dataColors';
import ButtonFilter from '../../components/ButtonFilter';
import StatusComponent from '../../components/StatusComponent';
import { getEtsyListings, getEtsyListingDetail } from '../../apis/etsyListing';

const PAGE_SIZE = 10;

const ETSY_LISTING_FILTERS = [
  { key: 'all', title: 'All', filter: 'All', count: 0 },
  { key: 'hasSku', title: 'Has SKU', filter: 'hasSku', count: 0 },
  { key: 'inStock', title: 'In Stock', filter: 'in_stock', count: 0 },
  { key: 'outOfStock', title: 'Out of Stock', filter: 'out_of_stock', count: 0 },
];

const createEtsyListingColumns = ({ handleViewDetail }) => [
  {
    title: <span style={{ color: dataColors.title }}>Image</span>,
    dataIndex: 'imageUrl',
    key: 'imageUrl',
    align: 'center',
    render: (data) =>
      data ? (
        <Image
          width={56}
          height={56}
          src={data}
          className="rounded-md object-cover"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <span>-</span>
      ),
  },
  {
    title: <span style={{ color: dataColors.title }}>Listing ID</span>,
    dataIndex: 'listingId',
    key: 'listingId',
    align: 'center',
    render: (data) => <span className="font-medium">{data || '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Title</span>,
    dataIndex: 'title',
    key: 'title',
    align: 'left',
    render: (data) => <span className="font-medium">{data || '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>SKU</span>,
    dataIndex: 'SKU',
    key: 'SKU',
    align: 'center',
    render: (data) => <span className="font-medium">{data || '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Shop Name</span>,
    dataIndex: 'shopName',
    key: 'shopName',
    align: 'center',
    render: (data) => <StatusComponent title={data || '-'} color={dataColors.pending} />,
  },
  {
    title: <span style={{ color: dataColors.title }}>Etsy Shop ID</span>,
    dataIndex: 'etsyShopId',
    key: 'etsyShopId',
    align: 'center',
    render: (data) => <span className="font-medium">{data || '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Price</span>,
    dataIndex: 'price',
    key: 'price',
    align: 'center',
    render: (data) => <span className="font-medium">{data || data === 0 ? `$${Number(data).toFixed(2)}` : '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Quantity</span>,
    dataIndex: 'quantity',
    key: 'quantity',
    align: 'center',
    render: (data) => <span className="font-medium">{data ?? '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Synced At</span>,
    dataIndex: 'syncedAt',
    key: 'syncedAt',
    align: 'center',
    render: (data) => <span className="whitespace-nowrap">{formatDateTime(data)}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Updated At</span>,
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    align: 'center',
    render: (data) => <span className="whitespace-nowrap">{formatDateTime(data)}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Actions</span>,
    dataIndex: 'actions',
    key: 'actions',
    align: 'center',
    render: (_, record) => (
      <Button size="small" onClick={() => handleViewDetail(record)} disabled={!record?._id}>
        Detail
      </Button>
    ),
  },
];

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const EtsyListing = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(ETSY_LISTING_FILTERS[0]);
  const [tabFilter, setTabFilter] = useState(ETSY_LISTING_FILTERS);
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableHeight, setTableHeight] = useState(0);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    perPage: PAGE_SIZE,
    search: '',
    stock: '',
    shopId: '',
  });

  const counts = useMemo(
    () => {
      const totalQuantity = dataSource.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
      const prices = dataSource.map((item) => Number(item?.price)).filter((price) => Number.isFinite(price));
      const avgPrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
      const syncedListings = dataSource.filter((item) => item?.syncedAt).length;

      return {
        totalListings: totalCount,
        totalQuantity,
        avgPrice,
        syncedListings,
      };
    },
    [dataSource, totalCount]
  );

  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : prev.page,
    }));
  }, []);

  const handleClickButton = useCallback(
    (item) => {
      setIsActivefilter(item);
      updateFilter({ stock: item?.filter === 'All' ? '' : item?.filter, page: 1 });
    },
    [updateFilter]
  );

  const handlePageChange = useCallback(
    (page, pageSize) => {
      updateFilter({ page, perPage: pageSize });
      setCurrentPage(page);
    },
    [updateFilter]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((keyword) => {
        updateFilter({ search: keyword || '', page: 1 });
      }, 300),
    [updateFilter]
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const fetchAllEtsyListings = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await getEtsyListings(params);
      if (response.data?.ok) {
        const list = Array.isArray(response.data?.data) ? response.data.data : [];
        const pagination = response.data?.pagination || {};
        setDataSource(list);
        setTotalCount(pagination.total ?? list.length);
        setCurrentPage(pagination.page ?? params?.page ?? 1);
      } else {
        setDataSource([]);
        setTotalCount(0);
        toast.error(response.data?.message || 'Get Etsy listings failed');
      }
    } catch (error) {
      setDataSource([]);
      setTotalCount(0);
      toast.error(error?.response?.data?.message || 'Get Etsy listings failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    setTabFilter(ETSY_LISTING_FILTERS);
    setDetailData(null);
    fetchAllEtsyListings(filters);
  };

  const handleViewDetail = useCallback(async (record) => {
    if (!record?._id) {
      toast.error('Missing Etsy listing id');
      return;
    }

    setOpenDetail(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const response = await getEtsyListingDetail(record?._id);
      if (response.data?.ok) {
        setDetailData(response.data?.data || null);
      } else {
        toast.error(response.data?.message || 'Get Etsy listing detail failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Get Etsy listing detail failed');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const etsyListingColumns = useMemo(() => createEtsyListingColumns({ handleViewDetail }), [handleViewDetail]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(filters.page);
  }, [filters.page]);

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 240;
      const availableHeight = window.innerHeight - headerHeight - 20;
      setTableHeight(availableHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAllEtsyListings(filters);
  }, [fetchAllEtsyListings, filters]);

  return (
    <div className="overflow-hidden">
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Etsy Listing
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => toast.info('Import Etsy Listing')}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Etsy Listing
              </span>
              <div style={{ color: 'black' }}>
                <LuImport size={15} />
              </div>
            </button>
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => toast.info('Add Etsy Listing')}
            >
              <div style={{ color: 'black' }}>
                <MdAdd size={15} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Etsy Listing
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            <div className="bg-gray-100 rounded-full p-2 flex items-center justify-center">
              <IoGiftOutline className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">Total Listings</span>
              <div className="text-2xl font-bold text-gray-800">{counts.totalListings}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            <div className="bg-green-100 rounded-full p-2 flex items-center justify-center">
              <FaDatabase className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">Total Quantity</span>
              <div className="text-2xl font-bold text-gray-800">{counts.totalQuantity}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            <div className="bg-orange-100 rounded-full p-2 flex items-center justify-center">
              <FaDollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">Avg Price</span>
              <div className="text-2xl font-bold text-gray-800">${counts.avgPrice.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex-1">
            <div className="bg-orange-100 rounded-full p-2 flex items-center justify-center">
              <FaEtsy className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 font-medium">Synced Listings</span>
              <div className="text-2xl font-bold text-gray-800">{counts.syncedListings}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center mt-4">
          {tabFilter.map((item) => (
            <ButtonFilter
              key={item.key}
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
              placeholder="Search Etsy listing"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center">
              <Tooltip title="Refresh">
                <button className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer" onClick={handleRefresh}>
                  <MdOutlineRefresh size={20} />
                </button>
              </Tooltip>
            </div>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
              pageSize={filters.perPage}
              current={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>

        <div className="mt-4">
          <Table
            className="no-indent-table listing"
            columns={etsyListingColumns}
            dataSource={dataSource}
            bordered={true}
            pagination={false}
            loading={loading}
            rowKey={(record) => record?._id || record?.listingId}
            locale={{ emptyText: <Empty description="No Etsy listings found" /> }}
            sticky={{ offsetHeader: 0 }}
            scroll={{ y: tableHeight }}
            tableLayout="auto"
          />
        </div>
      </div>
      <Drawer
        title="Etsy Listing Detail"
        width={560}
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        loading={detailLoading}
        destroyOnHidden
      >
        {detailData ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Mongo ID">{detailData?._id || '-'}</Descriptions.Item>
            <Descriptions.Item label="Portal Shop ID">{detailData?.shopId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Etsy Shop ID">{detailData?.etsyShopId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Shop Name">{detailData?.shopName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Listing ID">{detailData?.listingId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Title">{detailData?.title || '-'}</Descriptions.Item>
            <Descriptions.Item label="SKU">{detailData?.SKU || '-'}</Descriptions.Item>
            <Descriptions.Item label="Price">{detailData?.price ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Quantity">{detailData?.quantity ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Synced At">{formatDateTime(detailData?.syncedAt)}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{formatDateTime(detailData?.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description={detailLoading ? 'Loading Etsy listing detail' : 'No Etsy listing detail'} />
        )}
      </Drawer>
    </div>
  );
};

export default EtsyListing;
