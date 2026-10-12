import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import './i18n';
import App from './App';

const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
const backendUrl = import.meta.env.VITE_API_URL || (isRender ? 'https://varisai-backend.onrender.com' : '');
if (backendUrl) {
  axios.defaults.baseURL = backendUrl;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
