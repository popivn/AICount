import React, { useState, useEffect, useRef } from 'react'
import MainLayout from '../../layouts/MainLayout.jsx'

export default function HomePage({ onNavigate }) {
  const heroRef = useRef(null)
  const [isHeroInView, setIsHeroInView] = useState(true)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroInView(entry.isIntersecting)
      },
      {
        threshold: 0.05,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollToContent = () => {
    const target = document.getElementById('overview-section')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <MainLayout onNavigate={onNavigate} isHacked={isHeroInView}>
      {/* Hero Section: Dừng toàn bộ animation khi ra khỏi khung hình */}
      <section 
        id="hero-section" 
        ref={heroRef}
        className={`relative w-full h-[calc(100dvh-4rem)] min-h-[520px] flex flex-col items-center justify-center overflow-hidden border-b border-red-900/40 bg-black select-none ${isHeroInView ? 'animate-glitch-flicker' : ''}`}
      >
        {/* Lớp nền CRT Scanlines */}
        <div className="absolute inset-0 glitch-scanlines pointer-events-none opacity-60 z-20"></div>

        {/* Tia quét scanline laser cuộn liên tục (chỉ chạy khi đang xem Hero Section) */}
        {isHeroInView && (
          <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-red-500/10 to-transparent animate-scanline pointer-events-none z-20"></div>
        )}

        {/* Vệt xẹt ngang xé hình (chỉ chạy khi đang xem Hero Section) */}
        {isHeroInView && (
          <div className="absolute inset-x-0 bg-red-500/25 h-3 animate-tear-bar pointer-events-none z-30"></div>
        )}

        {/* Hiệu ứng hào quang nền */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-gradient-to-tr from-red-600/20 via-rose-500/10 to-cyan-500/15 rounded-full blur-3xl opacity-75"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-20"></div>
        </div>

        {/* Cyber HUD: 4 góc giao diện hacker */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-8 font-mono text-[10px] sm:text-xs text-red-500/80 flex items-center gap-2 z-10 pointer-events-none">
          <span className={`w-2 h-2 rounded-full bg-red-500 ${isHeroInView ? 'animate-ping' : ''}`}></span>
          <span>SYSTEM_STATUS: [COMPROMISED]</span>
        </div>
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 font-mono text-[10px] sm:text-xs text-cyan-400/80 z-10 pointer-events-none">
          SIGNAL_FREQ: 104.9 MHz <span className={`text-red-400 ${isHeroInView ? 'animate-pulse' : ''}`}>// CORRUPTED</span>
        </div>
        <div className="hidden sm:block absolute bottom-6 left-8 font-mono text-[10px] text-emerald-400/60 z-10 pointer-events-none">
          SEC_PROTOCOL: OVERRIDDEN [PORT: 8080]
        </div>

        {/* Cảnh báo xâm nhập hacker */}
        <div className="relative z-10 mb-4 sm:mb-6">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded bg-red-950/70 border border-red-500/50 text-red-400 font-mono text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(239,68,68,0.4)] ${isHeroInView ? 'animate-pulse' : ''}`}>
            <i className="fa-solid fa-triangle-exclamation text-xs text-red-400"></i>
            <span>SYSTEM BREACH DETECTED // INTRUSION ACTIVE</span>
          </div>
        </div>

        {/* Nội dung chính: Logo Site với hiệu ứng Glitch RGB Split giật xẹt */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4">
          <div className="relative group flex items-center justify-center">
            {/* Hào quang đỏ rực phía sau */}
            <div className="absolute -inset-8 bg-gradient-to-r from-red-600/30 via-rose-500/20 to-cyan-500/20 rounded-full blur-2xl opacity-70 pointer-events-none"></div>

            {/* Lớp RGB Split 1 (Red / Magenta Glitch) - Chỉ chạy khi đang xem Hero Section */}
            {isHeroInView && (
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="absolute max-h-[50vh] sm:max-h-[60vh] max-w-[85vw] sm:max-w-[70vw] w-auto h-auto object-contain opacity-75 pointer-events-none glitch-layer-1"
              />
            )}

            {/* Lớp RGB Split 2 (Cyan / Blue Glitch) - Chỉ chạy khi đang xem Hero Section */}
            {isHeroInView && (
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="absolute max-h-[50vh] sm:max-h-[60vh] max-w-[85vw] sm:max-w-[70vw] w-auto h-auto object-contain opacity-75 pointer-events-none glitch-layer-2"
              />
            )}

            {/* Logo gốc ở giữa */}
            <img
              src="/logo.png"
              alt="Site Logo"
              className="relative max-h-[50vh] sm:max-h-[60vh] max-w-[85vw] sm:max-w-[70vw] w-auto h-auto object-contain filter drop-shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-transform duration-300"
            />
          </div>
        </div>

        {/* Nút cuộn xuống nội dung bên dưới */}
        <button
          type="button"
          onClick={scrollToContent}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-red-400/80 hover:text-red-300 transition-colors cursor-pointer group z-30"
          aria-label="Cuộn xuống"
        >
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100">Bỏ Qua Cảnh Báo</span>
          <i className={`fa-solid fa-chevron-down text-xs text-red-400 ${isHeroInView ? 'animate-bounce' : ''}`}></i>
        </button>
      </section>

      <div id="overview-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Banner giới thiệu */}
        <section className="mb-10 text-center sm:text-left bg-gradient-to-br from-slate-900 via-slate-900/80 to-indigo-950/40 p-8 sm:p-10 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <i className="fa-solid fa-sparkles text-xs"></i>
              <span>AI Classroom Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Giám Sát Giảng Đường Thông Minh Bằng AI
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              Hệ thống tự động quét dữ liệu hình ảnh từ camera lớp học, phân tích sĩ số sinh viên theo thời gian thực với độ chính xác cao nhờ mô hình nhận diện đa tầng (Pose + Head AI).
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('/detect')}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 active:scale-95"
                >
                  <span>Trải Nghiệm Module AI Detect</span>
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </button>
              ) : (
                <a
                  href="/detect"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2.5"
                >
                  Trải Nghiệm Module AI Detect
                </a>
              )}
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* ========================================================
            TREE FLOW: SƠ ĐỒ CÂY QUÁ TRÌNH DETECT & PHÂN TÍCH MÔ HÌNH AI
           ======================================================== */}
        <section id="tree-flow-section" className="mb-12 bg-slate-900/80 rounded-3xl border border-slate-800/80 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              <i className="fa-solid fa-sitemap text-xs"></i>
              <span>Tri-Model Ensemble Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Sơ Đồ Luồng Cây Quá Trình Nhận Diện Ảnh (Tree Flow)
            </h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Cơ chế phân tách đa luồng AI song song kết hợp thuật toán khử trùng lặp không gian (Spatial Deduplication) để đạt độ chính xác tối đa trong môi trường giảng đường đông đúc (~100 sinh viên).
            </p>
          </div>

          {/* CÂY LUỒNG TRỰC QUAN (TREE FLOW DIAGRAM) */}
          <div className="relative max-w-5xl mx-auto">
            {/* GỐC CÂY (ROOT): ẢNH GỐC ĐẦU VÀO */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md bg-gradient-to-r from-slate-800 to-indigo-950/80 border border-indigo-500/40 rounded-2xl p-4 shadow-lg text-center relative z-10 group hover:border-indigo-400 transition-all">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
                  [ROOT] Ảnh Góc Rộng Giảng Đường
                </span>
                <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
                  <i className="fa-solid fa-image text-indigo-400"></i>
                  <span>Input Camera Image (1080p / 2K / 4K)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Độ che khuất cao do bàn ghế học tập, góc nghiêng và khoảng cách hàng ghế từ 2m đến 25m.
                </p>
              </div>

              {/* Đường nối từ Root tỏa ra các nhánh */}
              <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-slate-700"></div>
              <div className="w-full max-w-3xl h-0.5 bg-slate-700 relative hidden md:block">
                <div className="absolute left-1/6 -top-1 w-2 h-2 rounded-full bg-indigo-500"></div>
                <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="absolute right-1/6 -top-1 w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
              <div className="w-0.5 h-6 bg-slate-700 hidden md:block"></div>
            </div>

            {/* CÁC NHÁNH MÔ HÌNH (BRANCHES: 3 MÔ HÌNH AI CHỦ LỰC) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 relative">
              {/* NHÁNH 1: YOLOv8-Pose */}
              <div className="bg-slate-950/70 border border-indigo-500/30 rounded-2xl p-5 hover:border-indigo-500/70 transition-all shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
                      TẦNG 1: POSE
                    </span>
                    <i className="fa-solid fa-person-rays text-indigo-400 text-lg"></i>
                  </div>
                  <h5 className="text-base font-bold text-white mb-2">YOLOv8-Pose</h5>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Nhận diện toàn thân và trích xuất <strong>17 điểm khung xương</strong> (vai, khuỷu tay, đầu gối, mắt, tai).
                  </p>

                  <div className="space-y-2.5 text-xs border-t border-slate-800 pt-3">
                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-certificate text-indigo-400 text-xs"></i>
                        <span>Bản quyền & Phát minh:</span>
                      </span>
                      <strong className="text-indigo-300">Ultralytics Inc. (2023)</strong>
                      <span className="text-[11px] text-slate-400 block">Glenn Jocher & cộng sự</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-shield-halved text-emerald-400 text-xs"></i>
                        <span>Dùng miễn phí không?:</span>
                      </span>
                      <span className="text-emerald-400 font-semibold block">Có — Miễn phí 100% cho Học Thuật & Nghiên Cứu</span>
                      <span className="text-[11px] text-slate-400 block">Giấy phép AGPL-3.0 (Cần mua bản quyền Enterprise nếu đóng gói thương mại đóng mã nguồn).</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-clock text-indigo-400 text-xs"></i>
                        <span>Khi nào kích hoạt:</span>
                      </span>
                      <span className="text-slate-300">Quét tổng quan toàn khung hình để nhận diện tư thế ngồi của sinh viên.</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-bullseye text-indigo-400 text-xs"></i>
                        <span>Lý do sử dụng:</span>
                      </span>
                      <span className="text-slate-300">
                        Xác thực sinh viên thực sự ngồi tại bàn qua đường vai (<code className="text-indigo-400">mid-shoulder</code>); phát hiện tốt người trùm áo hoodie/ngồi nghiêng.
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-link text-indigo-400 text-xs"></i>
                        <span>Đường dẫn tài liệu & mã nguồn:</span>
                      </span>
                      <div className="flex flex-col gap-1 pt-0.5">
                        <a
                          href="https://github.com/ultralytics/ultralytics"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <i className="fa-brands fa-github text-xs"></i>
                          <span>github.com/ultralytics/ultralytics</span>
                        </a>
                        <a
                          href="https://docs.ultralytics.com/tasks/pose/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <i className="fa-solid fa-book-open text-xs"></i>
                          <span>docs.ultralytics.com/tasks/pose</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-indigo-400/90 font-mono">
                  <span>Trọng số: yolov8m-pose.pt</span>
                  <span>Conf: &ge; 0.12</span>
                </div>
              </div>

              {/* NHÁNH 2: YOLOv8-Head */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-5 hover:border-emerald-500/70 transition-all shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                      TẦNG 2 & 3: HEAD
                    </span>
                    <i className="fa-solid fa-head-side-brain text-emerald-400 text-lg"></i>
                  </div>
                  <h5 className="text-base font-bold text-white mb-2">YOLOv8-Head Detector</h5>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Mô hình chuyên dụng phát hiện <strong>đầu người mật độ cao</strong> và quét vét Cascade Recovery (<code className="text-emerald-400">conf=0.08</code>).
                  </p>

                  <div className="space-y-2.5 text-xs border-t border-slate-800 pt-3">
                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-certificate text-emerald-400 text-xs"></i>
                        <span>Bản quyền & Phát minh:</span>
                      </span>
                      <strong className="text-emerald-300">Ultralytics YOLOv8</strong>
                      <span className="text-[11px] text-slate-400 block">Fine-tune tối ưu trên bộ dữ liệu CrowdHuman & SCUT-HEAD</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-shield-halved text-emerald-400 text-xs"></i>
                        <span>Dùng miễn phí không?:</span>
                      </span>
                      <span className="text-emerald-400 font-semibold block">Có — Miễn phí mã nguồn mở & học thuật</span>
                      <span className="text-[11px] text-slate-400 block">Dữ liệu mở phi thương mại phục vụ nghiên cứu phát hiện người.</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-clock text-emerald-400 text-xs"></i>
                        <span>Khi nào kích hoạt:</span>
                      </span>
                      <span className="text-slate-300">Chạy song song tầng 2 và quét nối tiếp cascade tầng 3 để cứu các ca bị che khuất.</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-bullseye text-emerald-400 text-xs"></i>
                        <span>Lý do sử dụng:</span>
                      </span>
                      <span className="text-slate-300">
                        Bàn ghế giảng đường che lấp 70-80% thân người. Model này chuyên trị sinh viên cúi đầu viết bài, chỉ thấy chóp đầu hoặc bị màn hình máy tính che khuất.
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-link text-emerald-400 text-xs"></i>
                        <span>Đường dẫn tài liệu & bộ dữ liệu:</span>
                      </span>
                      <div className="flex flex-col gap-1 pt-0.5">
                        <a
                          href="https://github.com/Megvii-BaseDetection/CrowdHuman"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <i className="fa-brands fa-github text-xs"></i>
                          <span>github.com/Megvii-BaseDetection/CrowdHuman</span>
                        </a>
                        <a
                          href="https://github.com/ultralytics/ultralytics"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <i className="fa-solid fa-code-fork text-xs"></i>
                          <span>github.com/ultralytics/ultralytics</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400/90 font-mono">
                  <span>Trọng số: head_medium.pt</span>
                  <span>Conf: 0.08 - 0.36</span>
                </div>
              </div>

              {/* NHÁNH 3: P2PNet & PP-YOLOE */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-5 hover:border-amber-500/70 transition-all shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
                      TẦNG 4: P2PNET / EDGE
                    </span>
                    <i className="fa-solid fa-users-viewfinder text-amber-400 text-lg"></i>
                  </div>
                  <h5 className="text-base font-bold text-white mb-2">P2PNet & PP-YOLOE+</h5>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Point-to-Point Network dự đoán <strong>tọa độ điểm trực tiếp</strong> không dùng bounding box cho đám đông siêu xa.
                  </p>

                  <div className="space-y-2.5 text-xs border-t border-slate-800 pt-3">
                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-certificate text-amber-400 text-xs"></i>
                        <span>Bản quyền & Phát minh:</span>
                      </span>
                      <strong className="text-amber-300">Tencent Youtu Lab & HUST (ICCV 2021)</strong>
                      <span className="text-[11px] text-slate-400 block">Qingyu Song, Changan Wang et al. / Baidu (PP-YOLOE)</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-shield-halved text-emerald-400 text-xs"></i>
                        <span>Dùng miễn phí không?:</span>
                      </span>
                      <span className="text-emerald-400 font-semibold block">Có — Miễn phí mã nguồn mở 100%</span>
                      <span className="text-[11px] text-slate-400 block">P2PNet miễn phí nghiên cứu; PP-YOLOE giấy phép mở Apache 2.0.</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-clock text-amber-400 text-xs"></i>
                        <span>Khi nào kích hoạt:</span>
                      </span>
                      <span className="text-slate-300">Khi giảng đường có quy mô lớn (&gt;100 người) với hàng ghế xa cách camera 15-25m.</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-bullseye text-amber-400 text-xs"></i>
                        <span>Lý do sử dụng:</span>
                      </span>
                      <span className="text-slate-300">
                        Ở khoảng cách xa, đầu người chỉ còn kích thước vài pixel khiến bounding box bị trượt. P2PNet dùng regression điểm trực tiếp chuẩn xác tuyệt đối.
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-link text-amber-400 text-xs"></i>
                        <span>Đường dẫn tài liệu & mã nguồn:</span>
                      </span>
                      <div className="flex flex-col gap-1 pt-0.5">
                        <a
                          href="https://github.com/TencentYoutuResearch/CrowdCounting-P2PNet"
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <i className="fa-brands fa-github text-xs"></i>
                          <span>github.com/TencentYoutuResearch/...-P2PNet</span>
                        </a>
                        <a
                          href="https://github.com/PaddlePaddle/PaddleDetection"
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <i className="fa-solid fa-cube text-xs"></i>
                          <span>github.com/PaddlePaddle/PaddleDetection</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-amber-400/90 font-mono">
                  <span>Trọng số: SHTechA.pth</span>
                  <span>Point Threshold: 0.45</span>
                </div>
              </div>
            </div>

            {/* HỘI TỤ (CONVERGENCE / TRUNK): THUẬT TOÁN FUSION & DEDUPLICATION */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-3xl h-0.5 bg-slate-700 relative hidden md:block">
                <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
              <div className="w-0.5 h-8 bg-gradient-to-b from-slate-700 to-indigo-500"></div>

              <div className="w-full max-w-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/50 rounded-2xl p-5 shadow-xl text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 mb-2 border border-indigo-500/30">
                  <i className="fa-solid fa-code-merge"></i>
                  <span>Spatial Deduplication & Fusion Core</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Thuật Toán Hợp Nhất Không Gian & Khử Trùng Lặp Tuyệt Đối
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto">
                  Sử dụng ma trận khoảng cách hình học Euclidean để đối chiếu tọa độ tâm đầu giữa Pose và Head. Nếu 1 sinh viên được nhận diện bởi cả 2 mô hình, hệ thống gộp thành 1 thực thể duy nhất — <strong>tuyệt đối không đếm trùng</strong>.
                </p>
              </div>

              <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-emerald-500"></div>
            </div>

            {/* ĐẦU RA (LEAVES / OUTPUT STAGE) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-2">
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 text-center">
                <i className="fa-solid fa-user-check text-emerald-400 text-lg mb-1 block"></i>
                <h6 className="text-xs font-bold text-white">Sĩ Số Chính Xác</h6>
                <p className="text-[11px] text-slate-400 mt-0.5">Xuất tổng số sinh viên theo từng phòng học</p>
              </div>

              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3.5 text-center">
                <i className="fa-solid fa-paintbrush text-indigo-400 text-lg mb-1 block"></i>
                <h6 className="text-xs font-bold text-white">Ảnh Đánh Dấu Trực Quan</h6>
                <p className="text-[11px] text-slate-400 mt-0.5">Vẽ khung BBox & khớp xương vào data_processed</p>
              </div>

              <div className="bg-slate-950/80 border border-sky-500/30 rounded-xl p-3.5 text-center">
                <i className="fa-solid fa-database text-sky-400 text-lg mb-1 block"></i>
                <h6 className="text-xs font-bold text-white">Đồng Bộ MySQL</h6>
                <p className="text-[11px] text-slate-400 mt-0.5">Tự động trích xuất mã phòng & thời gian vào DB</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
