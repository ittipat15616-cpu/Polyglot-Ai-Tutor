// Prevent third-party libs like whatwg-fetch from redefining window.fetch in environments
// where window.fetch is a getter-only property (like AI Studio's preview iframe).
try {
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => originalFetch,
      set: () => { console.warn("Prevented window.fetch override"); },
      configurable: true
    });
  }
} catch(e) {}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
