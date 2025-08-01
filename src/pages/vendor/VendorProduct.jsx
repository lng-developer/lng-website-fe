import { Link, useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Flex, Image, Input, Modal, Pagination, Popover, Select, Switch, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { dataColors } from '../../utils/dataColors';
import { useEffect, useState } from 'react';
import { getALlVendorProduct } from '../../apis/vendor';
const VendorProduct = () => {
  const { collapsed } = useOutletContext();
  const [vendorProducts, setVendorProducts] = useState([]);

  const columns = [
    {
      title: <span style={{ color: dataColors.title, fontSize: 16 }}>#</span>,
      dataIndex: 'index',
      key: 'index',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Image</span>,
      dataIndex: 'image',
      key: 'image',
      render: (text) => (
        <Image
          width={100}
          src={'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'}
          className="rounded-lg overflow-hidden"
        />
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Product Name Vendor</span>,
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Product ID</span>,
      dataIndex: 'product_id',
      key: 'product_id',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Cost Center</span>,
      dataIndex: '_id',
      key: '_id',
      render: (text) => (
        <Link className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-5 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]">
          View
        </Link>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Vendor</span>,
      dataIndex: 'vendor_id',
      key: 'vendor_id',
      render: (text) => (
        <div
          className="inline-flex items-center rounded-full px-4 py-1 text-xs transition-colors font-medium text-foreground"
          style={{ backgroundColor: '#95C136' }}
        >
          <span className="text-white font-medium text-md">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Product Type For Design </span>,
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <Select
          defaultValue="lucy"
          style={{ width: 200 }}
          options={[
            { value: 'jack', label: 'Jack' },
            { value: 'lucy', label: 'Lucy' },
            { value: 'Yiminghe', label: 'yiminghe' },
          ]}
        />
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Switch defaultChecked />,
      align: 'center',
    },
  ];

  const fetchAllVendorProduct = async () => {
    try {
      const response = await getALlVendorProduct();
      if (response.status === 200) {
        const result = response.data.map((item, index) => {
          return {
            key: item?._id,
            index: index + 1,
            product_name: item?.product_name,
            image: item?.image,
            product_id: item?.product_id,
            _id: item?.product_id,
            vendor_id: item?.vendor_id?.name,
            type: item?.status,
            status: item?.status,
          };
        });
        setVendorProducts(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllVendorProduct();
  }, []);
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-20'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Vendor Products
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              // onClick={handleClickAdd}
            >
              <MdAdd size={20} />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Create Vendor Product
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center mt-4">
          <Flex gap={8} style={{ width: '40%' }}>
            <Input
              // onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              width={200}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <SelectFilter />
          </Flex>
          <Pagination total={vendorProducts.length} showTotal={(total) => `Total ${total} items`} defaultPageSize={10} defaultCurrent={1} />
        </div>
        <div className="mt-4">
          <Table columns={columns} dataSource={vendorProducts} pagination={false} />
        </div>
      </div>
    </div>
  );
};

export default VendorProduct;
