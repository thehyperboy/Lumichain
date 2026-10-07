import { useState, useEffect } from 'react'
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { getAnalytics } from '@/services/api'
import {
  Button,
  ChartCard,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from '@/components'
import { cn } from '@/utils'

// Dark theme tooltip styling for Recharts
const darkTooltipStyle = {
  backgroundColor: '#141b24',
  borderColor: '#2a3648',
  borderRadius: '12px',
  color: '#f4f7fb',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  fontSize: '12px',
}

export default function AdminAnalytics() {
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState('30d')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch analytics data when timeRange changes
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAnalytics({ timeRange })
        if (isMounted) {
          setAnalytics(data)
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load analytics.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [timeRange])

  // Mock Export handler
  function handleExport(format) {
    toast({
      title: `Export Initiated (${format.toUpperCase()})`,
      description: `Generating municipal analytical export for time range: ${timeRange.toUpperCase()}... File download will commence shortly.`,
      variant: 'info',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              <Activity className="h-3 w-3 animate-pulse" />
              Central Telemetry Intelligence
            </span>
            <span className="text-xs text-ink-muted">Â· Real-Time Aggregation</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            System Performance Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Platform-wide diagnostic insights: failure velocity, resolution efficiency, zonal distribution, and SLA adherence trends.
          </p>
        </div>

        {/* Date Range Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Pills */}
          <div className="flex items-center rounded-xl border border-line/60 bg-surface-subtle p-1">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                timeRange === '7d'
                  ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
                  : 'text-ink-muted hover:text-ink-primary',
              )}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                timeRange === '30d'
                  ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
                  : 'text-ink-muted hover:text-ink-primary',
              )}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('90d')}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                timeRange === '90d'
                  ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
                  : 'text-ink-muted hover:text-ink-primary',
              )}
            >
              Last 90 Days
            </button>
          </div>

          {/* Export Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="text-xs gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-violet-400" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="py-24">
          <LoadingState message="Aggregating telemetry datasets..." />
        </div>
      ) : error ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <ErrorState
            title="Analytics Telemetry Error"
            message={error}
            action={
              <Button
                variant="outline"
                onClick={() => setTimeRange('30d')}
                className="mt-4"
              >
                Reset Filter
              </Button>
            }
          />
        </div>
      ) : !analytics ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <EmptyState
            icon={BarChart3}
            title="No analytical records found"
            description="No metrics available for the chosen date range."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stat Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="card-glass border-line/60 p-4 transition-all hover:border-danger-500/30">
              <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
                <span>Total Failures</span>
                <AlertTriangle className="h-4 w-4 text-danger-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-ink-primary">
                {analytics.kpis.totalFailures}
              </div>
              <span className="text-[11px] text-danger-400 mt-0.5 block font-mono">
                {analytics.kpis.criticalIncidents} Critical Cutouts
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
                <span>Resolved Tickets</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                {analytics.kpis.resolvedFailures}
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                {analytics.kpis.resolutionRate}% Success Rate
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-violet-500/40">
              <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
                <span>Avg Repair Time</span>
                <Clock className="h-4 w-4 text-violet-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-violet-400">
                {analytics.kpis.avgRepairHours} <span className="text-xs text-ink-muted font-normal">hrs</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-0.5 block font-mono flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Under 4h SLA Target
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-purple-500/30">
              <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
                <span>SLA Compliance</span>
                <ShieldCheck className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-purple-400">
                {analytics.kpis.slaCompliance}%
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                Target â‰¥ 95.0%
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
                <span>Energy Saved</span>
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                {analytics.kpis.energySavedKwh?.toLocaleString()} <span className="text-xs text-ink-muted font-normal">kWh</span>
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                Dynamic LED Dimming
              </span>
            </div>
          </div>

          {/* â”€â”€ ROW 1: Failures Over Time & Complaints by Status â”€â”€ */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 1. Failures Over Time (Area Chart - 8 cols) */}
            <div className="lg:col-span-8">
              <ChartCard
                title="Failures & Incident Velocity Over Time"
                description={`Tracking incident detections, autonomous AI confirmations, and completed work orders (${timeRange.toUpperCase()})`}
                legend={
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                      <span className="text-ink-secondary">Resolved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="text-ink-secondary">Failures</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                      <span className="text-ink-secondary">AI Sentinel</span>
                    </div>
                  </div>
                }
              >
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.failuresOverTime}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="adminFailures" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                      <XAxis dataKey="date" stroke="#8b97a8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={darkTooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill="url(#adminResolved)"
                        name="Resolved"
                      />
                      <Area
                        type="monotone"
                        dataKey="failures"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="url(#adminFailures)"
                        name="Failures"
                      />
                      <Line
                        type="monotone"
                        dataKey="aiDetected"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#a855f7' }}
                        name="AI Sentinel Verified"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* 2. Complaints by Status (Donut Chart - 4 cols) */}
            <div className="lg:col-span-4">
              <ChartCard
                title="Complaints by Status"
                description="Distribution across active triage stages"
              >
                <div className="h-56 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.complaintsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="status"
                      >
                        {analytics.complaintsByStatus.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={darkTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Status Legend */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/40 text-[11px]">
                  {analytics.complaintsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-ink-muted truncate">{item.status}</span>
                      </div>
                      <span className="font-mono font-semibold text-ink-primary">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>

          {/* â”€â”€ ROW 2: Complaints by Priority & Average Repair Time Trend â”€â”€ */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 3. Complaints by Priority (Bar Chart) */}
            <ChartCard
              title="Complaints by Triage Priority"
              description="Severity distribution of open & active grievances"
            >
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.complaintsByPriority}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                    <XAxis dataKey="priority" stroke="#8b97a8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={darkTooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Ticket Count">
                      {analytics.complaintsByPriority.map((entry, idx) => (
                        <Cell key={`prio-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* 4. Average Repair Time Trend (Line Chart) */}
            <ChartCard
              title="Average Repair Time (MTTR) Trend"
              description="Mean time to repair in hours vs. target 4.0h SLA threshold"
              legend={
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-400" />
                    <span className="text-ink-secondary">Actual Hours</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-danger-400" />
                    <span className="text-ink-secondary">SLA Target (4h)</span>
                  </div>
                </div>
              }
            >
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.avgRepairTimeTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                    <XAxis dataKey="period" stroke="#8b97a8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={darkTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#06b6d4' }}
                      name="Actual Repair (Hours)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      name="SLA Threshold"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* â”€â”€ ROW 3: Zone-Wise Failures & SLA Compliance â”€â”€ */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 5. Zone-Wise Failures (Grouped Bar Chart) */}
            <ChartCard
              title="Zone-Wise Failures & Restorations"
              description="Incident density and repair throughput across municipal zones"
              legend={
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-rose-500" />
                    <span className="text-ink-secondary">Failed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-400" />
                    <span className="text-ink-secondary">Resolved</span>
                  </div>
                </div>
              }
            >
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.zoneFailures}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                    <XAxis
                      dataKey="zone"
                      stroke="#8b97a8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={darkTooltipStyle} />
                    <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                    <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* 6. SLA Compliance Over Time (Stacked / Percentage) */}
            <ChartCard
              title="SLA Compliance & Breach Rate"
              description="Percentage of work orders resolved within statutory SLA timeline"
              legend={
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-400" />
                    <span className="text-ink-secondary">Within SLA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-amber-500" />
                    <span className="text-ink-secondary">Breached</span>
                  </div>
                </div>
              }
            >
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.slaCompliance}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                    <XAxis dataKey="period" stroke="#8b97a8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={darkTooltipStyle} />
                    <Bar
                      dataKey="withinSla"
                      stackId="sla"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                      name="Within SLA"
                    />
                    <Bar
                      dataKey="breached"
                      stackId="sla"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      name="Breached SLA"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* â”€â”€ ROW 4: Technician Performance Table/Cards â”€â”€ */}
          <ChartCard
            title="Field Specialist Resolution Performance"
            description="Completed job throughput, average turnaround time, and SLA adherence score"
            legend={
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('technicians')}
                className="text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                <span>Export Technician Roster</span>
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line/60 bg-surface-subtle/80 text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
                  <tr>
                    <th className="py-3 pl-4 pr-3">Technician</th>
                    <th className="px-3 py-3">Completed Work Orders</th>
                    <th className="px-3 py-3">Average Repair Time</th>
                    <th className="px-3 py-3">SLA Adherence Rate</th>
                    <th className="py-3 pl-3 pr-4 text-right">Performance Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 font-mono">
                  {analytics.technicianPerformance.map((tech) => (
                    <tr key={tech.name} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-3 pl-4 pr-3 font-sans font-semibold text-ink-primary">
                        {tech.name}
                      </td>
                      <td className="px-3 py-3 text-violet-400 font-bold">
                        {tech.completed} jobs
                      </td>
                      <td className="px-3 py-3 text-ink-secondary">
                        {tech.avgHours} hours
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-card">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                              style={{ width: `${tech.slaAdherence}%` }}
                            />
                          </div>
                          <span className="text-emerald-400 font-bold">
                            {tech.slaAdherence}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right font-sans">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {tech.slaAdherence >= 95 ? 'Top Performer' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
