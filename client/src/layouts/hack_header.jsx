import React from 'react'

export default function HackHeader({ onNavigate }) {
  return (
    <header className="border-b border-red-900/40 bg-black/85 backdrop-blur-md sticky top-0 z-50 overflow-hidden select-none animate-glitch-flicker transition-all duration-300">
      {/* Lớp CRT Scanlines phủ mờ trên header */}
      <div className="absolute inset-0 glitch-scanlines pointer-events-none opacity-40 z-0"></div>

      {/* Vệt xẹt ngang xé hình trên header */}
      <div className="absolute inset-x-0 bg-red-500/20 h-1 animate-tear-bar pointer-events-none z-10"></div>

      {/* Container Fluid */}
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-20">
        {/* Logo & Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate && onNavigate('/')}
        >
          {/* Logo container với hiệu ứng RGB split giật */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="" 
              aria-hidden="true"
              className="absolute inset-0 w-full h-full rounded-xl object-contain opacity-75 pointer-events-none glitch-layer-1"
            />
            <img 
              src="/logo.png" 
              alt="" 
              aria-hidden="true"
              className="absolute inset-0 w-full h-full rounded-xl object-contain opacity-75 pointer-events-none glitch-layer-2"
            />
            <img 
              src="/logo.png" 
              alt="VTTU Logo" 
              className="relative w-10 h-10 rounded-xl object-contain bg-black/60 p-0.5 border border-red-500/40 shadow-lg shadow-red-500/10 group-hover:border-red-400 transition-all duration-200"
            />
          </div>
          <div>
            <h1 
              className="font-bold text-base sm:text-lg tracking-tight text-white font-mono glitch-text"
              data-text="VTTU Attendance & Monitoring"
            >
              VTTU Attendance & Monitoring
            </h1>
            <p className="text-[11px] font-mono text-red-400/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span>SYSTEM_OVERRIDDEN // HACK DETECTED</span>
            </p>
          </div>
        </div>

        {/* Navigation Links & Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          <nav className="hidden md:flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => onNavigate && onNavigate('/')}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-house text-slate-400"></i>
              <span>Trang Chủ</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('/detect')}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-camera-viewfinder text-slate-400"></i>
              <span>Module Detect</span>
            </button>
          </nav>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            THREAT LEVEL: CRITICAL
          </span>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/detect')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono text-xs sm:text-sm font-semibold transition-all shadow-md shadow-red-600/30 border border-red-500/50 flex items-center gap-2 active:scale-95"
            >
              <span>Mở Module Detect</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
