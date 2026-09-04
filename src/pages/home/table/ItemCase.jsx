import { memo, useEffect, useState } from 'react';
import { FcPlus } from 'react-icons/fc';
import { createCase, getAllCaseByOrder, removeCase, updateCaseById, updateOpenCase } from '../../../apis/order';
import { Button, Checkbox, Flex, Input, Modal, Select, Switch, Tooltip } from 'antd';
import { dataColors } from '../../../utils/dataColors';
import { toast } from 'sonner';

const ItemCase = ({ orderId, fetchAllOrder, filters, caseList = [], openCaseHandler = updateOpenCase, removeCaseHandler = removeCase }) => {
  const [isShowModal, setIsShowModal] = useState(false);
  const [selectCase, setSelectCase] = useState('');
  const [cases, setCases] = useState([]);
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);
  const [updatingCaseId, setUpdatingCaseId] = useState('');
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseBlocksProduction, setNewCaseBlocksProduction] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);

  const toCaseOption = (item) => ({
    value: item?._id,
    label: `${item?.name}${item?.blocksProduction ? ' (blocks production)' : ''}`,
    name: item?.name,
    blocksProduction: item?.blocksProduction === true,
  });

  const fetchAllCase = async () => {
    if (!isShowModal) return;
    try {
      const response = await getAllCaseByOrder();
      if (response.status === 200) {
        const result = response.data?.map(toCaseOption);
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
      const response = await removeCaseHandler({
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

  const handleToggleBlockProduction = async (caseId, blocksProduction) => {
    try {
      setUpdatingCaseId(caseId);
      const response = await updateCaseById(caseId, { blocksProduction });
      if (response.status === 200) {
        toast.success(blocksProduction ? 'Case will block production' : 'Case will not block production');
        setCases((prev) =>
          prev.map((item) =>
            item.value === caseId
              ? {
                  ...item,
                  blocksProduction,
                  label: `${item.name}${blocksProduction ? ' (blocks production)' : ''}`,
                }
              : item
          )
        );
        fetchAllOrder(filters);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || 'Update case setting failed!');
    } finally {
      setUpdatingCaseId('');
    }
  };

  const handleCreateCase = async () => {
    const name = newCaseName.trim();
    if (!name) {
      toast.error('Case name is required');
      return;
    }

    try {
      setCreatingCase(true);
      const response = await createCase({ name, blocksProduction: newCaseBlocksProduction });
      if (response.status === 201) {
        const option = toCaseOption(response.data);
        setCases((prev) => [...prev, option]);
        setSelectCase(option.value);
        setNewCaseName('');
        setNewCaseBlocksProduction(false);
        toast.success('Case created');
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.error?.message || error?.response?.data?.message || 'Create case failed!');
    } finally {
      setCreatingCase(false);
    }
  };

  const selectedCaseMeta = cases.find((item) => item.value === selectCase);

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
            <span style={{ color: dataColors.cancelled, whiteSpace: 'nowrap', fontSize: 12 }}>
              {item?.name}{item?.blocksProduction ? ' - blocks production' : ''}
            </span>
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
          {selectedCaseMeta && (
            <Flex justify="space-between" align="center" className="mt-3">
              <span className="font-medium">Block production</span>
              <Switch
                checked={selectedCaseMeta.blocksProduction}
                loading={updatingCaseId === selectedCaseMeta.value}
                onChange={(checked) => handleToggleBlockProduction(selectedCaseMeta.value, checked)}
              />
            </Flex>
          )}
          <div className="mt-4 border-t border-slate-200 pt-3">
            <div className="mb-2 text-sm font-medium">Create new case</div>
            <Flex vertical gap={8}>
              <Input value={newCaseName} placeholder="New case name" onChange={(event) => setNewCaseName(event.target.value)} />
              <Flex justify="space-between" align="center">
                <span className="text-sm">Block production</span>
                <Switch checked={newCaseBlocksProduction} onChange={setNewCaseBlocksProduction} />
              </Flex>
              <Button loading={creatingCase} disabled={!newCaseName.trim()} onClick={handleCreateCase}>
                Create case
              </Button>
            </Flex>
          </div>
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
                <span style={{ color: dataColors.cancelled, whiteSpace: 'nowrap', fontSize: 12 }}>
                  {item?.name}{item?.blocksProduction ? ' - blocks production' : ''}
                </span>
              </div>
              <Flex gap={8} align="center" className="mt-1">
                <Checkbox checked={selectedCases.includes(item._id)} onChange={(e) => handleCheck(item._id, e.target.checked)} />
                <span className="text-xs">Block production</span>
                <Switch
                  size="small"
                  checked={item?.blocksProduction === true}
                  loading={updatingCaseId === item._id}
                  onChange={(checked) => handleToggleBlockProduction(item._id, checked)}
                />
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Modal>
    </>
  );
};

export default memo(ItemCase);
