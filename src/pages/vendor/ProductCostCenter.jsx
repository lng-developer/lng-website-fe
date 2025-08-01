import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Flex, Image, Input, Modal, Pagination, Popover, Select, Switch, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { dataColors } from '../../utils/dataColors';
import { useEffect, useState } from 'react';
import { getProductCostCenter } from '../../apis/vendor';
import { MdHistory, MdOutlineArrowBack } from 'react-icons/md';
import { LuImport } from 'react-icons/lu';

const ProductCostCenter = () => {
  const { collapsed } = useOutletContext();
  const [productCostCenter, setProductCostCenter] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [nameProductCostCenter, setNameProductCostCenter] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys,
    onChange: (newKeys) => {
      setSelectedRowKeys(newKeys);
    },
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Vendor Size</span>,
      dataIndex: 'vendor_size',
      key: 'vendor_size',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Size</span>,
      dataIndex: 'standard_size',
      key: 'standard_size',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Color</span>,
      dataIndex: 'vendor_color',
      key: 'vendor_color',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>SKU</span>,
      dataIndex: 'sku',
      key: 'sku',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Base Cost</span>,
      dataIndex: 'base_cost',
      key: 'base_cost',
      render: (text) => (
        <div className="h-full">
          <span className="font-medium">{text}</span>
        </div>
      ),
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Domestic</span>,
      children: [
        {
          title: <span style={{ color: dataColors.title }}>Economy</span>,
          dataIndex: 'dosmetic',
          key: 'economy',
          align: 'center',
          render: (text) => (
            <div className="h-full">
              <span className="font-medium">{text?.economy}</span>
            </div>
          ),
        },
        {
          title: <span style={{ color: dataColors.title }}>Additional</span>,
          dataIndex: 'dosmetic',
          key: 'additional',
          align: 'center',
          render: (text) => (
            <div className="h-full">
              <span className="font-medium">{text?.additional}</span>
            </div>
          ),
        },
      ],
    },
    {
      title: <span style={{ color: dataColors.title }}>International</span>,
      children: [
        {
          title: <span style={{ color: dataColors.title }}>Economy</span>,
          dataIndex: 'international',
          key: 'internationalEconomy',
          align: 'center',
          render: (text) => (
            <div className="h-full">
              <span className="font-medium">{text?.economy}</span>
            </div>
          ),
        },
        {
          title: <span style={{ color: dataColors.title }}>Additional</span>,
          dataIndex: 'international',
          key: 'internationalAdditional',
          align: 'center',
          render: (text) => (
            <div className="h-full">
              <span className="font-medium">{text?.additional}</span>
            </div>
          ),
        },
      ],
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
      title: <span style={{ color: dataColors.title }}>History</span>,
      dataIndex: 'history',
      key: 'history',
      render: (text) => (
        <div className="flex justify-center items-center cursor-pointer ">
          <MdHistory size={20} />
        </div>
      ),
      align: 'center',
      fixed: 'right',
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Switch checked={text === 'Active' ? true : false} />,
      align: 'center',
      fixed: 'right',
    },
  ];

  const fetchAllProductCostCenter = async () => {
    try {
      const response = await getProductCostCenter(id);
      if (response.status === 200) {
        setProductCostCenter(response?.data?.items);
        setNameProductCostCenter(response?.data?.vendor_product_name);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchAllProductCostCenter();
  }, []);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-20'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Cost Centers {nameProductCostCenter ? `- ${nameProductCostCenter}` : ''}
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              // onClick={handleClickAdd}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Cost Center
              </span>
              <LuImport size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center mt-4">
          <Flex gap={8} style={{ width: '40%' }}>
            <button
              className="flex justify-center items-center px-3 py-2 border-1 border-[#e2e8f0] rounded-lg cursor-pointer"
              onClick={handleBack}
            >
              <MdOutlineArrowBack />
            </button>
            <Input
              // onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              width={200}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <SelectFilter />
          </Flex>
          <Pagination
            total={productCostCenter.length}
            showTotal={(total) => `Total ${total} items`}
            defaultPageSize={10}
            defaultCurrent={1}
          />
        </div>
        <div className="mt-4">
          <Table
            columns={columns}
            dataSource={productCostCenter}
            rowKey="key"
            bordered={true}
            pagination={false}
            rowSelection={rowSelection}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCostCenter;
