import { Col, Flex, Input, Modal } from 'antd';
import { useState } from 'react';
import { updateCustomerInfor } from '../../apis/order';
import isEqual from 'lodash.isequal';
import { toast } from 'sonner';

const ModalUpdateCustomer = ({ isModalOpen, setIsModalOpen, customerInfor, orderId, fetchAllOrder, filters }) => {
  const [formData, setFormData] = useState({
    name: customerInfor?.name,
    email: customerInfor?.email,
    phone_number: customerInfor?.phone_number,
    address: customerInfor?.address,
    address_2: customerInfor?.address_2,
    city: customerInfor?.city,
    zip_code: customerInfor?.zip_code,
    state: customerInfor?.state,
    country: customerInfor?.country,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleOk = async () => {
    try {
      const response = await updateCustomerInfor(orderId, formData);
      if (response.status === 200) {
        toast.success(response.data?.message);
        fetchAllOrder(filters);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.log(error);
      toast.error('Update error!');
    }
  };

  return (
    <Modal
      title="Update Customer"
      okText="Save changes"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      onOk={handleOk}
      okButtonProps={{ disabled: isEqual(formData, customerInfor) }}
      width={680}
      onCancel={handleCancel}
    >
      <div className="py-2">
        <div className="flex justify-between">
          <Flex gap={5} vertical={true}>
            <div className="w-[300px]">
              <span className="font-medium">Name</span>
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
            </div>
            <div>
              <span className="font-medium">Address</span>
              <Input name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
            </div>
            <div>
              <span className="font-medium">State</span>
              <Input name="state" value={formData.state} onChange={handleChange} placeholder="State" />
            </div>
            <div>
              <span className="font-medium">Country</span>
              <Input name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
            </div>
            <div>
              <span className="font-medium">Phone Number</span>
              <Input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Phone Number" />
            </div>
          </Flex>

          <Flex gap={5} vertical={true}>
            <div className="w-[300px]">
              <span className="font-medium">Email</span>
              <Input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
            </div>
            <div>
              <span className="font-medium">Address 2</span>
              <Input name="address_2" value={formData.address_2} onChange={handleChange} placeholder="Address 2" />
            </div>
            <div>
              <span className="font-medium">City</span>
              <Input name="city" value={formData.city} onChange={handleChange} placeholder="City" />
            </div>
            <div>
              <span className="font-medium">Zip Code</span>
              <Input name="zip_code" value={formData.zip_code} onChange={handleChange} placeholder="Zip Code" />
            </div>
          </Flex>
        </div>
      </div>
    </Modal>
  );
};

export default ModalUpdateCustomer;
