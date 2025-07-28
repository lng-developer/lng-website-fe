import { createContext, useContext, useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [dataFilter, setDataFilter] = useState([]);
  return (
    <OrderContext.Provider
      value={{
        orders,
        setOrders,
        dataFilter,
        setDataFilter,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOrder = () => useContext(OrderContext);
