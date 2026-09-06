import React, { useState, useRef } from 'react'
import { X, Upload, Camera, Trash2, User, PawPrint, Phone, MapPin, Sparkles, AlertTriangle } from 'lucide-react'
import CameraCaptureModal from './CameraCaptureModal'

export default function LostModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null

  const [category, setCategory] = useState('person') // 'person' or 'animal'
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [lastSeenDress, setLastSeenDress] = useState('')
  const [birthMark, setBirthMark] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [location, setLocation] = useState('')
  const [details, setDetails] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (selectedFiles.length === 0) {
      setError('Please upload at least one clear photograph of the person or animal.')
      return
    }

    if (!contactNumber.trim()) {
      setError('Contact number is required so finders can reach you immediately.')
      return
    }

    if (!location.trim()) {
      setError('Please enter the last seen location.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('report_type', 'lost')
      formData.append('category', category)
      formData.append('name', name)
      formData.append('age', age)
      formData.append('last_seen_dress', lastSeenDress)
      formData.append('birth_mark', birthMark)
      formData.append('contact_number', contactNumber)
      formData.append('location', location)
      formData.append('details', details)

      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to submit report')
      }

      const result = await response.json()
      onSuccess(result)
      onClose()
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-5 sm:p-6 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider">
                Missing Person / Animal
              </span>
              <span className="flex items-center gap-1 text-xs text-rose-100 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> AI Indexing
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Report a Lost Person or Animal
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
              Upload photos to enable AI feature matching across all sighted reports.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Switch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Who is missing?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory('person')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                  category === 'person'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <User className="w-5 h-5 text-rose-600" />
                <span>Person</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('animal')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                  category === 'animal'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <PawPrint className="w-5 h-5 text-rose-600" />
                <span>Animal / Pet</span>
              </button>
            </div>
          </div>

          {/* 2. Photo Upload Section (User requested: "enter a few pics of the person or animal") */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Upload Photos <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {selectedFiles.length} photo(s) selected
              </span>
            </div>

            {/* Dropzone & Camera Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/30 text-slate-700 font-semibold text-xs transition-colors"
              >
                <Upload className="w-4 h-4 text-rose-600" />
                <span>Choose Photos from Device</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/30 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Take Photo with Camera</span>
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

            {/* Thumbnails Preview */}
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

          {/* 3. Conditional Form Fields */}
          {category === 'person' ? (
            /* Person Columns */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe / Alex Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14 years old / 65 years"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Last Seen Dress / Clothing <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navy blue hoodie, blue denim jeans, white sneakers"
                  value={lastSeenDress}
                  onChange={(e) => setLastSeenDress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                />
                <span className="text-[11px] text-slate-500">
                  Detailed clothing colors help our AI match with photos taken by finders.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Any Birth Mark / Distinguishing Marks <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Small mole under right eye, scar on forehead, glasses"
                  value={birthMark}
                  onChange={(e) => setBirthMark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                />
              </div>
            </div>
          ) : (
            /* Animal Columns */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pet Name / Calling Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Max / Bella / Charlie"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Species & Breed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dog (Golden Retriever) or Cat (Persian)"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Collar, Harness or Clothing
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red nylon collar with circular gold bell, black harness"
                  value={lastSeenDress}
                  onChange={(e) => setLastSeenDress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fur Markings & Distinguishing Features
                </label>
                <input
                  type="text"
                  placeholder="e.g. White patch on chest, clipped left ear, floppy ears"
                  value={birthMark}
                  onChange={(e) => setBirthMark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* 4. Common Required Columns: Contact Number & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Number (In case found) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 (555) 234-5678"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm font-medium transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Shown to whoever finds and scans the matching person or pet.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Last Seen Location <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Park West, New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Circumstances / Notes
            </label>
            <textarea
              rows="2"
              placeholder="Any other helpful details about time, habits, medical conditions, or reward..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting AI Visual Embeddings & Publishing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Publish Lost Report & Activate AI Matching</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
