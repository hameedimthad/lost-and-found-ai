import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, RefreshCw, Check, AlertCircle, Upload, Settings } from 'lucide-react'

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  if (!isOpen) return null

  const videoRef = useRef(null)
  const fileFallbackRef = useRef(null)
  const streamRef = useRef(null)

  const [capturedBlob, setCapturedBlob] = useState(null)
  const [capturedUrl, setCapturedUrl] = useState(null)
  const [errorDetails, setErrorDetails] = useState(null)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [currentFacingMode, setCurrentFacingMode] = useState(() => {
    // Detect mobile vs laptop/desktop: laptops only have front cameras ('user')
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    return isMobile ? 'environment' : 'user'
  })

  // Cleanup helper
  const stopCurrentStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const startCamera = async (mode) => {
    setErrorDetails(null)
    stopCurrentStream()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorDetails({
        type: 'Unsupported',
        message: 'Camera access is not supported by your browser or connection. Note: HTTPS is required.',
      })
      return
    }

    try {
      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = devices.filter(d => d.kind === 'videoinput')
        if (videoInputs.length > 1) {
          setHasMultipleCameras(true)
        }
      } catch (e) {
        // Enumerate devices may fail before permission; ignore
      }

      // 1. Try with ideal facingMode constraint (tolerant on laptops without rear cameras)
      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (firstErr) {
        console.warn('First camera attempt with ideal facingMode failed, trying generic video constraint:', firstErr)
        // 2. Fallback to generic unconstrained video
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn('Auto play video warning:', playErr)
        }
      }
    } catch (err) {
      console.error('Final camera access error:', err)
      
      let title = 'Camera Access Issue'
      let message = err.message || 'Could not access the camera.'
      let isMacPermission = false

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        title = 'Camera Permission Blocked'
        message = 'Camera permission was denied. On Mac, check BOTH your browser URL bar AND "System Settings ➔ Privacy & Security ➔ Camera ➔ Allow your browser".'
        isMacPermission = true
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        title = 'Camera in Use or Locked'
        message = 'Your webcam is currently in use by another app (such as FaceTime, Zoom, WeChat, or Teams) or macOS privacy blocked the feed. Please close other apps using the camera.'
      } else if (err.name === 'OverconstrainedError') {
        title = 'Camera Mode Unsupported'
        message = 'The requested camera mode is not supported by your hardware.'
      }

      setErrorDetails({
        type: err.name,
        title,
        message,
        isMacPermission,
      })
    }
  }

  useEffect(() => {
    startCamera(currentFacingMode)

    return () => {
      stopCurrentStream()
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl)
      }
    }
  }, [currentFacingMode])

  const toggleCamera = () => {
    setCurrentFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleShoot = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      setCapturedBlob(blob)
      setCapturedUrl(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.92)
  }

  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedBlob(null)
    setCapturedUrl(null)

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }

  const handleConfirm = () => {
    if (!capturedBlob) return

    const file = new File(
      [capturedBlob],
      `camera_shot_${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    )

    onCapture(file)
    handleClose()
  }

  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    onCapture(file)
    handleClose()
  }

  const handleClose = () => {
    stopCurrentStream()
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedBlob(null)
    setCapturedUrl(null)
    setErrorDetails(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Live Camera Viewfinder</h3>
              <p className="text-[11px] text-slate-400">Position the person or animal in the center frame</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasMultipleCameras && !capturedUrl && !errorDetails && (
              <button
                type="button"
                onClick={toggleCamera}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative bg-black w-full aspect-4/3 flex items-center justify-center overflow-hidden">
          
          {errorDetails ? (
            /* Error & Mac Guidance Screen */
            <div className="p-6 text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-1">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-white font-black text-base">{errorDetails.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorDetails.message}
              </p>

              {errorDetails.isMacPermission && (
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300 text-left space-y-1">
                  <span className="font-bold text-white block">🍎 On Mac (macOS):</span>
                  <span>1. Open <strong>System Settings</strong> ➔ <strong>Privacy & Security</strong></span>
                  <br />
                  <span>2. Click <strong>Camera</strong></span>
                  <br />
                  <span>3. Turn ON toggle for your browser (e.g. <strong>Google Chrome</strong>)</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(currentFacingMode)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Try Again
                </button>

                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo File Instead</span>
                </button>
              </div>
            </div>
          ) : capturedUrl ? (
            /* Review captured picture */
            <img
              src={capturedUrl}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : (
            /* Live Video Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera Framing Grid / Crosshairs */}
              <div className="absolute inset-0 pointer-events-none border border-white/20 m-6 rounded-2xl">
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-rose-500" />
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-rose-500" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-rose-500" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-rose-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                </div>
              </div>

              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            </>
          )}

          {/* Hidden Fallback Input */}
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            onChange={handleFallbackFile}
            className="hidden"
          />

        </div>

        {/* Shutter / Confirmation Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          {capturedUrl ? (
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 max-w-xs py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 max-w-xs py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!!errorDetails}
              onClick={handleShoot}
              className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 border-4 border-white transition-all active:scale-95 disabled:opacity-30 cursor-pointer shadow-xl"
              title="Shoot Photo"
            >
              <div className="w-14 h-14 rounded-full bg-rose-600 group-hover:bg-rose-500 transition-colors flex items-center justify-center shadow-inner">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
