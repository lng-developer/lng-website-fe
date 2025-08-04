import { LuBox } from 'react-icons/lu';
import { FaAmazon, FaShopify } from 'react-icons/fa';
import { routes } from '../routes/routes';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';
import { CiCircleList } from 'react-icons/ci';
import { LiaClipboardListSolid } from 'react-icons/lia';
import { MdBalance, MdBlender } from 'react-icons/md';
import { FaBalanceScaleLeft } from 'react-icons/fa';
import { TbHomeStats } from 'react-icons/tb';
import { TbReport } from 'react-icons/tb';
import { RiPaletteLine } from 'react-icons/ri';
import { BsFiletypePsd } from 'react-icons/bs';
import { IoImageOutline } from 'react-icons/io5';
import { RiListIndefinite } from 'react-icons/ri';
import { BsBoxes } from 'react-icons/bs';

export const dataNav = [
  {
    key: routes.order,
    label: 'Orders',
    icon: <LuBox size={20} />,
    children: [
      { key: routes.order_amazon, label: 'Amazon', icon: <FaAmazon size={20} /> },
      { key: '/order/shopify', label: 'Shopify', icon: <FaShopify size={20} /> },
    ],
  },
  {
    key: routes.vendor,
    label: 'Vendor',
    icon: <HiOutlineBuildingStorefront size={20} />,
    children: [
      { key: routes.vendor_list, label: 'List Vendor', icon: <CiCircleList size={20} /> },
      { key: routes.vendor_products, label: 'Vendor Products', icon: <LiaClipboardListSolid size={20} /> },
    ],
  },
  {
    key: routes.fulfillment,
    label: 'Fulfillment',
    icon: <MdBalance size={20} />,
    children: [
      { key: routes.fulfillmentScale, label: 'Scale', icon: <FaBalanceScaleLeft size={20} /> },
      { key: routes.fulfillmentQc, label: 'QC', icon: <MdBlender size={20} /> },
      { key: routes.fulfillmentWorkingStatus, label: 'Working Status', icon: <TbHomeStats size={20} /> },
      { key: routes.fulfillmentReports, label: 'Reports', icon: <TbReport size={20} /> },
    ],
  },
  {
    key: routes.design,
    label: 'Design',
    icon: <RiPaletteLine size={20} />,
    children: [
      { key: routes.designPSD, label: 'PSD Tasks', icon: <BsFiletypePsd size={20} /> },
      { key: routes.designPNG, label: 'PNG Tasks', icon: <IoImageOutline size={20} /> },
      { key: routes.designEmbroider, label: 'Embroider Listing', icon: <RiListIndefinite size={20} /> },
      { key: routes.designProductType, label: 'Design Product Types', icon: <BsBoxes size={20} /> },
    ],
  },
];
