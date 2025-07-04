import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import errorLogger from './utils/errorLogger.ts';
import './index.css';

// Initialize error logger
console.log('🔍 Error Logger initialized. Use window.errorLogger.printLogs() to view errors.');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
