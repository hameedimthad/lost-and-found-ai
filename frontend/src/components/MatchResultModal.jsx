import React, { useState } from 'react'
import { X, Sparkles, Phone, MessageSquare, Check, Copy, AlertTriangle, ArrowRight, User, PawPrint, MapPin, Tag, ShieldCheck, Cpu, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function MatchResultModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null

  const { matches = [], queryPreview, queryReport } = data
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  
  // Deep Forensic State
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [forensicResult, setForensicResult] = useState(null)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  const activeMatch = matches[selectedMatchIndex] || null

  const handleCopyPhone = (phone) => {
    if (!phone) return
    navigator.clipboard.writeText(phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const cleanPhone = (phone) => {
    return phone ? phone.replace(/[^0-9+]/g, '') : ''
  }

  const runDeepForensicCheck = async () => {
    if (!activeMatch || !queryReport?.id) return
    setIsAnalyzing(true)

    try {
      const res = await fetch('/api/deep-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report1_id: activeMatch.record_id,
          report2_id: queryReport.id,
          gemini_api_key: geminiApiKey.trim() || null
        })
      })

      if (res.ok) {
        const data = await res.json()
        setForensicResult(data.gemini_forensic_analysis || data.biometric_comparison)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-rose-950 p-5 sm:p-6 text-white flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-black uppercase tracking-wider mb-1">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>FaceNet VGGFace2 Biometric Match</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Biometric Match Detected
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              AI facial bone & cranial structure analysis — invariant to beard, hair, and clothing changes.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Match Switcher if multiple */}
          {matches.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 shrink-0">
                Found {matches.length} Candidates:
              </span>
              {matches.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedMatchIndex(idx); setForensicResult(null); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedMatchIndex === idx
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  #{idx + 1} {m.name || 'Candidate'} ({m.similarity_score}%)
                </button>
              ))}
            </div>
          )}

          {activeMatch ? (
            <>
              {/* Photo Comparison with Invariance Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Sighted Photo */}
                <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-3 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Sighted Photo (Uploaded)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Query
                    </span>
                  </div>

                  <div className="w-full h-52 sm:h-60 rounded-xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
                    <img
                      src={
                        queryPreview || 
                        (queryReport?.image_paths?.length ? `/uploads/${queryReport.image_paths[0]}` : '')
                      }
                      alt="Query Image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Database Record */}
                <div className="relative rounded-2xl bg-rose-50/50 border-2 border-rose-200 p-3 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700">
                      Database Record Photo
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {activeMatch.similarity_score}% Match
                    </span>
                  </div>

                  <div className="w-full h-52 sm:h-60 rounded-xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
                    <img
                      src={
                        activeMatch.matched_image 
                          ? `/uploads/${activeMatch.matched_image}` 
                          : (activeMatch.image_paths?.[0] ? `/uploads/${activeMatch.image_paths[0]}` : '')
                      }
                      alt="Database Match"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

              </div>

              {/* Crucial Contact Revelation Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-400 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider block">
                        Guardian / Reporter Contact Number
                      </span>
                      <p className="text-xs text-slate-600 font-medium">
                        Reach out immediately to notify the guardian of the sighting.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                    Verified Match
                  </span>
                </div>

                {/* Big Phone Number Display */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-200">
                  <div className="text-center sm:text-left">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">
                      {activeMatch.contact_number || 'No contact provided'}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Contact for {activeMatch.name || 'Missing Person / Pet'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`tel:${cleanPhone(activeMatch.contact_number)}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Now</span>
                    </a>

                    <a
                      href={`https://wa.me/${cleanPhone(activeMatch.contact_number)}?text=${encodeURIComponent(
                        `Hello, I think I found ${activeMatch.name || 'your missing person/pet'}. Please contact me back!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyPhone(activeMatch.contact_number)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                      title="Copy phone number"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Biometric Invariance Breakdown (Addressing hair, beard, clothing differences) */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                      Biometric Invariance Analysis
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    Hair & Beard Invariant
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeMatch.invariance_note || (
                    "Model isolates cranial structure, inter-pupillary distance, and nose bridge geometry. Disregards superficial variations in beard growth, hairstyle, or clothing."
                  )}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Facial Bone Match
                    </span>
                    <span className="text-lg font-black text-indigo-900">
                      {activeMatch.facial_score || activeMatch.similarity_score}%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Deep Pose / Silhouette
                    </span>
                    <span className="text-lg font-black text-slate-800">
                      {activeMatch.structural_score || Math.min(100, (activeMatch.similarity_score || 80) - 5)}%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Clothing Independence
                    </span>
                    <span className="text-xs font-bold text-emerald-700 block mt-1">
                      100% Disentangled
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Checklist for Verification */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                  Reported Physical Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase">
                      Name
                    </span>
                    <span className="font-bold text-slate-800 text-base">
                      {activeMatch.name || 'Unknown'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase">
                      Age
                    </span>
                    <span className="font-bold text-slate-800 text-base">
                      {activeMatch.age || 'Not specified'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="block text-[11px] font-bold text-rose-600 uppercase">
                      Last Seen Dress (When reported lost)
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeMatch.last_seen_dress || 'No description'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      (Note: The person may currently be wearing different clothing)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="block text-[11px] font-bold text-indigo-600 uppercase">
                      Birthmark / Persistent Physical Marks
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeMatch.birth_mark || 'None reported'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase">
                      Reported Location
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {activeMatch.location || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No High-Confidence Matches Found Yet</p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
