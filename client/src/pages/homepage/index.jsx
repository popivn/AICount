import React from 'react'
import MainLayout from '../../layouts/MainLayout.jsx'

export default function HomePage({ onNavigate }) {
  return (
    <MainLayout onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Section */}
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
              <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                <i className="fa-solid fa-sliders text-indigo-400"></i>
                <span>Độ tin cậy Cron: <strong>0.36</strong></span>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* Feature Cards Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <i className="fa-solid fa-camera text-lg"></i>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quét & Hàng Đợi (Queue)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cron tự động kiểm tra thư mục <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">data/</code>, đồng bộ ảnh mới vào <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">data_queue</code> để bắt đầu xử lý.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <i className="fa-solid fa-brain text-lg"></i>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Xử Lý AI Tự Động</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nhận diện chính xác sinh viên ngồi các dãy bàn, góc khuất, trích xuất mã phòng học và thời gian chụp trực tiếp từ tên file ảnh.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 hover:-translate-y-1 transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <i className="fa-solid fa-chart-column text-lg"></i>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lưu Trữ & Xuất Ảnh Vẽ</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Lưu sĩ số vào bảng <code className="text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">room_number</code> và di chuyển ảnh kết quả đã được AI đánh dấu trực quan vào <code className="text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">data_processed/</code>.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
