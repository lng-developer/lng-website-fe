import { Image } from 'antd';

const SubItemCustom = () => {
  return (
    <div className="flex-col justify-between">
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Select Grade:</span>
        <span className="text-[#64748B]">Kindergaten</span>
      </div>
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Select Teacher Title:</span>
        <span className="text-[#64748B]">Mrs</span>
      </div>
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Enter Teacher Name: </span>
        <span className="text-[#64748B]">Sisson</span>
      </div>
      <div className="flex-col">
        <div>
          <span className="font-medium">Select Product Type & Color:</span>
        </div>
        <span className="text-[#64748B]">Comfort Colors T-Shirt/Seafoam</span>
      </div>
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Select size: </span>
        <span className="text-[#64748B]">XL</span>
      </div>
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Customization Url: </span>
        <span className="text-[#64748B]">Link</span>
      </div>
      <div className="flex-col gap-2 mb-1">
        <div className="mb-1">
          <span className="font-medium">Customer Photo: </span>
        </div>
        <Image width={80} src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" className="rounded-lg" />
      </div>
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Print File: </span>
        <span className="text-[#64748B]">Link</span>
      </div>
    </div>
  );
};

export default SubItemCustom;
