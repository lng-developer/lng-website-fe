import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import 'antd/dist/reset.css';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import vi from './locales/vi/translation.json';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastContainer } from 'react-toastify';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
    <ToastContainer />
  </AuthProvider>
);
