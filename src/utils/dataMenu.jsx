// Feather, Lucide, Remix...
import { LuBox, LuLayoutList, LuStar, LuBrain, LuListTodo, LuNotebook, LuTruck } from 'react-icons/lu';
import { LiaReact } from 'react-icons/lia';
import {
  RiPaletteLine,
  RiListIndefinite,
  RiAdvertisementLine,
  RiTokenSwapLine,
  RiContractLine,
  RiSettings2Line,
  RiErrorWarningLine,
  RiAdminLine,
} from 'react-icons/ri';
import {
  TbHomeStats,
  TbReport,
  TbReportSearch,
  TbHomeDollar,
  TbUsersGroup,
  TbPackages,
  TbCookie,
  TbBlender,
  TbBuildingFactory2,
  TbBuildingStore,
} from 'react-icons/tb';
import { FaAmazon, FaShopify, FaBalanceScaleLeft, FaEtsy } from 'react-icons/fa';
import { MdBalance, MdOutlinePendingActions } from 'react-icons/md';
import { HiOutlineBuildingStorefront, HiOutlineKey } from 'react-icons/hi2';
import { BsFiletypePsd, BsGraphUp } from 'react-icons/bs';
import { CgShoppingBag, CgFileDocument } from 'react-icons/cg';
import { IoImageOutline, IoStorefrontOutline } from 'react-icons/io5';
import { AiOutlineFileSync, AiOutlineCopy, AiOutlineFundView, AiFillIdcard, AiOutlineHome } from 'react-icons/ai';
import { GrDocumentConfig } from 'react-icons/gr';
import { BiCubeAlt, BiHomeAlt } from 'react-icons/bi';
import { BiExtension } from 'react-icons/bi';
import { MdOutlineConnectedTv } from 'react-icons/md';

import { routes } from '../routes/routes';

export const topMenus = [
  { key: 'sales', icon: <TbHomeStats size={20} />, label: 'Sales' },
  { key: 'fulfillment', icon: <MdBalance size={20} />, label: 'Fulfillment' },
  { key: 'design', icon: <RiPaletteLine size={20} />, label: 'Design' },
  { key: 'vendor', icon: <HiOutlineBuildingStorefront size={20} />, label: 'Vendor' },
  { key: 'extensions', icon: <BiExtension size={20} />, label: 'Extensions' },
];

