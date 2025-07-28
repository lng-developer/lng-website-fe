import { Input, Pagination, Table } from 'antd';
import ButtonFilter from '../../components/ButtonFilter';
import SelectFilter from '../../components/SelectFilter';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import SubItemImage from './table/SubItemImage';
import SubItemSku from './table/SubItemSku';
import SubItemCustom from './table/SubItemCustom';
import SubItemQuantity from './table/SubItemQuantity';
import SubItemCost from './table/SubItemCost';
import SubItemTracking from './table/SubItemTracking';
import { useCallback, useEffect, useState } from 'react';
import { getALlOrder } from '../../apis/order';
import { formatDate } from '../../utils/fomatDate';
import { FcShop } from 'react-icons/fc';
import { FcPlus } from 'react-icons/fc';
import ItemCustomer from './table/ItemCustomer';
import useDebounce from '../../hooks/useDebounce';
import { dataFilterStatus } from '../../utils/dataFilter';
import { useOrder } from '../../context/OrderContext';
const PAGE_SIZE = 10;

const Home = () => {
  const { orders, setOrders, dataFilter, setDataFilter } = useOrder();
  const [valueSearch, setValueSearch] = useState('');
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatus[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterStatus);
  const debounce = useDebounce(valueSearch, 600);
  const [currentPage, setCurrentPage] = useState(1);

  // handle pagination
  const handleChangePage = (page) => {
    setCurrentPage(page);
  };

  const paginatedData = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleColorStatus = (stt) => {
    switch (stt) {
      case 'New':
        return dataColors.success;
      case 'Fulfilled':
        return dataColors.process;
      case 'Shipped':
        return dataColors.pending;
      case 'Cancelled':
        return dataColors.cancelled;
      default:
        return dataColors.default;
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAllOrder = useCallback(async () => {
    try {
      const response = await getALlOrder();
      if (response.status === 200) {
        setOrders(response.data);
        setDataFilter(response.data);
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    }
  });

  // fetch count order by status
  const fetchCountStatus = () => {
    const resultTabFilter = dataFilterStatus.map((tab) => {
      const count = tab.status === 'All' ? orders.length : orders.filter((item) => item.status === tab.status).length;

      return { ...tab, count };
    });
    setTabFilter(resultTabFilter);
  };

  const columns = [
    { title: 'Order', dataIndex: 'order', key: 'ord', align: 'center' },
    { title: 'Status', dataIndex: 'status', key: 'customer', align: 'center' },
    { title: 'Created', dataIndex: 'created', key: 'date', align: 'center' },
    { title: 'Order Date', dataIndex: 'order_date', key: 'order_date', align: 'center' },
    { title: 'Shipping Type', dataIndex: 'shipping_type', key: 'shipping_type', align: 'center' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', align: 'center' },
    { title: 'Config Cost Center', dataIndex: 'config_cost_center', key: 'config_cost_center', align: 'center' },
    { title: 'Basecost', dataIndex: 'basecost', key: 'basecost', align: 'center' },
    { title: 'Store', dataIndex: 'store', key: 'store', align: 'center' },
    { title: 'Delivery Date', dataIndex: 'delivery_date', key: 'delivery_date', align: 'center' },
    { title: 'Handling Time', dataIndex: 'handling_time', key: 'handling_time', align: 'center' },
    { title: 'Case', dataIndex: 'case', key: 'case', align: 'center' },
  ];

  // Cột con trong bảng mở rộng
  const expandedRowRender = (record) => {
    const subColumns = [
      { title: 'Image & Print Side', dataIndex: 'product', key: 'product' },
      { title: 'SKU, Variant & Seller', dataIndex: 'sku', key: 'sku' },
      { title: 'Customization', dataIndex: 'price', key: 'price' },
      { title: 'QTY', dataIndex: 'quantity', key: 'quantity' },
      { title: 'Cost Center	', dataIndex: 'cost_center', key: 'cost_center' },
      { title: 'Tracking & Note', dataIndex: 'tracking_note', key: 'tracking_note' },
    ];

    return <Table columns={subColumns} dataSource={record.subItems} pagination={false} rowKey="key" />;
  };

  // Xử lý search
  const handleSearch = (e) => {
    setValueSearch(e.target.value);
  };

  const handleFilterForStatus = (status) => {
    // if (status === 'All') {
    //   setOrders(orders);
    //   return;
    // }
    // const results = dataFilter.filter((item) => {
    //   const orderFilter = item?.status;
    //   return orderFilter?.toLowerCase().includes(status?.toLowerCase());
    // });
    // setOrders(results);
  };

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: index,
        order: <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />,
        customer: <ItemCustomer nameCustomer={item?.customer_infor?.name} />,
        status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
        created: <span className="font-medium">{formatDate(item?.createdAt)}</span>,
        order_date: <span className="font-medium">{formatDate(item?.purchase_date)}</span>,
        shipping_type: <StatusComponent title="Standard" color={dataColors.success} />,
        config_cost_center: (
          <div className="border-1 rounded-full px-2 cursor-pointer" style={{ borderColor: dataColors.pending }}>
            <span className="font-medium ml-2" style={{ color: dataColors.pending }}>
              Re-test
            </span>
          </div>
        ),
        basecost: <span className="font-medium">{`$${3}`}</span>,
        store: (
          <div className="flex items-center border-1 rounded-full px-2" style={{ borderColor: dataColors.pending }}>
            <FcShop />
            <span className="font-medium ml-2" style={{ color: dataColors.pending }}>
              {item?.shopName}
            </span>
          </div>
        ),
        delivery_date: <span className="font-medium">July 25, 2025</span>,
        handling_time: <span className="font-medium">6 Days</span>,
        case: (
          <div className="flex justify-center cursor-pointer">
            <FcPlus size={20} />
          </div>
        ),
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            product: <SubItemImage linkImage={itemSub?.baseImageUrl} />,
            sku: <SubItemSku sku={itemSub?.sku} asin={itemSub?.asin} />,
            price: <SubItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />,
            quantity: <SubItemQuantity quantity={itemSub?.quantity} />,
            cost_center: <SubItemCost />,
            tracking_note: <SubItemTracking status={item?.status} orderId={item?.orderId} fetchAllOrder={fetchAllOrder} />,
          };
        }),
      };
    });
    return results;
  };

  useEffect(() => {
    if (!debounce.trim()) {
      setOrders(dataFilter);
      return;
    }
    const results = dataFilter.filter((item) => {
      const orderFilter = item?.orderId;
      return orderFilter?.toLowerCase().includes(valueSearch?.toLowerCase());
    });
    setOrders(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounce]);

  useEffect(() => {
    fetchCountStatus();
  }, [orders]);

  useEffect(() => {
    fetchAllOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="px-8 py-4 h-full">
      <div className="flex gap-3 items-center">
        {tabFilter.map((item, index) => (
          <ButtonFilter
            key={index}
            item={item}
            isActive={isActiveFilter?.key}
            handleFilterForStatus={handleFilterForStatus}
            setIsActivefilter={setIsActivefilter}
            count={item?.count}
          />
        ))}
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex w-[40%] gap-2">
          <Input
            value={valueSearch}
            onChange={handleSearch}
            placeholder="Search orders by ID, Customer..."
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
          <div className="flex gap-2 items-center ">
            <SelectFilter />
            <SelectFilter />
            <SelectFilter />
          </div>
        </div>
        <div>
          <Pagination
            total={orders.length}
            showTotal={(total) => `Total ${total} items`}
            defaultPageSize={10}
            defaultCurrent={1}
            onChange={handleChangePage}
          />
        </div>
      </div>
      <div className="mt-4">
        <Table
          columns={columns}
          dataSource={renderOrderInTable(paginatedData)}
          expandable={{ expandedRowRender }}
          rowKey="key"
          bordered={true}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default Home;
