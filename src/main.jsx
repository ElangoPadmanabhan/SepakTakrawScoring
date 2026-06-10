import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LeaguesProvider } from './context/LeaguesContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LeaguesProvider>
          <App />
        </LeaguesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
