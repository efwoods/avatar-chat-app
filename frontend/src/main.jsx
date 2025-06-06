import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NgrokUrlProvider } from './context/NgrokAPIContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NgrokUrlProvider>
      <App />
    </NgrokUrlProvider>
  </StrictMode>,
)
