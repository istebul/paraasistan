import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PwaInstallPrompt from "./components/PwaInstallPrompt.jsx";

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Uygulama hatası:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="loading-screen">
          <h1>Bir hata oluştu</h1>
          <p>Sayfayı yenileyerek tekrar deneyebilirsin.</p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Sayfayı Yenile
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
      <PwaInstallPrompt />
    </AppErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker kayıt hatası:', error)
    })
  })
}
