import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Descriptions, Drawer, Empty, Image, Input, Pagination, Select, Space, Spin, Table, Tooltip, Upload } from 'antd';
import { DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import { toast } from 'sonner';
import { FaDatabase, FaDollarSign, FaEtsy } from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import { LuImport } from 'react-icons/lu';
import { MdAdd, MdOutlineRefresh } from 'react-icons/md';
import { dataColors } from '../../utils/dataColors';
import ButtonFilter from '../../components/ButtonFilter';
import StatusComponent from '../../components/StatusComponent';
import {
  deleteEtsyListingDesignFile,
  downloadEtsyListingDesignFile,
  getEtsyListings,
  getEtsyListingDetail,
  uploadEtsyListingDesignFile,
} from '../../apis/etsyListing';
import { getAllShop } from '../../apis/shop';
import ModalDelete from '../../components/ModalDelete';

const PAGE_SIZE = 10;

const PAGE_TOKENS = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  mutedText: '#64748b',
  primary: '#0958d7',
  success: '#2f8f14',
  warning: '#d46a08',
  danger: '#cd1323',
  info: '#08969b',
};

const ETSY_LISTING_FILTERS = [
  { key: 'all', title: 'All', filter: 'All', count: 0 },
  { key: 'hasSku', title: 'Has SKU', filter: 'hasSku', count: 0 },
  { key: 'inStock', title: 'In Stock', filter: 'in_stock', count: 0 },
  { key: 'outOfStock', title: 'Out of Stock', filter: 'out_of_stock', count: 0 },
];

const PageActionButton = ({ icon, children, onClick }) => (
  <button
    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0958d7] focus-visible:ring-offset-2"
    style={{
      backgroundColor: PAGE_TOKENS.surfaceMuted,
      borderColor: PAGE_TOKENS.border,
      color: PAGE_TOKENS.text,
    }}
    onClick={onClick}
  >
    {icon}
    <span className="text-sm font-medium">{children}</span>
  </button>
);

const MetricCard = ({ icon, label, value, accent = PAGE_TOKENS.primary }) => (
  <div
    className="flex min-h-[86px] items-center gap-3 rounded-lg border px-4 py-3"
    style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
  >
    <div
      className="flex h-9 w-9 flex-none items-center justify-center rounded-md"
      style={{ backgroundColor: `${accent}14`, color: accent }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <span className="block text-sm font-medium" style={{ color: PAGE_TOKENS.mutedText }}>
        {label}
      </span>
      <div className="mt-0.5 truncate text-2xl font-semibold tabular-nums" style={{ color: PAGE_TOKENS.text }}>
        {value}
      </div>
    </div>
  </div>
);

const EtsyListingActions = ({ record, fetchAllEtsyListings, filters }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const listingId = record?.listingId;
  const hasPsdFile = record?.PSDstatus === true;

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    fileList,
    showUploadList: false,
    disabled: !listingId || uploading,
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploading(true);
        const response = await uploadEtsyListingDesignFile(listingId, formData, {
          onUploadProgress: (evt) => {
            if (evt.total) {
              onProgress?.({ percent: Math.round((evt.loaded / evt.total) * 100) });
            }
          },
        });
        onSuccess?.(response.data);
        toast.success(`${file.name} uploaded success!`);
        await fetchAllEtsyListings?.(filters);
      } catch (error) {
        onError?.(error);
        toast.error(error?.response?.data?.message || `${file.name} upload failed!`);
      } finally {
        setUploading(false);
        setFileList([]);
      }
    },
    onChange(info) {
      setFileList(info.fileList);
    },
  };

  const handleDownload = async () => {
    try {
      const response = await downloadEtsyListingDesignFile(listingId);
      const data = response.data || {};
      const downloadUrl = data.signed_url || data.signedUrl || data.downloadUrl || data.url;

      if (!downloadUrl) {
        toast.error('Download link not found');
        return;
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', String(listingId));
      link.setAttribute('target', '_parent');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download success!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Download failed!');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEtsyListingDesignFile(listingId);
      toast.success('Delete success!');
      setOpenModalDelete(false);
      await fetchAllEtsyListings?.(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed!');
    }
  };

  return (
    <>
      <Space size="small" align="center">
        {uploading ? (
          <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
            <Spin size="small" />
          </div>
        ) : (
          <Tooltip title="Upload">
            <Upload {...uploadProps}>
              <Button aria-label="Upload design file" icon={<UploadOutlined />} disabled={!listingId} />
            </Upload>
          </Tooltip>
        )}
        <Tooltip title="Download">
          <Button aria-label="Download design file" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!listingId || !hasPsdFile} />
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            aria-label="Delete design file"
            icon={<DeleteOutlined />}
            onClick={() => setOpenModalDelete(true)}
            disabled={!listingId || !hasPsdFile}
            danger
          />
        </Tooltip>
      </Space>

      <ModalDelete
        title="Delete design file"
        isShowModalDelete={openModalDelete}
        setIsShowModalDelete={setOpenModalDelete}
        handleDelete={handleDelete}
        text="design file"
      />
    </>
  );
};

