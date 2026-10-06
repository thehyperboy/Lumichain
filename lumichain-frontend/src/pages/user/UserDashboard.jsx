import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  PlusCircle,
  Clock,
  CheckCircle2,
  Wrench,
  Lightbulb,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  StatCard,
  Button,
  StatusBadge,
  PriorityBadge,
  LoadingState,
} from '@/components/ui'

export default function UserDashboard() {
  const { user } = useAuth()
  const { complaints, loading } = useComplaints()

  const currentCitizenName = user?.name || 'Ananya Gupta'

  // Filter complaints reported by this citizen (or in their residential ward)
  const myComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const isMine =
        (c.citizenName &&
          (c.citizenName.toLowerCase().includes(currentCitizenName.toLowerCase()) ||
            currentCitizenName.toLowerCase().includes(c.citizenName.toLowerCase()))) ||
        (user?.phone && c.citizenContact === user.phone)

      // Also include ward reports if citizen has fewer than 2
      return isMine
    })
  }, [complaints, currentCitizenName, user])

  // If citizen has submitted 0 or 1, fallback to including nearby ward reports
  const displayComplaints = useMemo(() => {
    if (myComplaints.length >= 2) return myComplaints
    const wardReports = complaints.filter(
      (c) => c.zone?.includes('Central') || c.ward?.includes('Janpath') || c.id === 'CMP-2026-101',
    )
    const set = new Set(myComplaints.map((c) => c.id))
    const merged = [...myComplaints]
    for (const c of wardReports) {
      if (!set.has(c.id)) {
        merged.push(c)
      }
    }
    return merged
  }, [myComplaints, complaints])

  // 4 Stat Cards: Total, Open, In-Progress, Resolved
  const stats = useMemo(() => {
    const total = displayComplaints.length
    const open = displayComplaints.filter(
      (c) => c.status === 'OPEN' || c.status === 'ASSIGNED',
    ).length
    const inProgress = displayComplaints.filter((c) => c.status === 'IN_PROGRESS').length
    const resolved = displayComplaints.filter(
      (c) =>
        c.status === 'REPAIR_COMPLETED' ||
        c.status === 'VERIFIED' ||
        c.status === 'CLOSED',
    ).length

    return { total, open, inProgress, resolved }
  }, [displayComplaints])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Loading your ward grievance dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ HERO BANNER & REPORT A PROBLEM ACTION (Requirement 1) â”€â”€ */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-r from-surface-card via-surface-card/95 to-violet-950/30 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
                Citizen Smart Lighting Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
              Welcome, {currentCitizenName}
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Help keep our streets safe and well-lit. Report faulty luminaires, dark crossings, or flickering lights directly to municipal repair teams.
            </p>
          </div>

          <div className="shrink-0">
            <Link to="/user/report">
              <Button
                variant="primary"
                size="lg"
                className="gap-2 font-bold px-6 py-3.5 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-sm sm:text-base"
              >
                <PlusCircle size={18} />
                <span>Report a Streetlight Problem</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* â”€â”€ 4 STAT CARDS (Requirement 1) â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={stats.total}
          subtitle="Submitted Grievances"
          tone="neutral"
          icon={AlertCircle}
        />
        <StatCard
          title="Open Reports"
          value={stats.open}
          subtitle="Under Municipal Review"
          tone="warning"
          icon={Clock}
        />
        <StatCard
          title="In-Progress"
          value={stats.inProgress}
          subtitle="Technician Dispatched"
          tone="info"
          icon={Wrench}
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          subtitle="Fixed & Verified"
          tone="success"
          icon={CheckCircle2}
        />
      </div>

      {/* â”€â”€ RECENT COMPLAINTS SECTION (Requirement 1) â”€â”€ */}
      <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-ink-primary">
              Your Streetlight Fault Reports ({displayComplaints.length})
            </h2>
            <p className="text-xs text-ink-muted">
              Live tracking for issues logged in your ward.
            </p>
          </div>

          <Link to="/user/complaints">
            <Button variant="ghost" size="sm" className="text-xs text-violet-400 gap-1">
              View All Reports
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        {displayComplaints.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-muted space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
            <p className="text-ink-primary font-semibold">No issues currently reported by you.</p>
            <p>Notice a broken streetlight nearby? Click "Report a Streetlight Problem" above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayComplaints.slice(0, 4).map((c) => {
              const isReadyForConfirmation =
                c.status === 'REPAIR_COMPLETED' || c.status === 'VERIFIED'

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-line bg-surface-primary/60 p-4 space-y-2.5 hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-violet-400">
                        {c.id}
                      </span>
                      <span className="text-xs text-ink-muted font-mono">
                        Pole: {c.poleId}
                      </span>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>

                    <span className="text-[11px] font-mono text-ink-muted">
                      Reported {c.createdAt}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-ink-primary">
                    {c.title}
                  </div>

                  <p className="text-xs text-ink-secondary line-clamp-1">
                    {c.description}
                  </p>

                  <div className="pt-2 border-t border-line/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1 text-ink-muted">
                      <MapPin size={12} className="text-violet-400" />
                      {c.location}
                    </span>

                    <div className="flex items-center gap-2">
                      {isReadyForConfirmation && (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-semibold animate-pulse">
                          Ready for Resident Signoff
                        </span>
                      )}

                      <Link to={`/user/complaints/${c.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                          Track Live Status â†’
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
