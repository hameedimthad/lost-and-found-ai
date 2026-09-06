import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LostModal from './components/LostModal'
import FoundModal from './components/FoundModal'
import MatchResultModal from './components/MatchResultModal'
import ReportsFeed from './components/ReportsFeed'
import AiQuickScanner from './components/AiQuickScanner'

export default function App() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({ total_lost: 0, total_found: 0, reunited: 0 })
  const [activeTab, setActiveTab] = useState('feed') // 'feed' or 'scanner'

  // Modals state
  const [isLostOpen, setIsLostOpen] = useState(false)
  const [isFoundOpen, setIsFoundOpen] = useState(false)
  const [matchModalData, setMatchModalData] = useState({
    isOpen: false,
    matches: [],
    queryPreview: null,
    queryReport: null,
  })

  // Toast / Alert banner state
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 5000)
  }

  const loadData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/stats')
      ])

      if (reportsRes.ok) {
        const d = await reportsRes.json()
        setReports(d.reports || [])
      }

      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats(s)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLostSuccess = (result) => {
    loadData()
    showToast('Lost report published successfully! AI indexing activated.')
    // If automatic matches exist against any found reports:
    if (result.automatic_matches && result.automatic_matches.length > 0) {
      setMatchModalData({
        isOpen: true,
        matches: result.automatic_matches,
        queryReport: result.report,
        queryPreview: null,
      })
    }
  }

  const handleFoundSuccess = (result) => {
    loadData()
    showToast('Found report submitted successfully! AI search completed.')
  }

  const handleMatchFound = ({ queryReport, queryImagePreview, matches }) => {
    setMatchModalData({
      isOpen: true,
      matches,
      queryReport,
      queryPreview: queryImagePreview,
    })
  }

  const handleScanExistingReport = async (reportId) => {
    try {
      showToast('Running AI biometric comparison across records...', 'info')
      const res = await fetch(`/api/reports/${reportId}/matches?threshold=45`)
      if (!res.ok) throw new Error('Failed to fetch matches')
      const data = await res.json()

      if (data.matches && data.matches.length > 0) {
        setMatchModalData({
          isOpen: true,
          matches: data.matches,
          queryReport: data.report,
          queryPreview: null,
        })
      } else {
        showToast('No matching records found in the opposite category yet.', 'info')
      }
    } catch (err) {
      showToast('Error scanning report: ' + err.message, 'error')
    }
  }

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        loadData()
        showToast(`Report updated to ${newStatus}!`)
      }
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}>
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        onOpenLost={() => setIsLostOpen(true)}
        onOpenFound={() => setIsFoundOpen(true)}
        onOpenScanner={() => setActiveTab('scanner')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      {/* Hero Section with Large Action Buttons */}
      <Hero
        onOpenLost={() => setIsLostOpen(true)}
        onOpenFound={() => setIsFoundOpen(true)}
        onOpenScanner={() => setActiveTab('scanner')}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'feed' ? (
          <ReportsFeed
            reports={reports}
            onScanReport={handleScanExistingReport}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <AiQuickScanner
            onMatchSelected={(data) => {
              setMatchModalData({
                isOpen: true,
                matches: data.matches,
                queryPreview: data.queryPreview,
                queryReport: data.queryReport,
              })
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 font-medium mt-12">
        <p>ReuniteAI — AI-Powered Facial & Deep Feature Visual Matching Portal</p>
        <p className="mt-1 text-slate-400">
          Created for quick detection and safe return of lost persons and animals.
        </p>
      </footer>

      {/* Lost Report Modal */}
      <LostModal
        isOpen={isLostOpen}
        onClose={() => setIsLostOpen(false)}
        onSuccess={handleLostSuccess}
      />

      {/* Found Report Modal */}
      <FoundModal
        isOpen={isFoundOpen}
        onClose={() => setIsFoundOpen(false)}
        onSuccess={handleFoundSuccess}
        onMatchFound={handleMatchFound}
      />

      {/* High-Confidence Match Result Modal */}
      <MatchResultModal
        isOpen={matchModalData.isOpen}
        data={matchModalData}
        onClose={() => setMatchModalData(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  )
}
