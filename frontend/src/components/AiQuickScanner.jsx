import React, { useState, useRef } from 'react'
import { Camera, Upload, Sparkles, AlertCircle, Phone, ArrowRight, User, PawPrint, Search, RefreshCw } from 'lucide-react'
import CameraCaptureModal from './CameraCaptureModal'
import { compressImage } from '../utils/imageCompressor'

export default function AiQuickScanner({ onMatchSelected }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [category, setCategory] = useState('person')
  const [threshold, setThreshold] = useState(45)
  const [isScanning, setIsScanning] = useState(false)
  const [matches, setMatches] = useState([])
  const [hasScanned, setHasScanned] = useState(false)
  const [error, setError] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMatches([])
    setHasScanned(false)
    setError('')
  }

  const runAiScan = async () => {
    if (!selectedImage) {
      setError('Please select or take a photo first.')
      return
    }

    setIsScanning(true)
    setError('')
    setHasScanned(false)

    try {
      // Fast client-side compression before sending over network
      const optimizedFile = await compressImage(selectedImage, 1280, 0.85)

      const formData = new FormData()
      formData.append('file', optimizedFile)
      formData.append('category', category)
      formData.append('target_type', 'lost')
      formData.append('threshold', threshold)

      const response = await fetch('/api/match-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to run AI scan')
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setHasScanned(true)
    } catch (err) {
      setError(err.message || 'Scan failed')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Real-Time Neural Vision</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Instant AI Photo Scanner
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload or snap a photo of any sighted person or animal to cross-reference against all missing database records in real time.
            </p>
          </div>

          {/* Category Toggle */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => { setCategory('person'); setMatches([]); setHasScanned(false); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                category === 'person' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-rose-600" />
              <span>Person</span>
            </button>
            <button
              onClick={() => { setCategory('animal'); setMatches([]); setHasScanned(false); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                category === 'animal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PawPrint className="w-4 h-4 text-rose-600" />
              <span>Animal</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Upload & Scanner Zone */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Left: Image input box */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative overflow-hidden group">
            {previewUrl ? (
              <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-inner bg-slate-900">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                
                {/* AI Laser Scan Line Animation when scanning */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] ai-scan-line pointer-events-none" />
                )}

                <button
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); setMatches([]); setHasScanned(false); }}
                  className="absolute top-2 right-2 px-3 py-1 bg-black/70 hover:bg-rose-600 text-white rounded-full text-xs font-bold transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Select or Snap a Picture</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                  Take a photo directly from your camera or choose a picture from your library.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose File</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden Input for file picker */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />

            {/* Live Camera Viewfinder Modal */}
            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file) => {
                setSelectedImage(file)
                setPreviewUrl(URL.createObjectURL(file))
                setMatches([])
                setHasScanned(false)
                setError('')
              }}
            />
          </div>

          {/* Right: Controls & AI Explanation */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                AI Matching Engine Settings
              </h4>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Match Sensitivity Threshold</span>
                  <span className="font-bold text-slate-900">{threshold}%</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="80"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Lower threshold shows more candidates; higher shows only high-confidence exact visual matches.
                </span>
              </div>
            </div>

            <button
              onClick={runAiScan}
              disabled={!selectedImage || isScanning}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning Deep Features Across Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Run AI Biometric Scan</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Results Section */}
        {hasScanned && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span>Scan Results</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {matches.length} Match(es)
                </span>
              </h3>
            </div>

            {matches.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <p className="font-bold text-slate-700">No matches found above {threshold}% threshold.</p>
                <p className="text-xs text-slate-500 mt-1">Try lowering the sensitivity threshold or selecting another photo angle.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border-2 border-slate-200 hover:border-rose-500 shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo + Confidence Badge */}
                      <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 mb-3">
                        <img
                          src={`/uploads/${m.matched_image || m.image_paths[0]}`}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {m.similarity_score}% Match
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base">{m.name || 'Unknown'}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          Facial Bone: {m.facial_score || m.similarity_score}%
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Beard & Hair Invariant)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {m.age ? `Age: ${m.age}` : 'Age not specified'}
                      </p>

                      <div className="mt-2 text-xs space-y-1 text-slate-700">
                        {m.last_seen_dress && (
                          <p><span className="font-bold text-slate-900">Dress:</span> {m.last_seen_dress}</p>
                        )}
                        {m.birth_mark && (
                          <p><span className="font-bold text-slate-900">Mark:</span> {m.birth_mark}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact Revelation */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl mb-2 text-center">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-800 block">
                          Reporter Contact Number
                        </span>
                        <a
                          href={`tel:${m.contact_number}`}
                          className="text-sm font-black text-emerald-900 hover:underline"
                        >
                          {m.contact_number}
                        </a>
                      </div>

                      <button
                        onClick={() => onMatchSelected({
                          matches: [m],
                          queryPreview: previewUrl,
                          queryReport: null
                        })}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>View Full Side-by-Side</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
