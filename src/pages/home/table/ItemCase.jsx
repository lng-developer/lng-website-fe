import { memo, useEffect, useState } from 'react';
import { FcPlus } from 'react-icons/fc';
import { getAllCaseByOrder, removeCase, updateOpenCase } from '../../../apis/order';
import { Checkbox, Flex, Modal, Select, Tooltip } from 'antd';
import { dataColors } from '../../../utils/dataColors';
import { toast } from 'sonner';

const ItemCase = ({ orderId, fetchAllOrder, filters, caseList = [], openCaseHandler = updateOpenCase }) => {
  const [isShowModal, setIsShowModal] = useState(false);
  const [selectCase, setSelectCase] = useState('');
  const [cases, setCases] = useState([]);
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);

  const fetchAllCase = async () => {
    if (!isShowModal) return;
    try {
      const response = await getAllCaseByOrder();
      if (response.status === 200) {
        const result = response.data?.map((item) => {
          return {
            value: item?._id,
            label: item?.name,
          };
        });
        setCases(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddCase = async () => {
    try {
      const response = await openCaseHandler({
        orderId,
        caseIds: [selectCase],
      });
      if (response.status === 200) {
        toast.success(response.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Update error!');
    } finally {
      fetchAllOrder(filters);
      setIsShowModal(false);
    }
  };

  const handleUpdateCase = async () => {
    try {
      const response = await removeCase({
        orderId,
        caseIds: selectedCases,
      });
      if (response.status === 200) {
        toast.success(response.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Update error!');
    } finally {
      fetchAllOrder(filters);
      setIsShowModalUpdate(false);
    }
  };

  const handleCheck = (caseId, checked) => {
    if (checked) {
      setSelectedCases((prev) => [...prev, caseId]);
    } else {
      setSelectedCases((prev) => prev.filter((id) => id !== caseId));
    }
  };

  useEffect(() => {
    fetchAllCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowModal]);

  return (
    <>
      <Flex
        vertical={true}
        gap={4}
        style={{
          display: caseList.length > 0 ? 'inline-block' : '',
        }}
      >
        {caseList?.map((item) => (
          <div
            style={{
              borderColor: dataColors.cancelled,
              textDecorationColor: dataColors.cancelled,
            }}
            className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium mb-1 hover:underline cursor-pointer"
            onClick={() => setIsShowModalUpdate(true)}
          >
            <span style={{ color: dataColors.cancelled, whiteSpace: 'nowrap', fontSize: 12 }}>{item?.name}</span>
          </div>
        ))}
        <Tooltip title="Open case">
          <div className="flex justify-center cursor-pointer" onClick={() => setIsShowModal(true)}>
            <FcPlus size={20} />
          </div>
        </Tooltip>
      </Flex>
      <Modal
        title="Open case"
        width={350}
        style={{ top: '30%' }}
        okText="Open case"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModal}
        onOk={handleAddCase}
        onCancel={() => setIsShowModal(false)}
        okButtonProps={{ disabled: selectCase ? false : true }}
      >
        <Flex vertical={true} gap={2} className="my-2" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <span className="font-medium"></span>
          <Select
            showSearch
            onChange={(value) => setSelectCase(value)}
            placeholder="Select a case..."
            optionFilterProp="label"
            options={cases}
          />
        </Flex>
      </Modal>
      <Modal
        title="Manage case"
        width={350}
        style={{ top: '30%' }}
        okText="Resolve cases"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalUpdate}
        onOk={handleUpdateCase}
        onCancel={() => setIsShowModalUpdate(false)}
        okButtonProps={{ disabled: selectedCases.length === 0 }}
      >
        <Flex vertical={true} gap={4} style={{ paddingTop: 10, paddingBottom: 10 }}>
          {caseList?.map((item, index) => (
            <Flex
              key={index}
              vertical={true}
              gap={4}
              style={{
                display: 'inline-block',
              }}
              justify="left"
            >
              <span className="font-medium mr-1">{index + 1}.</span>
              <div
                style={{
                  borderColor: dataColors.cancelled,
                  textDecorationColor: dataColors.cancelled,
                }}
                className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium m-1"
              >
                <span style={{ color: dataColors.cancelled, whiteSpace: 'nowrap', fontSize: 12 }}>{item?.name}</span>
              </div>
              <Checkbox checked={selectedCases.includes(item._id)} onChange={(e) => handleCheck(item._id, e.target.checked)} />
            </Flex>
          ))}
        </Flex>
      </Modal>
    </>
  );
};

export default memo(ItemCase);
