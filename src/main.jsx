import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerServiceWorker } from './serviceWorker/register'
import './assets/css/scroll-optimization.css'
// import './assets/css/style.css
// Register service worker
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
