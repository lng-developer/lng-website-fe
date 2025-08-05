import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { Flex, Input, Modal, Popover, Select } from 'antd';
import { useEffect, useState } from 'react';
import { Space, Table, Tag } from 'antd';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { MdDeleteOutline } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import { addVendor, deleteVendor, getALlVendor, updateVender } from '../../apis/vendor';
import { toast } from 'react-toastify';

const Vendor = () => {
  const { collapsed } = useOutletContext();
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  const [isShowModalDelete, setIsShowModalDelete] = useState(false);
  const [isShowModalAdd, setIsShowModalAdd] = useState(false);
  const [selected, setSelected] = useState({});
  const [valueEdit, setValueEdit] = useState('');
  const [vendors, setVendors] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState('');
  const [valueAdd, setValueAdd] = useState('');

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Name</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div className="h-full" style={{ verticalAlign: 'middle' }}>
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Fulfillment Type</span>,
      dataIndex: 'fulfillment_type',
      key: 'fulfillment_type',
      render: (text) => {
        const colorMap = {
          API: '#CE4997',
          Shopify: '#95C136',
          Manual: '#39AAAE',
        };

        return (
          <div
            className="inline-flex items-center rounded-full px-4 py-1 text-xs border-1 transition-colors font-medium text-foreground"
            style={{ backgroundColor: colorMap[text] || 'gray', borderColor: colorMap[text] }}
          >
            <span className="text-white font-medium text-md">{text}</span>
          </div>
        );
      },
    },
    {
      title: <span style={{ color: dataColors.title }}>Active</span>,
      dataIndex: 'active',
      key: 'active',
      render: (text) => <StatusComponent title={text} color={dataColors.success} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      render: (_, record) => {
        return (
          <Flex gap={10}>
            <Popover content={<div className="font-medium">Edit</div>} title="">
              <button
                className="cursor-pointer"
                onClick={() => {
                  setValueEdit(record?.name);
                  setSelected(record);
                  setIsShowModalUpdate(true);
                }}
              >
                <BiSolidEdit size={20} />
              </button>
            </Popover>
            <Popover content={<div className="font-medium">Delete</div>} title="">
              <button
                className="cursor-pointer"
                onClick={() => {
                  setSelected(record);
                  setIsShowModalDelete(true);
                }}
              >
                <MdDeleteOutline size={20} />
              </button>
            </Popover>
          </Flex>
        );
      },
    },
  ];

  const fetchAllVendor = async () => {
    try {
      const response = await getALlVendor();
      if (response.status === 200) {
        const result = response.data.map((item) => {
          return {
            key: item?._id,
            name: item?.name,
            active: item?.status,
            fulfillment_type: item?.fulfillment_type,
          };
        });
        setVendors(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleClickAdd = () => {
    setIsShowModalAdd(true);
  };

  const handleEditVendor = async () => {
    try {
      const response = await updateVender(selected?.key, valueEdit);
      if (response.status === 200) {
        toast.success('Update success!');
        fetchAllVendor();
      } else {
        toast.error('Update error!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Add vendor error!');
    } finally {
      setIsShowModalUpdate(false);
    }
  };

  const handleDeleteVendor = async () => {
    try {
      const response = await deleteVendor(selected?.key);
      if (response.status === 204) {
        toast.success('Delete vendor success!');
        fetchAllVendor();
      } else {
        toast.error('Delete vendor error!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Delete vendor error!');
    } finally {
      setIsShowModalDelete(false);
    }
  };

  const handleAddVendor = async () => {
    try {
      const response = await addVendor(valueAdd, fulfillmentType);
      if (response.status === 201) {
        toast.success('Add vendor success!');
        fetchAllVendor();
      } else {
        toast.error('Add vendor error!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Add vendor error!');
    } finally {
      setIsShowModalAdd(false);
    }
  };

  const handleSearch = (value) => {
    if (!value) {
      fetchAllVendor();
      return;
    }
    const results = vendors.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));
    setVendors(results);
  };

  useEffect(() => {
    fetchAllVendor();
  }, []);
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Vendor Fulfill
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={handleClickAdd}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Vendor Fulfill
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <Input
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
        />
        <div className="mt-4">
          <Table columns={columns} dataSource={vendors} pagination={false} />
        </div>
      </div>
      <Modal
        title="Edit Vendor"
        width={300}
        style={{ top: '30%' }}
        okText="Save"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalUpdate}
        onOk={handleEditVendor}
        onCancel={() => setIsShowModalUpdate(false)}
      >
        <Flex vertical={true} gap={2}>
          <span className="font-medium">Name</span>
          <Input
            defaultValue={valueEdit}
            value={valueEdit}
            onChange={(e) => setValueEdit(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
        </Flex>
      </Modal>
      <Modal
        title="Delete Vendor"
        width={500}
        style={{ top: '30%' }}
        okText="Confirm"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalDelete}
        onOk={handleDeleteVendor}
        onCancel={() => setIsShowModalDelete(false)}
      >
        <span className="font-medium text-[#64748b]">Are you sure you want to delete this vendor? This action cannot be undone.</span>
      </Modal>
      <Modal
        title="Add Vendor"
        width={350}
        style={{ top: '30%' }}
        okText="Create"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalAdd}
        onOk={handleAddVendor}
        onCancel={() => setIsShowModalAdd(false)}
      >
        <Flex vertical={true} gap={10} style={{ paddingBottom: 10 }}>
          <Flex vertical={true} gap={2}>
            <span className="font-medium">Name</span>
            <Input
              defaultValue={valueAdd}
              value={valueAdd}
              placeholder="Name"
              onChange={(e) => setValueAdd(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </Flex>
          <Flex vertical={true} gap={2} className="my-2">
            <span className="font-medium">Fulfillment Type</span>
            <Select
              onChange={(value) => setFulfillmentType(value)}
              placeholder="Select Fulfillment Type"
              options={[
                { value: 'API', label: 'API' },
                { value: 'Manual', label: 'Manual' },
                { value: 'Shopify', label: 'Shopify' },
              ]}
            />
          </Flex>
        </Flex>
      </Modal>
    </div>
  );
};

export default Vendor;
