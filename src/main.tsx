import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { googleFitService } from '@/services/googleFitService';

// Global Google Fit adım fonksiyonu
// @ts-ignore
window.getGoogleFitSteps = async () => {
  try {
    return await googleFitService.getCurrentSteps();
  } catch (e) {
    console.error("getGoogleFitSteps error:", e);
    return 0;
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
