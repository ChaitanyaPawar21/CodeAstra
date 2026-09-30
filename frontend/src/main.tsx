import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/App.tsx'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
