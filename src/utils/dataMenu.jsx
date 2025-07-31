import { LuBox } from 'react-icons/lu';
import { FaAmazon, FaShopify } from 'react-icons/fa';
import { routes } from '../routes/routes';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';
import { CiCircleList } from 'react-icons/ci';
import { LiaClipboardListSolid } from 'react-icons/lia';

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
];
