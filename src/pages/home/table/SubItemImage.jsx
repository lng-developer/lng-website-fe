import { Button, Image, Popconfirm } from 'antd';
import { useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { MdOutlineDone } from 'react-icons/md';
import StatusComponent from '../../../components/StatusComponent';
import { MdDoneOutline } from 'react-icons/md';
import { dataColors } from '../../../utils/dataColors';

const SubItemImage = () => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  const productList = [
    { id: 1, name: 'Font' },
    { id: 2, name: 'back' },
  ];

  const handleSelect = (product) => {
    setSelected(product);
    setVisible(false);
  };
  return (
    <div>
      <div className="rounded-lg overflow-hidden flex gap-2">
        <Image width={130} src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" className="rounded-lg" />
        <Image width={130} src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" className="rounded-lg" />
      </div>
      <div className="mt-2">
        <Popconfirm
          title={
            <div className="">
              {productList.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="flex justify-between items-center cursor-pointer px-2 py-1 hover:bg-gray-100 rounded"
                >
                  {selected?.name === product.name ? <MdOutlineDone /> : <div></div>}
                  <span className="ml-1">{product.name}</span>
                </div>
              ))}
            </div>
          }
          open={visible}
          onOpenChange={setVisible}
          showCancel={false}
          okButtonProps={{ style: { display: 'none' } }}
          placement="bottom"
          icon={null}
        >
          <Button className="flex justify-between items-center">
            <span>{selected ? selected.name : productList[0].name}</span>
            <IoIosArrowDown />
          </Button>
        </Popconfirm>
      </div>
      <div className="">
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">PSD:</span>
            <MdDoneOutline color="green" />
          </div>
          <div>
            <StatusComponent title="Download" color="#38a00b" />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">ASIN Type:</span>
          </div>
          <div>
            <StatusComponent title="Pod Lovers" color="#0958d7" />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">PNG Status:</span>
          </div>
          <div>
            <StatusComponent title="Completed" color={dataColors.success} />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">Scale By:</span>
          </div>
          <div>
            <StatusComponent title="Nguyễn Thị Thu Trang" color={dataColors.process} />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">QC By:</span>
          </div>
          <div>
            <StatusComponent title="Trần Thị Thu Trang" color={dataColors.purple} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubItemImage;
