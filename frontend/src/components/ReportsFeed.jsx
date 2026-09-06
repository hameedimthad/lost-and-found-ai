import React, { useState } from 'react'
import { Search, Filter, Phone, MapPin, User, PawPrint, Sparkles, CheckCircle2, Clock, AlertCircle, HeartHandshake } from 'lucide-react'

export default function ReportsFeed({ reports, onScanReport, onUpdateStatus }) {
  const [filterType, setFilterType] = useState('all') // 'all', 'lost', 'found'
  const [filterCategory, setFilterCategory] = useState('all') // 'all', 'person', 'animal'
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReports = reports.filter((r) => {
    if (filterType !== 'all' && r.report_type !== filterType) return false
    if (filterCategory !== 'all' && r.category !== filterCategory) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = (r.name || '').toLowerCase().includes(q)
      const matchDress = (r.last_seen_dress || '').toLowerCase().includes(q)
      const matchMark = (r.birth_mark || '').toLowerCase().includes(q)
      const matchLoc = (r.location || '').toLowerCase().includes(q)
      const matchDetails = (r.details || '').toLowerCase().includes(q)
      if (!matchName && !matchDress && !matchMark && !matchLoc && !matchDetails) {
        return false
      }
    }
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, clothing description, birthmark, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden text-sm transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Type Filters */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('lost')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'lost' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setFilterType('found')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'found' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Found
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterCategory('person')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'person' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <User className="w-3.5 h-3.5 text-rose-600" />
                <span>Person</span>
              </button>
              <button
                onClick={() => setFilterCategory('animal')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'animal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <PawPrint className="w-3.5 h-3.5 text-rose-600" />
                <span>Animal</span>
              </button>
            </div>

          </div>

        </div>

        {/* Status Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
          <span>Showing {filteredReports.length} reports</span>
          <span>Click "Run AI Match" on any case to cross-examine sightings</span>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-lg">No matching reports found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search terms or filters, or be the first to report a lost or sighted case.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const isLost = report.report_type === 'lost'
            const isReunited = report.status === 'reunited'
            const mainImg = report.image_paths?.[0] ? `/uploads/${report.image_paths[0]}` : null

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Status Banner */}
                  <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                    {mainImg ? (
                      <img
                        src={mainImg}
                        alt={report.name || 'Report Photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No photo provided
                      </div>
                    )}

                    {/* Badge: Lost / Found */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                          isLost
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isLost ? 'Missing (Lost)' : 'Sighted (Found)'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-sm capitalize flex items-center gap-1">
                        {report.category === 'person' ? <User className="w-3 h-3 text-indigo-600" /> : <PawPrint className="w-3 h-3 text-indigo-600" />}
                        {report.category}
                      </span>
                    </div>

                    {isReunited && (
                      <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center text-white">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 font-extrabold text-sm shadow-xl">
                          <HeartHandshake className="w-5 h-5" />
                          <span>Reunited with Guardian!</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                          {report.name || (isLost ? 'Unnamed Missing Person/Pet' : 'Found Unidentified')}
                        </h3>
                        {report.age && (
                          <span className="text-xs font-semibold text-slate-500">
                            Age: {report.age}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Last seen dress & birth mark details */}
                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {report.last_seen_dress && (
                        <div>
                          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-rose-700">
                            {report.category === 'person' ? 'Dress / Clothing:' : 'Collar / Harness:'}
                          </span>
                          <span className="font-medium text-slate-700">{report.last_seen_dress}</span>
                        </div>
                      )}

                      {report.birth_mark && (
                        <div className="pt-1 border-t border-slate-200/60">
                          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-indigo-700">
                            {report.category === 'person' ? 'Birth Mark / Physical Marks:' : 'Fur / Markings:'}
                          </span>
                          <span className="font-medium text-slate-700">{report.birth_mark}</span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-slate-200/60 flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>
                    </div>

                    {report.details && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {report.details}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Contact & AI Actions */}
                <div className="p-5 pt-0 space-y-2">
                  
                  {/* Contact Number Display */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                        Reporter Contact
                      </span>
                      <a
                        href={`tel:${report.contact_number}`}
                        className="font-black text-emerald-950 hover:underline"
                      >
                        {report.contact_number}
                      </a>
                    </div>
                    <a
                      href={`tel:${report.contact_number}`}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      title="Call Now"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* AI Match Button */}
                  <button
                    onClick={() => onScanReport(report.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Run AI Match Against All {isLost ? 'Found' : 'Lost'}</span>
                  </button>

                  {/* Toggle Reunited Status */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onUpdateStatus(report.id, isReunited ? 'active' : 'reunited')}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {isReunited ? 'Mark as Active' : 'Mark as Reunited ✓'}
                    </button>
                  </div>

                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
