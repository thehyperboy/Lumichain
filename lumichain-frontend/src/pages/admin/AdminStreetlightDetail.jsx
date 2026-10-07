import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Lightbulb,
  Zap,
  Battery,
  Thermometer,
  Activity,
  AlertTriangle,
  ArrowLeft,
  Wrench,
  Clock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { getStreetlightById } from '@/services/api'
import {
  Breadcrumb,
  SensorMetricCard,
  MapPlaceholder,
  StatusBadge,
  PriorityBadge,
  ChartCard,
  LoadingState,
  ErrorState,
  Button,
} from '@/components/ui'
import { NeighborNodeVerification } from '@/components/streetlight'
import { cn } from '@/utils'

export default function AdminStreetlightDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [streetlight, setStreetlight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeChartTab, setActiveChartTab] = useState('light') // 'light' | 'electrical'

  const loadDetails = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStreetlightById(id)
      setStreetlight(data)
    } catch (err) {
      setError(err.message || `Unable to load streetlight details for node ${id}.`)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Fetching sensor telemetry & mesh consensus for ${id}...`} />
      </div>
    )
  }

  if (error || !streetlight) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Streetlight Asset Not Found"
          description={error || `No asset found with identifier "${id}".`}
          onRetry={() => navigate('/admin/streetlights')}
          retryLabel="Back to Streetlight Inventory"
        />
      </div>
    )
  }

  const {
    poleNumber,
    location,
    zone,
    ward,
    model,
    lat,
    lng,
    status,
    brightness,
    currentAmps,
    voltage,
    batteryLevel,
    temperature,
    failureProbability = 0,
    priority = 'LOW',
    lastPing,
    installedAt,
    assignedTechnician,
    currentComplaint,
    sensorHistory = [],
    failureHistory = [],
    maintenanceHistory = [],
    timeline = [],
  } = streetlight

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Streetlight Nodes', to: '/admin/streetlights' },
    { label: `${poleNumber} (${id})` },
  ]

  const riskTone =
    failureProbability >= 80
      ? 'text-danger-400 bg-danger-500/15 border-danger-500/30'
      : failureProbability >= 40
        ? 'text-warning-400 bg-warning-500/15 border-warning-500/30'
        : 'text-success-400 bg-success-500/15 border-success-500/30'

  return (
    <div className="space-y-7 pb-14">
      {/* â”€â”€ BREADCRUMBS (Requirement 5) â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Link to="/admin/streetlights">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
              <ArrowLeft size={13} />
              <span>Back to Nodes</span>
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={loadDetails} className="gap-1.5 text-xs">
            <RefreshCw size={12} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* â”€â”€ POLE HERO HEADER & BASIC INFO â”€â”€ */}
      <section className="card-glass border-line/80 p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-ink-primary">
                {poleNumber}
              </span>
              <span className="font-mono text-sm px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 font-bold">
                {id}
              </span>
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
            </div>

            <p className="text-base font-semibold text-ink-primary">{location}</p>
            <p className="text-xs text-ink-muted font-mono">
              {zone} â€¢ {ward} â€¢ Coordinates: {lat}Â° N, {lng}Â° E
            </p>
            <p className="text-xs text-ink-secondary">
              Hardware Spec: <strong className="text-ink-primary">{model}</strong>
            </p>
          </div>

          {/* Quick Metrics & Metadata Pill */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
            <div className="rounded-xl border border-line bg-surface-primary/70 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted flex items-center gap-1">
                  <Activity size={12} />
                  AI Failure Probability
                </span>
                <span className={cn('px-2 py-0.5 rounded-full font-mono font-bold text-[11px] border', riskTone)}>
                  {failureProbability}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    failureProbability >= 80 ? 'bg-danger-500' : failureProbability >= 40 ? 'bg-warning-500' : 'bg-success-500',
                  )}
                  style={{ width: `${failureProbability}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface-primary/70 p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-ink-muted">Assigned Tech:</span>
                <span className="text-ink-primary font-semibold">{assignedTechnician || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Commissioned:</span>
                <span className="text-ink-secondary">{installedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Last Mesh Heartbeat:</span>
                <span className="text-violet-400">{lastPing}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ CURRENT SENSOR READINGS (Phase 3 SensorMetricCard) â”€â”€ */}
      <section aria-label="Current Sensor Readings">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
          Real-time IoT Sensor Array Telemetry
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <SensorMetricCard
            label="Light Intensity"
            value={`${brightness}`}
            unit="Lux / %"
            icon={Lightbulb}
            status={brightness > 0 ? 'Actively Emitting' : 'Zero Lux Output'}
            className="border-line/70"
          />
          <SensorMetricCard
            label="Current Draw"
            value={currentAmps !== undefined ? `${currentAmps}` : '0.00'}
            unit="Amperes (A)"
            icon={Zap}
            status={currentAmps > 0.05 ? 'Normal Load' : 'Load Collapsed'}
            className="border-line/70"
          />
          <SensorMetricCard
            label="Operating Voltage"
            value={voltage !== undefined ? `${voltage}` : '230'}
            unit="Volts (V AC)"
            icon={Battery}
            status={voltage >= 210 ? 'Nominal Rail' : 'Voltage Sag Alert'}
            className="border-line/70"
          />
          <SensorMetricCard
            label="Enclosure Temp"
            value={`${temperature}`}
            unit="Â°C"
            icon={Thermometer}
            status={temperature > 40 ? 'High Thermal Stress' : 'Normal Operating'}
            className="border-line/70"
          />
          <SensorMetricCard
            label="Battery Backup"
            value={`${batteryLevel}`}
            unit="%"
            icon={Battery}
            status={batteryLevel > 50 ? 'Healthy Reserve' : 'Depleted Charge'}
            className="border-line/70"
          />
          <SensorMetricCard
            label="Failure Risk"
            value={`${failureProbability}`}
            unit="% Probability"
            icon={Activity}
            status={failureProbability > 70 ? 'Critical Attention' : 'Healthy Asset'}
            className="border-line/70"
          />
        </div>
      </section>

      {/* â”€â”€ VISUAL NEIGHBOR NODE VERIFICATION (Requirement 4) â”€â”€ */}
      <NeighborNodeVerification streetlight={streetlight} />

      {/* â”€â”€ SENSOR HISTORY CHARTS (Time Series: Light, Current, Voltage) â”€â”€ */}
      <section aria-label="Sensor History Time Series">
        <ChartCard
          title="24-Hour Telemetry History"
          description="Continuous time-series sensor readings recorded at 3-hour telemetry telemetry intervals"
          legend={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveChartTab('light')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                  activeChartTab === 'light'
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                    : 'border-line text-ink-muted hover:text-ink-primary',
                )}
              >
                Light Intensity (Lux)
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('electrical')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                  activeChartTab === 'electrical'
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                    : 'border-line text-ink-muted hover:text-ink-primary',
                )}
              >
                Voltage & Current
              </button>
            </div>
          }
        >
          <div className="h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'light' ? (
                <AreaChart data={sensorHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                  <XAxis dataKey="time" stroke="#8b97a8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141b24',
                      borderColor: '#2a3648',
                      borderRadius: '12px',
                      color: '#f4f7fb',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="light"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#lightGrad)"
                    name="Optical Light Intensity (%)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={sensorHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2a38" />
                  <XAxis dataKey="time" stroke="#8b97a8" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} unit="V" />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b97a8" fontSize={12} tickLine={false} axisLine={false} unit="A" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141b24',
                      borderColor: '#2a3648',
                      borderRadius: '12px',
                      color: '#f4f7fb',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="voltage"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    name="Operating Voltage (V)"
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="current"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    name="Current Draw (A)"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* â”€â”€ LOCATION MAP & RELATED COMPLAINT â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location (Phase 3 MapPlaceholder) */}
        <section aria-label="Geographic Location">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
            Geographic Location & GIS Anchor
          </h2>
          <div className="card-glass border-line/80 p-5 space-y-3">
            <MapPlaceholder
              label={`${poleNumber} â€” ${location}`}
              description={`GPS Coordinates: ${lat}Â° N, ${lng}Â° E â€¢ GIS Anchor: ${ward}, ${zone}`}
              className="min-h-[220px]"
            />
            <div className="flex items-center justify-between text-xs text-ink-secondary pt-1 font-mono">
              <span>GIS Layer: Municipal Street Grid v2.4</span>
              <span className="text-violet-400">Precision: Â±0.4m RTK</span>
            </div>
          </div>
        </section>

        {/* Active Incident Ticket / Related Complaint */}
        <section aria-label="Related Complaint">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
            Related Complaint & Citizen Incident
          </h2>
          <div className="card-glass border-line/80 p-5 space-y-4 h-[calc(100%-1.75rem)] flex flex-col justify-between">
            {currentComplaint ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-danger-400">
                    {currentComplaint.id}
                  </span>
                  <StatusBadge status={currentComplaint.status} />
                </div>

                <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3.5 space-y-1.5">
                  <h4 className="text-sm font-bold text-ink-primary">
                    {currentComplaint.title}
                  </h4>
                  <p className="text-xs text-ink-muted">
                    Reported by citizen representative: <strong className="text-ink-secondary">{currentComplaint.citizen}</strong>
                  </p>
                </div>

                <div className="text-xs text-ink-secondary space-y-1">
                  <p className="flex justify-between">
                    <span className="text-ink-muted">Triage Priority:</span>
                    <span className="font-semibold text-danger-400">{currentComplaint.priority}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-ink-muted">Assigned Dispatch:</span>
                    <span className="font-mono text-ink-primary">{assignedTechnician}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-sm font-semibold text-ink-primary">Zero Active Complaints</h4>
                <p className="text-xs text-ink-muted max-w-xs">
                  No open citizen complaints or manual fault tickets are currently associated with this pole.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
              <span className="text-ink-muted">Automated Work Order:</span>
              <span className="font-mono text-violet-400">
                {currentComplaint ? 'WO-DISPATCHED-091' : 'None Required'}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* â”€â”€ MAINTENANCE & FAILURE HISTORY + CHRONOLOGICAL TIMELINE â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failure & Maintenance History (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Failure Logs */}
          <div className="card-glass border-line/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <AlertTriangle size={15} className="text-warning-400" />
              <span>Historical Failure Records</span>
            </h3>

            {failureHistory.length === 0 ? (
              <p className="text-xs text-ink-muted py-2">No previous failure events recorded for this luminaire.</p>
            ) : (
              <div className="space-y-2">
                {failureHistory.map((f) => (
                  <div key={f.id} className="rounded-xl border border-line bg-surface-primary/70 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-danger-400">{f.id}</span>
                      <span className="text-ink-muted text-[11px]">{f.date}</span>
                    </div>
                    <p className="text-ink-secondary">{f.reason}</p>
                    <p className="text-[11px] text-ink-muted">Resolution: {f.resolvedBy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Service History */}
          <div className="card-glass border-line/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <Wrench size={15} className="text-violet-400" />
              <span>Service & Maintenance History</span>
            </h3>

            {maintenanceHistory.length === 0 ? (
              <p className="text-xs text-ink-muted py-2">No field maintenance visits recorded.</p>
            ) : (
              <div className="space-y-2">
                {maintenanceHistory.map((m) => (
                  <div key={m.id} className="rounded-xl border border-line bg-surface-primary/70 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-violet-400">{m.id} â€¢ {m.type}</span>
                      <span className="text-ink-muted text-[11px]">{m.date}</span>
                    </div>
                    <p className="text-ink-secondary">{m.notes}</p>
                    <p className="text-[11px] text-ink-muted font-mono">Field Tech: {m.technician}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chronological Event Timeline (1 col) */}
        <div className="lg:col-span-1">
          <div className="card-glass border-line/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <Clock size={15} className="text-primary-400" />
              <span>Operational Timeline</span>
            </h3>

            <div className="relative border-l-2 border-line/80 ml-2 space-y-5 py-1">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative pl-5 group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full border border-surface-card bg-violet-400 group-hover:scale-125 transition-transform" />
                  <span className="text-[10px] font-mono font-semibold text-violet-400 block">
                    {item.time}
                  </span>
                  <h4 className="text-xs font-bold text-ink-primary mt-0.5">
                    {item.event}
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
