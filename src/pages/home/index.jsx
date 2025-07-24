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

const Home = () => {
  const [orders, setOrders] = useState([]);

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
        const results = response.data.map((item, index) => {
          return {
            key: index,
            order: <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />,
            customer: item?.customer_infor?.name,
            status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
            created: formatDate(item?.createdAt),
            order_date: formatDate(item?.purchase_date),
            shipping_type: <StatusComponent title="Standard" color={dataColors.success} />,
            config_cost_center: 'Re-Test',
            basecost: `$${item?.totalCustomizationPrice}`,
            store: 'LNG Store',
            delivery_date: '2025-07-22',
            handling_time: '2025-07-22',
            case: '',
            subItems: [
              {
                key: '1-1',
                product: <SubItemImage linkImage={item?.baseImageUrl} />,
                sku: <SubItemSku sku={item?.sku} asin={item?.asin} />,
                price: <SubItemCustom items={item?.version3Data} customUrl={item?.customized_url} />,
                quantity: <SubItemQuantity quantity={item?.quantity} />,
                cost_center: <SubItemCost />,
                tracking_note: <SubItemTracking status={item?.status} orderId={item?.orderId} fetchAllOrder={fetchAllOrder} />,
              },
            ],
          };
        });
        setOrders(results);
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    }
  });

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

  useEffect(() => {
    fetchAllOrder();
  }, [fetchAllOrder]);
  return (
    <div className="px-8 py-4 h-full">
      <div className="flex gap-3 items-center">
        <ButtonFilter />
        <ButtonFilter />
        <ButtonFilter />
        <ButtonFilter />
        <ButtonFilter />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex w-[40%] gap-2">
          <Input
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
          <Pagination total={85} showTotal={(total) => `Total ${total} items`} defaultPageSize={20} defaultCurrent={1} />
        </div>
      </div>
      <div className="mt-4">
        <Table columns={columns} dataSource={orders} expandable={{ expandedRowRender }} rowKey="key" bordered pagination={false} />
      </div>
    </div>
  );
};

export default Home;
