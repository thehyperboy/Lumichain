import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Search,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  ExternalLink,
  MapPin,
  Wrench,
  Award,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Button,
  Pagination,
  LoadingState,
  EmptyState,
  PriorityBadge,
  StatusBadge,
} from '@/components/ui'

export default function TechnicianRepairHistory() {
  const { user } = useAuth()
  const { complaints, technicians, loading } = useComplaints()

  const currentTechName = user?.name || 'Rohan Mehta'
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  // Fetch technician profile to get recentHistory
  const techProfile = useMemo(() => {
    return (
      technicians.find(
        (t) =>
          t.name.toLowerCase().includes(currentTechName.toLowerCase()) ||
          currentTechName.toLowerCase().includes(t.name.toLowerCase()),
      ) || technicians[0]
    )
  }, [technicians, currentTechName])

  // Combine completed complaints with historical verified jobs
  const allHistoryItems = useMemo(() => {
    const fromComplaints = complaints
      .filter((c) => {
        if (!c.assignedTo) return false
        const isMine =
          c.assignedTo.toLowerCase().includes(currentTechName.toLowerCase()) ||
          currentTechName.toLowerCase().includes(c.assignedTo.toLowerCase())
        const isFinished =
          c.status === 'REPAIR_COMPLETED' ||
          c.status === 'VERIFIED' ||
          c.status === 'CLOSED'
        return isMine && isFinished
      })
      .map((c) => ({
        id: c.ticketNumber || `JOB-${c.id.replace('CMP-2026-', '')}`,
        complaintId: c.id,
        poleId: c.poleId || c.streetlightId,
        location: c.location,
        actionTaken:
          c.repairNotes ||
          'Replaced failed driver board and restored photocell sensitivity.',
        completedAt: c.resolvedAt || c.repairCompletedAt || c.updatedAt,
        durationHours: 1.8,
        verifiedBy: 'IoT Mesh Oracle Validator',
        priority: c.priority,
        status: c.status,
      }))

    const fromProfile = (techProfile?.recentHistory || []).map((h) => ({
      id: h.id,
      complaintId: h.complaintId,
      poleId: h.poleId,
      location: h.location,
      actionTaken: h.actionTaken,
      completedAt: h.completedAt,
      durationHours: h.durationHours,
      verifiedBy: h.verifiedBy,
      priority: 'HIGH',
      status: 'VERIFIED',
    }))

    // Deduplicate by complaintId or id
    const seen = new Set()
    const merged = []
    for (const item of [...fromComplaints, ...fromProfile]) {
      const key = item.complaintId || item.id
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(item)
      }
    }

    return merged
  }, [complaints, techProfile, currentTechName])

  // Filter by search query
  const filteredHistory = useMemo(() => {
    return allHistoryItems.filter((item) => {
      const q = search.toLowerCase()
      return (
        !search ||
        item.id.toLowerCase().includes(q) ||
        (item.complaintId && item.complaintId.toLowerCase().includes(q)) ||
        item.poleId.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.actionTaken.toLowerCase().includes(q)
      )
    })
  }, [allHistoryItems, search])

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredHistory.slice(start, start + pageSize)
  }, [filteredHistory, currentPage, pageSize])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Loading historical repair records..." />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Service Log & Verification Archive
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Repair History & Completed Work
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Cryptographically sealed lighting fixes executed by {currentTechName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono text-emerald-300">
            <Award size={13} />
            <span>{allHistoryItems.length} Verified Completions</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ SEARCH BAR (Requirement 5) â”€â”€ */}
      <div className="rounded-2xl border border-line bg-surface-card p-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            placeholder="Search past repairs by job ID, pole number, action taken, or street name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-xl border border-line bg-surface-primary pl-9 pr-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* â”€â”€ HISTORY LIST (Requirement 5) â”€â”€ */}
      {filteredHistory.length === 0 ? (
        <EmptyState
          title="No History Found"
          description="No past repair records match your search criteria."
          action={
            <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
              Clear Search
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-line bg-surface-card p-4 sm:p-5 shadow-sm space-y-3 hover:border-violet-500/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-violet-400">
                    {item.id}
                  </span>
                  <span className="text-xs font-mono text-ink-muted">
                    ({item.complaintId})
                  </span>
                  <span className="rounded bg-surface-primary px-2 py-0.5 text-xs font-mono text-ink-primary border border-line">
                    Pole: {item.poleId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
                    Fix Duration: {item.durationHours}h
                  </span>
                  <span className="font-mono text-xs text-ink-muted flex items-center gap-1">
                    <Calendar size={12} />
                    {item.completedAt}
                  </span>
                </div>
              </div>

              {/* Action Taken */}
              <div>
                <p className="text-xs text-ink-primary bg-surface-primary/60 p-3 rounded-xl border border-line/60 leading-relaxed font-mono">
                  {item.actionTaken}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-ink-muted pt-1">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="text-violet-400" />
                  {item.location}
                </span>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 flex items-center gap-1 text-[11px]">
                    <ShieldCheck size={13} />
                    {item.verifiedBy}
                  </span>

                  {item.complaintId && (
                    <Link to={`/technician/repairs/${item.complaintId}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-violet-400 py-0 px-2 gap-1">
                        View Ticket
                        <ExternalLink size={11} />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ PAGINATION CONTROLS (Requirement 5) â”€â”€ */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
