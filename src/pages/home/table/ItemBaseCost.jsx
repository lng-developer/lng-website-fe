import { Flex, Input, Modal, Popover, Tooltip } from 'antd';
import { updateBaseCost, resetBaseCost } from '../../../apis/order';
import { memo, useEffect, useState } from 'react';
import useDebounce from '../../../hooks/useDebounce';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { MdOutlineRefresh } from 'react-icons/md';

const ItemBaseCost = ({ orderId, base_cost, fetchAllOrder, filters, showResetBaseCost = false }) => {
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [isShowResetModal, setIsShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const debounce = useDebounce(value, 600);
  const handleChange = async () => {
    const newValue = parseFloat(value);
    const oldValue = parseFloat(base_cost);
    if (!isNaN(newValue) && newValue !== oldValue) {
      try {
        await updateBaseCost(orderId, newValue);
        toast.success(`Updated base cost for ${orderId}`);
        fetchAllOrder(filters);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to update base cost for ${orderId}`);
      }
    }
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
    <Input
      defaultValue={base_cost ? base_cost : 0}
      size="small"
      style={{
        width: 70,
      }}
      prefix="$"
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={handleChange}
    />
  );

  useEffect(() => {
    handleChange();
  }, [debounce]);
  return (
    <>
      {user?.role === 'Admin' ? (
        <>
          <Flex align="center" justify="center" gap={6}>
            <Popover content={content}>
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
