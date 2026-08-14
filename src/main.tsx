import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { StageProvider } from './context/StageContext';
import './styles/index.css';
import './styles/dpad.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StageProvider>
      <App />
    </StageProvider>
  </React.StrictMode>
);
