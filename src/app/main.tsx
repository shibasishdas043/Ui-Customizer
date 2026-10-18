import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Fast guard to bypass Chrome's native Omnibox focus lock on new tab pages
if (typeof window !== 'undefined' && window.location && !window.location.search.includes('focus')) {
  const search = window.location.search || ''
  const sep = search.length > 0 ? '&' : '?'
  window.location.replace(window.location.pathname + search + sep + 'focus=1')
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}



