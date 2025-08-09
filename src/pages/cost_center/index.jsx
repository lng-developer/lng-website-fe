import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Button, Flex, Input, Modal, Popover, Select, Tooltip } from 'antd';
import { Space, Table, Tag } from 'antd';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { MdDeleteOutline, MdOutlineRemoveRedEye } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import ModalView from './ModalView';

// Data cho bảng chính
const dataLevel1 = [
  {
    key: '1',
    name: 'Embroidered Body Suit / Middle (SwaddleAn)',
    date: 'Jul 28, 14:03 PM',
  },
  {
    key: '1',
    name: 'Embroidered Body Suit / Middle (SwaddleAn)',
    date: 'Jul 28, 14:03 PM',
  },
];

const dataLevel2 = [
  {
    no: 1,
    key: '1',
    name: 'Embroidered Body Suit / Middle (SwaddleAn)',
    date: 'Jul 28, 14:03 PM',
    vendor: 'GodGroup',
    productId: 'BSE',
    productName: 'Body Suit Embroidered',
    isVariant: 'TRUE',
    status: 'Active',
    items: [
      {
        key: '1',
        sku: 'GGBSEL06MD',
        godSize: '0-3 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '0-3 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '2',
        sku: 'GGBSE3XL06MD',
        godSize: '12-18 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '12-18 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '3',
        sku: 'GGBSE4XL06MD',
        godSize: '18-24 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '18-24 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '4',
        sku: 'GGBSEXL06MD',
        godSize: '3-6 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '3-6 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '5',
        sku: 'GGBSE2XL06MD',
        godSize: '6-12 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '6-12 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '6',
        sku: 'GGBSEM06MD',
        godSize: 'Newborn / Middle',
        godColor: 'Blue Bell',
        standardSize: 'NEWBORN',
        standardColor: 'Blue Bell',
      },
      {
        key: '7',
        sku: 'GGBSES06MD',
        godSize: 'Preemie / Middle',
        godColor: 'Blue Bell',
        standardSize: 'PREEMIE',
        standardColor: 'Blue Bell',
      },
      {
        key: '8',
        sku: 'GGBSEL07MD',
        godSize: '0-3 months / Middle',
        godColor: 'Blue Depths',
        standardSize: '0-3 MONTHS',
        standardColor: 'Blue Depths',
      },
      {
        key: '9',
        sku: 'GGBSE3XL07MD',
        godSize: '12-18 months / Middle',
        godColor: 'Blue Depths',
        standardSize: '12-18 MONTHS',
        standardColor: 'Blue Depths',
      },
      {
        key: '10',
        sku: 'GGBSE4XL07MD',
        godSize: '18-24 months / Middle',
        godColor: 'Blue Depths',
        standardSize: '18-24 MONTHS',
        standardColor: 'Blue Depths',
      },
      {
        key: '1',
        sku: 'GGBSEL06MD',
        godSize: '0-3 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '0-3 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '2',
        sku: 'GGBSE3XL06MD',
        godSize: '12-18 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '12-18 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '3',
        sku: 'GGBSE4XL06MD',
        godSize: '18-24 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '18-24 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '4',
        sku: 'GGBSEXL06MD',
        godSize: '3-6 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '3-6 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '5',
        sku: 'GGBSE2XL06MD',
        godSize: '6-12 months / Middle',
        godColor: 'Blue Bell',
        standardSize: '6-12 MONTHS',
        standardColor: 'Blue Bell',
      },
      {
        key: '6',
        sku: 'GGBSEM06MD',
        godSize: 'Newborn / Middle',
        godColor: 'Blue Bell',
        standardSize: 'NEWBORN',
        standardColor: 'Blue Bell',
      },
      {
        key: '7',
        sku: 'GGBSES06MD',
        godSize: 'Preemie / Middle',
        godColor: 'Blue Bell',
        standardSize: 'PREEMIE',
        standardColor: 'Blue Bell',
      },
      {
        key: '8',
        sku: 'GGBSEL07MD',
        godSize: '0-3 months / Middle',
        godColor: 'Blue Depths',
        standardSize: '0-3 MONTHS',
        standardColor: 'Blue Depths',
      },
      {
        key: '9',
        sku: 'GGBSE3XL07MD',
        godSize: '12-18 months / Middle',
        godColor: 'Blue Depths',
        standardSize: '12-18 MONTHS',
        standardColor: 'Blue Depths',
      },
      {
        key: '10',
        sku: 'GGBSE4XL07MD',
        godSize: '18-24 months / Middle',
        godColor: 'Blue Depths',
        standardSize: '18-24 MONTHS',
        standardColor: 'Blue Depths',
      },
    ],
  },
];

