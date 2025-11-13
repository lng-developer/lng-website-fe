import { Link, useOutletContext } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';
import { FaBox, FaDollarSign, FaUser, FaRedo, FaPercentage } from 'react-icons/fa';
import SelectFilter from '../../components/SelectFilter';
import { Image, Input, Pagination, Table, Tooltip } from 'antd';
import { dataColors } from '../../utils/dataColors';
import StatusComponent from '../../components/StatusComponent';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { getALlOrder, getALlShop } from '../../apis/order';
import { toast } from 'sonner';
import { RiLinkM } from 'react-icons/ri';
import { debounce } from 'lodash';
import { getOrderCostStatistics } from '../../apis/report';
import NoImage from '../../assets/NoImage.jpg';
import { MdOutlineRefresh } from 'react-icons/md';

const PAGE_SIZE = 10;

// helper an toàn số
const num = (v) => (Number.isFinite(+v) ? +v : 0);
const fmtMoney = (v) => `$${num(v).toFixed(2)}`;

const ReportOrderCost = () => {
  const { collapsed } = useOutletContext();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [tableHeight, setTableHeight] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [shops, setShops] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [counts, setCounts] = useState({}); // stats từ API
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
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

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys((prev) => [...prev, record.key]);
    } else {
      setExpandedRowKeys((prev) => prev.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys = () => {
    if (isShowRowkeys) setExpandedRowKeys([]);
    else setExpandedRowKeys(orders.map((item) => item.key));
    setIsShowRowKeys((prev) => !prev);
  };

  const handlePageChange = (page, pageSize) => {
    updateFilter({ page, perPage: pageSize });
    setCurrentPage(page);
  };

  // KPIs cards (dùng dữ liệu từ API statistics)
  const kpiItems = useMemo(() => {
    const s = counts || {};
    return [
      { key: 'orders', label: 'Orders', value: num(s.orders), icon: <FaBox className="text-white" />, iconBg: 'bg-slate-600' },
      {
        key: 'revenue',
        label: 'Revenue',
        value: num(s.revenue),
        prefix: '$',
        icon: <FaDollarSign className="text-white" />,
        iconBg: 'bg-rose-500',
      },
      { key: 'profit', label: 'Profit', value: num(s.profit), prefix: '$', icon: <FaUser className="text-white" />, iconBg: 'bg-blue-500' },
      {
        key: 'lng',
        label: 'LNG Cost',
        value: num(s.lngCost),
        prefix: '$',
        icon: <FaDollarSign className="text-white" />,
        iconBg: 'bg-emerald-500',
      },
      {
        key: 'vendor',
        label: 'Vendor Cost',
        value: num(s.vendorCost),
        prefix: '$',
        icon: <FaDollarSign className="text-white" />,
        iconBg: 'bg-amber-500',
      },
      // Diff = tổng item_promotion_discount (theo backend bạn yêu cầu)
      {
        key: 'diff',
        label: 'Discount',
        value: num(s.diff),
        prefix: '$',
        icon: <FaPercentage className="text-white" />,
        iconBg: 'bg-violet-500',
      },
      {
        key: 'refund',
        label: 'Refund',
        value: num(s.refund),
        prefix: '$',
        icon: <FaRedo className="text-white" />,
        iconBg: 'bg-fuchsia-500',
      },
      { key: 'tax', label: 'Tax', value: num(s.tax), prefix: '$', icon: <FaPercentage className="text-white" />, iconBg: 'bg-orange-500' },
    ];
  }, [counts]);

  const formatNumber = (n) =>
    typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;

  const IconWrap = ({ bg, children }) => <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>{children}</div>;

  const Card = ({ item }) => (
    <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <IconWrap bg={item.iconBg}>{item.icon}</IconWrap>
        <div className="text-slate-600 text-[13px] leading-4 font-medium">{item.label}</div>
      </div>
      <div className="text-right tabular-nums font-semibold text-slate-800">
        {typeof item.value === 'number' ? (
          <span>
            {item.prefix || ''}
            {item.label === 'Orders' ? item.value : formatNumber(item.value)}
          </span>
        ) : (
          <span>{item.value}</span>
        )}
      </div>
    </div>
  );

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Order ID</span>,
      dataIndex: 'orderId',
      key: 'orderId',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Date Order</span>,
      dataIndex: 'orderDate',
      key: 'orderDate',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Shop</span>,
      dataIndex: 'shopName',
      key: 'shopName',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Source Type</span>,
      dataIndex: 'platForm',
      key: 'platForm',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Revenue</span>,
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Tax</span>,
      dataIndex: 'tax',
      key: 'tax',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>S-Tax</span>,
      dataIndex: 'shipping_tax',
      key: 'shipping_tax',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Fee</span>,
      dataIndex: 'fee',
      key: 'fee',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Refund</span>,
      dataIndex: 'refund',
      key: 'refund',
      align: 'center',
      width: 90,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Cost</span>,
      dataIndex: 'lng_cost',
      key: 'lng_cost',
      align: 'center',
      width: 90,
    },
    {
      title: <span style={{ color: dataColors.title }}>Cost</span>,
      dataIndex: 'base_cost',
      key: 'base_cost',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Discount</span>,
      dataIndex: 'diff',
      key: 'diff',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Profit</span>,
      dataIndex: 'profit',
      key: 'profit',
      align: 'center',
      width: 90,
    },
  ];

  // render Orders -> map dữ liệu từ API sang hàng của bảng
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      const aft = item?.amazon_finance_total || {};
      const revenueVal = num(aft.revenue ?? item?.revenue);
      const feeVal = num(aft.fee ?? item?.fee);
      const baseVal = num(item?.base_cost);
      const refundVal = num(aft.refund);
      const opCostVal = num(aft.opCost); // LNG cost
      const itemTax = num(aft.item_tax);
      const shippingTax = num(aft.shipping_tax);
      const profit1Val = num(aft.profit1 ?? revenueVal - (baseVal + feeVal));
      const promoVal = num(aft.item_promotion_discount); // Diff

      return {
        key: item?.orderId,
        orderDate: (
          <div>
            <span className="font-medium whitespace-nowrap mr-2">{formatDate(item?.purchase_date)}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              (
              {formatDistanceToNow(item?.purchase_date, { addSuffix: true })
                .replace(/^about /, '')
                .replace(/^less than /, '')}
              )
            </span>
          </div>
        ),
        shopName: <StatusComponent title={item?.shopName} color={dataColors.pending} />,
        orderId: <StatusComponent title={item?.orderId} color={dataColors.asin} />,
        platForm: <span className="font-medium">Amazon</span>,

        revenue: <span className="font-medium">{fmtMoney(revenueVal)}</span>,
        tax: <span className="font-medium">{fmtMoney(itemTax)}</span>,
        fee: <span className="font-medium">{fmtMoney(feeVal)}</span>,
        refund: <span className="font-medium">{refundVal === 0 ? 0 : fmtMoney(refundVal)}</span>,
        profit: (
          <span className="font-medium" style={{ color: dataColors.success }}>
            {profit1Val < 0 ? 0 : fmtMoney(profit1Val)}
          </span>
        ), // Profit = profit1
        lng_cost: <span className="font-medium">{opCostVal === 0 ? 0 : fmtMoney(opCostVal)}</span>,
        base_cost: <span className="font-medium">{fmtMoney(baseVal)}</span>,
        diff: <span className="font-medium">{fmtMoney(promoVal)}</span>,
        shipping_tax: <span className="font-medium">{fmtMoney(shippingTax)}</span>,
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            product_info: (
              <div>
                <div
                  className="w-[100px] h-[100px] rounded-lg overflow-hidden"
                  style={{
                    boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                  }}
                >
                  <Image
                    height={100}
                    width={100}
                    src={itemSub?.listing?.product_image || itemSub?.baseImageUrl || NoImage}
                    className="rounded-lg"
                  />
                </div>
              </div>
            ),
            sku: (
              <>
                {itemSub?.sku && (
                  <div className="flex-col mb-2">
                    <div className="flex items-center mr-2">
                      <span className="font-medium">SKU:</span>
                    </div>
                    <div>
                      <StatusComponent title={itemSub?.sku} color={dataColors.asin} />
                    </div>
                  </div>
                )}
                {itemSub?.asin && (
                  <div className="flex-col mb-2">
                    <div className="flex items-center mr-2">
                      <span className="font-medium">ASIN:</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <StatusComponent title={itemSub?.asin} color={dataColors.pending} />
                      <Tooltip title="Open Link">
                        <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${itemSub?.asin}`}>
                          <RiLinkM size={18} />
                        </Link>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </>
            ),
            seller: <StatusComponent title={item?.seller?.full_name || 'No data'} color={dataColors.process} />,
            quantity: (
              <div>
                <div>
                  <span className="font-medium mr-2">Quantity:</span>
                  <span style={{ color: dataColors.asin }}>{itemSub?.quantity}</span>
                </div>
              </div>
            ),
            cost_center: (
              <div>
                <div style={{ maxWidth: 450 }}>
                  <span className="font-medium mr-2">Vendor Product:</span>
                  <span style={{ color: dataColors.asin }}>{itemSub?.cost_center?.vendorProductDisplayName}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Size:</span>
                  <span style={{ color: dataColors.asin }}>{itemSub?.cost_center?.sizeValue}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Color:</span>
                  <span style={{ color: dataColors.asin }}>{itemSub?.cost_center?.colorValue}</span>
                </div>
              </div>
            ),
          };
        }),
      };
    });
    return results;
  };

  const expandedRowRender = (record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Image & Print Side</span>, dataIndex: 'product_info', key: 'product' },
      { title: <span style={{ color: dataColors.title }}>SKU, Variant</span>, dataIndex: 'sku', key: 'sku' },
      { title: <span style={{ color: dataColors.title }}>Order Owner</span>, dataIndex: 'seller', key: 'seller' },
      { title: <span style={{ color: dataColors.title }}>Quantity</span>, dataIndex: 'quantity', key: 'quantity' },
      { title: <span style={{ color: dataColors.title }}>Cost Center</span>, dataIndex: 'cost_center', key: 'cost_center' },
    ];

    return (
      <Table
        columns={subColumns}
        dataSource={record.subItems}
        pagination={false}
        rowKey="key"
        rowClassName={() => 'table-row-center'}
        style={{ padding: 10 }}
      />
    );
  };

  const fetchAllOrder = async (params) => {
    setLoading(true);
    try {
      const response = await getALlOrder(params);
      if (response.status === 200) {
        setOrders(response.data?.data || []);
        setTotalCount(response.data?.totalCount || 0);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllShop = async () => {
    try {
      const result = await getALlShop();
      if (result.status === 200) {
        setShops(result.data || []);
      }
    } catch (error) {
      console.log(error);
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

  const fetchCountOrderCost = async (params) => {
    try {
      const result = await getOrderCostStatistics(params);
      if (result.status === 200) {
        // hỗ trợ cả 2 kiểu response: {data: stats} hoặc stats
        setCounts(result.data?.data ?? result.data ?? {});
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 320;
      const marginBottom = 20;
      const availableHeight = window.innerHeight - headerHeight - marginBottom;
      setTableHeight(availableHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAllShop();
  }, []);

  useEffect(() => {
    fetchAllOrder(filters);
    fetchCountOrderCost(filters);
  }, [filters]);

  useEffect(() => {
    if (isShowRowkeys) {
      setExpandedRowKeys(orders.map((item) => item.orderId));
    }
  }, [orders, isShowRowkeys]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Orders Cost
          </h1>
          <div className="flex justify-center items-center">
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{ selected: 'my-selected', range_middle: 'my-range-middle' }}
              modifiersStyles={{ range_middle: { backgroundColor: '#f3f4f6', fontWeight: 'normal' } }}
              updateFilter={updateFilter}
            />
          </div>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        {/* KPI Cards */}
        <div className="flex items-center gap-4 w-full">
          <div className="w-full">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {kpiItems.map((it) => (
                <Card key={it.key || it.label} item={it} />
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              onChange={handleSearch}
              placeholder="Search orders by ID, Customer..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item.name)}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ shopName: val });
                }}
              />
            </div>
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  fetchAllOrder(filters);
                  fetchCountOrderCost(filters);
                  toast.success('Refresh success!');
                }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
              defaultCurrent={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              className="custom-pagination"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          <Table
            className="no-indent-table no-backgroud-title scale"
            columns={columns}
            dataSource={renderOrderInTable(orders)}
            expandable={{
              indentSize: 0,
              expandedRowRender,
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
            bordered
            pagination={false}
            loading={loading}
            rowKey="key"
            sticky={{ offsetHeader: 0 }}
            scroll={{ y: tableHeight }}
            tableLayout="auto"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportOrderCost;
