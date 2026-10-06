import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  PlusCircle,
  LayoutGrid,
  List,
  Search,
  ShieldCheck,
  Sparkles,
  MapPin,
  ChevronRight,
  ArrowRight,
  CheckCheck,
  AlertTriangle,
  Radio,
} from 'lucide-react'
import { useComplaints, useAuth } from '@/context'
import {
  Button,
  StatusBadge,
  PriorityBadge,
  EmptyState,
} from '@/components/ui'
import { ComplaintTable, ComplaintCard } from '@/components/complaints'
import { cn } from '@/utils'

export default function UserComplaints() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { complaints, loading } = useComplaints()

  // Filter scope: 'my' | 'ward' | 'all'
  const [scope, setScope] = useState('my')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Identify citizen name
  const currentCitizenName = user?.name || 'Ananya Gupta'
  const currentCitizenWard = user?.ward || 'Ward 15 (Janpath)'

  // Filtered dataset based on scope
  const scopedComplaints = useMemo(() => {
    if (!complaints) return []

    return complaints.filter((c) => {
      if (scope === 'my') {
        const isCitizen =
          c.citizenName?.toLowerCase() === currentCitizenName.toLowerCase() ||
          c.citizenName?.toLowerCase() === 'ananya gupta' ||
          c.reportedBy?.toLowerCase() === currentCitizenName.toLowerCase()
        return isCitizen
      }
      if (scope === 'ward') {
        return (
          c.ward?.includes('15') ||
          c.zone?.includes('1') ||
          c.location?.toLowerCase().includes('janpath') ||
          c.citizenName?.toLowerCase() === currentCitizenName.toLowerCase()
        )
      }
      return true
    })
  }, [complaints, scope, currentCitizenName])

  // Complaints awaiting citizen confirmation (REPAIR_COMPLETED or VERIFIED)
  const awaitingConfirmation = useMemo(() => {
    return scopedComplaints.filter(
      (c) => c.status === 'REPAIR_COMPLETED' || c.status === 'VERIFIED',
    )
  }, [scopedComplaints])

  // Count summaries
  const stats = useMemo(() => {
    const total = scopedComplaints.length
    const open = scopedComplaints.filter(
      (c) => c.status === 'OPEN' || c.status === 'ASSIGNED',
    ).length
    const inProgress = scopedComplaints.filter(
      (c) => c.status === 'IN_PROGRESS',
    ).length
    const pendingConfirmation = awaitingConfirmation.length
    const resolved = scopedComplaints.filter((c) => c.status === 'CLOSED').length

    return { total, open, inProgress, pendingConfirmation, resolved }
  }, [scopedComplaints, awaitingConfirmation])

  // Final filtered list for card grid view
  const cardList = useMemo(() => {
    return scopedComplaints.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.poleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus =
        statusFilter === 'ALL' || c.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [scopedComplaints, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Citizen Grievance Portal
            </span>
            <span className="text-xs text-ink-muted">Â· {currentCitizenWard}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            My Ward Incident Reports
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Track real-time status of your reported streetlight faults, verify repair resolutions, and inspect neighborhood node health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/user/report">
            <Button
              variant="primary"
              className="group flex items-center gap-2 bg-gradient-to-r from-violet-500 to-blue-600 font-semibold shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-blue-500"
            >
              <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>Report a Problem</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Prominent Action Callout: Complaints awaiting Citizen Confirmation */}
      {awaitingConfirmation.length > 0 && (
        <div className="card-glass relative overflow-hidden border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-surface-card to-violet-950/20 p-5 shadow-lg">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-sm">
                <CheckCheck className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-primary flex items-center gap-2">
                  Action Required: {awaitingConfirmation.length} Repair{awaitingConfirmation.length > 1 ? 's' : ''} Awaiting Your Confirmation!
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-medium text-amber-300">
                    {awaitingConfirmation[0].id}
                  </span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 max-w-2xl leading-relaxed">
                  Field technicians have marked repairs completed on {awaitingConfirmation[0].poleId} ({awaitingConfirmation[0].location}).
                  Please verify if the streetlight is illuminating properly and confirm resolution or request re-inspection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/user/complaints/${awaitingConfirmation[0].id}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-500 text-ink-primary hover:bg-amber-400 font-semibold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <span>Review & Confirm</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="card-glass border-line/60 p-4 transition-all hover:border-violet-500/40">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Total Reports</span>
            <AlertCircle className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink-primary">
            {stats.total}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            {scope === 'my' ? 'Submitted by you' : 'In your selected view'}
          </span>
        </div>

        <div className="card-glass border-line/60 p-4 transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Open / Queued</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {stats.open}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Pending dispatch
          </span>
        </div>

        <div className="card-glass border-line/60 p-4 transition-all hover:border-blue-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>In-Progress</span>
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {stats.inProgress}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Technician on field
          </span>
        </div>

        <div className="card-glass border-line/60 p-4 transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Needs Confirmation</span>
            <CheckCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {stats.pendingConfirmation}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Repaired & awaiting citizen
          </span>
        </div>

        <div className="card-glass border-line/60 p-4 transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {stats.resolved}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Confirmed & closed
          </span>
        </div>
      </div>

      {/* Scope Selector Tabs & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle/80 border border-line/50">
          <button
            type="button"
            onClick={() => setScope('my')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              scope === 'my'
                ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-card/60',
            )}
          >
            My Reports ({complaints.filter(c => c.citizenName?.toLowerCase() === 'ananya gupta' || c.citizenName === user?.name).length})
          </button>
          <button
            type="button"
            onClick={() => setScope('ward')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              scope === 'ward'
                ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-card/60',
            )}
          >
            Ward 15 Neighborhood
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              scope === 'all'
                ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-card/60',
            )}
          >
            All Municipal Reports ({complaints.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-line/50 bg-surface-subtle/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                viewMode === 'table'
                  ? 'bg-surface-card text-violet-400 shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary',
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                viewMode === 'cards'
                  ? 'bg-surface-card text-violet-400 shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <ComplaintTable
          complaints={scopedComplaints}
          detailBasePath="/user/complaints"
          role="user"
          pageSize={8}
        />
      ) : (
        <div className="space-y-4">
          {/* Card View Search and Status Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Search ticket, pole ID, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-line/60 bg-surface-card/80 py-2 pl-9 pr-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-line/60 bg-surface-card/80 px-3 py-2 text-xs text-ink-primary focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REPAIR_COMPLETED">Repair Completed</option>
                <option value="VERIFIED">Verified</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {cardList.length === 0 ? (
            <div className="card-glass border-line/60 p-12 text-center">
              <EmptyState
                icon={AlertCircle}
                title="No reports match your filters"
                description="Try clearing the search query or changing the filter scope."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('ALL')
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cardList.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  detailBasePath="/user/complaints"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
