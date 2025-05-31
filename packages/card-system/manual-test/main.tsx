import React from 'react'
import ReactDOM from 'react-dom/client'
import { CardSystemDemo } from '../src/manual-test/demo'

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <CardSystemDemo />
    </React.StrictMode>
  )
} else {
  console.error('Root element not found')
}