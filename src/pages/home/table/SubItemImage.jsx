import { Flex, Image, Input, Modal } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import NoImage from '../../../assets/NoImage.jpg';
import { FcApproval } from 'react-icons/fc';
import { TbPhotoEdit } from 'react-icons/tb';
import { memo, useState } from 'react';
import { updateImage } from '../../../apis/order';
import { toast } from 'sonner';

const SubItemImage = ({ linkImage = '', orderId, orderItemId, fetchAllOrder, filters, linkFulfill = {}, seller }) => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [valueImage, setValueImage] = useState('');
  const [checkError, setCheckError] = useState(false);

  const handleUpdate = async () => {
    if (!valueImage) {
      setCheckError(true);
      return;
    }
    try {
      const response = await updateImage({
        orderId,
        orderItemId,
        imageUrl: valueImage,
      });
      if (response.status === 200) {
        toast.success('Update image success!');
      } else {
        toast.error('Update error!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Update error!');
    } finally {
      setShowUpdate(false);
      fetchAllOrder(filters);
    }
  };

  const arrFulfill = Object.entries(typeof linkFulfill === 'object' ? linkFulfill : {}).map(([key, url]) => ({
    title: key,
    url,
  }));

  return (
    <>
      <div>
        <div className={arrFulfill?.length > 0 ? `inline-grid grid-cols-2 gap-4` : ''}>
          <div
            className="w-[130px] h-[130px] rounded-lg overflow-hidden"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <Image height={130} width={130} src={linkImage || NoImage} className="rounded-lg" />
          </div>
          {arrFulfill.length > 0 &&
            arrFulfill?.map((f, i) => (
              <div
                key={i}
                className="w-[130px] h-[130px] rounded-lg overflow-hidden"
                style={{
                  boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                }}
              >
                <Image height={130} width={130} src={f?.url || NoImage} className="rounded-lg" />
              </div>
            ))}
        </div>
        <div
          className="w-[60px] mt-2 flex items-center justify-between rounded-md px-2 py-1 border border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]"
          onClick={() => setShowUpdate(true)}
        >
          <span>Edit</span>
          <span>
            <TbPhotoEdit size={16} />
          </span>
        </div>
        <div className="mt-3">
          <div className="flex-col gap-2 mt-2">
            <div className="flex items-center">
              <span className="mr-2 font-medium">PSD:</span>
              <FcApproval />
            </div>
            <div>
              <StatusComponent title="No data" color="#38a00b" />
            </div>
          </div>
          <div className="flex-col gap-2 mt-2">
            <div className="flex items-center">
              <span className="mr-2 font-medium">ASIN Type:</span>
            </div>
            <div>
              <StatusComponent title="No data" color="#0958d7" />
            </div>
          </div>
          <div className="flex-col gap-2 mt-2">
            <div className="flex items-center">
              <span className="mr-2 font-medium">PNG Status:</span>
            </div>
            <div>
              <StatusComponent title="No data" color={dataColors.success} />
            </div>
          </div>
          <div className="flex-col gap-2 mt-2">
            <div className="flex items-center">
              <span className="mr-2 font-medium">Scale By:</span>
            </div>
            <div>
              <StatusComponent title={seller?.full_name || 'No data'} color={dataColors.process} />
            </div>
          </div>
          <div className="flex-col gap-2 mt-2">
            <div className="flex items-center">
              <span className="mr-2 font-medium">QC By:</span>
            </div>
            <div>
              <StatusComponent title="Đặng Thành Trung CS" color={dataColors.purple} />
            </div>
          </div>
        </div>
      </div>
      <Modal
        title="Edit Image"
        width={330}
        style={{ top: '30%' }}
        okText="Save"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={showUpdate}
        onOk={handleUpdate}
        onCancel={() => setShowUpdate(false)}
      >
        <Flex vertical={true} gap={2}>
          <Input
            defaultValue={valueImage}
            placeholder="Link image..."
            value={valueImage}
            onChange={(e) => {
              setCheckError(false);
              setValueImage(e.target.value);
            }}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
          {checkError && <span className="text-red-500 mt-2">Please enter link image!</span>}
        </Flex>
      </Modal>
    </>
  );
};

export default memo(SubItemImage);
