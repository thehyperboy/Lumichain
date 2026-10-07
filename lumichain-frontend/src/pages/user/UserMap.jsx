import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Search,
  Filter,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  ArrowRight,
  Radio,
  Layers,
} from 'lucide-react'
import { getStreetlights } from '@/services/api'
import {
  Breadcrumb,
  Button,
  StatusBadge,
  PriorityBadge,
  LoadingState,
  EmptyState,
} from '@/components/ui'
import { cn } from '@/utils'

export default function UserMap() {
  const [streetlights, setStreetlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedPole, setSelectedPole] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function loadNodes() {
      try {
        const data = await getStreetlights()
        if (isMounted) {
          setStreetlights(data)
          if (data.length > 0) setSelectedPole(data[0])
        }
      } catch (err) {
        console.error('Failed to load map streetlights:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadNodes()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredPoles = streetlights.filter((sl) => {
    const matchesSearch =
      sl.poleId?.toLowerCase().includes(search.toLowerCase()) ||
      sl.location?.toLowerCase().includes(search.toLowerCase()) ||
      sl.zone?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || sl.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const breadcrumbs = [
    { label: 'Citizen Portal', path: '/user/dashboard' },
    { label: 'Interactive Ward Map' },
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ BREADCRUMB & HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary font-sans mt-1">
            Ward Luminaire Map
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            Real-time optical state and telemetry for municipal lighting infrastructure.
          </p>
        </div>

        <Link to="/user/report">
          <Button variant="primary" className="gap-2 shadow-lg shadow-violet-500/20">
            <PlusCircle size={16} />
            <span>Report a Defect</span>
          </Button>
        </Link>
      </div>

      {/* â”€â”€ CONTROLS â”€â”€ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 card-glass p-4 rounded-2xl border-line">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pole ID, street name, or ward..."
            className="w-full rounded-xl border border-line bg-surface-card/80 py-2 pl-9 pr-4 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'WORKING', 'FAILED', 'UNDER_REPAIR'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                statusFilter === st
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-surface-card border border-line text-ink-muted hover:text-ink-primary',
              )}
            >
              {st === 'ALL' ? 'All Luminaires' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ MAP CONTAINER & SIDE PANEL â”€â”€ */}
      {loading ? (
        <LoadingState label="Calibrating GIS mesh nodes..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Map Area */}
          <div className="lg:col-span-2 rounded-2xl border border-line bg-surface-card/60 p-6 relative overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Grid background simulation */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px, 48px 48px, 48px 48px',
              }}
            />

            {/* Simulated Live Mesh Pins */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-xl bg-surface-card/80 border border-line px-3 py-1.5 backdrop-blur-md">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-medium text-ink-primary">
                  LoRaWAN Mesh GPS Overlay Active
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">
                Showing {filteredPoles.length} Nodes
              </span>
            </div>

            {/* Interactive Nodes Scatter */}
            <div className="relative z-10 py-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPoles.slice(0, 12).map((sl) => {
                const isSelected = selectedPole?.id === sl.id
                return (
                  <button
                    key={sl.id}
                    type="button"
                    onClick={() => setSelectedPole(sl)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150 backdrop-blur-sm',
                      isSelected
                        ? 'border-violet-500/40 bg-violet-500/20 shadow-lg shadow-violet-500/20 scale-105'
                        : 'border-line/70 bg-surface-primary/70 hover:border-violet-500/40 hover:bg-surface-hover',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0',
                        sl.status === 'WORKING'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : sl.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400',
                      )}
                    >
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-ink-primary truncate font-mono">
                        {sl.poleId}
                      </span>
                      <span className="block text-[10px] text-ink-muted truncate">
                        {sl.status}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Map Legend Footnote */}
            <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs text-ink-muted border-t border-line/60 pt-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Operational
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Complete Blackout
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Under Maintenance
              </span>
            </div>
          </div>

          {/* Selected Luminaire Details Card */}
          <div className="card-glass border-line p-5 rounded-2xl space-y-4">
            {selectedPole ? (
              <>
                <div className="border-b border-line/60 pb-3 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-violet-400 font-semibold tracking-wider">
                      Selected Node
                    </span>
                    <h3 className="text-xl font-extrabold text-ink-primary font-mono">
                      {selectedPole.poleId}
                    </h3>
                  </div>
                  <StatusBadge status={selectedPole.status} />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Location</span>
                    <p className="font-medium text-ink-primary">{selectedPole.location}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl border border-line bg-surface-subtle/40">
                      <span className="text-ink-muted block text-[10px]">Zone</span>
                      <p className="font-semibold text-ink-primary">{selectedPole.zone}</p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-line bg-surface-subtle/40">
                      <span className="text-ink-muted block text-[10px]">Brightness</span>
                      <p className="font-semibold text-ink-primary">
                        {selectedPole.lightIntensity || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl border border-line bg-surface-subtle/40">
                      <span className="text-ink-muted block text-[10px]">Voltage</span>
                      <p className="font-semibold text-ink-primary">
                        {selectedPole.voltage || 230} V
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-line bg-surface-subtle/40">
                      <span className="text-ink-muted block text-[10px]">Current</span>
                      <p className="font-semibold text-ink-primary">
                        {selectedPole.current || 0.65} A
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-line/60 pt-4 space-y-2">
                  <Link to={`/user/report?poleId=${selectedPole.poleId}`}>
                    <Button variant="primary" className="w-full gap-2">
                      <PlusCircle size={15} />
                      <span>Report Issue on {selectedPole.poleId}</span>
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a Luminaire"
                description="Click any pole marker on the GIS mesh to view its readings."
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
