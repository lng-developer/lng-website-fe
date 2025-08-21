import { useAuth } from '../context/AuthContext';
import { routes } from '../routes/routes';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { accessToken, roles, isLoading } = useAuth();

  if (isLoading) return null;

  const isAuthenticated = !!accessToken;

  if (!isAuthenticated) return <Navigate to={routes.login} />;

  if (allowedRoles && !roles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to={routes.unauthorized} />;
  }

  return children;
};

export { PrivateRoute };
