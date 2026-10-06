import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Lightbulb,
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Cpu,
  Layers,
  Battery,
  Zap,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  getStreetlights,
  getComplaints,
  getAnalytics,
  getBlockchainTransactions,
} from '@/services/api'
import {
  StatCard,
  ChartCard,
  StatusBadge,
  PriorityBadge,
  StreetlightStatusIndicator,
  LoadingState,
  EmptyState,
  ErrorState,
  Button,
} from '@/components/ui'
import { useComplaints } from '@/context'
import { cn } from '@/utils'

export default function AdminDashboard() {
  const { complaints: sharedComplaints } = useComplaints()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [streetlights, setStreetlights] = useState([])
  const [localComplaints, setLocalComplaints] = useState([])
  const complaints = sharedComplaints.length > 0 ? sharedComplaints : localComplaints
  const [analytics, setAnalytics] = useState(null)
  const [transactions, setTransactions] = useState([])

  // Filters & Tabs
  const [streetlightFilter, setStreetlightFilter] = useState('ALL')
  const [complaintFilter, setComplaintFilter] = useState('ALL')
  const [streetlightSearch, setStreetlightSearch] = useState('')

  // Load all dashboard data asynchronously
  async function loadDashboardData() {
    setLoading(true)
    setError(null)
    try {
      const [lightsData, complaintsData, analyticsData, txData] = await Promise.all([
        getStreetlights(),
        getComplaints(),
        getAnalytics(),
        getBlockchainTransactions(),
      ])
      setStreetlights(lightsData)
      setLocalComplaints(complaintsData)
      setAnalytics(analyticsData)
      setTransactions(txData)
    } catch (err) {
      setError(err.message || 'Failed to fetch municipal grid metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Filtered streetlights
  const filteredStreetlights = streetlights.filter((light) => {
    const matchesStatus =
      streetlightFilter === 'ALL' || light.status === streetlightFilter
    const matchesSearch =
      streetlightSearch === '' ||
      light.id.toLowerCase().includes(streetlightSearch.toLowerCase()) ||
      light.poleNumber.toLowerCase().includes(streetlightSearch.toLowerCase()) ||
      light.zone.toLowerCase().includes(streetlightSearch.toLowerCase()) ||
      light.location.toLowerCase().includes(streetlightSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Filtered complaints
  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'ALL') return true
    if (complaintFilter === 'CRITICAL') return c.priority === 'CRITICAL'
    if (complaintFilter === 'OPEN') return c.status === 'OPEN'
    if (complaintFilter === 'IN_PROGRESS') return c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
    if (complaintFilter === 'RESOLVED') return c.status === 'REPAIR_COMPLETED' || c.status === 'VERIFIED' || c.status === 'CLOSED'
    return true
  })

  // Handle Loading State
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Synchronizing municipal IoT telemetry & on-chain ledger..." />
      </div>
    )
  }

  // Handle Error State
  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Telemetry Data Sync Failed"
          description={error}
          onRetry={loadDashboardData}
          retryLabel="Reconnect & Retry"
        />
      </div>
    )
  }

  // Handle Empty State (if no data returned)
  if (!analytics || (streetlights.length === 0 && complaints.length === 0)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <EmptyState
          title="No Municipal Data Available"
          description="The smart grid telemetry database returned zero records for the current monitoring cycle."
          action={
            <Button variant="primary" onClick={loadDashboardData}>
              Reload Telemetry
            </Button>
          }
        />
      </div>
    )
  }

  const { kpis, failureStatistics, complaintStatusDistribution, maintenanceTrend } = analytics

  return (
    <div className="space-y-8 pb-10">
      {/* â”€â”€ HEADER BANNER â”€â”€ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Central Command Console
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Admin Infrastructure Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            System-wide luminaire health, incident tickets, failure analytics, and cryptographic ledger proofs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            className="gap-2 text-xs"
          >
            <RefreshCw size={13} />
            Refresh Telemetry
          </Button>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-mono text-violet-300">
            <Cpu size={14} className="text-violet-400" />
            <span>48,290 Nodes Online</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ STAT CARDS GRID (8 KPIs as requested) â”€â”€ */}
      <section aria-label="Key Performance Indicators">
        <h2 className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Streetlights"
            value={kpis.totalStreetlights?.toLocaleString() || '48,290'}
            hint="Across 4 Municipal Sectors"
            icon={Lightbulb}
            className="border-line/80 hover:border-violet-500/40 transition-colors"
          />
          <StatCard
            label="Working Luminaires"
            value={kpis.workingStreetlights?.toLocaleString() || '47,140'}
            hint="97.6% Operational Uptime"
            icon={CheckCircle2}
            className="border-line/80 hover:border-emerald-500/40 transition-colors"
          />
          <StatCard
            label="Failed / Offline"
            value={kpis.failedStreetlights?.toLocaleString() || '535'}
            hint="Auto-flagged by photocells"
            icon={AlertTriangle}
            className="border-line/80 hover:border-danger-500/40 transition-colors"
          />
          <StatCard
            label="Under Repair"
            value={kpis.underRepairStreetlights?.toLocaleString() || '615'}
            hint="Active field maintenance"
            icon={Wrench}
            className="border-line/80 hover:border-violet-500/40 transition-colors"
          />
          <StatCard
            label="Open Complaints"
            value={kpis.openComplaints || '28'}
            hint="Citizen & sensor tickets"
            icon={AlertCircle}
            className="border-line/80 hover:border-warning-500/40 transition-colors"
          />
          <StatCard
            label="Critical Faults"
            value={kpis.criticalComplaints || '4'}
            hint="Urgent priority dispatch"
            icon={AlertTriangle}
            className="border-line/80 hover:border-danger-500/40 transition-colors"
          />
          <StatCard
            label="Average Repair Time"
            value={kpis.avgRepairTimeHours || '3.4 hrs'}
            hint="-1.2 hrs vs last quarter"
            icon={Clock}
            className="border-line/80 hover:border-violet-500/40 transition-colors"
          />
          <StatCard
            label="Resolution Rate"
            value={kpis.resolutionRate || '95.8%'}
            hint="SLA benchmark met"
            icon={TrendingUp}
            className="border-line/80 hover:border-emerald-500/40 transition-colors"
          />
        </div>
      </section>

      {/* â”€â”€ CHARTS SECTION (Recharts: Maintenance Trend, Failure Stats, Complaint Status) â”€â”€ */}
      <section className="space-y-6" aria-label="Visual Analytics & Trends">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Maintenance Trend Chart (2 cols on desktop) */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Maintenance & Incident Resolution Trend"
              description="Monthly reported faults vs. completed work orders with repair SLA performance"
              legend={
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                    <span className="text-ink-secondary">Resolved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-danger-400" />
                    <span className="text-ink-secondary">Reported</span>
                  </div>
                </div>
              }
            >
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={maintenanceTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                    <XAxis
                      dataKey="month"
                      stroke="#8b97a8"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#8b97a8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141b24',
                        borderColor: '#2a3648',
                        borderRadius: '12px',
                        color: '#f4f7fb',
                      }}
                      itemStyle={{ color: '#c5ced9' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                      name="Resolved Tickets"
                    />
                    <Area
                      type="monotone"
                      dataKey="reported"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorReported)"
                      name="Reported Faults"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* 2. Failure Statistics Chart */}
          <div className="lg:col-span-1">
            <ChartCard
              title="Failure Cause Breakdown"
              description="Primary root causes across luminaire hardware failures"
            >
              <div className="h-72 w-full pt-1 flex flex-col justify-between">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={failureStatistics}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="cause"
                    >
                      {failureStatistics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141b24',
                        borderColor: '#2a3648',
                        borderRadius: '12px',
                        color: '#f4f7fb',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-2 border-t border-line/60">
                  {failureStatistics.slice(0, 4).map((f) => (
                    <div key={f.cause} className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                      <span className="truncate text-ink-muted">{f.cause}:</span>
                      <span className="font-semibold text-ink-primary font-mono">{f.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* 3. Complaint Status Chart (Bar Distribution) */}
        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="Complaint Status Pipeline"
            description="Active tickets by lifecycle status across all municipal reporting channels"
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complaintStatusDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" vertical={false} />
                  <XAxis
                    dataKey="status"
                    stroke="#8b97a8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#8b97a8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      backgroundColor: '#141b24',
                      borderColor: '#2a3648',
                      borderRadius: '12px',
                      color: '#f4f7fb',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    name="Complaints"
                  >
                    {complaintStatusDistribution.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* â”€â”€ LIVE STREETLIGHT STATUS LIST (At least 12 items across zones) â”€â”€ */}
      <section className="space-y-4" aria-label="Live Streetlight Nodes">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink-primary">
              Live Streetlight Status Grid
            </h2>
            <p className="text-xs text-ink-muted">
              Real-time pole telemetry across municipal zones (14 assets monitored)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/streetlights">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-violet-300 border-violet-500/40">
                <span>View Full Inventory</span>
                <ArrowRight size={13} />
              </Button>
            </Link>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Filter poles..."
                value={streetlightSearch}
                onChange={(e) => setStreetlightSearch(e.target.value)}
                className="rounded-full border border-line bg-surface-card py-1.5 pl-8 pr-3 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Status Filter Buttons */}
            {['ALL', 'WORKING', 'FAILED', 'UNDER_REPAIR', 'WARNING'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStreetlightFilter(status)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                  streetlightFilter === status
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                    : 'border-line bg-surface-card/60 text-ink-muted hover:border-line-strong hover:text-ink-primary',
                )}
              >
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Streetlight Table / Cards */}
        <div className="rounded-2xl border border-line bg-surface-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-primary/80 font-mono text-ink-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Node & Pole</th>
                  <th className="py-3 px-4">Location / Zone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Brightness</th>
                  <th className="py-3 px-4">Power / Batt</th>
                  <th className="py-3 px-4">Last Ping</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredStreetlights.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No streetlights match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredStreetlights.map((light) => (
                    <tr
                      key={light.id}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-ink-primary">
                        <div className="flex items-center gap-1.5">
                          <span className="text-violet-400 font-bold">{light.id}</span>
                          <span className="text-[10px] text-ink-muted">({light.poleNumber})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-ink-primary font-medium">{light.location}</div>
                        <div className="text-[10px] text-ink-muted">{light.zone} â€¢ {light.ward}</div>
                      </td>
                      <td className="py-3 px-4">
                        <StreetlightStatusIndicator status={light.status} />
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-primary">{light.brightness}%</span>
                          <div className="h-1.5 w-12 rounded-full bg-surface-hover overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-400"
                              style={{ width: `${light.brightness}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-primary">{light.powerConsumption}W</span>
                          <span className="text-ink-muted">â€¢</span>
                          <span className="flex items-center gap-1 text-ink-secondary">
                            <Battery size={11} className={light.batteryLevel < 40 ? 'text-danger-400' : 'text-emerald-400'} />
                            {light.batteryLevel}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-ink-muted text-[11px]">
                        {light.lastPing}
                      </td>
                      <td className="py-3 px-4 text-ink-secondary">
                        {light.assignedTechnician}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/admin/streetlights/${light.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-violet-400 hover:text-violet-300 py-1 px-2.5">
                            Details â†’
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* â”€â”€ RECENT COMPLAINTS TABLE (16 realistic records) â”€â”€ */}
      <section className="space-y-4" aria-label="Recent Incident Complaints">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink-primary">
              Recent Complaints & Fault Reports
            </h2>
            <p className="text-xs text-ink-muted">
              Citizen reports & automated photocell outage alerts ({filteredComplaints.length} shown)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'OPEN', label: 'Open' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'RESOLVED', label: 'Resolved' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setComplaintFilter(f.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                    complaintFilter === f.id
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                      : 'border-line bg-surface-card/60 text-ink-muted hover:border-line-strong hover:text-ink-primary',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Link to="/admin/complaints">
              <Button variant="ghost" size="sm" className="text-xs text-violet-400 hover:text-violet-300">
                View All â†’
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-primary/80 font-mono text-ink-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Pole Ref</th>
                  <th className="py-3 px-4">Title & Issue</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredComplaints.slice(0, 8).map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-violet-400">
                      <Link to={`/admin/complaints/${cmp.id}`} className="hover:underline">
                        {cmp.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-secondary">
                      {cmp.streetlightId}
                    </td>
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-ink-primary truncate">{cmp.title}</div>
                      <div className="text-[11px] text-ink-muted truncate">{cmp.citizenName} â€¢ {cmp.citizenContact}</div>
                    </td>
                    <td className="py-3 px-4 text-ink-muted">
                      {cmp.zone}
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={cmp.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cmp.status} />
                    </td>
                    <td className="py-3 px-4 text-ink-muted font-mono text-[11px]">
                      {cmp.createdAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/admin/complaints/${cmp.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-violet-400 hover:text-violet-300 py-1 px-2.5">
                          Inspect â†’
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* â”€â”€ RECENT BLOCKCHAIN ACTIVITY â”€â”€ */}
      <section className="space-y-4" aria-label="Web3 Audit Trail">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-violet-400 text-xs font-mono uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Immutable Ledger</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink-primary">
              Recent Blockchain Activity & Audit Trail
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted hidden sm:inline-block">
            Smart Contract: 0xLumiAuditEngine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="card-glass border-line/70 p-4 transition-all hover:border-violet-500/40 hover:bg-surface-card space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-violet-300">
                  {tx.type}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success-400">
                  <CheckCircle2 size={11} />
                  {tx.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-primary line-clamp-1">{tx.details}</p>
                <p className="text-[10px] font-mono text-ink-muted mt-0.5">Entity: {tx.entityId}</p>
              </div>

              <div className="pt-2 border-t border-line/50 flex items-center justify-between text-[10px] font-mono text-ink-muted">
                <span className="truncate max-w-[140px]" title={tx.txHash}>
                  {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                </span>
                <span>{tx.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
