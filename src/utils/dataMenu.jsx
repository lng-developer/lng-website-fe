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
import { CgShoppingBag } from 'react-icons/cg';
import { TbReportSearch } from 'react-icons/tb';
import { CiStar } from 'react-icons/ci';
import { RiAdvertisementLine } from 'react-icons/ri';
import { BsGraphUp } from 'react-icons/bs';
import { LuLayoutList } from 'react-icons/lu';
import { CgFileDocument } from 'react-icons/cg';
import { LuStar } from 'react-icons/lu';

export const topMenus = [
  { key: 'sales', icon: <TbHomeStats size={20} />, label: 'Sales' },
  { key: 'fulfillment', icon: <MdBalance size={20} />, label: 'Fulfillment' },
  { key: 'design', icon: <RiPaletteLine size={20} />, label: 'Design' },
  { key: 'vendor', icon: <HiOutlineBuildingStorefront size={20} />, label: 'Vendor' },
];

export const detailMenus = {
  sales: [
    {
      key: 'orders',
      label: 'Orders',
      icon: <LuBox size={20} />,
      children: [
        { key: routes.order_amazon, label: 'Amazon', icon: <FaAmazon size={20} /> },
        { key: '/order/shopify', label: 'Shopify', icon: <FaShopify size={20} /> },
      ],
    },
    {
      key: routes.report,
      label: 'Reports',
      icon: <TbReport size={20} />,
      children: [
        { key: '', label: 'Orders Cost', icon: <CgShoppingBag size={20} /> },
        { key: '/order/shopify', label: 'Listing Report', icon: <RiListIndefinite size={20} /> },
        { key: '/order/shopify', label: 'Sale Report', icon: <TbReportSearch size={20} /> },
        { key: '/order/shopify', label: 'Tool Scale Reports', icon: <FaBalanceScaleLeft size={20} /> },
        { key: '/order/shopify', label: 'Amazon Store Report', icon: <LuStar size={20} /> },
        { key: '/order/shopify', label: 'Amazon Ads Invoice', icon: <RiAdvertisementLine size={20} /> },
        { key: '/order/shopify', label: 'Revenue & Basecost', icon: <BsGraphUp size={20} /> },
      ],
    },
  ],
  fulfillment: [],
  design: [],
  vendor: [
    { key: routes.vendor_list, label: 'List Vendor', icon: <LuLayoutList size={20} /> },
    { key: routes.vendor_products, label: 'Vendor Products', icon: <CgFileDocument size={20} /> },
  ],
};
