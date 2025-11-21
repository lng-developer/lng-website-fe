import { Col, Flex, Popover, Tooltip } from 'antd';
import { dataColors } from '../../../utils/dataColors';
import { BiSolidEdit } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { memo, useState } from 'react';
import ModalUpdateCustomer from '../ModalUpdateCustomer';
import { IoWarningOutline } from 'react-icons/io5';
import { FcApproval } from 'react-icons/fc';
import { toast } from 'sonner';

const ItemCustomer = ({ customerInfor, orderId, fetchAllOrder, filters, address_validation }) => {
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.log(err);
      toast.error('Failed to copy!');
    }
  };
  const content = (
    <div className="w-auto">
      <Flex justify="space-between" gap={20}>
        <Flex gap={5} vertical={true}>
          <Flex vertical={true}>
            <span className="font-medium">Name:</span>
            <Col>
              {customerInfor?.name ? (
                <div
                  onClick={() => handleCopy(customerInfor?.name)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold truncate" style={{ color: dataColors.process }}>
                    {customerInfor?.name}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
          <Flex vertical={true}>
            <span className="font-medium">Address:</span>
            <Col>
              {customerInfor?.address ? (
                <div
                  onClick={() => handleCopy(customerInfor?.address)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.address}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
          <Flex vertical={true}>
            <span className="font-medium">City:</span>
            <Col>
              {customerInfor?.city ? (
                <div
                  onClick={() => handleCopy(customerInfor?.city)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.city}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
          <Flex vertical={true}>
            <span className="font-medium">Country:</span>
            <Col>
              {customerInfor?.country ? (
                <div
                  onClick={() => handleCopy(customerInfor?.country)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.country}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
          <Flex vertical={true}>
            <span className="font-medium">Phone:</span>
            <Col>
              {customerInfor?.phone_number ? (
                <div
                  onClick={() => handleCopy(customerInfor?.phone_number)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.phone_number}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
        </Flex>

        <Flex gap={5} vertical={true}>
          <Flex vertical={true}>
            <span className="font-medium">Email:</span>
            <Col>
              {customerInfor?.email ? (
                <div
                  onClick={() => handleCopy(customerInfor?.email)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.email}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
          <Flex vertical={true}>
            <span className="font-medium">Address 2:</span>
            <Col>
              {customerInfor?.address_2 ? (
                <div
                  onClick={() => handleCopy(customerInfor?.address_2)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.address_2}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>

          <Flex vertical={true}>
            <span className="font-medium">State:</span>
            <Col>
              {customerInfor?.state ? (
                <div
                  onClick={() => handleCopy(customerInfor?.state)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.state}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>

          <Flex vertical={true}>
            <span className="font-medium">Zip:</span>
            <Col>
              {customerInfor?.zip_code ? (
                <div
                  onClick={() => handleCopy(customerInfor?.zip_code)}
                  className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                  style={{ borderColor: dataColors.process }}
                >
                  <span className="font-bold" style={{ color: dataColors.process }}>
                    {customerInfor?.zip_code}
                  </span>
                </div>
              ) : (
                <IoClose color="#cd1323" size={20} />
              )}
            </Col>
          </Flex>
        </Flex>
      </Flex>
    </div>
  );

  const renderWarningAddress = () => {
    if (address_validation) {
      return <FcApproval size={18} />;
    }
    return (
      <Tooltip title="Warning address">
        <button className="hover:underline cursor-pointer hover:text-blue">
          <IoWarningOutline size={15} color={dataColors.cancelled} />
        </button>
      </Tooltip>
    );
  };
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <Popover trigger="click" content={content} title={<span className="text-xl font-medium">Customer Information</span>}>
          <button className="hover:underline cursor-pointer hover:text-blue flex items-center">
            <span
              className="font-medium hover:text-blue-600"
              style={{
                display: 'inline-block',
                maxWidth: 120,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {customerInfor?.name}
            </span>
          </button>
        </Popover>
        <Tooltip title="Edit">
          <button className="cursor-pointer" onClick={() => setIsShowModalUpdate(true)}>
            <BiSolidEdit size={16} color={dataColors.pending} />
          </button>
        </Tooltip>
        {renderWarningAddress()}
      </div>
      <ModalUpdateCustomer
        isModalOpen={isShowModalUpdate}
        setIsModalOpen={setIsShowModalUpdate}
        customerInfor={customerInfor}
        orderId={orderId}
        fetchAllOrder={fetchAllOrder}
        filters={filters}
      />
    </>
  );
};

export default memo(ItemCustomer);
