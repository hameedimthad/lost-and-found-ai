import React from 'react'
import { Search, Sparkles, Shield, HeartHandshake, PlusCircle, Camera } from 'lucide-react'

export default function Navbar({ onOpenLost, onOpenFound, onOpenScanner, activeTab, setActiveTab, stats }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-rose-900 bg-clip-text text-transparent">
                  Reunite<span className="text-rose-600">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                  AI Biometric Match
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Instant Visual Recognition for Lost & Found Persons & Pets
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-sm font-medium">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'feed'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Public Feed
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white text-rose-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-rose-500" />
              AI Photo Scanner
            </button>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenLost}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost</span>
            </button>

            <button
              onClick={onOpenFound}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/25 transition-all"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Report Found</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}
