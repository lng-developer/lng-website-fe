import { Flex, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { getAllDesigner } from '../../apis/user';
import { assignIdeaDesigner } from '../../apis/psdTask';
import { toast } from 'sonner';

const ModalAssignIdea = ({ isShowModal, setIsShowModal, idTask, fetchAllListing, filters, fetchCountStatus }) => {
  const [designerId, setDesignerId] = useState('');
  const [priority, setPriority] = useState('');
  const [designers, setDesigners] = useState([]);

  const fetchDesigner = async () => {
    try {
      const response = await getAllDesigner();
      if (response.status === 200) {
        const result = response.data?.map((item) => {
          return {
            label: item?.full_name,
            value: item?._id,
          };
        });
        setDesigners(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleOk = async () => {
    try {
      const response = await assignIdeaDesigner(idTask, {
        difficulty: priority,
        assigneeUserId: designerId,
      });

      if (response.status === 200) {
        toast.success('Assign Designer success!');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsShowModal(false);
      fetchAllListing(filters);
      fetchCountStatus();
    }
  };

  useEffect(() => {
    if (isShowModal) {
      fetchDesigner();
    }
  }, [isShowModal]);

  return (
    <Modal
      title="Assign Designer"
      width={350}
      style={{ top: '20%' }}
      okText="Assign"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isShowModal}
      onOk={handleOk}
      onCancel={() => setIsShowModal(false)}
    >
      <Flex vertical={true} gap={10} className="my-2" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <Flex vertical={true}>
          <span className="font-medium">Designer</span>
          <Select
            showSearch
            onChange={(value) => setDesignerId(value)}
            placeholder="Select a persion"
            optionFilterProp="label"
            options={designers}
          />
        </Flex>
        <Flex vertical={true}>
          <span className="font-medium">Priority</span>
          <Select
            showSearch
            onChange={(value) => setPriority(value)}
            placeholder="Select a priority"
            optionFilterProp="label"
            options={[
              {
                label: '1',
                value: '1',
              },
              {
                label: '2',
                value: '2',
              },
              {
                label: '3',
                value: '3',
              },
              {
                label: '4',
                value: '4',
              },
            ]}
          />
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ModalAssignIdea;
