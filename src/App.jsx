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
import UnauthorizedPage from './pages/unauthorized';
import QC from './pages/fulfillment/QC';
import TitlePages from './utils/TitlePages';
import Mapping from './pages/cost_center/Mapping';

function App() {
  return (
    <Router>
      <TitlePages />
      <Routes>
        <Route
          path={routes.home}
          element={
            <PrivateRoute allowedRoles={['Admin', 'Seller']}>
              <OrderProvider>
                <MainLayout />
              </OrderProvider>
            </PrivateRoute>
          }
        >
          <Route index path={routes.order_amazon} element={<Home />} />
          <Route path={routes.sale_listing} element={<Listing />} />
          <Route path={routes.vendor_list} element={<Vendor />} />
          <Route path={routes.vendor_products} element={<VendorProduct />} />
          <Route path={routes.product_cost_center} element={<ProductCostCenter />} />
          <Route path={routes.fulfillmentScale} element={<FulfillmentScale />} />
          <Route path={routes.fulfillmentQc} element={<QC />} />
          <Route path={routes.cost_center_productTypes} element={<CostCenterProductTypes />} />
          <Route path={routes.cost_center_config} element={<CostCenterConfig />} />
          <Route path={routes.cost_center_mapping} element={<Mapping />} />
          <Route path={routes.report_ordersCost} element={<ReportOrderCost />} />
          <Route path={routes.report_sale} element={<SaleReport />} />
          <Route path={routes.unauthorized} element={<UnauthorizedPage />} />
        </Route>

        <Route path={routes.login} element={<Login />} />
        <Route path={routes.register} element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
