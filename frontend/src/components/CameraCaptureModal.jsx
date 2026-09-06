import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react'

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  if (!isOpen) return null

  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [capturedUrl, setCapturedUrl] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'user' or 'environment'
  const [error, setError] = useState('')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Start Camera Stream
  const startCamera = async (mode) => {
    setError('')
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or device.')
      }

      // Check available devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      if (videoDevices.length > 1) {
        setHasMultipleCameras(true)
      }

      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (err) {
      console.error('Camera access error:', err)
      // Fallback try without specific facingMode if first attempt failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        setStream(fallbackStream)
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream
        }
      } catch (fallbackErr) {
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser settings.'
            : 'Could not access camera. Please check your camera permissions or device settings.'
        )
      }
    }
  }

  useEffect(() => {
    startCamera(facingMode)

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [facingMode])

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
  }

  // Snap / Shoot photo
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
    // Resume video
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }

  const handleConfirm = () => {
    if (!capturedBlob) return

    // Convert blob to File object
    const file = new File(
      [capturedBlob],
      `camera_shot_${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    )

    onCapture(file)
    handleClose()
  }

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setStream(null)
    setCapturedBlob(null)
    setCapturedUrl(null)
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
            {hasMultipleCameras && !capturedUrl && (
              <button
                type="button"
                onClick={toggleCamera}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Switch Camera (Front/Back)"
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
          
          {error ? (
            <div className="p-6 text-center max-w-sm">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
              <p className="text-white font-bold text-sm">{error}</p>
              <p className="text-xs text-slate-400 mt-1">
                Please grant camera permission in your browser URL bar or use file upload.
              </p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Try Again
              </button>
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

        </div>

        {/* Shutter / Confirmation Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          {capturedUrl ? (
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 max-w-xs py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 max-w-xs py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!!error}
              onClick={handleShoot}
              className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 border-4 border-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-xl"
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