export const detailMenus = {
  sales: [
    {
      key: routes.order_sc,
      label: 'Orders',
      icon: <LuBox size={20} />,
      children: [
        { key: routes.order_amazon, label: 'Amazon', icon: <FaAmazon size={20} /> },
        { key: routes.order_etsy, label: 'Etsy', icon: <FaEtsy size={20} /> },
        // { key: '/order/shopify', label: 'Shopify', icon: <FaShopify size={20} /> },
      ],
    },
    {
      key: routes.team_task,
      label: 'Team Tasks',
      icon: <LuNotebook size={20} />,
    },

    {
      key: routes.sale_listing,
      label: 'Listings',
      icon: <LuLayoutList size={20} />,
    },
    {
      key: routes.cost_center,
      label: 'Cost Centers',
      icon: <TbHomeDollar size={20} />,
      children: [
        { key: routes.cost_center_config, label: 'Config', icon: <GrDocumentConfig size={20} /> },
        { key: routes.cost_center_productTypes, label: 'Product Types', icon: <TbPackages size={20} /> },
        { key: routes.cost_center_mapping, label: 'Mapping', icon: <RiTokenSwapLine size={20} /> },
        { key: routes.cost_center_group_standards, label: 'Group Standards', icon: <TbUsersGroup size={20} /> },
      ],
    },
    {
      key: routes.report,
      label: 'Reports',
      icon: <TbReport size={20} />,
      children: [
        { key: routes.report_ordersCost, label: 'Orders Cost', icon: <CgShoppingBag size={20} /> },
        // { key: '', label: 'Listing Report', icon: <RiListIndefinite size={20} /> },
        {
          key: routes.report_sale,
          label: 'Sale Report',
          icon: <TbReportSearch size={20} />,
        },
        {
          key: routes.report_sale_etsy,
          label: 'Etsy Sale Report',
          icon: <FaEtsy size={20} />,
        },
        {
          key: routes.report_order_cost_etsy,
          label: 'Etsy Orders Cost',
          icon: <FaEtsy size={20} />,
        },
        // { key: '', label: 'Tool Scale Reports', icon: <FaBalanceScaleLeft size={20} /> },
        // { key: '', label: 'Amazon Store Report', icon: <LuStar size={20} /> },
        { key: routes.report_ads, label: 'Ads Report', icon: <RiAdvertisementLine size={20} /> },
        { key: routes.report_ads_etsy, label: 'ADS Etsy', icon: <FaEtsy size={20} /> },
        // { key: '', label: 'Revenue & Basecost', icon: <BsGraphUp size={20} /> },
      ],
    },
    {
      key: 'a',
      label: 'Monitoring',
      icon: <AiOutlineFileSync size={20} />,
      children: [{ key: 'order-missing-sync', label: 'Order Missing Sync', icon: <AiOutlineFileSync size={20} /> }],
    },
    {
      key: 'd',
      label: 'Configuration',
      icon: <RiSettings2Line size={20} />,
      children: [
        { key: routes.manage_stores, label: 'Manage stores', icon: <IoStorefrontOutline size={20} /> },
        { key: routes.sku_mapping, label: 'SKU Mapping', icon: <CgShoppingBag size={20} /> },
        { key: 'cookies', label: 'Cookies', icon: <TbCookie size={20} /> },
        { key: 'tm-keywords', label: 'TM Keywords', icon: <HiOutlineKey size={20} /> },
        { key: routes.management_account, label: 'Account', icon: <RiAdminLine size={20} /> },
      ],
    },
  ],
  fulfillment: [
    {
      key: 'scale',
      icon: <MdBalance size={20} />,
      label: 'Scale',
      children: [
        {
          key: routes.fulfillmentScale,
          label: 'AMAZON Scale',
          icon: <FaAmazon size={20} />,
        },
        {
          key: routes.scalesty,
          label: 'ETSY Scale ',
          icon: <FaEtsy size={20} />,
        },
      ],
    },
    {
      key: 'qc',
      icon: <TbBlender size={20} />,
      label: 'QC',
      children: [
        { key: routes.fulfillmentQc, label: 'AMAZON QC', icon: <FaAmazon size={20} /> },
        { key: routes.fulfillmentQcEtsy, label: 'ETSY QC', icon: <FaEtsy size={20} /> },
      ],
    },
    { key: 'working-status', icon: <TbHomeStats size={20} />, label: 'Working Status' },
    {
      key: 'e',
      icon: <MdBalance size={20} />,
      label: 'Reports',
      children: [
        { key: 'vendor-fulfillment', label: 'Vendor Fulfillment', icon: <TbBuildingFactory2 size={20} /> },
        { key: 'vendor-pending', label: 'Vendor Pending', icon: <MdOutlinePendingActions size={20} /> },
        { key: 'lng-pending', label: 'LNG Pending', icon: <LiaReact size={20} /> },
        { key: 'working-results', label: 'Working Results', icon: <TbReport size={20} /> },
      ],
    },
  ],
  design: [
    { key: routes.idea_task, label: 'Idea Tasks', icon: <LuBrain size={20} /> },
    {
      key: routes.psd_design,
      label: 'PSD Tasks',
      icon: <BsFiletypePsd size={20} />,
    },
    { key: routes.png_design, label: 'PNG Tasks', icon: <IoImageOutline size={20} /> },
    { key: 'embroider-listing', label: 'Embroider Listing', icon: <LuLayoutList size={20} /> },
    { key: 'design-product-types', label: 'Design Product Types', icon: <TbPackages size={20} /> },
    { key: routes.points_dashboard, label: 'Points Dashboard', icon: <AiOutlineFundView size={20} /> },
  ],
  vendor: [
    { key: routes.vendor_list, label: 'List Vendor', icon: <LuLayoutList size={20} /> },
    { key: 'token-vendor', label: 'Token Vendor', icon: <RiErrorWarningLine size={20} /> },
    { key: routes.vendor_products, label: 'Vendor Products', icon: <CgFileDocument size={20} /> },
    { key: 'store-fulfill', label: 'Store Fulfill', icon: <TbBuildingStore size={20} /> },
    { key: 'vendor-design-product-types', label: 'Design Product Types', icon: <BiCubeAlt size={20} /> },
  ],
  extensions: [
    {
      key: routes.extensions,
      label: 'Manage Clients',
      icon: <MdOutlineConnectedTv size={20} />,
    },
    {
      key: routes.extensions_config_auto,
      label: 'Config Auto',
      icon: <RiSettings2Line size={20} />,
    },
    {
      key: routes.extensions_log_manager,
      label: 'Log Manager',
      icon: <TbReport size={20} />,
    },
    {
      key: routes.extensions_tracking_etsy,
      label: 'Tracking Etsy',
      icon: <FaEtsy size={20} />,
    },
    {
      key: routes.extensions_tracking_etsy_detail,
      label: 'Message Etsy',
      icon: <FaEtsy size={20} />,
    },
    // {
    //   key: routes.extensions_confirm_ship,
    //   label: 'Amz Confirm Ship',
    //   icon: <RiContractLine size={20} />,
    // },
    {
      key: routes.checkodertracking,
      label: 'Check Tracking',
      icon: <LuTruck size={20} />,
    },
  ],
};
