import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutGrid,
  List,
  Search,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { getStreetlights } from '@/services/api'
import {
  PriorityBadge,
  StreetlightStatusIndicator,
  Pagination,
  LoadingState,
  EmptyState,
  ErrorState,
  Button,
} from '@/components/ui'
import { StreetlightCard } from '@/components/streetlight'
import { cn } from '@/utils'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'WORKING', label: 'Working' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'UNDER_REPAIR', label: 'Under Repair' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'OFFLINE', label: 'Offline' },
]

const ZONE_OPTIONS = [
  { value: 'ALL', label: 'All Zones' },
  { value: 'Zone 1 (Central)', label: 'Zone 1 (Central)' },
  { value: 'Zone 2 (North)', label: 'Zone 2 (North)' },
  { value: 'Zone 3 (West)', label: 'Zone 3 (West)' },
  { value: 'Zone 4 (South)', label: 'Zone 4 (South)' },
]

const SORT_OPTIONS = [
  { value: 'risk-desc', label: 'Highest Failure Risk' },
  { value: 'pole-asc', label: 'Pole ID (A to Z)' },
  { value: 'light-desc', label: 'Light Intensity (High to Low)' },
  { value: 'light-asc', label: 'Light Intensity (Low to High)' },
  { value: 'voltage-desc', label: 'Voltage (Highest First)' },
]

const ITEMS_PER_PAGE = 6

