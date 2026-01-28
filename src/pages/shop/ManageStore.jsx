import { useOutletContext } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Flex, Input, Modal, Select, Switch, Table, Tooltip, Tag } from 'antd';
import { MdAdd, MdDeleteOutline, MdPersonAddAlt1 } from 'react-icons/md';
import { BiSolidEdit } from 'react-icons/bi';
import { toast } from 'sonner';

import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';

// API (bạn tạo file theo mục 2 bên dưới)
import { getAllShop, createShop, updateShop, deleteShop, addUserToShop, updateShopStatus } from '../../apis/shop';

const ManageStores = () => {
  const { collapsed } = useOutletContext();

  const [stores, setStores] = useState([]);
  const [dataFilter, setDataFilter] = useState([]);

  // modal states
  const [isShowAdd, setIsShowAdd] = useState(false);
  const [isShowEdit, setIsShowEdit] = useState(false);
  const [isShowDelete, setIsShowDelete] = useState(false);
  const [isShowAddUser, setIsShowAddUser] = useState(false);
  const [isShowUpdateStatus, setIsShowUpdateStatus] = useState(false);

  const [selected, setSelected] = useState(null);

  // form states: Add
  const [addForm, setAddForm] = useState({
    store: '',
    name: '',
    merchant: 'Amazon',
    autoEnabled: true,
    status: 'Active',
  });

  // form states: Edit
  const [editForm, setEditForm] = useState({
    store: '',
    name: '',
    merchant: 'Amazon',
    autoEnabled: true,
    status: 'Active',
  });

  // form states: Add user
  const [addUserForm, setAddUserForm] = useState({
    userIdsText: '',
  });

  // form states: Update status (endpoint riêng)
  const [statusForm, setStatusForm] = useState({
    status: 'Active',
    autoEnabled: true,
  });

  const normalizeStore = (item) => {
    const clients = Array.isArray(item?.clients) ? item.clients : [];
    const lastSeenMax = clients.reduce((acc, c) => {
      const t = c?.lastSeen ? new Date(c.lastSeen).getTime() : 0;
      return Math.max(acc, t);
    }, 0);

    return {
      key: item?._id,
      _id: item?._id,
      store: item?.store || '',
      name: item?.name || '',
      merchant: item?.merchant || '',
      status: item?.status || 'Unknown',
      autoEnabled: Boolean(item?.autoEnabled),
      teamCount: Array.isArray(item?.team) ? item.team.length : 0,
      userCount: Array.isArray(item?.userIds) ? item.userIds.length : 0,
      clientsCount: clients.length,
      clientsLastSeen: lastSeenMax ? new Date(lastSeenMax).toISOString() : '',
      raw: item,
    };
  };

  const fetchAll = async () => {
    try {
      const res = await getAllShop();
      if (res?.status === 200) {
        const rows = (Array.isArray(res?.data) ? res.data : []).map(normalizeStore);
        setStores(rows);
        setDataFilter(rows);
      } else {
        toast.error('Get stores failed!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Get stores error!');
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSearch = (value) => {
    if (!value) {
      setStores(dataFilter);
      return;
    }
    const v = value.toLowerCase();
    const results = dataFilter.filter((x) => {
      return (
        (x.store || '').toLowerCase().includes(v) ||
        (x.name || '').toLowerCase().includes(v) ||
        (x.merchant || '').toLowerCase().includes(v) ||
        (x.status || '').toLowerCase().includes(v)
      );
    });
    setStores(results);
  };

  const parseUserIds = (raw = '') => {
    return raw
      .split(/[\n,; \t]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // Actions
  const onOpenAdd = () => {
    setAddForm({ store: '', name: '', merchant: 'Amazon', autoEnabled: true, status: 'Active' });
    setIsShowAdd(true);
  };

  const onOpenEdit = (record) => {
    setSelected(record);
    setEditForm({
      store: record?.store || '',
      name: record?.name || '',
      merchant: record?.merchant || 'Amazon',
      autoEnabled: Boolean(record?.autoEnabled),
      status: record?.status || 'Active',
    });
    setIsShowEdit(true);
  };

  const onOpenDelete = (record) => {
    setSelected(record);
    setIsShowDelete(true);
  };

  const onOpenAddUser = (record) => {
    setSelected(record);
    setAddUserForm({ userIdsText: '' });
    setIsShowAddUser(true);
  };

  const onOpenUpdateStatus = (record) => {
    setSelected(record);
    setStatusForm({
      status: record?.status || 'Active',
      autoEnabled: Boolean(record?.autoEnabled),
    });
    setIsShowUpdateStatus(true);
  };

  const handleCreate = async () => {
    try {
      if (!addForm.store?.trim() || !addForm.name?.trim()) {
        toast.error('Store & Name are required!');
        return;
      }
      const payload = {
        store: addForm.store.trim(),
        name: addForm.name.trim(),
        merchant: addForm.merchant,
        autoEnabled: Boolean(addForm.autoEnabled),
        status: addForm.status,
      };
      const res = await createShop(payload);
      if (res?.status === 201 || res?.status === 200) {
        toast.success('Create store success!');
        await fetchAll();
        setIsShowAdd(false);
      } else {
        toast.error('Create store failed!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Create store error!');
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selected?._id) return;

      if (!editForm.store?.trim() || !editForm.name?.trim()) {
        toast.error('Store & Name are required!');
        return;
      }

      const payload = {
        store: editForm.store.trim(),
        name: editForm.name.trim(),
        merchant: editForm.merchant,
        autoEnabled: Boolean(editForm.autoEnabled),
        status: editForm.status,
      };

      const res = await updateShop(selected._id, payload);
      if (res?.status === 200) {
        toast.success('Update store success!');
        await fetchAll();
        setIsShowEdit(false);
      } else {
        toast.error('Update store failed!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Update store error!');
    }
  };

  const handleRemove = async () => {
    try {
      if (!selected?._id) return;
      const res = await deleteShop(selected._id);
      // bạn có thể đang trả 204 giống vendor
      if (res?.status === 204 || res?.status === 200) {
        toast.success('Delete store success!');
        await fetchAll();
      } else {
        toast.error('Delete store failed!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Delete store error!');
    } finally {
      setIsShowDelete(false);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!selected?._id) return;

      const userIds = parseUserIds(addUserForm.userIdsText);
      if (!userIds.length) {
        toast.error('UserIds is required!');
        return;
      }

      const payload = { shopId: selected._id, userIds };
      const res = await addUserToShop(payload);

      if (res?.status === 200) {
        toast.success('Add user to shop success!');
        await fetchAll();
        setIsShowAddUser(false);
      } else {
        toast.error('Add user to shop failed!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Add user to shop error!');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      if (!selected?._id) return;

      const payload = {
        shopId: selected._id,
        status: statusForm.status,
        autoEnabled: Boolean(statusForm.autoEnabled),
      };

      const res = await updateShopStatus(payload);
      if (res?.status === 200) {
        toast.success('Update status success!');
        await fetchAll();
        setIsShowUpdateStatus(false);
      } else {
        toast.error('Update status failed!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Update status error!');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: <span style={{ color: dataColors.title }}>Store</span>,
        dataIndex: 'store',
        key: 'store',
        render: (text) => (
          <div className="h-full" style={{ verticalAlign: 'middle' }}>
            <span className="font-medium">{text}</span>
          </div>
        ),
      },
      {
        title: <span style={{ color: dataColors.title }}>Name</span>,
        dataIndex: 'name',
        key: 'name',
        render: (text) => <span className="font-medium">{text}</span>,
      },
      {
        title: <span style={{ color: dataColors.title }}>Merchant</span>,
        dataIndex: 'merchant',
        key: 'merchant',
        render: (text) => (
          <div
            style={{ borderColor: dataColors.asin }}
            className="inline-flex items-center rounded-full px-4 py-1 text-xs border-1 transition-colors font-medium text-foreground"
          >
            <span style={{ color: dataColors.asin }} className="font-medium text-md">
              {text}
            </span>
          </div>
        ),
      },
      {
        title: <span style={{ color: dataColors.title }}>Status</span>,
        dataIndex: 'status',
        key: 'status',
        render: (text) => <StatusComponent title={text} color={text === 'Active' ? dataColors.success : dataColors.title} />,
      },
      {
        title: <span style={{ color: dataColors.title }}>Auto</span>,
        dataIndex: 'autoEnabled',
        key: 'autoEnabled',
        width: 90,
        render: (v) => <span className="font-medium">{v ? 'On' : 'Off'}</span>,
      },
      //   {
      //     title: <span style={{ color: dataColors.title }}>Users</span>,
      //     dataIndex: 'userCount',
      //     key: 'userCount',
      //     width: 90,
      //     render: (v) => <span className="font-medium">{v ?? 0}</span>,
      //   },
      //   {
      //     title: <span style={{ color: dataColors.title }}>Clients</span>,
      //     dataIndex: 'clientsCount',
      //     key: 'clientsCount',
      //     width: 90,
      //     render: (v, record) => {
      //       const last = record?.clientsLastSeen ? new Date(record.clientsLastSeen).toLocaleString() : '—';
      //       return (
      //         <Tooltip title={`Last seen: ${last}`}>
      //           <span className="font-medium">{v ?? 0}</span>
      //         </Tooltip>
      //       );
      //     },
      //   },
      {
        title: <span style={{ color: dataColors.title }}>Actions</span>,
        key: 'actions',
        width: 170,
        render: (_, record) => (
          <Flex gap={10}>
            <Tooltip title="Edit">
              <button
                className="cursor-pointer border rounded"
                style={{ padding: 6, borderColor: dataColors.default }}
                onClick={() => onOpenEdit(record)}
              >
                <BiSolidEdit size={20} />
              </button>
            </Tooltip>

            {/* <Tooltip title="Add User">
              <button
                className="cursor-pointer border rounded"
                style={{ padding: 6, borderColor: dataColors.default }}
                onClick={() => onOpenAddUser(record)}
              >
                <MdPersonAddAlt1 size={20} />
              </button>
            </Tooltip> */}

            {/* <Tooltip title="Update Status">
              <button
                className="cursor-pointer border rounded"
                style={{ padding: 6, borderColor: dataColors.default }}
                onClick={() => onOpenUpdateStatus(record)}
              >
                <span className="text-sm font-medium">S</span>
              </button>
            </Tooltip> */}

            <Tooltip title="Delete">
              <button
                className="cursor-pointer border rounded"
                style={{ padding: 6, borderColor: dataColors.default }}
                onClick={() => onOpenDelete(record)}
              >
                <MdDeleteOutline size={20} />
              </button>
            </Tooltip>
          </Flex>
        ),
      },
    ],
    []
  );

  return (
    <div>
      {/* Header fixed - giống Vendor */}
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Stores
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={onOpenAdd}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Store
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-[60px] px-8 py-4 h-full">
        <Input
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
        />
        <div className="mt-4">
          <Table columns={columns} dataSource={stores} pagination={false} bordered />
        </div>
      </div>

      {/* Add Store */}
      <Modal
        title="Add Store"
        width={420}
        style={{ top: '30%' }}
        okText="Create"
        open={isShowAdd}
        onOk={handleCreate}
        onCancel={() => setIsShowAdd(false)}
        closable={{ 'aria-label': 'Custom Close Button' }}
      >
        <Flex vertical gap={12} style={{ paddingBottom: 10 }}>
          <Flex vertical gap={6}>
            <span className="font-medium">Store</span>
            <Input
              value={addForm.store}
              placeholder="Acc 1 / LNG Boutique..."
              onChange={(e) => setAddForm((p) => ({ ...p, store: e.target.value }))}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </Flex>

          <Flex vertical gap={6}>
            <span className="font-medium">Name</span>
            <Input
              value={addForm.name}
              placeholder="Acc1 / LNG Boutique..."
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </Flex>

          <Flex vertical gap={6}>
            <span className="font-medium">Merchant</span>
            <Select
              value={addForm.merchant}
              onChange={(v) => setAddForm((p) => ({ ...p, merchant: v }))}
              options={[
                { value: 'Amazon', label: 'Amazon' },
                { value: 'Etsy', label: 'Etsy' },
                { value: 'Shopify', label: 'Shopify' },
              ]}
            />
          </Flex>

          <Flex align="center" justify="space-between">
            <span className="font-medium">Auto Enabled</span>
            <Switch checked={addForm.autoEnabled} onChange={(v) => setAddForm((p) => ({ ...p, autoEnabled: v }))} />
          </Flex>

          <Flex vertical gap={6}>
            <span className="font-medium">Status</span>
            <Select
              value={addForm.status}
              onChange={(v) => setAddForm((p) => ({ ...p, status: v }))}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
              ]}
            />
          </Flex>
        </Flex>
      </Modal>

      {/* Edit Store */}
      <Modal
        title="Edit Store"
        width={420}
        style={{ top: '30%' }}
        okText="Save"
        open={isShowEdit}
        onOk={handleUpdate}
        onCancel={() => setIsShowEdit(false)}
        closable={{ 'aria-label': 'Custom Close Button' }}
      >
        <Flex vertical gap={12}>
          <Flex vertical gap={6}>
            <span className="font-medium">Store</span>
            <Input
              value={editForm.store}
              onChange={(e) => setEditForm((p) => ({ ...p, store: e.target.value }))}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </Flex>

          <Flex vertical gap={6}>
            <span className="font-medium">Name</span>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </Flex>

          <Flex vertical gap={6}>
            <span className="font-medium">Merchant</span>
            <Select
              value={editForm.merchant}
              onChange={(v) => setEditForm((p) => ({ ...p, merchant: v }))}
              options={[
                { value: 'Amazon', label: 'Amazon' },
                { value: 'Etsy', label: 'Etsy' },
                { value: 'Shopify', label: 'Shopify' },
              ]}
            />
          </Flex>

          <Flex align="center" justify="space-between">
            <span className="font-medium">Auto Enabled</span>
            <Switch checked={editForm.autoEnabled} onChange={(v) => setEditForm((p) => ({ ...p, autoEnabled: v }))} />
          </Flex>

          <Flex vertical gap={6}>
            <span className="font-medium">Status</span>
            <Select
              value={editForm.status}
              onChange={(v) => setEditForm((p) => ({ ...p, status: v }))}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
              ]}
            />
          </Flex>
        </Flex>
      </Modal>

      {/* Delete Store */}
      <Modal
        title="Delete Store"
        width={520}
        style={{ top: '30%' }}
        okText="Confirm"
        open={isShowDelete}
        onOk={handleRemove}
        onCancel={() => setIsShowDelete(false)}
        closable={{ 'aria-label': 'Custom Close Button' }}
      >
        <span className="font-medium text-[#64748b]">Are you sure you want to delete this store? This action cannot be undone.</span>
      </Modal>

      {/* Add user to shop */}
      <Modal
        title="Add User To Store"
        width={520}
        style={{ top: '30%' }}
        okText="Add"
        open={isShowAddUser}
        onOk={handleAddUser}
        onCancel={() => setIsShowAddUser(false)}
        closable={{ 'aria-label': 'Custom Close Button' }}
      >
        <Flex vertical gap={8}>
          <div className="text-sm text-[#64748b]">Input userIds separated by newline / comma / space / semicolon.</div>
          <Input.TextArea
            rows={5}
            value={addUserForm.userIdsText}
            onChange={(e) => setAddUserForm({ userIdsText: e.target.value })}
            placeholder="u01,u02,u03..."
          />
        </Flex>
      </Modal>

      {/* Update status (endpoint riêng) */}
      <Modal
        title="Update Store Status"
        width={420}
        style={{ top: '30%' }}
        okText="Save"
        open={isShowUpdateStatus}
        onOk={handleUpdateStatus}
        onCancel={() => setIsShowUpdateStatus(false)}
        closable={{ 'aria-label': 'Custom Close Button' }}
      >
        <Flex vertical gap={12}>
          <Flex vertical gap={6}>
            <span className="font-medium">Status</span>
            <Select
              value={statusForm.status}
              onChange={(v) => setStatusForm((p) => ({ ...p, status: v }))}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
              ]}
            />
          </Flex>

          <Flex align="center" justify="space-between">
            <span className="font-medium">Auto Enabled</span>
            <Switch checked={statusForm.autoEnabled} onChange={(v) => setStatusForm((p) => ({ ...p, autoEnabled: v }))} />
          </Flex>
        </Flex>
      </Modal>
    </div>
  );
};

export default ManageStores;
