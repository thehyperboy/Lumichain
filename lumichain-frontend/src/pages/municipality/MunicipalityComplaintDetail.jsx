import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  Eye,
  FileText,
  Lightbulb,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Wrench,
  Building2,
  Image as ImageIcon,
  CheckCheck,
} from 'lucide-react'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Breadcrumb,
  StatusBadge,
  PriorityBadge,
  Button,
  LoadingState,
  ErrorState,
  ConfirmationModal,
  Modal,
  ComplaintTimeline,
  ComplaintBlockchainTrail,
  useToast,
} from '@/components'
import { AssignTechnicianModal } from '@/components/technicians'
import { cn } from '@/utils'

export default function MunicipalityComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    getComplaint,
    updateComplaintPriority,
    verifyComplaint,
    closeComplaint,
    loading: contextLoading,
  } = useComplaints()

  // Retrieve latest in-memory complaint from live shared context
  const complaint = getComplaint(id)

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [priorityModalOpen, setPriorityModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [targetPriority, setTargetPriority] = useState('HIGH')
  const [activeEvidenceImage, setActiveEvidenceImage] = useState(null)

  if (contextLoading && !complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Retrieving ward incident docket for ${id}...`} />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Incident Record Not Found"
          description={`No municipal grievance record located with identifier "${id}".`}
          onRetry={() => navigate('/municipality/complaints')}
          retryLabel="Return to Ward Complaints Register"
        />
      </div>
    )
  }

  // Handle Action 1: Change Priority
  function handleConfirmPriorityChange() {
    updateComplaintPriority(complaint.id, targetPriority)
    toast({
      title: 'Priority Updated',
      description: `Complaint ${complaint.id} triage level updated to ${targetPriority}.`,
      variant: 'success',
    })
    setPriorityModalOpen(false)
  }

  // Handle Action 2: Verify Complaint
  function handleConfirmVerify() {
    verifyComplaint(
      complaint.id,
      'Signed and verified by Municipal Ward Officer on-chain.',
    )
    toast({
      title: 'Complaint Verified',
      description: `Physical repair on ${complaint.id} verified on-chain. Luminaire active.`,
      variant: 'success',
    })
    setVerifyModalOpen(false)
  }

  // Handle Action 3: Close Complaint
  function handleConfirmClose() {
    closeComplaint(
      complaint.id,
      'Formally closed and sealed by Municipal Ward Quality Office.',
    )
    toast({
      title: 'Complaint Formally Closed',
      description: `Ticket ${complaint.id} closed and marked resolved.`,
      variant: 'success',
    })
    setCloseModalOpen(false)
  }

  const confidenceVal = Number(complaint.aiConfidence) || 95.0
  const isHighConfidence = confidenceVal >= 85
  const isModerateConfidence = confidenceVal >= 70 && confidenceVal < 85

  const breadcrumbs = [
    { label: 'Ward Dashboard', path: '/municipality/dashboard' },
    { label: 'Complaints', path: '/municipality/complaints' },
    { label: complaint.id },
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ BREADCRUMB & TOP NAV â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <div className="space-y-1">
          <Breadcrumb items={breadcrumbs} />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary font-mono">
              {complaint.id}
            </h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/municipality/complaints">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
              <ArrowLeft size={14} />
              Ward Complaints
            </Button>
          </Link>
        </div>
      </div>

      {/* â”€â”€ ACTION CONTROLS BAR (Ward Actions) â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-surface-card via-surface-card/95 to-violet-950/20 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
                  Municipal Dispatch & Oversight Console
                </span>
                <span className="text-[10px] rounded bg-surface-primary px-1.5 py-0.5 font-mono text-ink-muted border border-line">
                  {complaint.ticketNumber || 'ACTIVE-DOCKET'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Reported: <span className="font-mono text-ink-primary">{complaint.createdAt}</span> Â· Last action:{' '}
                <span className="font-mono text-ink-primary">{complaint.updatedAt || complaint.createdAt}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Assign Technician Button */}
            <Button
              variant={complaint.assignedTo ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Wrench size={13} />
              {complaint.assignedTo ? 'Reassign Specialist' : 'Assign Specialist'}
            </Button>

            {/* Change Priority */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTargetPriority(complaint.priority)
                setPriorityModalOpen(true)
              }}
              className="gap-1.5 text-xs font-medium"
            >
              <SlidersHorizontal size={13} />
              Triage Priority
            </Button>

            {/* Verify Repair (if ready or in progress) */}
            {complaint.status !== 'VERIFIED' && complaint.status !== 'CLOSED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVerifyModalOpen(true)}
                className="gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
              >
                <CheckCheck size={13} />
                Verify Repair
              </Button>
            )}

            {/* Close Complaint */}
            {complaint.status !== 'CLOSED' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCloseModalOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Lock size={13} />
                Close Ticket
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ 2-COLUMN GRID â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Incident, AI Meter, Evidence & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Problem & Incident Statement */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-violet-400" />
                <h2 className="text-base font-bold text-ink-primary">Grievance Overview & Problem</h2>
              </div>
              <span className="text-xs font-mono text-violet-400">
                â–² {complaint.upvotes ?? 6} Endorsements
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink-primary tracking-tight">
                {complaint.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary bg-surface-primary/50 rounded-xl p-3.5 border border-line/60">
                {complaint.description}
              </p>
            </div>

            {/* Reporter details and physical location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-line/70 bg-surface-primary/60 p-3">
                <div className="text-[11px] font-mono uppercase text-ink-muted flex items-center gap-1.5">
                  <User size={12} className="text-violet-400" />
                  Reporting Citizen
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-primary">
                  {complaint.citizenName || 'Resident Report'}
                </div>
                <div className="text-xs font-mono text-ink-muted">
                  {complaint.citizenContact || 'Contact protected on-chain'}
                </div>
              </div>

              <div className="rounded-xl border border-line/70 bg-surface-primary/60 p-3">
                <div className="text-[11px] font-mono uppercase text-ink-muted flex items-center gap-1.5">
                  <MapPin size={12} className="text-violet-400" />
                  Physical Location
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-primary truncate">
                  {complaint.location}
                </div>
                <div className="text-xs font-mono text-ink-muted">
                  {complaint.ward} Â· {complaint.zone}
                </div>
              </div>
            </div>
          </div>

          {/* 2. AI Classification & Visual Confidence Meter */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet-400" />
                <h2 className="text-base font-bold text-ink-primary">AI Telemetry & Oracle Meter</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-violet-400">
                <Sparkles size={13} className="text-violet-400" />
                Sentinel Edge Diagnostic
              </div>
            </div>

            {/* AI Classification */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-400">
                  Detected Failure Classification:
                </span>
                <p className="text-sm font-semibold text-ink-primary mt-0.5">
                  {complaint.aiClassification || 'Photocell Lux Blackout & Voltage Drop Anomaly'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-violet-400/20 px-2.5 py-1 text-xs font-mono font-bold text-violet-300 border border-violet-500/30">
                <ShieldCheck size={13} />
                MESH VERIFIED
              </span>
            </div>

            {/* Visual Confidence Meter */}
            <div className="rounded-xl border border-line/80 bg-surface-primary/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                    AI Diagnostic Confidence Score
                  </h4>
                  <p className="text-xs text-ink-muted">
                    Derived from neighbor node optical cross-verification.
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-2xl font-black font-mono',
                      isHighConfidence
                        ? 'text-violet-400'
                        : isModerateConfidence
                          ? 'text-amber-400'
                          : 'text-rose-400',
                    )}
                  >
                    {confidenceVal.toFixed(1)}%
                  </span>
                  <div className="text-[10px] font-mono uppercase text-ink-muted">
                    {isHighConfidence ? 'Ultra-High Confidence' : 'Review Suggested'}
                  </div>
                </div>
              </div>

              {/* Glowing progress meter bar */}
              <div className="space-y-1.5">
                <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-surface-card border border-line">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      isHighConfidence
                        ? 'bg-gradient-to-r from-violet-600 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                        : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
                    )}
                    style={{ width: `${Math.min(Math.max(confidenceVal, 5), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted px-0.5">
                  <span>0% (Heuristic)</span>
                  <span>50% (Ambiguous)</span>
                  <span className="text-violet-400 font-bold">100% (Proof Verified)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Evidence Images Gallery */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-violet-400" />
                <h2 className="text-base font-bold text-ink-primary">Telemetry & Photographic Evidence</h2>
              </div>
              <span className="text-xs font-mono text-ink-muted">
                {(complaint.evidenceImages || []).length} Verified Captures
              </span>
            </div>

            {(!complaint.evidenceImages || complaint.evidenceImages.length === 0) ? (
              <div className="rounded-xl border border-line/60 bg-surface-primary/40 p-6 text-center text-ink-muted text-xs">
                No photographic evidence uploaded for this ticket.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.evidenceImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-xl border border-line bg-surface-primary/60 transition-all hover:border-violet-500/40 cursor-pointer"
                    onClick={() => setActiveEvidenceImage(img)}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                      <img
                        src={img.url}
                        alt={img.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-ink-primary border border-white/10 flex items-center gap-1">
                        <Eye size={11} /> Inspect
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[10px] font-mono text-violet-300 block">
                          {img.timestamp}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{img.title}</h4>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-ink-secondary line-clamp-2">{img.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Full 9-stage ComplaintTimeline */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm">
            <ComplaintTimeline timeline={complaint.timeline} />
          </div>
        </div>

        {/* Right Column (4 cols): Associated Luminaire, Assigned Tech, Ward Info, Blockchain */}
        <div className="lg:col-span-4 space-y-6">
          {/* Associated Streetlight Node */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">Luminaire Asset</h3>
              </div>
              <span className="text-[11px] font-mono text-violet-400">Node Ref</span>
            </div>

            <div className="rounded-xl border border-violet-500/30 bg-surface-primary/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-ink-muted uppercase">Pole Identifier:</span>
                <span className="font-mono text-sm font-bold text-violet-400">
                  {complaint.poleId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-ink-muted uppercase">Asset Node ID:</span>
                <span className="font-mono text-xs font-semibold text-ink-primary">
                  {complaint.streetlightId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-ink-muted uppercase">Ward:</span>
                <span className="text-xs text-ink-secondary font-medium">{complaint.ward}</span>
              </div>
            </div>

            <Link to={`/admin/streetlights/${complaint.streetlightId}`} className="block">
              <Button variant="primary" size="sm" className="w-full justify-center gap-1.5 text-xs font-semibold">
                <Lightbulb size={14} />
                <span>View Streetlight Telemetry</span>
                <ExternalLink size={12} className="ml-1 opacity-70" />
              </Button>
            </Link>
          </div>

          {/* Assigned Technician */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">Assigned Field Tech</h3>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Work Order</span>
            </div>

            {complaint.assignedTo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-surface-primary/70 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 font-bold font-mono border border-violet-500/30">
                    {complaint.assignedTo.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink-primary">{complaint.assignedTo}</h4>
                    <p className="text-xs text-ink-muted font-mono">Field Luminaire Specialist</p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAssignModalOpen(true)}
                  className="w-full justify-center text-xs"
                >
                  Change / Reassign Technician
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface-primary/30 p-4 text-center space-y-2.5">
                <p className="text-xs text-ink-muted">
                  No technician dispatched yet for this incident.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAssignModalOpen(true)}
                  className="w-full justify-center text-xs gap-1 font-semibold"
                >
                  <Wrench size={12} />
                  Dispatch Technician Now
                </Button>
              </div>
            )}
          </div>

          {/* Municipality Authority */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">Municipality</h3>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Jurisdiction</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-line bg-surface-primary/60 p-2.5">
                <span className="text-[10px] font-mono text-ink-muted uppercase block">Authority:</span>
                <span className="font-semibold text-ink-primary">{complaint.municipality}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-surface-primary/40">
                <span className="text-ink-muted">Resolution Target:</span>
                <span className="font-mono text-violet-400 font-semibold">24 Hours (SLA)</span>
              </div>
            </div>
          </div>

          {/* Blockchain Audit Status */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                  On-Chain Settlement
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Polygon zkEVM</span>
            </div>

            <div className="space-y-2 text-[11px] font-mono text-ink-muted">
              <div className="flex justify-between items-center">
                <span>Contract:</span>
                <span className="text-ink-primary">0x8a92...3F0d</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <span className="text-success-400">Ledger Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ VERIFIABLE BLOCKCHAIN AUDIT TRAIL (Phase 11 Requirement 4) â”€â”€ */}
      <ComplaintBlockchainTrail complaintId={complaint.id} />

      {/* â”€â”€ MODALS â”€â”€ */}
      {/* 1. Assign Technician Modal */}
      {assignModalOpen && (
        <AssignTechnicianModal
          open={true}
          onClose={() => setAssignModalOpen(false)}
          complaint={complaint}
        />
      )}

      {/* 2. Change Priority Modal */}
      {priorityModalOpen && (
        <ConfirmationModal
          open={true}
          onClose={() => setPriorityModalOpen(false)}
          title={`Update Triage Priority: ${complaint.id}`}
          description={`Update operational resolution priority for this complaint.`}
          confirmLabel="Update Priority"
          cancelLabel="Cancel"
          onConfirm={handleConfirmPriorityChange}
        >
          <div className="my-2 space-y-2">
            <select
              value={targetPriority}
              onChange={(e) => setTargetPriority(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary py-2.5 px-3 text-sm text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              <option value="CRITICAL" className="bg-surface-primary text-danger-400">CRITICAL (Emergency Blackout - 24h SLA)</option>
              <option value="HIGH" className="bg-surface-primary text-warning-400">HIGH (Major Flickering - 48h SLA)</option>
              <option value="MEDIUM" className="bg-surface-primary text-violet-400">MEDIUM (Sensor Misalignment - 72h SLA)</option>
              <option value="LOW" className="bg-surface-primary text-emerald-400">LOW (Cosmetic - 7d SLA)</option>
            </select>
          </div>
        </ConfirmationModal>
      )}

      {/* 3. Verify Complaint Modal */}
      {verifyModalOpen && (
        <ConfirmationModal
          open={true}
          onClose={() => setVerifyModalOpen(false)}
          title={`Verify Physical Repair: ${complaint.id}`}
          description={`Confirm that the luminaire has been repaired, photometer reads nominal lux output, and advance the lifecycle to REPAIR VERIFIED.`}
          confirmLabel="Confirm & Verify"
          cancelLabel="Cancel"
          onConfirm={handleConfirmVerify}
        />
      )}

      {/* 4. Close Complaint Modal */}
      {closeModalOpen && (
        <ConfirmationModal
          open={true}
          onClose={() => setCloseModalOpen(false)}
          title={`Formally Close Ticket ${complaint.id}?`}
          description={`Close the incident and complete the 9-stage lifecycle pipeline. This releases assigned technician workload.`}
          confirmLabel="Yes, Close Complaint"
          cancelLabel="Cancel"
          danger={true}
          onConfirm={handleConfirmClose}
        />
      )}

      {/* 5. Image Preview Modal */}
      {activeEvidenceImage && (
        <Modal
          open={true}
          onClose={() => setActiveEvidenceImage(null)}
          title={activeEvidenceImage.title}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-line bg-black">
              <img
                src={activeEvidenceImage.url}
                alt={activeEvidenceImage.title}
                className="max-h-[65vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-line/60 pt-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-mono text-violet-400">
                  Captured: {activeEvidenceImage.timestamp}
                </span>
                <p className="text-ink-secondary">{activeEvidenceImage.caption}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveEvidenceImage(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
