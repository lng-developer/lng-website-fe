import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import { routes } from './routes/routes';
import { Register } from './pages/register';
import Home from './pages/home';
import { NotFound } from './pages/notfound';
import MainLayout from './layouts/MainLayout';
import { PrivateRoute } from './layouts/PrivateRoute';
import { OrderProvider } from './context/OrderContext';

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
          <Route index element={<Home />} />
        </Route>

        <Route path={routes.login} element={<Login />} />
        <Route path={routes.register} element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
