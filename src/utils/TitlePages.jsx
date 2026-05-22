import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/order/amazon': 'Orders Amazon',
  '/order/etsy': 'Orders Etsy',
  '/sales/listing': 'Manage Listing',
  '/fulfillment/scale': 'Fulfillment Scale',
  '/fulfillment/qc': 'QC Fulfillment',
  '/reports': 'Reports',
  '/cost-center/config': 'Config Cost Center',
  '/cost-center/product-types': 'Product Type Groups',
  '/cost-center/mapping': 'Mapping Cost Center',
  '/cost-center/group-standards': 'Teams Group',
  '/report/sale': 'Sale Report',
  '/report/orders-cost': 'Report Orders Cost',
  '/report/ads': 'Amazon Ads Report',
  '/report/ads-etsy': 'Etsy Ads Report',
  '/design/idea': 'Idea Tasks',
  '/design/psd': 'PSD Tasks',
  '/design/png': 'PNG Tasks',
  '/design/points': 'Points Dashboard',
  '/extensions': 'Extensions',
  '/extensions/confirm-ship': 'Confirm Shipping',
  '/extensions/tracking-etsy': 'Tracking Etsy',
  '/account': 'Users Management',
  '/sku_mapping': 'SKU Mapping',
  '/vendor/list-vendor': 'Manage Vendor',
  '/vendor/vendor-products': 'Vendor Products',
  '/team-tasks': 'Team Tasks',
};

const TitlePages = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] || 'LNG System';
  }, [pathname]);
  return null;
};

export default TitlePages;
