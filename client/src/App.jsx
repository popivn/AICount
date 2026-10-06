import React, { useState, useEffect } from 'react'
import HomePage from './pages/homepage/index.jsx'
import DetectPage from './pages/detect/index.jsx'

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/')

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Phân luồng route:
  // - '/' hoặc '/home' -> Trang HomePage
  // - '/detect' hoặc '/module-detect' -> Trang Module Detect
  if (currentPath === '/detect' || currentPath === '/module-detect') {
    return <DetectPage onNavigate={navigate} />
  }

  // Mặc định route '/' hiển thị HomePage
  return <HomePage onNavigate={navigate} />
}
