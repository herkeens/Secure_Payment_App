import './styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './auth'
import { initCsrf } from './api'

async function start() {
  try { await initCsrf() } catch (e) { console.error('CSRF init failed', e) }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

start()
