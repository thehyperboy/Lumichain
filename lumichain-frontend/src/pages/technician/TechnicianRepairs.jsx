import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Play,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Button,
  PriorityBadge,
  StatusBadge,
  ConfirmationModal,
  LoadingState,
  EmptyState,
  useToast,
} from '@/components/ui'
import { RepairCard } from '@/components/technicians'

export default function TechnicianRepairs() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { complaints, startRepair, loading } = useComplaints()
  const { toast } = useToast()

  const currentTechName = user?.name || 'Rohan Mehta'

  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [filterMyJobsOnly, setFilterMyJobsOnly] = useState(true)

  // Starting repair modal
  const [startingComplaint, setStartingComplaint] = useState(null)

  // Base technician complaints
  const baseComplaints = useMemo(() => {
    if (!filterMyJobsOnly) return complaints
    return complaints.filter((c) => {
      if (!c.assignedTo) return false
      return (
        c.assignedTo.toLowerCase().includes(currentTechName.toLowerCase()) ||
        currentTechName.toLowerCase().includes(c.assignedTo.toLowerCase())
      )
    })
  }, [complaints, filterMyJobsOnly, currentTechName])

  // Filtered list
  const filteredRepairs = useMemo(() => {
    return baseComplaints.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        c.id.toLowerCase().includes(q) ||
        (c.poleId && c.poleId.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'ALL' || c.status === statusFilter

      const matchesPriority =
        priorityFilter === 'ALL' || c.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [baseComplaints, search, statusFilter, priorityFilter])

  function handleInitiateStartRepair(complaint) {
    setStartingComplaint(complaint)
  }

  function handleConfirmStartRepair() {
    if (!startingComplaint) return
    startRepair(
      startingComplaint.id,
      `Technician ${currentTechName} arrived on-site. Inspection and component replacement started.`,
    )
    toast({
      title: 'Field Repair Started',
      description: `Job ${startingComplaint.id} marked IN PROGRESS.`,
      variant: 'success',
    })
    const id = startingComplaint.id
    setStartingComplaint(null)
    navigate(`/technician/repairs/${id}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Loading assigned field repairs..." />
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
              Work Order Queue
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Assigned Field Repairs
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Execute lighting repairs, submit photo telemetry evidence, and trigger optical verification.
          </p>
        </div>

        {/* View toggle & My Jobs Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMyJobsOnly(!filterMyJobsOnly)}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-3 py-1.5 text-xs font-mono text-ink-secondary hover:border-violet-500/40 hover:text-violet-300 transition-colors"
          >
            <Briefcase size={12} className="text-violet-400" />
            <span>{filterMyJobsOnly ? `My Tasks Only (${baseComplaints.length})` : 'All System Tasks'}</span>
          </button>

          <div className="flex items-center rounded-xl border border-line bg-surface-card p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ SEARCH & FILTER BAR â”€â”€ */}
      <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Bar (6 cols) */}
          <div className="sm:col-span-6 relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              placeholder="Search by ticket ID, pole number, location, or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary pl-9 pr-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Status Filter (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary px-3 py-2 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned (Ready to Start)</option>
              <option value="IN_PROGRESS">In Progress (Active)</option>
              <option value="REPAIR_COMPLETED">Repair Completed</option>
              <option value="VERIFIED">Verified</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority Filter (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary px-3 py-2 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Emergency</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Count summary */}
        <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line/60">
          <span>
            Showing <strong className="text-ink-primary">{filteredRepairs.length}</strong> of{' '}
            <strong className="text-ink-primary">{baseComplaints.length}</strong> work orders
          </span>

          {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
              }}
              className="text-violet-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ CONTENT: GRID OR TABLE â”€â”€ */}
      {filteredRepairs.length === 0 ? (
        <EmptyState
          title="No Repair Tasks Found"
          description="No work orders match the selected search or filter parameters."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRepairs.map((complaint) => (
            <RepairCard
              key={complaint.id}
              complaint={complaint}
              onStartRepair={handleInitiateStartRepair}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-line bg-surface-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-primary/80 font-mono text-ink-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Pole Ref</th>
                  <th className="py-3 px-4">Problem & Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredRepairs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-400">
                      <Link to={`/technician/repairs/${c.id}`} className="hover:underline">
                        {c.id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-primary">
                      {c.poleId}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-ink-primary truncate">{c.title}</div>
                      <div className="text-[11px] text-ink-muted truncate">{c.location}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-muted text-[11px]">
                      {c.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === 'ASSIGNED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleInitiateStartRepair(c)}
                            className="gap-1 text-xs py-1 px-2.5 font-semibold"
                          >
                            <Play size={10} fill="currentColor" />
                            Start
                          </Button>
                        )}
                        <Link to={`/technician/repairs/${c.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                            Details â†’
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ START REPAIR CONFIRMATION MODAL â”€â”€ */}
      {startingComplaint && (
        <ConfirmationModal
          open={true}
          onClose={() => setStartingComplaint(null)}
          title={`Start Field Repair: ${startingComplaint.id}`}
          description={`Confirm arrival at pole ${startingComplaint.poleId} (${startingComplaint.location}). Status will update to IN PROGRESS.`}
          confirmLabel="Start Repair"
          cancelLabel="Cancel"
          onConfirm={handleConfirmStartRepair}
        />
      )}
    </div>
  )
}
