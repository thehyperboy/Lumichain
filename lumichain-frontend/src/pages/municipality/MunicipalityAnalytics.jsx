import { useState, useEffect } from 'react'
import {
  BarChart3,
  Building2,
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
  TrendingDown,
  Sparkles,
  Users,
  IndianRupee,
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
import { useAuth } from '@/context'
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

export default function MunicipalityAnalytics() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState('30d')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Identify logged in municipality (default to NDMC)
  const currentMunicipality = user?.municipality || 'NDMC'

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAnalytics({
          timeRange,
          municipality: currentMunicipality,
        })
        if (isMounted) {
          setAnalytics(data)
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load municipality analytics.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [timeRange, currentMunicipality])

  function handleExport(format) {
    toast({
      title: `Municipal Export Generated (${format.toUpperCase()})`,
      description: `Exporting zonal telemetry & energy savings dataset for ${analytics?.municipality || 'Ward Operations'}...`,
      variant: 'info',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
              <Building2 className="h-3 w-3" />
              {analytics?.municipality || 'Municipal Operations Division'}
            </span>
            <span className="text-xs text-ink-muted">Â· Zonal Energy & Telemetry</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            Ward Energy & Maintenance Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Localized smart luminaire diagnostics: ward health distribution, night-cycle power savings, and field technician dispatch efficiency.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
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
              7 Days
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
              30 Days
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
              90 Days
            </button>
          </div>

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
          <LoadingState message="Connecting to municipal telemetry datastore..." />
        </div>
      ) : error ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <ErrorState
            title="Failed to Load Municipality Analytics"
            message={error}
            action={
              <Button variant="outline" onClick={() => setTimeRange('30d')}>
                Retry
              </Button>
            }
          />
        </div>
      ) : !analytics ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <EmptyState
            icon={BarChart3}
            title="No municipal metrics available"
            description="Ensure the ward is registered and telemetry streams are active."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <div className="card-glass border-line/60 p-4 transition-all hover:border-violet-500/40">
              <span className="text-ink-muted text-xs font-medium">Ward Luminaires</span>
              <div className="mt-2 text-2xl font-bold font-mono text-ink-primary">
                {analytics.kpis.totalStreetlights?.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 mt-0.5 block font-mono">
                98.8% Connected
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-amber-500/30">
              <span className="text-ink-muted text-xs font-medium">Active Faults</span>
              <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
                {analytics.kpis.activeFaults}
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                Dispatched to field
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-violet-500/40">
              <span className="text-ink-muted text-xs font-medium">Average MTTR</span>
              <div className="mt-2 text-2xl font-bold font-mono text-violet-400">
                {analytics.kpis.avgRepairHours} <span className="text-xs text-ink-muted font-normal">hrs</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-0.5 block font-mono flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Under 4h SLA
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-purple-500/30">
              <span className="text-ink-muted text-xs font-medium">SLA Adherence</span>
              <div className="mt-2 text-2xl font-bold font-mono text-purple-400">
                {analytics.kpis.slaCompliancePct}%
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                Target â‰¥ 95%
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-emerald-500/30">
              <span className="text-ink-muted text-xs font-medium">Power Saved</span>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                {analytics.kpis.energySavedMwh} <span className="text-xs text-ink-muted font-normal">MWh</span>
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                Night Dimming Profile
              </span>
            </div>

            <div className="card-glass border-line/60 p-4 transition-all hover:border-emerald-500/30">
              <span className="text-ink-muted text-xs font-medium">Cost Savings</span>
              <div className="mt-2 text-lg font-bold font-mono text-emerald-400 truncate">
                {analytics.kpis.costSavingsInr}
              </div>
              <span className="text-[11px] text-ink-muted mt-0.5 block font-mono">
                Tariff rebate credit
              </span>
            </div>
          </div>

          {/* â”€â”€ ROW 1: Ward-by-Ward Breakdown & Energy Dimming Trend â”€â”€ */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 1. Ward-by-Ward Breakdown (Bar Chart - 7 cols) */}
            <div className="lg:col-span-7">
              <ChartCard
                title="Ward Breakdown & Luminaire Uptime"
                description="Pole count, active fault tickets, and operational uptime across residential wards"
                legend={
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded bg-violet-400" />
                      <span className="text-ink-secondary">Poles (x100)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded bg-rose-500" />
                      <span className="text-ink-secondary">Active Faults</span>
                    </div>
                  </div>
                }
              >
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.wardBreakdown.map((w) => ({
                        ...w,
                        scaledPoles: Math.round(w.totalPoles / 100),
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                      <XAxis
                        dataKey="ward"
                        stroke="#8b97a8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => val.split(' ')[0] + ' ' + val.split(' ')[1]}
                      />
                      <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={darkTooltipStyle} />
                      <Bar dataKey="scaledPoles" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Total Poles (x100)" />
                      <Bar dataKey="activeFaults" fill="#ef4444" radius={[4, 4, 0, 0]} name="Active Faults" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* 2. Nightly Energy Consumption & Dimming Profile (Area Chart - 5 cols) */}
            <div className="lg:col-span-5">
              <ChartCard
                title="Nightly Dynamic Dimming Profile"
                description="Power draw: Traditional 100% baseline vs. IoT dimming schedule"
                legend={
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                      <span className="text-ink-secondary">Baseline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="text-ink-secondary">Smart LED</span>
                    </div>
                  </div>
                }
              >
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.energyTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="muniSmart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                      <XAxis dataKey="time" stroke="#8b97a8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={darkTooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="baselineKwh"
                        stroke="#64748b"
                        strokeDasharray="3 3"
                        fill="transparent"
                        name="Baseline (kWh)"
                      />
                      <Area
                        type="monotone"
                        dataKey="smartKwh"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#muniSmart)"
                        name="Smart Dimmed (kWh)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* â”€â”€ ROW 2: Incident Velocity & Municipal Technician Roster â”€â”€ */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 3. Daily Incident Velocity (Reported vs Resolved) */}
            <ChartCard
              title="Daily Grievance Velocity"
              description="Reported resident complaints vs. confirmed technician fixes"
              legend={
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-rose-500" />
                    <span className="text-ink-secondary">Reported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-violet-400" />
                    <span className="text-ink-secondary">Resolved</span>
                  </div>
                </div>
              }
            >
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.incidentVelocity}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                    <XAxis dataKey="day" stroke="#8b97a8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={darkTooltipStyle} />
                    <Bar dataKey="reported" fill="#ef4444" radius={[4, 4, 0, 0]} name="Reported" />
                    <Bar dataKey="resolved" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* 4. Municipal Field Technicians Workload Table */}
            <ChartCard
              title="Ward Field Specialist Workload"
              description="Active dispatched jobs, monthly throughput, and resident satisfaction score"
              legend={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('technicians')}
                  className="text-xs gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Export</span>
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line/60 bg-surface-subtle/80 text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
                    <tr>
                      <th className="py-3 pl-3 pr-2">Technician</th>
                      <th className="px-2 py-3">Active Work Orders</th>
                      <th className="px-2 py-3">Monthly Solved</th>
                      <th className="py-3 pl-2 pr-3 text-right">Citizen Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40 font-mono">
                    {analytics.technicianWorkload.map((tech) => (
                      <tr key={tech.name} className="hover:bg-surface-subtle/40 transition-colors">
                        <td className="py-3 pl-3 pr-2 font-sans font-semibold text-ink-primary">
                          {tech.name}
                        </td>
                        <td className="px-2 py-3">
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-blue-400 font-bold">
                            {tech.activeJobs} Active
                          </span>
                        </td>
                        <td className="px-2 py-3 text-emerald-400 font-bold">
                          {tech.completedMonth} Completed
                        </td>
                        <td className="py-3 pl-2 pr-3 text-right text-amber-400 font-bold">
                          â˜… {tech.rating} / 5.0
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}
