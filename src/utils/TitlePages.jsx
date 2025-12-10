import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/order/amazon': 'Orders',
  '/sales/listing': 'Manage Listing',
  '/fulfillment/scale': 'Fulfillment Scale',
  '/fulfillment/qc': 'QC Fulfillment',
  '/reports': 'Reports',
  '/cost-center/config': 'Config Cost Center',
  '/cost-center/product-types': 'Product Type Groups',
  '/cost-center/mapping': 'Mapping Cost Center',
  '/report/sale': 'Sale Report',
  '/report/orders-cost': 'Report Orders Cost',
  '/report/ads': 'Amazon Ads Report',
  '/design/idea': 'Idea Tasks',
  '/design/psd': 'PSD Tasks',
  '/design/png': 'PNG Tasks',
  '/design/points': 'Points Dashboard',
  '/extensions': 'Extensions',
  '/extensions/confirm-ship': 'Confirm Shipping',
};

const TitlePages = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] || 'LNG System';
  }, [pathname]);
  return null;
};

export default TitlePages;
