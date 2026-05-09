import { useState, useRef, useEffect } from 'react'
import './App.css'
import { compressImage, processFiles, createZip, compressImageWithTargetSize } from './utils/imageProcessor'
import { useLocale } from './i18n/context'
import { type Locale } from './i18n/locales'

interface FileItem {
  id: number
  name: string
  size: number
  type: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  compressedSize?: number
  compressedFile?: File
}

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
}

const CONCURRENCY = 4

let nextId = 0

function App() {
  const { locale, setLocale, t } = useLocale()
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [quality, setQuality] = useState(0.7)
  const [format, setFormat] = useState('jpeg')
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionMode, setCompressionMode] = useState<'quality' | 'size'>('size')
  const [targetSize, setTargetSize] = useState(200)
  const [targetSizeStr, setTargetSizeStr] = useState('200')
  const [completedCount, setCompletedCount] = useState(0)
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview))
    }
  }, [])

  const addFiles = async (newFiles: FileItem[]) => {
    setFiles(prev => [...prev, ...newFiles])
    setCompletedCount(0)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set false if leaving the drop zone (not entering a child)
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.items) {
      const processed = await processFiles(e.dataTransfer.items)
      const withPreview = processed.map(f => ({
        ...f,
        id: nextId++,
        preview: URL.createObjectURL(f.file),
      }))
      addFiles(withPreview)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected) return

    const items: FileItem[] = []
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      if (file.type.startsWith('image/')) {
        items.push({
          id: nextId++,
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          preview: URL.createObjectURL(file),
          status: 'pending',
        })
      }
    }
    addFiles(items)
    e.target.value = '' // reset so same file can be re-selected
  }

  const handleRemoveFile = (id: number) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const handleClearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    setCompletedCount(0)
  }

  const handleTargetSizeBlur = () => {
    const num = parseInt(targetSizeStr)
    if (!isNaN(num) && num >= 1) {
      setTargetSize(num)
      setTargetSizeStr(String(num))
    } else {
      // Restore from valid targetSize
      setTargetSizeStr(String(targetSize))
    }
  }

  const handleCompress = async () => {
    if (files.length === 0 || isCompressing) return

    // Reset all files to pending
    const resetFiles = files.map(f => ({
      ...f,
      status: 'pending' as const,
      compressedSize: undefined,
      compressedFile: undefined,
    }))
    setFiles(resetFiles)
    setCompletedCount(0)
    setIsCompressing(true)

    const queue = [...resetFiles]
    let done = 0

    const processOne = async (item: FileItem) => {
      // Mark as processing
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' as const } : f))

      try {
        let compressedFile: File
        if (compressionMode === 'size') {
          const targetSizeBytes = targetSize * 1024
          compressedFile = await compressImageWithTargetSize(item.file, targetSizeBytes, format)
        } else {
          compressedFile = await compressImage(item.file, quality, format)
        }

        setFiles(prev => prev.map(f =>
          f.id === item.id
            ? { ...f, status: 'completed' as const, compressedFile, compressedSize: compressedFile.size }
            : f
        ))
      } catch {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' as const } : f))
      }

      done++
      setCompletedCount(done)
    }

    // Process with concurrency limit
    const running: Promise<void>[] = []
    for (const item of queue) {
      const p = processOne(item).then(() => {
        running.splice(running.indexOf(p), 1)
      })
      running.push(p)
      if (running.length >= CONCURRENCY) {
        await Promise.race(running)
      }
    }
    await Promise.all(running)
    setIsCompressing(false)
  }

  const handleDownloadAll = async () => {
    if (files.length === 0 || isCompressing) return
    const compressedFiles = files.filter(f => f.compressedFile).map(f => f.compressedFile!)
    if (compressedFiles.length === 0) return

    const blob = await createZip(compressedFiles)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed-images-${Date.now()}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadSingle = (file: File) => {
    if (isCompressing) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  const getSavingPercent = (original: number, compressed: number) => {
    if (original === 0) return 0
    return Math.round(((original - compressed) / original) * 100)
  }

  const getSavingClass = (percent: number) => {
    if (percent >= 50) return 'saving-good'
    if (percent >= 20) return 'saving-ok'
    return 'saving-low'
  }

  const statusText = (status: string) => {
    switch (status) {
      case 'pending': return t('status.pending')
      case 'processing': return t('status.processing')
      case 'completed': return t('status.completed')
      case 'error': return t('status.error')
      default: return status
    }
  }

  const progressPercent = files.length > 0 ? Math.round((completedCount / files.length) * 100) : 0
  const allDone = files.length > 0 && files.every(f => f.status === 'completed')
  const hasAnyFile = files.length > 0

  return (
    <div className="app">
      <div className="container">
        {/* Header with language switcher */}
        <header className="header">
          <div className="header-top">
            <div className="lang-switcher">
              <span className="lang-label">{t('lang.switch')}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="lang-select"
              >
                {Object.entries(LOCALE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <h1 className="title">{t('app.title')}</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
        </header>

        {/* Settings toolbar — always visible */}
        <div className="settings-toolbar">
          <div className="toolbar-item">
            <label className="setting-label">{t('settings.mode')}</label>
            <select
              value={compressionMode}
              onChange={(e) => setCompressionMode(e.target.value as 'quality' | 'size')}
              className="setting-select"
            >
              <option value="size">{t('settings.modeSize')}</option>
              <option value="quality">{t('settings.modeQuality')}</option>
            </select>
          </div>

          {compressionMode === 'quality' ? (
            <div className="toolbar-item">
              <label className="setting-label">{t('settings.quality')}</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="setting-range"
              />
              <span className="setting-value-inline">{Math.round(quality * 100)}%</span>
            </div>
          ) : (
            <div className="toolbar-item">
              <label className="setting-label">{t('settings.targetSize')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={targetSizeStr}
                onChange={(e) => {
                  const v = e.target.value
                  // Allow empty or digits only
                  if (v === '' || /^\d+$/.test(v)) {
                    setTargetSizeStr(v)
                    const num = parseInt(v)
                    if (!isNaN(num) && num >= 1) {
                      setTargetSize(num)
                    }
                  }
                }}
                onBlur={handleTargetSizeBlur}
                className="setting-input size-input"
              />
            </div>
          )}

          <div className="toolbar-item">
            <label className="setting-label">{t('settings.format')}</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="setting-select">
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
            </select>
          </div>
        </div>

        {/* Main drop zone */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`drop-area ${isDragging ? 'drag-over' : ''} ${hasAnyFile ? 'drop-area-compact' : ''}`}
        >
          <div className="drop-content">
            <svg xmlns="http://www.w3.org/2000/svg" className="drop-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="drop-text">{hasAnyFile ? t('drop.subtitle') : t('drop.title')}</p>
          </div>
        </div>

        {/* File cards */}
        {hasAnyFile && (
          <>
            {/* Progress bar */}
            {isCompressing && (
              <div className="progress-section">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="progress-text">
                  {t('progress.compressOne').replace('{current}', String(completedCount)).replace('{total}', String(files.length))}
                </p>
              </div>
            )}

            {/* File list header */}
            <div className="file-list-header">
              <h2 className="file-list-title">
                {t('fileList.title')} ({files.length})
              </h2>
              <div className="file-list-actions">
                <button onClick={() => fileInputRef.current?.click()} className="btn-small btn-secondary">
                  + {t('button.addFiles')}
                </button>
                <button onClick={handleClearAll} className="btn-small btn-danger" disabled={isCompressing}>
                  {t('button.clearAll')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Card grid */}
            <div className="card-grid">
              {files.map(file => (
                <div key={file.id} className={`file-card ${file.status === 'processing' ? 'card-processing' : ''}`}>
                  {/* Remove button */}
                  <button
                    className="card-remove"
                    onClick={() => handleRemoveFile(file.id)}
                    disabled={isCompressing}
                    title={t('button.remove')}
                  >
                    &times;
                  </button>

                  {/* Thumbnail */}
                  <div className="card-preview">
                    <img src={file.preview} alt={file.name} className="card-thumb" />
                    {file.status === 'processing' && <div className="card-spinner" />}
                  </div>

                  {/* Info */}
                  <div className="card-body">
                    <p className="card-name" title={file.name}>{file.name}</p>
                    <div className="card-sizes">
                      <span className="card-original">{getFileSize(file.size)}</span>
                      {file.compressedSize != null && file.status === 'completed' ? (
                        <>
                          <span className="card-arrow">&rarr;</span>
                          <span className="card-compressed">{getFileSize(file.compressedSize)}</span>
                          {(() => {
                            const pct = getSavingPercent(file.size, file.compressedSize)
                            return pct > 0 ? (
                              <span className={`card-saving ${getSavingClass(pct)}`}>-{pct}%</span>
                            ) : null
                          })()}
                        </>
                      ) : (
                        <span className={`card-status-badge status-${file.status}`}>
                          {statusText(file.status)}
                        </span>
                      )}
                    </div>

                    {/* Download single */}
                    {file.status === 'completed' && file.compressedFile && (
                      <button
                        className="btn-card-download"
                        onClick={() => handleDownloadSingle(file.compressedFile!)}
                      >
                        {t('button.download')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action bar */}
            <div className="action-bar">
              {!isCompressing && !allDone && (
                <button onClick={handleCompress} className="btn-primary btn-compress">
                  {t('button.compress')}
                </button>
              )}
              {isCompressing && (
                <button disabled className="btn-primary btn-compress btn-disabled">
                  <span className="btn-spinner" />
                  {t('button.compressing')}
                </button>
              )}
              {allDone && files.length > 1 && (
                <button onClick={handleDownloadAll} className="btn-primary btn-download">
                  <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('button.downloadAll')}
                </button>
              )}
              {allDone && files.length === 1 && files[0].compressedFile && (
                <button
                  onClick={() => handleDownloadSingle(files[0].compressedFile!)}
                  className="btn-primary btn-download"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('button.downloadFile')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
