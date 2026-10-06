import React, { useState, useEffect } from 'react'
import HackHeader from './hack_header.jsx'

export default function MainLayout({ children, onNavigate, isHacked }) {
  const [isHeroInView, setIsHeroInView] = useState(false)

  useEffect(() => {
    if (typeof isHacked === 'boolean') {
      setIsHeroInView(isHacked)
      return
    }

    const heroEl = document.getElementById('hero-section')
    if (!heroEl) {
      setIsHeroInView(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroInView(entry.isIntersecting)
      },
      {
        rootMargin: '-64px 0px 0px 0px',
        threshold: 0.05,
      }
    )

    observer.observe(heroEl)
    return () => observer.disconnect()
  }, [children, isHacked])

  const showHackHeader = typeof isHacked === 'boolean' ? isHacked : isHeroInView

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Header: HackHeader khi focus vào Hero Section, Header thường khi ra khỏi Hero Section */}
      {showHackHeader ? (
        <HackHeader onNavigate={onNavigate} />
      ) : (
        /* Header / Navbar bình thường - Container Fluid */
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo & Brand */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigate && onNavigate('/')}
            >
              <img 
                src="/logo.png" 
                alt="VTTU Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-white/5 p-0.5 border border-slate-700/60 shadow-lg shadow-indigo-500/10 group-hover:border-indigo-500/50 transition-all duration-200"
              />
              <div>
                <h1 className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-indigo-300 transition-all">
                  VTTU Attendance & Monitoring
                </h1>
                <p className="text-[11px] text-slate-400">Hệ Thống Điểm Danh & Giám Sát Giảng Đường</p>
              </div>
            </div>

            {/* Navigation Links & Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => onNavigate && onNavigate('/')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-house text-slate-400"></i>
                  <span>Trang Chủ</span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('/detect')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-camera-viewfinder text-slate-400"></i>
                  <span>Module Detect</span>
                </button>
              </nav>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hệ thống trực tuyến
              </span>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('/detect')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2"
                >
                  <span>Mở Module Detect</span>
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer - Container Fluid */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur text-slate-400 py-8 mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fa-solid fa-graduation-cap text-indigo-400 text-sm"></i>
            <span>AI Classroom Monitoring & Attendance System &copy; {new Date().getFullYear()} VTTU.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-microchip text-slate-400"></i>
              YOLOv8 + Pose AI
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-database text-slate-400"></i>
              MySQL Queue
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
