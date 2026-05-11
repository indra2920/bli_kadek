import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store/useStore'
import { db } from './firebase'

// Initialize the store and its real-time listeners
useStore.getState().initialize();

// Expose to window for debugging
(window as any).db = db;
(window as any).useStore = useStore;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
