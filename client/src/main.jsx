
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

/**
 * Main entry point for the Travel Planner MVP client application.
 * Renders the App component inside a BrowserRouter to enable client-side routing.
 * Design decision: Using React 18's createRoot for concurrent rendering support.
 */
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)