// // Data cho bảng con (SKU details)
const skuData = [
  {
    key: '1',
    sku: 'GGBSEL06MD',
    godSize: '0-3 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '0-3 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '2',
    sku: 'GGBSE3XL06MD',
    godSize: '12-18 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '12-18 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '3',
    sku: 'GGBSE4XL06MD',
    godSize: '18-24 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '18-24 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '4',
    sku: 'GGBSEXL06MD',
    godSize: '3-6 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '3-6 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '5',
    sku: 'GGBSE2XL06MD',
    godSize: '6-12 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '6-12 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '6',
    sku: 'GGBSEM06MD',
    godSize: 'Newborn / Middle',
    godColor: 'Blue Bell',
    standardSize: 'NEWBORN',
    standardColor: 'Blue Bell',
  },
  {
    key: '7',
    sku: 'GGBSES06MD',
    godSize: 'Preemie / Middle',
    godColor: 'Blue Bell',
    standardSize: 'PREEMIE',
    standardColor: 'Blue Bell',
  },
  {
    key: '8',
    sku: 'GGBSEL07MD',
    godSize: '0-3 months / Middle',
    godColor: 'Blue Depths',
    standardSize: '0-3 MONTHS',
    standardColor: 'Blue Depths',
  },
  {
    key: '9',
    sku: 'GGBSE3XL07MD',
    godSize: '12-18 months / Middle',
    godColor: 'Blue Depths',
    standardSize: '12-18 MONTHS',
    standardColor: 'Blue Depths',
  },
  {
    key: '10',
    sku: 'GGBSE4XL07MD',
    godSize: '18-24 months / Middle',
    godColor: 'Blue Depths',
    standardSize: '18-24 MONTHS',
    standardColor: 'Blue Depths',
  },
  {
    key: '1',
    sku: 'GGBSEL06MD',
    godSize: '0-3 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '0-3 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '2',
    sku: 'GGBSE3XL06MD',
    godSize: '12-18 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '12-18 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '3',
    sku: 'GGBSE4XL06MD',
    godSize: '18-24 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '18-24 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '4',
    sku: 'GGBSEXL06MD',
    godSize: '3-6 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '3-6 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '5',
    sku: 'GGBSE2XL06MD',
    godSize: '6-12 months / Middle',
    godColor: 'Blue Bell',
    standardSize: '6-12 MONTHS',
    standardColor: 'Blue Bell',
  },
  {
    key: '6',
    sku: 'GGBSEM06MD',
    godSize: 'Newborn / Middle',
    godColor: 'Blue Bell',
    standardSize: 'NEWBORN',
    standardColor: 'Blue Bell',
  },
  {
    key: '7',
    sku: 'GGBSES06MD',
    godSize: 'Preemie / Middle',
    godColor: 'Blue Bell',
    standardSize: 'PREEMIE',
    standardColor: 'Blue Bell',
  },
  {
    key: '8',
    sku: 'GGBSEL07MD',
    godSize: '0-3 months / Middle',
    godColor: 'Blue Depths',
    standardSize: '0-3 MONTHS',
    standardColor: 'Blue Depths',
  },
  {
    key: '9',
    sku: 'GGBSE3XL07MD',
    godSize: '12-18 months / Middle',
    godColor: 'Blue Depths',
    standardSize: '12-18 MONTHS',
    standardColor: 'Blue Depths',
  },
  {
    key: '10',
    sku: 'GGBSE4XL07MD',
    godSize: '18-24 months / Middle',
    godColor: 'Blue Depths',
    standardSize: '18-24 MONTHS',
    standardColor: 'Blue Depths',
  },
];

