import { Flex, Image, Input, Pagination, Table, Tooltip } from 'antd';
import { dataColors } from '../../utils/dataColors';
import SelectFilter from '../../components/SelectFilter';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import StatusComponent from '../../components/StatusComponent';
import { formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import { TbBlender } from 'react-icons/tb';
import { dataFilterStatusQC } from '../../utils/dataFilter';
import ButtonFilter from '../../components/ButtonFilter';
import QcCanvasModal from './ModalQC';
import { MdOutlineImageSearch } from 'react-icons/md';

const PAGE_SIZE = 10;

const data = [
  {
    orderId: '111-6203804-0864268',
    baseImageUrl:
      'https://m.media-amazon.com/images/S/gestalt-seller-images-prod-us-east-1/ATVPDKIKX0DER/AJU55GT2TGET2/174426aa6ba2269328786708824f7f03.jpg',
    purchase_date: '2025-08-22T23:13:09.000Z',
    scale_status: 'Pending',
    seller: 'Nguyễn Huy Hoàng',
    status_order: 'New',
    scale_by: 'Lê Thị Phương CS',
  },
  {
    orderId: '111-6203804-0864268',
    baseImageUrl:
      'https://m.media-amazon.com/images/S/gestalt-seller-images-prod-us-east-1/ATVPDKIKX0DER/AJU55GT2TGET2/174426aa6ba2269328786708824f7f03.jpg',
    purchase_date: '2025-08-22T23:13:09.000Z',
    scale_status: 'Pending',
    seller: 'Nguyễn Huy Hoàng',
    status_order: 'New',
    scale_by: 'Lê Thị Phương CS',
  },
  {
    orderId: '111-6203804-0864268',
    baseImageUrl:
      'https://m.media-amazon.com/images/S/gestalt-seller-images-prod-us-east-1/ATVPDKIKX0DER/AJU55GT2TGET2/174426aa6ba2269328786708824f7f03.jpg',
    purchase_date: '2025-08-22T23:13:09.000Z',
    scale_status: 'Pending',
    seller: 'Nguyễn Huy Hoàng',
    status_order: 'New',
    scale_by: 'Lê Thị Phương CS',
  },
  {
    orderId: '111-6203804-0864268',
    baseImageUrl:
      'https://m.media-amazon.com/images/S/gestalt-seller-images-prod-us-east-1/ATVPDKIKX0DER/AJU55GT2TGET2/174426aa6ba2269328786708824f7f03.jpg',
    purchase_date: '2025-08-22T23:13:09.000Z',
    scale_status: 'Pending',
    seller: 'Nguyễn Huy Hoàng',
    status_order: 'New',
    scale_by: 'Lê Thị Phương CS',
  },
];

const QC = () => {
  const { collapsed } = useOutletContext();
  const [dataSource, setDataSource] = useState([data]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusQC[0]);
  const [openModalQC, setOpenMOdalQC] = useState(false);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    statuses: 'New',
    search: '',
  });

  const imageUrl =
    'https://res.cloudinary.com/debr5x898/image/upload/v1755856565/fulfillment_files/111-2238146-6478638-137072151658201.png';

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

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Order ID</span>,
      dataIndex: 'orderId',
      key: 'orderId',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.purple} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Image Order</span>,
      dataIndex: 'baseImageUrl',
      key: 'baseImageUrl',
      align: 'center',
      render: (data) => (
        <div className="flex justify-center items-center">
          <div className="w-[80px] h-[80px] rounded-lg overflow-hidden flex gap-2 shadow-md">
            <Image src={data} width={80} height={80} className="rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Order Date</span>,
      dataIndex: 'purchase_date',
      key: 'purchase_date',
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
      title: <span style={{ color: dataColors.title }}>Scale Status</span>,
      dataIndex: 'scale_status',
      key: 'scale_status',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.pending} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Order Owner</span>,
      dataIndex: 'seller',
      key: 'seller',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.asin} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Scale By </span>,
      dataIndex: 'scale_by',
      key: 'scale_by',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.cancelled} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status Order</span>,
      dataIndex: 'status_order',
      key: 'status_order',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.success} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Action</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      render: (data) => (
        <Tooltip title="QC">
          <button
            className="cursor-pointer border rounded"
            style={{ padding: 6, borderColor: dataColors.default }}
            onClick={() => setOpenMOdalQC(true)}
          >
            <MdOutlineImageSearch size={20} />
          </button>
        </Tooltip>
      ),
    },
  ];

  const handleSearch = (e) => {
    if (!e.target.value) {
      updateFilter({ search: '' });
      return;
    }
    updateFilter({ search: e.target.value });
  };

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            QC Fulfillment
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              //   onClick={handleClickAdd}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add QC
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex gap-3 items-center">
          {dataFilterStatusQC.map((item, index) => (
            <ButtonFilter
              key={index}
              item={item}
              isActive={isActiveFilter?.key}
              // handleFilterForStatus={handleFilterForStatus}
              setIsActivefilter={setIsActivefilter}
              count={item?.count}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              onChange={handleSearch}
              placeholder="Search..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center">
              <SelectFilter
                title="Seller"
                ListData={['Nguyễn Huy Hoàng', 'Tạ Khánh Tùng']}
                // value={selectShop}
                // onChange={(val) => {
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
              defaultPageSize={10}
              defaultCurrent={1}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table columns={columns} dataSource={data} rowKey="key" bordered={true} pagination={false} loading={loading} />
        </div>
      </div>
      <QcCanvasModal
        open={openModalQC}
        onClose={() => setOpenMOdalQC(false)}
        imageUrl={imageUrl}
        baseImages={[
          'https://m.media-amazon.com/images/S/gestalt-seller-images-prod-us-east-1/ATVPDKIKX0DER/AJU55GT2TGET2/174426aa6ba2269328786708824f7f03.jpg',
          'https://res.cloudinary.com/debr5x898/image/upload/v1755824180/snapshot_images/197d0b44-daa3-7f11-1da2-5b083a16aed7.jpg',
        ]}
        orderInfo={{
          order_id: '111-5227489-8109016',
          asin: 'B0FLDG8CCC',
          sku: 'J2503-TL-06082025-2224',
          size: '3XL',
          color: 'Royal Blue',
          vendor: 'LNGGroup',
          quantity: 1,
          product_name: 'Printed PET Hoodile',
          fulfill_name: '13707215165820113707215165820113',
          version3Data: [
            {
              label: 'Custom Name',
              value: 'Mrs.Finney',
            },
            {
              label: 'Select Product Type',
              value: 'Comfort Color T-Shirt',
            },
            {
              label: 'Comfort Color',
              value: 'Orchid',
            },
            {
              label: 'Select Size',
              value: 'XL',
            },
            {
              label: 'Priority Production',
              value: 'No, Thanks.',
            },
            {
              label: 'If we brought a smile to your day, then our job here is done – sprinkles on the cupcake!',
              value: 'Thank you!!!',
            },
            {
              label: 'Priority Production',
              value: 'No, Thanks.',
            },
          ],
        }}
        onPass={(p) => console.log('PASS', p)}
        onReject={(p) => console.log('REJECT', p)}
        stageWidth={900}
        stageHeight={520}
      />
    </div>
  );
};

export default QC;
