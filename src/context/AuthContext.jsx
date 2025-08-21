import { createContext, useContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loginUser = (authData) => {
    setUser(authData.user);
    setAccessToken(authData.accessToken);
    const roleUser = [authData.user.role];
    setRoles(roleUser || []);
    localStorage.setItem('auth', JSON.stringify(authData));
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRoles([]);
    localStorage.removeItem('auth');
  };

  // Load từ localStorage nếu đã đăng nhập trước đó
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
      const roleUser = [parsed.user?.role];
      setRoles(roleUser || []);
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        roles,
        loginUser,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
