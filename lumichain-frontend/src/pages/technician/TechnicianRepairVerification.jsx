import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  Activity,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Sparkles,
  RefreshCw,
  Clock,
  MapPin,
  Lock,
  CheckCheck,
} from 'lucide-react'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Breadcrumb,
  Button,
  StatusBadge,
  PriorityBadge,
  ConfirmationModal,
  LoadingState,
  ErrorState,
  useToast,
} from '@/components/ui'
import { cn } from '@/utils'

export default function TechnicianRepairVerification() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getComplaint, verifyComplaint, loading: ctxLoading } = useComplaints()
  const { toast } = useToast()

  const complaint = getComplaint(id)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)

  if (ctxLoading && !complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Initiating oracle sensor check for ${id}...`} />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Incident Record Not Found"
          description={`Unable to locate incident ${id} for verification.`}
          onRetry={() => navigate('/technician/repairs')}
          retryLabel="Back to Assigned Repairs"
        />
      </div>
    )
  }

  const isAlreadyVerified = complaint.status === 'VERIFIED' || complaint.status === 'CLOSED'

  // Post-repair sensor check readings
  const sensorReadings = [
    {
      metric: 'Illumination Output',
      measured: '88.4 Lux',
      threshold: '> 75 Lux Target',
      status: 'PASSED',
      tone: 'success',
      icon: Lightbulb,
    },
    {
      metric: 'Circuit Current Draw',
      measured: '0.68 A',
      threshold: '0.60 â€“ 0.75 A (150W Load)',
      status: 'PASSED',
      tone: 'success',
      icon: Zap,
    },
    {
      metric: 'AC Line Voltage',
      measured: '232.4 V',
      threshold: '220 â€“ 240 V AC Nominal',
      status: 'PASSED',
      tone: 'success',
      icon: Activity,
    },
    {
      metric: 'Junction Box Temperature',
      measured: '36.8 Â°C',
      threshold: '< 65 Â°C Thermal Limit',
      status: 'PASSED',
      tone: 'success',
      icon: Cpu,
    },
  ]

  // Neighbor confirmation nodes
  const neighborNodes = [
    {
      id: 'PL-ND-102',
      relation: 'Neighbor Left (West)',
      ambientDetected: '84.2 Lux',
      status: 'Confirmed Light Spill',
    },
    {
      id: complaint.poleId || 'PL-ND-103',
      relation: 'Subject Node (Repaired)',
      ambientDetected: '88.4 Lux Direct',
      status: 'Active Illumination Verified',
      isSubject: true,
    },
    {
      id: 'PL-ND-104',
      relation: 'Neighbor Right (East)',
      ambientDetected: '86.1 Lux',
      status: 'Confirmed Light Spill',
    },
  ]

  function handleConfirmVerification() {
    setIsVerifying(true)
    setTimeout(() => {
      verifyComplaint(
        complaint.id,
        'Post-repair optical photometer test passed at 88.4 Lux. Neighbor poles PL-ND-102 and PL-ND-104 confirmed on-chain consensus.',
      )
      setIsVerifying(false)
      setConfirmModalOpen(false)
      setVerificationComplete(true)

      toast({
        title: 'Sensor Verification Passed',
        description: `Complaint ${complaint.id} status transitioned to VERIFIED. Luminaire restored on public grid.`,
        variant: 'success',
      })
    }, 400)
  }

  const breadcrumbs = [
    { label: 'Field Console', path: '/technician/dashboard' },
    { label: 'Assigned Repairs', path: '/technician/repairs' },
    { label: complaint.id, path: `/technician/repairs/${complaint.id}` },
    { label: 'Repair Verification' },
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ BREADCRUMB & HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <div className="space-y-1">
          <Breadcrumb items={breadcrumbs} />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary font-mono">
              Sensor Verification: {complaint.id}
            </h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <Link to={`/technician/repairs/${complaint.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
            <ArrowLeft size={14} />
            Back to Ticket
          </Button>
        </Link>
      </div>

      {/* â”€â”€ "VERIFICATION PASSED" STATE BANNER (Requirement 4) â”€â”€ */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-surface-card via-surface-card/95 to-emerald-950/20 p-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Automated Oracle Verification Check
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  PASSED (100% CONFIDENCE)
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">
                Physical sensor telemetry satisfies all municipal luminance standards. Ready to record cryptographic proof.
              </p>
            </div>
          </div>

          <div>
            {!isAlreadyVerified && !verificationComplete ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setConfirmModalOpen(true)}
                className="gap-2 font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Move to VERIFIED</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-mono font-bold text-emerald-300">
                <CheckCheck size={16} />
                <span>Status: VERIFIED On-Chain</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ 2-COLUMN: SENSOR READINGS + NEIGHBOR CONFIRMATION â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Post-Repair Sensor Readings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">
                  Live Post-Repair Telemetry Check
                </h3>
              </div>
              <span className="text-xs font-mono text-violet-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                Telemetry Streaming Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sensorReadings.map((reading) => {
                const Icon = reading.icon
                return (
                  <div
                    key={reading.metric}
                    className="rounded-xl border border-line bg-surface-primary/70 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted flex items-center gap-1.5">
                        <Icon size={13} className="text-violet-400" />
                        {reading.metric}
                      </span>
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                        {reading.status}
                      </span>
                    </div>

                    <div className="text-xl font-black font-mono text-ink-primary">
                      {reading.measured}
                    </div>

                    <div className="text-[11px] font-mono text-ink-muted border-t border-line/40 pt-1.5">
                      Spec: {reading.threshold}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2. Neighbor Node Confirmation Verification (5 cols) (Requirement 4) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">
                  Neighbor Node Confirmation
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">2 / 2 Validated</span>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Neighboring photocell sentinel nodes monitor optical reflection from the repaired luminaire to cross-validate light output without human bias:
            </p>

            <div className="space-y-2.5">
              {neighborNodes.map((node) => (
                <div
                  key={node.id}
                  className={cn(
                    'rounded-xl border p-3 space-y-1 transition-all',
                    node.isSubject
                      ? 'border-violet-500/50 bg-violet-950/20 ring-1 ring-violet-500/30'
                      : 'border-line bg-surface-primary/60',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink-primary">
                      {node.id} {node.isSubject && '(This Luminaire)'}
                    </span>
                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      {node.ambientDetected}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{node.relation}</span>
                    <span className="text-emerald-400 font-medium">âœ“ {node.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono space-y-0.5">
              <div className="font-bold">âœ“ Byzantine Oracle Consensus: 100%</div>
              <div className="text-[10px] text-emerald-400/80">
                Adjacent poles registered persistent 84+ Lux emission across 15-minute monitoring window.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Verification Navigation Bar */}
      {(isAlreadyVerified || verificationComplete) && (
        <div className="rounded-2xl border border-line bg-surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-ink-primary">
              Work Order Successfully Verified & Sealed
            </h4>
            <p className="text-xs text-ink-muted">
              Incident {complaint.id} is now complete. The municipality dashboard and admin audit logs have been updated.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/technician/repairs">
              <Button variant="primary" size="sm" className="text-xs font-semibold">
                Back to Work Queue â†’
              </Button>
            </Link>
            <Link to="/technician/history">
              <Button variant="secondary" size="sm" className="text-xs">
                View in History
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* â”€â”€ CONFIRMATION MODAL â”€â”€ */}
      {confirmModalOpen && (
        <ConfirmationModal
          open={true}
          onClose={() => setConfirmModalOpen(false)}
          title={`Confirm & Move ${complaint.id} to VERIFIED?`}
          description={`All sensor telemetry and neighbor node consensus tests have passed at 88.4 Lux. Moving to VERIFIED will record final cryptographic proof on the municipal audit trail.`}
          confirmLabel={isVerifying ? 'Signing on Blockchain...' : 'Confirm Verification'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmVerification}
        />
      )}
    </div>
  )
}
