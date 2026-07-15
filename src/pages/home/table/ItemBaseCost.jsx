import { Button, Flex, Input, Modal, Popover, Tooltip } from 'antd';
import { updateBaseCost, resetBaseCost } from '../../../apis/order';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { MdOutlineRefresh } from 'react-icons/md';

const ItemBaseCost = ({ orderId, base_cost, fetchAllOrder, filters, showResetBaseCost = false, updateBaseCostRequest = updateBaseCost }) => {
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [pendingBaseCostUpdate, setPendingBaseCostUpdate] = useState(null);
  const [isShowResetModal, setIsShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const handleUpdateBaseCost = async (newValue) => {
    try {
      await updateBaseCostRequest(orderId, newValue);
      toast.success(`Updated base cost for ${orderId}`);
      setIsPopoverOpen(false);
      setPendingBaseCostUpdate(null);
      fetchAllOrder(filters);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update base cost for ${orderId}`);
    }
  };

  const handleChange = () => {
    const nextValue = value === '' ? base_cost : value;
    const newValue = parseFloat(nextValue);
    const oldValue = parseFloat(base_cost);

    if (Number.isNaN(newValue)) {
      toast.error('Please enter a valid base cost');
      return;
    }

    if (newValue === oldValue) {
      toast.info('Base cost is unchanged');
      return;
    }

    setPendingBaseCostUpdate({
      newValue,
      oldValue: Number.isNaN(oldValue) ? 0 : oldValue,
    });
  };

  const handleResetBaseCost = async () => {
    if (!(user?.role === 'Admin')) {
      toast.error('Access denied: insufficient permissions');
      return;
    }

    setIsResetting(true);
    try {
      const response = await resetBaseCost({ orderId });
      if (response.status === 200) {
        toast.success(`Reset base cost for ${orderId}`);
        setIsShowResetModal(false);
        fetchAllOrder(filters);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to reset base cost for ${orderId}`);
    } finally {
      setIsResetting(false);
    }
  };

  const content = (
    <Flex gap={8} align="center">
      <Input
        defaultValue={base_cost ? base_cost : 0}
        size="small"
        style={{
          width: 80,
        }}
        prefix="$"
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleChange}
      />
      <Button size="small" type="primary" onClick={handleChange}>
        OK
      </Button>
    </Flex>
  );

  return (
    <>
      {user?.role === 'Admin' ? (
        <>
          <Flex align="center" justify="center" gap={6}>
            <Popover content={content} open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <div className="cursor-pointer">
                <span className="font-medium hover:text-blue-600">${base_cost ? parseFloat(base_cost).toFixed(2) : '0.00'}</span>
              </div>
            </Popover>
            {showResetBaseCost && (
              <Tooltip title="Reset base cost">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full hover:bg-[#f1f5f9] cursor-pointer"
                  style={{ width: 24, height: 24, color: '#ef4444' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShowResetModal(true);
                  }}
                >
                  <MdOutlineRefresh size={16} />
                </button>
              </Tooltip>
            )}
          </Flex>

          <Modal
            title="Confirm base cost update"
            width={480}
            style={{ top: '30%' }}
            okText="Confirm"
            cancelText="Cancel"
            open={Boolean(pendingBaseCostUpdate)}
            onOk={() => handleUpdateBaseCost(pendingBaseCostUpdate.newValue)}
            onCancel={() => setPendingBaseCostUpdate(null)}
          >
            <Flex vertical gap={16}>
              <div className="text-sm text-[#64748b]">Are you sure you want to update base cost for this order?</div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="text-sm">
                  <span className="text-[#64748b]">Order ID: </span>
                  <span className="font-medium text-black">{orderId || '-'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[#64748b]">Base Cost: </span>
                  <span className="font-medium text-black">
                    ${pendingBaseCostUpdate?.oldValue?.toFixed(2)} {'->'} ${pendingBaseCostUpdate?.newValue?.toFixed(2)}
                  </span>
                </div>
              </div>
            </Flex>
          </Modal>

          <Modal
            title="Reset Base Cost Confirmation"
            width={480}
            style={{ top: '30%' }}
            okText="Confirm Reset"
            cancelText="Cancel"
            open={isShowResetModal}
            onOk={handleResetBaseCost}
            confirmLoading={isResetting}
            onCancel={() => setIsShowResetModal(false)}
            okButtonProps={{ danger: true }}
          >
            <Flex vertical gap={16}>
              <div className="text-sm text-[#64748b]">
                Are you sure you want to reset base cost for this order? This action cannot be undone.
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="text-sm">
                  <span className="text-[#64748b]">Order ID: </span>
                  <span className="font-medium text-black">{orderId || '-'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[#64748b]">Current Base Cost: </span>
                  <span className="font-medium text-black">${base_cost ? parseFloat(base_cost).toFixed(2) : '0.00'}</span>
                </div>
              </div>

              <div className="text-xs text-red-500 font-medium">This action cannot be undone.</div>
            </Flex>
          </Modal>
        </>
      ) : (
        <div className="cursor-pointer">
          <span className="font-medium">${base_cost ? parseFloat(base_cost).toFixed(2) : '0.00'}</span>
        </div>
      )}
    </>
  );
};

export default memo(ItemBaseCost);
