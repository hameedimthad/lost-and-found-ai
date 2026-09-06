import React from 'react'
import { AlertCircle, CheckCircle2, Sparkles, UserX, PawPrint, Camera, PhoneCall, ShieldCheck, MapPin } from 'lucide-react'

export default function Hero({ onOpenLost, onOpenFound, onOpenScanner, stats }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-10 pb-14 px-4 sm:px-6 lg:px-8 rounded-3xl mx-3 sm:mx-6 my-4 shadow-xl border border-indigo-900/50">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-rose-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Real-time Neural Visual Matching for People & Animals</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight sm:leading-tight">
          Help Bring Them Back Home With{' '}
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
            AI Vision
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Report a missing person or pet, or upload a photo of someone you’ve found. Our AI visual engine compares facial features, clothes, and markings across the database to immediately connect finder and guardian.
        </p>

        {/* The Two Main Action Buttons Required by User */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          
          {/* Button 1: LOST */}
          <button
            onClick={onOpenLost}
            className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-rose-400/30 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-wide uppercase">
              I Lost Someone / Pet
            </span>
            <span className="text-xs font-medium text-rose-100/90 mt-1 text-center">
              Upload photos, age, dress, birthmarks & contact number
            </span>
            <div className="mt-3 px-3 py-1 rounded-full bg-rose-950/40 text-[11px] font-semibold text-rose-200 border border-rose-400/20">
              Click to Report Lost →
            </div>
          </button>

          {/* Button 2: FOUND */}
          <button
            onClick={onOpenFound}
            className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-emerald-400/30 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-wide uppercase">
              I Found Someone / Pet
            </span>
            <span className="text-xs font-medium text-emerald-100/90 mt-1 text-center">
              Take/upload a photo, enter location & phone number
            </span>
            <div className="mt-3 px-3 py-1 rounded-full bg-emerald-950/40 text-[11px] font-semibold text-emerald-200 border border-emerald-400/20">
              Click to Report Found →
            </div>
          </button>

        </div>

        {/* Live Counters */}
        <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.total_lost || 0}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Missing Reports</div>
          </div>
          <div className="p-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {stats?.total_found || 0}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Found & Sighted</div>
          </div>
          <div className="p-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-400">
              {stats?.reunited || 0}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Reunited Guardians</div>
          </div>
          <div className="p-2">
            <div className="text-2xl sm:text-3xl font-black text-indigo-300">
              &lt;100ms
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">AI Match Latency</div>
          </div>
        </div>

      </div>
    </section>
  )
}
