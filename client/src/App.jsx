import React, { useState, useRef } from 'react'

export default function App() {
  const [confThresh, setConfThresh] = useState(0.22)
  const [activeTab, setActiveTab] = useState('result') // 'result' | 'original'
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSample, setSelectedSample] = useState(null)
  
  const [metrics, setMetrics] = useState({
    total: 0,
    pose: 0,
    head: 0,
    far: 0,
    elapsedMs: null,
  })

  const [imageUrls, setImageUrls] = useState({
    original: null,
    result: null,
  })

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
        far: data.far_head_students,
        elapsedMs: data.elapsed_ms,
      })

      setImageUrls({
        original: data.original_url,
        result: data.result_url,
      })

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

  const currentDisplayUrl = activeTab === 'result' ? imageUrls.result : imageUrls.original

  return (
    <div className="container">
      {/* Header */}
      <header>
        <div className="brand">
          <div className="brand-icon">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1>AI Classroom Monitoring</h1>
            <p>Hệ thống Đếm & Định Vị Sinh Viên Lớp Học (YOLOv8-Pose + P2PNet)</p>
          </div>
        </div>

        <div className="system-status">
          <div className="badge-online">
            <span className="pulse-dot"></span>
            <span>AI Engine Ready</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        {/* Left Column: Controls & Upload */}
        <section className="controls-column">
          <div className="glass-card">
            <h2 className="card-title">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Tải Lên Ảnh Camera
            </h2>

            {/* Dropzone */}
            <div
              className={`upload-dropzone ${isDragOver ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
              onDrop={handleDrop}
            >
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3>Kéo & Thả ảnh vào đây</h3>
              <p>Hỗ trợ JPG, PNG, WEBP (Tối đa 50MB)</p>
              <span className="upload-btn">Hoặc chọn file từ máy</span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
              />
            </div>

            {/* Sample Images */}
            <div className="sample-section">
              <div className="sample-title">Ảnh Mẫu Lớp Học Có Sẵn</div>
              <div className="sample-grid">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    className={`sample-card ${selectedSample === s.id ? 'active' : ''}`}
                    onClick={() => handleSampleClick(s.id)}
                  >
                    <span className="sample-tag">{s.tag}</span>
                    <span className="sample-desc">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="slider-group">
              <div className="slider-header">
                <span>Ngưỡng Tin Cậy (Confidence)</span>
                <span className="slider-val">{Number(confThresh).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.02"
                value={confThresh}
                onChange={(e) => setConfThresh(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Right Column: Results & Viewer */}
        <section className="results-column">
          {/* Counters Row */}
          <div className="metrics-row">
            <div className="metric-card metric-total">
              <div className="metric-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{metrics.total}</div>
                <div className="metric-label">Tổng Sinh Viên Có Mặt</div>
                {metrics.elapsedMs && (
                  <span className="speed-tag">{metrics.elapsedMs} ms</span>
                )}
              </div>
            </div>

            <div className="metric-card metric-pose">
              <div className="metric-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{metrics.pose}</div>
                <div className="metric-label">Toàn Thân / Khung Xương (Pose)</div>
              </div>
            </div>

            <div className="metric-card metric-head">
              <div className="metric-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="10" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18c0-2.2 2.7-4 6-4s6 1.8 6 4" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{metrics.head}</div>
                <div className="metric-label">Che Thân / Ngồi Sát (Head AI)</div>
              </div>
            </div>

            <div className="metric-card metric-far">
              <div className="metric-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="metric-value">{metrics.far}</div>
                <div className="metric-label">Hàng Ghế Xa Cùng (P2PNet)</div>
              </div>
            </div>
          </div>

          {/* Viewer Card */}
          <div className="glass-card viewer-card">
            <div className="viewer-header">
              <div className="tabs">
                <button
                  className={`tab-btn ${activeTab === 'result' ? 'active' : ''}`}
                  onClick={() => setActiveTab('result')}
                >
                  Ảnh Nhận Diện (AI)
                </button>
                <button
                  className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                  onClick={() => setActiveTab('original')}
                >
                  Ảnh Gốc (Camera)
                </button>
              </div>

              <div className="viewer-actions">
                <button className="action-btn" onClick={handleFullscreen} title="Xem toàn màn hình">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Toàn màn hình
                </button>

                {currentDisplayUrl && (
                  <a
                    className="action-btn"
                    href={currentDisplayUrl}
                    download={`ai_classroom_${activeTab}.png`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải Ảnh Về
                  </a>
                )}
              </div>
            </div>

            {/* Canvas Container */}
            <div className="image-canvas-container" ref={viewerRef}>
              {/* Loading Overlay */}
              <div className={`loading-overlay ${isLoading ? 'active' : ''}`}>
                <div className="spinner"></div>
                <div className="loading-text">AI Đang Phân Tích Khung Hình...</div>
                <div className="loading-subtext">Trích xuất khung xương, tư thế và vị trí đầu người</div>
              </div>

              {/* Empty State */}
              {!currentDisplayUrl && !isLoading && (
                <div className="empty-state">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Chưa có hình ảnh được chọn</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Kéo thả ảnh hoặc chọn 1 ảnh mẫu ở bên trái để bắt đầu
                  </p>
                </div>
              )}

              {/* Main Image */}
              {currentDisplayUrl && (
                <img
                  src={currentDisplayUrl}
                  alt="Classroom Detection"
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
