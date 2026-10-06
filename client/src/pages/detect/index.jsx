import React, { useState, useRef, useMemo } from 'react'

export default function DetectPage({ onNavigate }) {
  const [confThresh, setConfThresh] = useState(0.22)
  const [activeTab, setActiveTab] = useState('result') // 'result' | 'original'
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSample, setSelectedSample] = useState(null)
  
  // Data states
  const [metrics, setMetrics] = useState({
    total: 0,
    pose: 0,
    head: 0,
    recovered: 0,
    far: 0,
    elapsedMs: null,
  })

  const [imageUrls, setImageUrls] = useState({
    original: null,
    result: null,
  })

  const [students, setStudents] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all' | 'pose' | 'head' | 'recovered' | 'far'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const viewerRef = useRef(null)

  const samples = [
    {
      id: 'orig_6bb2c3b5_2550_0_4._P.202-01_20260923073501.png',
      tag: 'Mẫu 1 (07:35)',
      desc: 'Lớp học vắng (27 người), có ca trùm áo hoodie',
    },
    {
      id: '2550_0_4. P.202-01_20260923075304.png',
      tag: 'Mẫu 2 (07:53)',
      desc: 'Lớp học đông (~81 người), kín các hàng ghế',
    },
  ]

  const runInference = async (formData) => {
    setIsLoading(true)
    formData.append('conf_thresh', confThresh)

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!data.success) {
        alert('Lỗi: ' + (data.error || 'Xảy ra lỗi trong quá trình xử lý ảnh'))
        return
      }

      setMetrics({
        total: data.total_students,
        pose: data.pose_students,
        head: data.head_students || 0,
        recovered: data.recovered_students || 0,
        far: data.far_head_students,
        elapsedMs: data.elapsed_ms,
      })

      setImageUrls({
        original: data.original_url,
        result: data.result_url,
      })

      setStudents(data.students || [])
      setCurrentPage(1)
      setActiveTab('result')
    } catch (err) {
      console.error(err)
      alert('Không thể kết nối đến máy chủ AI (Port 3838). Vui lòng kiểm tra server!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file) => {
    if (!file) return
    setSelectedSample(null)
    const formData = new FormData()
    formData.append('image', file)
    runInference(formData)
  }

  const handleSampleClick = (sampleId) => {
    setSelectedSample(sampleId)
    const formData = new FormData()
    formData.append('sample_name', sampleId)
    runInference(formData)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFullscreen = () => {
    if (!viewerRef.current) return
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  // Lọc và tìm kiếm danh sách sinh viên
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Lọc theo loại mô hình
      let matchType = true
      if (filterType === 'pose') {
        matchType = s.type === 'fused_pose_head' || s.type === 'pose_only'
      } else if (filterType === 'head') {
        matchType = s.type === 'head_only'
      } else if (filterType === 'recovered') {
        matchType = s.type === 'recovered_head'
      } else if (filterType === 'far') {
        matchType = s.type === 'far_crowd_head'
      }

      // Lọc theo tìm kiếm ID
      let matchSearch = true
      if (searchQuery.trim() !== '') {
        matchSearch = s.id.toString().includes(searchQuery.trim())
      }

      return matchType && matchSearch
    })
  }, [students, filterType, searchQuery])

  // Phân trang
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  const currentDisplayUrl = activeTab === 'result' ? imageUrls.result : imageUrls.original

  const getModelBadge = (type) => {
    switch (type) {
      case 'fused_pose_head':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Toàn thân & Đầu (Pose)
          </span>
        )
      case 'head_only':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Đầu bị che (Head AI)
          </span>
        )
      case 'pose_only':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Khung xương (Pose Only)
          </span>
        )
      case 'recovered_head':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse"></span>
            Góc Khuất / Màn Hình (Cascade)
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Hàng ghế xa (P2PNet)
          </span>
        )
    }
  }

  return (
    <div className="w-full min-h-screen px-4 md:px-8 py-6 max-w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 mb-8 gap-4">
        <div className="flex items-center gap-4">
          {onNavigate && (
            <button
              onClick={() => onNavigate('/')}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white transition-all shadow-md"
              title="Quay lại Trang Chủ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}

          <img 
            src="/logo.png" 
            alt="VTTU Logo" 
            className="w-12 h-12 rounded-xl object-contain bg-white/5 p-0.5 border border-white/10 shadow-lg shadow-cyan-500/20 shrink-0"
          />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AI Classroom Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Hệ thống Điểm Danh & Định Vị Sinh Viên Lớp Học (YOLOv8-Pose + P2PNet)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              Trang Chủ
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AI Engine Ready</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Upload */}
        <section className="lg:col-span-4 xl:col-span-3">
          <div className="glass-panel rounded-2xl p-5 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2.5">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Tải Lên Ảnh Camera
            </h2>

            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isDragOver
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 -translate-y-0.5'
                  : 'border-cyan-500/30 bg-slate-900/40 hover:border-cyan-400 hover:bg-cyan-500/5'
              }`}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 mx-auto mb-3 text-cyan-400 flex items-center justify-center rounded-xl bg-cyan-500/10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Kéo & Thả ảnh vào đây</h3>
              <p className="text-xs text-slate-400 mb-3">Hỗ trợ JPG, PNG, WEBP (Tối đa 50MB)</p>
              <span className="inline-block px-3.5 py-1.5 bg-white/10 hover:bg-cyan-500 hover:text-slate-950 border border-white/10 rounded-lg text-xs font-semibold transition-all">
                Chọn file từ máy
              </span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
              />
            </div>

            {/* Sample Images */}
            <div className="mt-5">
              <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5">
                Ảnh Mẫu Lớp Học Có Sẵn
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      selectedSample === s.id
                        ? 'border-cyan-400 bg-cyan-500/15 shadow-md shadow-cyan-500/10'
                        : 'border-white/10 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                    }`}
                    onClick={() => handleSampleClick(s.id)}
                  >
                    <div className="text-xs font-bold text-cyan-400 mb-0.5">{s.tag}</div>
                    <div className="text-xs text-slate-400 leading-snug">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-300 font-medium">Ngưỡng Tin Cậy (Confidence)</span>
                <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {Number(confThresh).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.02"
                value={confThresh}
                onChange={(e) => setConfThresh(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Right Column: Results & Viewer */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Counters Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* Metric Total */}
            <div className="glass-panel rounded-xl p-4 flex items-center gap-3.5 hover:border-white/20 transition-all">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white leading-none">{metrics.total}</div>
                <div className="text-xs text-slate-400 mt-1">Tổng Sinh Viên Có Mặt</div>
                {metrics.elapsedMs && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    {metrics.elapsedMs} ms
                  </span>
                )}
              </div>
            </div>

            {/* Metric Pose */}
            <div className="glass-panel rounded-xl p-4 flex items-center gap-3.5 hover:border-white/20 transition-all">
              <div className="w-11 h-11 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white leading-none">{metrics.pose}</div>
                <div className="text-xs text-slate-400 mt-1">Toàn Thân / Khung Xương</div>
              </div>
            </div>

            {/* Metric Head */}
            <div className="glass-panel rounded-xl p-4 flex items-center gap-3.5 hover:border-white/20 transition-all">
              <div className="w-11 h-11 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="10" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18c0-2.2 2.7-4 6-4s6 1.8 6 4" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white leading-none">{metrics.head}</div>
                <div className="text-xs text-slate-400 mt-1">Che Thân / Ngồi Sát</div>
              </div>
            </div>

            {/* Metric Cascade Deep-Recovery */}
            {metrics.recovered > 0 && (
              <div className="glass-panel rounded-xl p-4 flex items-center gap-3.5 hover:border-fuchsia-500/40 transition-all border border-fuchsia-500/25 bg-fuchsia-950/15">
                <div className="w-11 h-11 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-500/15">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-fuchsia-300 leading-none">{metrics.recovered}</div>
                  <div className="text-xs text-fuchsia-400/90 mt-1">Cứu Hộ Góc Khuất (Cascade)</div>
                </div>
              </div>
            )}

            {/* Metric Far (Chi hien khi co P2PNet) */}
            {metrics.far > 0 && (
              <div className="glass-panel rounded-xl p-4 flex items-center gap-3.5 hover:border-white/20 transition-all">
                <div className="w-11 h-11 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white leading-none">{metrics.far}</div>
                  <div className="text-xs text-slate-400 mt-1">Hàng Ghế Xa Cùng</div>
                </div>
              </div>
            )}
          </div>

          {/* Viewer Card */}
          <div className="glass-panel rounded-2xl p-5 shadow-2xl flex flex-col min-h-[540px]">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
              <div className="flex gap-1.5 p-1 bg-slate-900/80 rounded-lg border border-white/10">
                <button
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === 'result'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('result')}
                >
                  Ảnh Nhận Diện (AI)
                </button>
                <button
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === 'original'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('original')}
                >
                  Ảnh Gốc (Camera)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all"
                  onClick={handleFullscreen}
                  title="Xem toàn màn hình"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Toàn màn hình
                </button>

                {currentDisplayUrl && (
                  <a
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all"
                    href={currentDisplayUrl}
                    download={`ai_classroom_${activeTab}.png`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải Ảnh Về
                  </a>
                )}
              </div>
            </div>

            {/* Canvas Container */}
            <div
              className="flex-1 bg-black/90 rounded-xl overflow-hidden relative flex items-center justify-center min-h-[460px] border border-white/5"
              ref={viewerRef}
            >
              {/* Loading Overlay */}
              <div
                className={`absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-30 transition-opacity duration-300 ${
                  isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
                <div className="text-sm font-semibold text-white">AI Đang Phân Tích Khung Hình...</div>
                <div className="text-xs text-slate-400 mt-1">Trích xuất khung xương, tư thế và vị trí đầu người</div>
              </div>

              {/* Empty State */}
              {!currentDisplayUrl && !isLoading && (
                <div className="text-center text-slate-500 p-8">
                  <svg className="w-16 h-16 mx-auto mb-3 text-white/10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Chưa có hình ảnh được chọn</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Kéo thả ảnh hoặc chọn 1 ảnh mẫu ở bên trái để bắt đầu
                  </p>
                </div>
              )}

              {/* Main Image */}
              {currentDisplayUrl && (
                <img
                  src={currentDisplayUrl}
                  alt="Classroom Detection"
                  className={`max-w-full max-h-[640px] object-contain block ${isLoading ? 'hidden' : ''}`}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Bảng Chi Tiết Mức Độ Tin Cậy Của Từng Điểm Detect */}
      {students.length > 0 && (
        <section className="mt-8 glass-panel rounded-2xl p-6 shadow-2xl">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Bảng Thống Kê Mức Độ Tin Cậy Từng Điểm Detect
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold">
                    {filteredStudents.length} / {students.length} điểm
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Số thứ tự (#) tương ứng với từng chấm tròn đã được đánh số trên ảnh nhận diện
                </p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Tìm theo STT (#)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors w-32 sm:w-40"
              />

              <div className="flex gap-1 bg-slate-900/60 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => { setFilterType('all'); setCurrentPage(1) }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({students.length})
                </button>
                <button
                  onClick={() => { setFilterType('pose'); setCurrentPage(1) }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    filterType === 'pose'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pose ({metrics.pose})
                </button>
                <button
                  onClick={() => { setFilterType('head'); setCurrentPage(1) }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    filterType === 'head'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Head ({metrics.head})
                </button>
                {metrics.recovered > 0 && (
                  <button
                    onClick={() => { setFilterType('recovered'); setCurrentPage(1) }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      filterType === 'recovered'
                        ? 'bg-fuchsia-500 text-white font-bold shadow-sm shadow-fuchsia-500/30'
                        : 'text-fuchsia-400 hover:text-white'
                    }`}
                  >
                    Góc Khuất ({metrics.recovered})
                  </button>
                )}
                {metrics.far > 0 && (
                  <button
                    onClick={() => { setFilterType('far'); setCurrentPage(1) }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      filterType === 'far'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    P2PNet ({metrics.far})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 w-16"># (STT)</th>
                  <th className="py-3.5 px-4">Mô Hình AI Phát Hiện</th>
                  <th className="py-3.5 px-4">Tọa Độ Ảnh (X, Y)</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Mức Độ Tin Cậy (Confidence)</th>
                  <th className="py-3.5 px-4 text-center">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      Không tìm thấy điểm nhận diện nào khớp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((st) => {
                    const percent = Math.min(100, Math.round(st.conf * 1000) / 10)
                    let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    let barColor = 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    let label = 'Rất Cao'

                    if (percent < 60) {
                      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      barColor = 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      label = 'Tin Cậy'
                    } else if (percent < 40) {
                      statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      barColor = 'bg-gradient-to-r from-rose-500 to-amber-500'
                      label = 'Thấp'
                    }

                    return (
                      <tr key={st.id} className="hover:bg-cyan-500/5 transition-colors">
                        {/* ID */}
                        <td className="py-3 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono text-cyan-300 border border-white/10">
                              {st.id}
                            </span>
                          </div>
                        </td>

                        {/* Model Type */}
                        <td className="py-3 px-4">
                          {getModelBadge(st.type)}
                        </td>

                        {/* Coordinates */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">
                          X: {st.x}, Y: {st.y}
                        </td>

                        {/* Confidence Progress Bar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <span className="font-mono font-bold text-xs w-12 text-right text-slate-200">
                              {percent}%
                            </span>
                          </div>
                        </td>

                        {/* Rating Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${statusColor}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">
              <div>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)} trên{' '}
                {filteredStudents.length} điểm
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all"
                >
                  Trang trước
                </button>
                <span className="px-2 font-mono text-slate-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
