import { Link, useOutletContext, useNavigationType } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Flex, Image, Input, Modal, Pagination, Popover, Select, Switch, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { dataColors } from '../../utils/dataColors';
import { useEffect, useState } from 'react';
import { getALlVendor, getALlVendorProduct, updateVendorProduct } from '../../apis/vendor';
import NoImage from '../../assets/NoImage.jpg';
import ModalCreatVendorProduct from './ModalCreatVendorProduct';
import { LuImport } from 'react-icons/lu';
import ModalImportVendor from './ModalImportVendor';
import { toast } from 'react-toastify';
const PAGE_SIZE = 10;

const VendorProduct = () => {
  const { collapsed } = useOutletContext();
  const [vendorProducts, setVendorProducts] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isShowModalAdd, setIsShowModalAdd] = useState(false);
  const [isShowModalImport, setIsShowModalImport] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    search: '',
    vendor: '',
  });
  const navType = useNavigationType();

  const handleChangeStatus = async (id, value) => {
    try {
      const status = value === true ? 'Active' : 'InActive';
      const response = await updateVendorProduct(id, { status: status });
      if (response.status === 200) {
        toast.success('Update status success!');
        fetchAllVendorProduct(filters);
      }
    } catch (error) {
      console.log(error);
      toast.error('Change status error!');
    }
  };

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    updateFilter({ page: page, perPage: pageSize });
  };

  // Xử lý search
  const handleSearch = (e) => {
    if (!e.target.value) {
      updateFilter({ search: '' });
      return;
    }
    updateFilter({ search: e.target.value });
  };

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
      render: (text) => <Image width={100} src={text ? text : NoImage} className="rounded-lg overflow-hidden" />,
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
      dataIndex: 'payload',
      key: 'payload',
      render: (text) => (
        <Link
          to={`/vendor/vendor-products/${text?.id}`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-5 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]"
          state={{ name: text?.name }}
        >
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
      render: () => (
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
      render: (text) => (
        <Switch checked={text?.status === 'Active' ? true : false} onChange={(value) => handleChangeStatus(text?._id, value)} />
      ),
      align: 'center',
    },
  ];

  const fetchAllVendorProduct = async (params) => {
    try {
      const response = await getALlVendorProduct(params);
      if (response.status === 200) {
        const result = response.data?.data?.map((item, index) => {
          return {
            key: item?._id,
            index: index + 1,
            product_name: item?.product_name,
            image: item?.image,
            product_id: item?.product_id,
            payload: {
              id: item?._id,
              name: item?.product_name,
            },
            vendor_id: item?.vendor?.name,
            type: item?.status,
            status: {
              status: item?.status,
              _id: item?._id,
            },
          };
        });
        setVendorProducts(result);
        setTotal(response.data?.total);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllVendor = async () => {
    try {
      const response = await getALlVendor();
      if (response.status === 200) {
        const result = response.data?.map((item) => {
          return {
            value: item?._id,
            label: item?.name,
          };
        });
        setVendors(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllVendor();
  }, []);

  useEffect(() => {
    if (navType === 'POP') {
      return;
    }
    fetchAllVendorProduct(filters);
  }, [filters]);
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Vendor Products
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setIsShowModalImport(true)}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Vendor Product
              </span>
              <LuImport size={15} color="black" />
            </button>
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setIsShowModalAdd(true)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Create Vendor Product
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center">
          <Flex gap={8} style={{ width: '40%' }}>
            <Input
              onChange={handleSearch}
              placeholder="Search..."
              width={200}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <SelectFilter
              title={'Vendor'}
              ListData={vendors.map((item) => item?.label)}
              value={vendor}
              onChange={(val) => {
                updateFilter({ vendor_name: val });
                setVendor(val);
              }}
            />
          </Flex>
          <Pagination
            total={total}
            showTotal={(total) => `Total ${total} items`}
            defaultPageSize={PAGE_SIZE}
            defaultCurrent={currentPage}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
          />
        </div>
        <div className="mt-4">
          <Table columns={columns} dataSource={vendorProducts} pagination={false} bordered />
        </div>
      </div>
      <ModalCreatVendorProduct
        isShowModalAdd={isShowModalAdd}
        setIsShowModalAdd={setIsShowModalAdd}
        filters={filters}
        fetchAllProductCostCenter={fetchAllVendorProduct}
        vendors={vendors}
      />
      <ModalImportVendor
        isModalOpen={isShowModalImport}
        setIsModalOpen={setIsShowModalImport}
        filters={filters}
        fetchAllProductCostCenter={fetchAllVendorProduct}
        vendors={vendors}
      />
    </div>
  );
};

export default VendorProduct;