const createEtsyListingColumns = ({ handleViewDetail, shopNameById, fetchAllEtsyListings, filters }) => [
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
    title: <span style={{ color: dataColors.title }}>PSD Status</span>,
    dataIndex: 'PSDstatus',
    key: 'PSDstatus',
    align: 'center',
    render: (data) => (
      <StatusComponent
        title={data === true ? 'Ready' : 'Missing'}
        color={data === true ? dataColors.success : dataColors.cancelled}
      />
    ),
  },
  {
    title: <span style={{ color: dataColors.title }}>Shop</span>,
    dataIndex: 'shopId',
    key: 'shop',
    align: 'center',
    render: (shopId, record) => <StatusComponent title={shopNameById.get(String(shopId)) || record?.shopName || '-'} color={dataColors.pending} />,
  },
  {
    title: <span style={{ color: dataColors.title }}> Shop ID</span>,
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
    render: (data) => <span className="font-medium tabular-nums">{data || data === 0 ? `$${Number(data).toFixed(2)}` : '-'}</span>,
  },
  {
    title: <span style={{ color: dataColors.title }}>Actions</span>,
    dataIndex: 'actions',
    key: 'actions',
    align: 'center',
    render: (_, record) => (
      <Space size="small" align="center">
        <EtsyListingActions record={record} fetchAllEtsyListings={fetchAllEtsyListings} filters={filters} />
        <Button size="small" onClick={() => handleViewDetail(record)} disabled={!record?._id}>
          Detail
        </Button>
      </Space>
    ),
  },
];

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const pickShopId = (shop) => shop?._id || shop?.shopId || shop?.id || '';
const pickShopName = (shop) => shop?.name || shop?.shopName || shop?.storeName || pickShopId(shop) || 'Unnamed shop';
const isEtsyShop = (shop) => {
  const merchant = String(shop?.merchant || shop?.platform || shop?.type || '').toLowerCase();
  return !merchant || merchant === 'etsy';
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
  const [shops, setShops] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
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

  const metricCards = useMemo(
    () => [
      {
        key: 'totalListings',
        label: 'Total Listings',
        value: counts.totalListings,
        accent: PAGE_TOKENS.primary,
        icon: <IoGiftOutline className="h-4 w-4" />,
      },
      {
        key: 'totalQuantity',
        label: 'Total Quantity',
        value: counts.totalQuantity,
        accent: PAGE_TOKENS.success,
        icon: <FaDatabase className="h-4 w-4" />,
      },
      {
        key: 'avgPrice',
        label: 'Avg Price',
        value: `$${counts.avgPrice.toFixed(2)}`,
        accent: PAGE_TOKENS.warning,
        icon: <FaDollarSign className="h-4 w-4" />,
      },
      {
        key: 'syncedListings',
        label: 'Synced Listings',
        value: counts.syncedListings,
        accent: PAGE_TOKENS.info,
        icon: <FaEtsy className="h-4 w-4" />,
      },
    ],
    [counts]
  );

  const shopOptions = useMemo(
    () =>
      shops.map((shop) => ({
        value: pickShopId(shop),
        label: pickShopName(shop),
      })),
    [shops]
  );

  const shopNameById = useMemo(
    () =>
      new Map(
        shops
          .map((shop) => [String(pickShopId(shop)), pickShopName(shop)])
          .filter(([shopId]) => shopId)
      ),
    [shops]
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

  const fetchAllShop = useCallback(async () => {
    setShopLoading(true);
    try {
      const response = await getAllShop();
      const list = Array.isArray(response.data) ? response.data : Array.isArray(response.data?.data) ? response.data.data : [];
      setShops(list.filter(isEtsyShop).filter((shop) => pickShopId(shop)));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Get shop list failed');
    } finally {
      setShopLoading(false);
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

  const etsyListingColumns = useMemo(
    () => createEtsyListingColumns({ handleViewDetail, shopNameById, fetchAllEtsyListings, filters }),
    [handleViewDetail, shopNameById, fetchAllEtsyListings, filters]
  );

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

  useEffect(() => {
    fetchAllShop();
  }, [fetchAllShop]);

  return (
    <div className="min-h-full overflow-hidden" style={{ backgroundColor: PAGE_TOKENS.background }}>
      <div
        className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 transition-all duration-300`}
        style={{ backgroundColor: PAGE_TOKENS.surface, borderBottom: `1px solid ${PAGE_TOKENS.border}` }}
      >
        <div className="sticky top-0 flex h-[60px] items-center justify-between gap-4 px-4 md:px-8">
          <h1 className="!mb-0 text-2xl font-semibold" style={{ color: PAGE_TOKENS.text }}>
            Etsy Listing
          </h1>
          <div className="flex justify-center items-center gap-2">
            <PageActionButton icon={<LuImport size={15} />} onClick={() => toast.info('Import Etsy Listing')}>
              Import Etsy Listing
            </PageActionButton>
            <PageActionButton icon={<MdAdd size={15} />} onClick={() => toast.info('Add Etsy Listing')}>
              Add Etsy Listing
            </PageActionButton>
          </div>
        </div>
      </div>

      <div className="mt-[60px] h-full px-4 py-4 md:px-8">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <MetricCard key={item.key} icon={item.icon} label={item.label} value={item.value} accent={item.accent} />
          ))}
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

        <div
          className="mt-4 flex flex-col gap-3 rounded-lg border p-3 xl:flex-row xl:items-center xl:justify-between"
          style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
        >
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-[680px]">
            <Input
              onChange={handleSearch}
              placeholder="Search Etsy listing"
              className="h-10 w-full flex-1 rounded-md text-sm sm:max-w-80"
              aria-label="Search Etsy listing"
            />
            <Select
              allowClear
              showSearch
              size="large"
              loading={shopLoading}
              placeholder="Select Etsy shop"
              value={filters.shopId || undefined}
              options={shopOptions}
              optionFilterProp="label"
              className="min-w-[220px]"
              onChange={(value) => updateFilter({ shopId: value || '', page: 1 })}
            />
            <div className="flex gap-2 items-center">
              <Tooltip title="Refresh">
                <button
                  aria-label="Refresh Etsy listings"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-[#f1f5f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0958d7] focus-visible:ring-offset-2"
                  style={{ color: PAGE_TOKENS.text }}
                  onClick={handleRefresh}
                >
                  <MdOutlineRefresh size={20} />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="flex justify-end">
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

        <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: PAGE_TOKENS.border, backgroundColor: PAGE_TOKENS.surface }}>
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
