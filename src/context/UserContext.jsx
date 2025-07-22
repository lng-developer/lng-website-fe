import { createContext, useReducer, useContext } from 'react';

// 1. Tạo initial state
const initialState = { 
    isLoading: false,
    Values: {},
    accessToken: ''
};

function counterReducer(state, action) {
  switch (action.type) {
    case 'login':
      return { 
        isLoading: true,
        values: action.payload,
        accessToken: action?.payload?.accessToken
       };
    case 'logout':
      return { 
    isLoading: false,
    Values: {},
    accessToken: ''
};
    default:
      return state;
  }
}

// 3. Tạo context
const CounterContext = createContext();

// 4. Provider bọc quanh App
export function CounterProvider({ children }) {
  const [state, dispatch] = useReducer(counterReducer, initialState);

  return (
    <CounterContext.Provider value={{ state, dispatch }}>
      {children}
    </CounterContext.Provider>
  );
}

// 5. Custom hook để dùng trong component
export function useCounter() {
  return useContext(CounterContext);
}
