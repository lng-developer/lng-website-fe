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

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path={routes.home}
          element={
            <PrivateRoute allowedRoles={['Admin']}>
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
          <Route path={routes.product_const_center} element={<ProductCostCenter />} />
          <Route path={routes.fulfillmentScale} element={<FulfillmentScale />} />
        </Route>

        <Route path={routes.login} element={<Login />} />
        <Route path={routes.register} element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
