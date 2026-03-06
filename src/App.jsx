import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import { routes } from './routes/routes';
import { Register } from './pages/register';
import Home from './pages/home';
import { NotFound } from './pages/notfound';
import MainLayout from './layouts/MainLayout';
import { PrivateRoute } from './layouts/PrivateRoute';
import { OrderProvider } from './context/OrderContext';
import Vendor from './pages/vendor';
import VendorProduct from './pages/vendor/VendorProduct';
import ProductCostCenter from './pages/vendor/ProductCostCenter';
import FulfillmentScale from './pages/fulfillment';
import Listing from './pages/listing';
import CostCenterProductTypes from './pages/cost_center';
import CostCenterConfig from './pages/cost_center/CostCenterConfig';
import ReportOrderCost from './pages/report/ReportOrderCost';
import SaleReport from './pages/report/SaleReport';
import EtsySaleReport from './pages/report/etsy/EtsySaleReport';
import EtsyOrderCost from './pages/report/etsy/EtsyOrderCost';
import UnauthorizedPage from './pages/unauthorized';
import QC from './pages/fulfillment/QC';
import TitlePages from './utils/TitlePages';
import Mapping from './pages/cost_center/Mapping';
import PSDTasks from './pages/design/PSDTasks';
import PNGTasks from './pages/design/PNGTasks';
import IdeaTask from './pages/design/IdeaTask';
import AdsReport from './pages/report/AdsReport';
import Teams from './pages/cost_center/Teams';
import ExtensionManager from './pages/extension';
import PointsDashboard from './pages/design/PointsDashboard';
import SkuMapping from './pages/sku_mapping/SkuMapping';
import User from './pages/user/User';
import ConfirmShip from './pages/extension/ConfirmShip';
import Dashboard from './pages/dashboard/DashboardPage';
import ManageStores from './pages/shop/ManageStore';
import OrderEtsy from './pages/home/OrderEtsy';

function App() {
  return (
    <Router>
      <TitlePages />
      <Routes>
        <Route
          path={routes.home}
          element={
            <PrivateRoute allowedRoles={['Admin', 'Seller', 'Designer', 'Customer Service', 'Production', 'Design Leader']}>
              <OrderProvider>
                <MainLayout />
              </OrderProvider>
            </PrivateRoute>
          }
        >
          <Route index path={routes.order_amazon} element={<Home />} />
          <Route path={routes.order_etsy} element={<OrderEtsy />} />
          <Route path={routes.team_task} element={<Dashboard />} />
          <Route path={routes.sale_listing} element={<Listing />} />
          <Route path={routes.vendor_list} element={<Vendor />} />
          <Route path={routes.vendor_products} element={<VendorProduct />} />
          <Route path={routes.product_cost_center} element={<ProductCostCenter />} />
          <Route path={routes.fulfillmentScale} element={<FulfillmentScale />} />
          <Route path={routes.fulfillmentQc} element={<QC />} />
          <Route path={routes.cost_center_productTypes} element={<CostCenterProductTypes />} />
          <Route path={routes.cost_center_config} element={<CostCenterConfig />} />
          <Route path={routes.cost_center_mapping} element={<Mapping />} />
          <Route path={routes.cost_center_group_standards} element={<Teams />} />
          <Route path={routes.manage_stores} element={<ManageStores />} />

          {/* Report */}
          <Route path={routes.report_ordersCost} element={<ReportOrderCost />} />
          <Route path={routes.report_sale} element={<SaleReport />} />
          <Route path={routes.report_sale_etsy} element={<EtsySaleReport />} />
          <Route path={routes.report_order_cost_etsy} element={<EtsyOrderCost />} />
          <Route path={routes.unauthorized} element={<UnauthorizedPage />} />
          <Route path={routes.report_ads} element={<AdsReport />} />

          {/* Design */}
          <Route path={routes.psd_design} element={<PSDTasks />} />
          <Route path={routes.png_design} element={<PNGTasks />} />
          <Route path={routes.idea_task} element={<IdeaTask />} />
          <Route path={routes.points_dashboard} element={<PointsDashboard />} />

          {/* Extension */}
          <Route path={routes.extensions} element={<ExtensionManager />} />
          <Route path={routes.extensions_confirm_ship} element={<ConfirmShip />} />

          {/* SKU Mapping */}
          <Route path={routes.sku_mapping} element={<SkuMapping />} />

          {/* Management Account */}
          <Route
            path={routes.management_account}
            element={
              <PrivateRoute allowedRoles={['Admin']}>
                <User />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path={routes.login} element={<Login />} />
        <Route path={routes.register} element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
