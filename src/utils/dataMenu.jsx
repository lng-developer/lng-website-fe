import { LuBox } from 'react-icons/lu';
import { FaAmazon, FaShopify } from 'react-icons/fa';
import { RiListIndefinite } from 'react-icons/ri';
import { routes } from '../routes/routes';

export const dataNav = [
  {
    key: '/order',
    label: 'Orders',
    icon: <LuBox size={20} />,
    children: [
      { key: '/order/amazon', label: 'Amazon', icon: <FaAmazon size={20} /> },
      { key: '/order/shopify', label: 'Shopify', icon: <FaShopify size={20} /> },
    ],
  },
  // {
  //   title: 'Listings',
  //   icon: <RiListIndefinite />,
  //   link: '',
  //   isSubMenu: false,
  // },
];
