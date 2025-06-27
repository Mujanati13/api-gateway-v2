import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Aggressive service worker and cache cleanup
async function clearAllBrowserData() {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => {
        console.log('Unregistering SW:', reg.scope);
        return reg.unregister();
      }));
    }

    // 2. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => {
        console.log('Deleting cache:', name);
        return caches.delete(name);
      }));
    }

    // 3. Clear storage
    localStorage.clear();
    sessionStorage.clear();

    console.log('✅ All browser data cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing browser data:', error);
  }
}

// 4. Block any service worker registration attempts
if ('serviceWorker' in navigator) {
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function() {
    console.log('🚫 Service worker registration blocked');
    return Promise.reject(new Error('Service worker registration disabled'));
  };
}

// Run cleanup immediately
clearAllBrowserData();

// Initialize React app
const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