const CostCenterProductTypes = () => {
  const { collapsed } = useOutletContext();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [dataView, setDataView] = useState({});

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.key]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys = () => {
    if (isShowRowkeys) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(dataLevel1.map((item) => item.key));
    }
    setIsShowRowKeys((prev) => !prev);
  };

  const columnLevel1 = [
    {
      title: <span style={{ color: dataColors.title }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Date</span>,
      dataIndex: 'date',
      key: 'date',
      render: (text) => <span className="font-medium text-md">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      align: 'center',
      render: () => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="Edit">
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
              <BiSolidEdit size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Delete">
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      ),
    },
  ];

  const columnsLevel2 = [
    {
      title: <span style={{ color: dataColors.title }}>No</span>,
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Vendor</span>,
      dataIndex: 'vendor',
      key: 'vendor',
      align: 'center',
      render: (text) => <span className="font-medium text-md">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Product ID</span>,
      dataIndex: 'productId',
      key: 'productId',
      align: 'center',
      render: (text) => <span className="font-medium text-md">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Is Variant</span>,
      dataIndex: 'isVariant',
      key: 'isVariant',
      align: 'center',
      render: (text) => <span className="font-medium text-md">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (text) => <StatusComponent title={text} color={dataColors.success} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      align: 'center',
      render: (record) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="View">
            <button
              className="cursor-pointer border rounded"
              style={{ padding: 6, borderColor: dataColors.default }}
              onClick={() => {
                setDataView(record?.items);
                setIsOpenModal(true);
              }}
            >
              <MdOutlineRemoveRedEye size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Edit">
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
              <BiSolidEdit size={20} />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Delete">
            <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      ),
    },
  ];

  // Columns cho bảng con (SKU)
  const skuColumns = [
    {
      title: <span style={{ color: dataColors.title }}>SKU</span>,
      dataIndex: 'sku',
      width: 150,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Size</span>,
      dataIndex: 'godSize',
      width: 200,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Color</span>,
      dataIndex: 'godColor',
      width: 150,
      render: (color) => <span>{color}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Size</span>,
      dataIndex: 'standardSize',
      width: 150,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Color</span>,
      dataIndex: 'standardColor',
      width: 150,
      render: (color) => <span>{color}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      width: 80,
      align: 'center',
      render: () => (
        <Tooltip placement="top" title="Delete">
          <button className="cursor-pointer border rounded" style={{ padding: 6, borderColor: dataColors.default }}>
            <MdDeleteOutline size={20} />
          </button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Product Type Groups
          </h1>
          <div className="flex justify-center items-center">
            <button className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer">
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Create Product Type
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <Input
          //   onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
        />
        <div className="mt-4">
          <Table
            className="no-indent-table"
            columns={columnLevel1}
            dataSource={dataLevel1}
            expandable={{
              indentSize: 0,
              expandedRowRender: () => (
                <Table
                  className="no-indent-table"
                  columns={columnsLevel2}
                  dataSource={dataLevel2}
                  pagination={false}
                  expandable={{
                    indentSize: 0,
                    expandedRowRender: () => (
                      <Table
                        className="no-indent-table"
                        columns={skuColumns}
                        dataSource={skuData}
                        pagination={true}
                        bordered={true}
                        rowKey="key"
                        style={{ padding: 10, paddingBottom: 0 }}
                      />
                    ),
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
                  bordered={true}
                  rowKey="key"
                  style={{ padding: 10, paddingBottom: 0 }}
                />
              ),
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
            bordered={true}
            pagination={false}
            rowKey="key"
          />
        </div>
      </div>
      <ModalView isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} dataSource={dataView || []} />
    </div>
  );
};

export default CostCenterProductTypes;
