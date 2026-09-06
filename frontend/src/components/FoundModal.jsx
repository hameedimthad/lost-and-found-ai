import React, { useState, useRef } from 'react'
import { X, Camera, Upload, Trash2, MapPin, Phone, Sparkles, AlertCircle, Compass, User, PawPrint } from 'lucide-react'
import CameraCaptureModal from './CameraCaptureModal'
import { compressImages } from '../utils/imageCompressor'

export default function FoundModal({ isOpen, onClose, onSuccess, onMatchFound }) {
  if (!isOpen) return null

  const [category, setCategory] = useState('person')
  const [contactNumber, setContactNumber] = useState('')
  const [location, setLocation] = useState('')
  const [details, setDetails] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [detectingGps, setDetectingGps] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newFiles = [...selectedFiles, ...files]
    setSelectedFiles(newFiles)

    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation(`GPS: Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`)
        setDetectingGps(false)
      },
      (err) => {
        setDetectingGps(false)
        setError('Could not retrieve GPS location. Please enter your location manually.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (selectedFiles.length === 0) {
      setError('Please upload or take at least one photo with your phone.')
      return
    }

    if (!contactNumber.trim()) {
      setError('Your phone number is required so the family or owner can contact you.')
      return
    }

    if (!location.trim()) {
      setError('Please enter where you found the person or animal.')
      return
    }

    setLoading(true)

    try {
      // Compress pictures client-side before sending
      const optimizedFiles = await compressImages(selectedFiles, 1280, 0.85)

      const formData = new FormData()
      formData.append('report_type', 'found')
      formData.append('category', category)
      formData.append('contact_number', contactNumber)
      formData.append('location', location)
      formData.append('details', details)

      optimizedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to submit found report')
      }

      const result = await response.json()
      
      onSuccess(result)
      onClose()

      // If AI detected matches in the lost database, immediately show the Match Result modal!
      if (result.automatic_matches && result.automatic_matches.length > 0) {
        onMatchFound({
          queryReport: result.report,
          queryImagePreview: previews[0],
          matches: result.automatic_matches
        })
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 sm:p-6 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider">
                Found Report
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-100 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Instant AI Matching
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Report Sighting / Found Case
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Upload a picture from your phone. AI will instantly compare it with missing reports.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              What did you find?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory('person')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                  category === 'person'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <User className="w-5 h-5 text-emerald-600" />
                <span>Person</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('animal')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                  category === 'animal'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <PawPrint className="w-5 h-5 text-emerald-600" />
                <span>Animal / Pet</span>
              </button>
            </div>
          </div>

          {/* Phone Photo Upload Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Upload Pics from Phone <span className="text-emerald-600">*</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {selectedFiles.length} photo(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs gap-2 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span>Take Photo With Camera</span>
              </button>

              {/* Gallery Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs gap-2 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span>Choose from Photo Gallery</span>
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Live Camera Viewfinder Modal */}
              <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(file) => {
                  setSelectedFiles(prev => [...prev, file])
                  setPreviews(prev => [...prev, URL.createObjectURL(file)])
                }}
              />
            </div>

            {/* Thumbnail Previews */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-100 rounded-2xl">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden shadow-xs border border-slate-200">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finder's Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Phone Number <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="e.g. +1 (555) 987-6543"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm font-medium transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              This will be shared with the verified family/owner if an AI match is found.
            </span>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Found Location <span className="text-emerald-600">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:text-emerald-800 transition-colors"
              >
                <Compass className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Near 72nd St Station or Park entrance"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm transition-all"
              />
            </div>
          </div>

          {/* Description / Clothing */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Sighting Notes
            </label>
            <textarea
              rows="2"
              placeholder="E.g., What clothes they are wearing, physical condition, safe shelter location..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning Database with AI Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Submit & Scan for Matches Immediately</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