export default function AdminStreetlights() {
  const [streetlights, setStreetlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // View mode
  const [viewMode, setViewMode] = useState('card') // 'card' | 'table'

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedZone, setSelectedZone] = useState('ALL')
  const [selectedSort, setSelectedSort] = useState('risk-desc')
  const [currentPage, setCurrentPage] = useState(1)

  async function fetchStreetlights() {
    setLoading(true)
    setError(null)
    try {
      const data = await getStreetlights()
      setStreetlights(data)
    } catch (err) {
      setError(err.message || 'Failed to load streetlight assets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStreetlights()
  }, [])

  // Filter, sort, and paginate
  const filteredAndSortedList = useMemo(() => {
    let result = [...streetlights]

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(query) ||
          s.poleNumber.toLowerCase().includes(query) ||
          s.location.toLowerCase().includes(query) ||
          s.zone.toLowerCase().includes(query) ||
          s.ward.toLowerCase().includes(query) ||
          (s.assignedTechnician && s.assignedTechnician.toLowerCase().includes(query)),
      )
    }

    // 2. Status Filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((s) => s.status === selectedStatus)
    }

    // 3. Zone Filter
    if (selectedZone !== 'ALL') {
      result = result.filter((s) => s.zone === selectedZone)
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (selectedSort === 'risk-desc') {
        return (b.failureProbability || 0) - (a.failureProbability || 0)
      }
      if (selectedSort === 'pole-asc') {
        return a.poleNumber.localeCompare(b.poleNumber)
      }
      if (selectedSort === 'light-desc') {
        return (b.brightness || 0) - (a.brightness || 0)
      }
      if (selectedSort === 'light-asc') {
        return (a.brightness || 0) - (b.brightness || 0)
      }
      if (selectedSort === 'voltage-desc') {
        return (b.voltage || 0) - (a.voltage || 0)
      }
      return 0
    })

    return result
  }, [streetlights, searchQuery, selectedStatus, selectedZone, selectedSort])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedStatus, selectedZone, selectedSort])

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedList.length / ITEMS_PER_PAGE))
  const paginatedList = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedList.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  }, [filteredAndSortedList, currentPage])

  // Summary counts
  const failedCount = streetlights.filter((s) => s.status === 'FAILED').length
  const underRepairCount = streetlights.filter((s) => s.status === 'UNDER_REPAIR').length
  const workingCount = streetlights.filter((s) => s.status === 'WORKING').length

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Loading municipal streetlight network telemetry..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Failed to Load Streetlights"
          description={error}
          onRetry={fetchStreetlights}
          retryLabel="Retry Connection"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* â”€â”€ PAGE HEADER â”€â”€ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Asset Inventory & Diagnostics
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Streetlight Node Monitoring
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Live telemetry, failure probability risk scoring, electrical load inspection, and mesh health.
          </p>
        </div>

        {/* Quick actions & health summary */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300">
            <span>{workingCount} Healthy</span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-danger-500/30 bg-danger-500/10 px-3 py-1 text-xs font-mono text-danger-300">
              <span>{failedCount} Failed</span>
            </div>
          )}
          {underRepairCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-mono text-violet-300">
              <span>{underRepairCount} In Repair</span>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStreetlights}
            className="gap-1.5 text-xs ml-1"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </div>

      {/* â”€â”€ CONTROL TOOLBAR: SEARCH, FILTERS, SORT, TOGGLE â”€â”€ */}
      <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-3.5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              placeholder="Search by Pole ID, Node ID, location, or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-line bg-surface-primary py-2 pl-9 pr-4 text-xs sm:text-sm text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Status Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-full border border-line bg-surface-primary py-2 px-3 text-xs text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface-primary">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full rounded-full border border-line bg-surface-primary py-2 px-3 text-xs text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              {ZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface-primary">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full rounded-full border border-line bg-surface-primary py-2 px-3 text-xs text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface-primary">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle: Card vs Table (1 col) */}
          <div className="md:col-span-1 flex justify-end">
            <div className="inline-flex rounded-full border border-line bg-surface-primary p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Card View"
                className={cn(
                  'rounded-full p-1.5 transition-colors',
                  viewMode === 'card'
                    ? 'bg-violet-500 text-white shadow'
                    : 'text-ink-muted hover:text-ink-primary',
                )}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={cn(
                  'rounded-full p-1.5 transition-colors',
                  viewMode === 'table'
                    ? 'bg-violet-500 text-white shadow'
                    : 'text-ink-muted hover:text-ink-primary',
                )}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Result summary indicator */}
        <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line/60">
          <span>
            Showing <strong className="text-ink-primary">{paginatedList.length}</strong> of{' '}
            <strong className="text-ink-primary">{filteredAndSortedList.length}</strong> streetlights
            {searchQuery && ` matching "${searchQuery}"`}
          </span>

          {(selectedStatus !== 'ALL' || selectedZone !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedStatus('ALL')
                setSelectedZone('ALL')
              }}
              className="text-violet-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ CONTENT PRESENTATION: CARD VIEW OR TABLE VIEW â”€â”€ */}
      {filteredAndSortedList.length === 0 ? (
        <EmptyState
          title="No Streetlight Nodes Found"
          description="Try adjusting your status filter, zone selection, or search query."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedStatus('ALL')
                setSelectedZone('ALL')
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === 'card' ? (
        /* 1. CARD VIEW (Grid of StreetlightCard components) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedList.map((light) => (
            <StreetlightCard
              key={light.id}
              streetlight={light}
              detailBasePath="/admin/streetlights"
            />
          ))}
        </div>
      ) : (
        /* 2. TABLE VIEW */
        <div className="rounded-2xl border border-line bg-surface-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-primary/80 font-mono text-ink-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pole ID / Node</th>
                  <th className="py-3 px-4">Location / Zone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Failure Risk</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Intensity</th>
                  <th className="py-3 px-4">Electrical (A / V)</th>
                  <th className="py-3 px-4">Current Complaint</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Last Ping</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {paginatedList.map((light) => {
                  const prob = light.failureProbability || 0
                  const probColor =
                    prob >= 80 ? 'text-danger-400' : prob >= 40 ? 'text-warning-400' : 'text-success-400'

                  return (
                    <tr
                      key={light.id}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="text-ink-primary font-bold">{light.poleNumber}</div>
                        <div className="text-[10px] text-violet-400">{light.id}</div>
                      </td>

                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-semibold text-ink-primary truncate">{light.location}</div>
                        <div className="text-[10px] text-ink-muted truncate font-mono">{light.zone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <StreetlightStatusIndicator status={light.status} />
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className={cn('font-bold', probColor)}>{prob}%</span>
                        <div className="h-1 w-12 rounded-full bg-surface-hover overflow-hidden mt-1">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              prob >= 80 ? 'bg-danger-500' : prob >= 40 ? 'bg-warning-500' : 'bg-success-500',
                            )}
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <PriorityBadge priority={light.priority} />
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-semibold text-ink-primary">{light.brightness}%</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-ink-primary font-semibold">{light.currentAmps || 0.0}A</div>
                        <div className="text-ink-muted text-[10px]">{light.voltage || 230}V</div>
                      </td>

                      <td className="py-3 px-4 max-w-[170px]">
                        {light.currentComplaint ? (
                          <div className="truncate text-danger-400 font-medium text-[11px]" title={light.currentComplaint.title}>
                            {light.currentComplaint.id}
                          </div>
                        ) : (
                          <span className="text-ink-muted text-[11px]">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-ink-secondary">
                        {light.assignedTechnician || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4 text-ink-muted font-mono text-[11px]">
                        {light.lastPing}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link to={`/admin/streetlights/${light.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs py-1 px-2.5">
                            <span>Details</span>
                            <ArrowRight size={11} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ PAGINATION CONTROLS â”€â”€ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-line/60">
          <p className="text-xs text-ink-muted">
            Page <strong className="text-ink-primary">{currentPage}</strong> of{' '}
            <strong className="text-ink-primary">{totalPages}</strong>
          </p>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
