import { LuBox } from 'react-icons/lu';
import { FaAmazon, FaShopify } from 'react-icons/fa';
import { RiListIndefinite } from 'react-icons/ri';

export const dataNav = [
  {
    title: 'Orders',
    icon: <LuBox />,
    subMenu: [
      { title: 'Amazon', icon: <FaAmazon />, link: '' },
      { title: 'Shopify', icon: <FaShopify />, link: '' },
    ],
    link: '',
    isSubMenu: true,
  },
  // {
  //   title: 'Listings',
  //   icon: <RiListIndefinite />,
  //   link: '',
  //   isSubMenu: false,
  // },
];
