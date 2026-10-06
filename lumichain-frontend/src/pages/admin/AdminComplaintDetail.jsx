import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { getComplaintById } from '@/services/api'
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
import { useComplaints } from '@/context'
import { cn } from '@/utils'

export default function AdminComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    getComplaint,
    updateComplaintPriority,
    closeComplaint,
    loading: ctxLoading,
  } = useComplaints()

  // Retrieve current in-memory complaint from shared context
  const complaint = getComplaint(id)

  // Admin Actions State
  const [modalAction, setModalAction] = useState(null) // 'priority' | 'close'
  const [newPriority, setNewPriority] = useState(complaint?.priority || 'CRITICAL')

  // Evidence preview modal
  const [activeEvidenceImage, setActiveEvidenceImage] = useState(null)

  // Handle Admin Action: Change Priority
  function handleConfirmPriorityChange() {
    if (!complaint) return
    updateComplaintPriority(complaint.id, newPriority)
    toast({
      title: 'Priority Updated',
      description: `Complaint ${complaint.id} triage level updated to ${newPriority}.`,
      variant: 'success',
    })
    setModalAction(null)
  }

  // Handle Admin Action: Mark as Closed
  function handleConfirmCloseComplaint() {
    if (!complaint) return
    closeComplaint(
      complaint.id,
      'Formally closed and sealed by Central Admin via console.',
    )
    toast({
      title: 'Complaint Marked as Closed',
      description: `Complaint ${complaint.id} has been formally closed and verified on-chain.`,
      variant: 'success',
    })
    setModalAction(null)
  }

  if (ctxLoading && !complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Retrieving complaint docket & oracle consensus for ${id}...`} />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Complaint Record Not Found"
          description={`No municipal incident logged for "${id}".`}
          onRetry={() => navigate('/admin/complaints')}
          retryLabel="Return to Complaints Register"
        />
      </div>
    )
  }

  // Calculate AI confidence meter attributes
  const confidenceVal = Number(complaint.aiConfidence) || 94.5
  const isHighConfidence = confidenceVal >= 85
  const isModerateConfidence = confidenceVal >= 70 && confidenceVal < 85

  const breadcrumbs = [
    { label: 'Admin', path: '/admin/dashboard' },
    { label: 'Complaints', path: '/admin/complaints' },
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

        {/* Back and Refresh */}
        <div className="flex items-center gap-2">
          <Link to="/admin/complaints">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
              <ArrowLeft size={14} />
              All Complaints
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="gap-1 text-xs">
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </div>

      {/* â”€â”€ ACTION BAR / ADMIN QUICK CONTROLS (Requirement 5) â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-surface-card via-surface-card/95 to-violet-950/20 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
                  Administrative Triage Console
                </span>
                <span className="text-[10px] rounded bg-surface-primary px-1.5 py-0.5 font-mono text-ink-muted border border-line">
                  {complaint.ticketNumber || 'TICKET-ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Logged at <span className="font-mono text-ink-primary">{complaint.createdAt}</span> Â· Last audited:{' '}
                <span className="font-mono text-ink-primary">{complaint.updatedAt || complaint.createdAt}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Change Priority Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalAction('priority')}
              className="gap-1.5 text-xs font-medium"
            >
              <SlidersHorizontal size={14} />
              Change Priority
            </Button>

            {/* Mark as Closed Button */}
            {complaint.status !== 'CLOSED' ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setModalAction('close')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Lock size={14} />
                Mark as Closed
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-success-500/30 bg-success-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-success-300">
                <CheckCircle2 size={14} />
                Ticket Formally Closed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ MAIN 2-COLUMN GRID â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* â”€â”€ LEFT COLUMN: Incident Details, AI Meter, Evidence & Timeline (8 cols) â”€â”€ */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Problem & Incident Statement Card */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-violet-400" />
                <h2 className="text-base font-bold text-ink-primary">Incident Statement & Citizen Report</h2>
              </div>
              {complaint.upvotes !== undefined && (
                <span className="rounded-full border border-line bg-surface-primary px-2.5 py-0.5 text-xs font-mono text-violet-400">
                  â–² {complaint.upvotes} Citizen Endorsements
                </span>
              )}
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
                  {complaint.citizenName || 'Verified Citizen'}
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

          {/* 2. AI Classification & AI Confidence Visual Meter (Requirement 2) â”€â”€ */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet-400" />
                <h2 className="text-base font-bold text-ink-primary">AI Telemetry & Oracle Verification</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-violet-400">
                <Sparkles size={13} className="animate-spin text-violet-400" />
                Edge AI Sentinel v2.4
              </div>
            </div>

            {/* Classification banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3.5">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-400">
                  Detected Failure Classification:
                </span>
                <p className="text-sm font-semibold text-ink-primary mt-0.5">
                  {complaint.aiClassification || 'Optical Photometer Blackout & Voltage Drop Anomaly'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-violet-400/20 px-2.5 py-1 text-xs font-mono font-bold text-violet-300 border border-violet-500/30">
                <ShieldCheck size={13} />
                MESH VERIFIED
              </span>
            </div>

            {/* AI Confidence Visual Meter */}
            <div className="rounded-xl border border-line/80 bg-surface-primary/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                    AI Diagnostic Confidence Score
                  </h4>
                  <p className="text-xs text-ink-muted">
                    Consensus agreement calculated against neighbor nodes and historical telemetry.
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
                    {isHighConfidence
                      ? 'Ultra-High Precision'
                      : isModerateConfidence
                        ? 'Moderate Confidence'
                        : 'Review Required'}
                  </div>
                </div>
              </div>

              {/* Visual meter progress bar */}
              <div className="space-y-1.5">
                <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-surface-card border border-line">
                  {/* Subtle grid ticks */}
                  <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
                    <span className="h-full w-px bg-line-strong" />
                    <span className="h-full w-px bg-line-strong" />
                    <span className="h-full w-px bg-line-strong" />
                    <span className="h-full w-px bg-line-strong" />
                  </div>

                  {/* Glowing Meter Fill */}
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      isHighConfidence
                        ? 'bg-gradient-to-r from-violet-600 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                        : isModerateConfidence
                          ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
                    )}
                    style={{ width: `${Math.min(Math.max(confidenceVal, 5), 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted px-0.5">
                  <span>0% (Heuristic Guess)</span>
                  <span>50% (Ambiguous)</span>
                  <span>75% (Threshold)</span>
                  <span className="text-violet-400 font-bold">100% (Cryptographic Proof)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Evidence Images (Mock) (Requirement 2) â”€â”€ */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-violet-400" />
                <h2 className="text-base font-bold text-ink-primary">Telemetry & Visual Evidence</h2>
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
                    className="group relative overflow-hidden rounded-xl border border-line bg-surface-primary/60 transition-all hover:border-violet-500/40 hover:shadow-md cursor-pointer"
                    onClick={() => setActiveEvidenceImage(img)}
                  >
                    {/* Image frame */}
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

                    {/* Caption */}
                    <div className="p-3">
                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                        {img.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Full Complaint Timeline (Requirement 2 & 3) â”€â”€ */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm">
            <ComplaintTimeline timeline={complaint.timeline} />
          </div>
        </div>

        {/* â”€â”€ RIGHT COLUMN: Streetlight Link, Assigned Tech, Municipality, Blockchain (4 cols) â”€â”€ */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Associated Streetlight Pole Card (Requirement 2) */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">Associated Luminaire</h3>
              </div>
              <span className="text-[11px] font-mono text-violet-400">Node Asset</span>
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
                <span className="text-xs font-mono text-ink-muted uppercase">Ward / Zone:</span>
                <span className="text-xs text-ink-secondary">
                  {complaint.ward}
                </span>
              </div>
            </div>

            {/* Streetlight Direct Link Button */}
            <Link
              to={`/admin/streetlights/${complaint.streetlightId}`}
              className="block"
            >
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center gap-1.5 text-xs font-semibold"
              >
                <Lightbulb size={14} />
                <span>View Streetlight Telemetry</span>
                <ExternalLink size={12} className="ml-1 opacity-70" />
              </Button>
            </Link>
          </div>

          {/* 2. Assigned Technician Card (Requirement 2) */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">Assigned Technician</h3>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Field Dispatch</span>
            </div>

            {complaint.assignedTo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-surface-primary/70 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 font-bold font-mono border border-violet-500/30">
                    {complaint.assignedTo.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink-primary">{complaint.assignedTo}</h4>
                    <p className="text-xs text-ink-muted font-mono">Senior Luminaire Technician</p>
                  </div>
                </div>

                <div className="rounded-xl border border-line/60 bg-surface-primary/40 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Contact Hotline:</span>
                    <span className="font-mono text-ink-primary">+91 98721 00984</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Dispatch Status:</span>
                    <span className="font-mono text-success-400">On-Site / Dispatched</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface-primary/30 p-4 text-center space-y-2">
                <p className="text-xs text-ink-muted">
                  No technician assigned yet. Awaiting municipal dispatch queue.
                </p>
                <span className="inline-block rounded-full bg-warning-500/15 border border-warning-500/30 px-2.5 py-0.5 text-[10px] font-mono text-warning-400">
                  Unassigned Incident
                </span>
              </div>
            )}
          </div>

          {/* 3. Municipality Card (Requirement 2) */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">Municipality & Ward</h3>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Jurisdiction</span>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-xl border border-line/70 bg-surface-primary/60 p-3">
                <span className="text-[10px] font-mono uppercase text-ink-muted block">
                  Municipal Authority:
                </span>
                <h4 className="text-xs font-bold text-ink-primary mt-0.5">
                  {complaint.municipality}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-line/70 bg-surface-primary/40 p-2.5">
                  <span className="text-[10px] font-mono text-ink-muted uppercase block">Zone:</span>
                  <span className="font-semibold text-ink-primary">{complaint.zone}</span>
                </div>
                <div className="rounded-xl border border-line/70 bg-surface-primary/40 p-2.5">
                  <span className="text-[10px] font-mono text-ink-muted uppercase block">Ward:</span>
                  <span className="font-semibold text-ink-primary">{complaint.ward}</span>
                </div>
              </div>

              <div className="rounded-xl border border-line/60 bg-surface-primary/40 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Resolution SLA Target:</span>
                  <span className="font-mono text-ink-primary">24 Hours (Critical)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Target Completion:</span>
                  <span className="font-mono text-violet-400">2026-10-07 08:30</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Cryptographic Proof & Ledger Status */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                  Blockchain Proof
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Polygon zkEVM</span>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between items-center text-ink-muted">
                <span>Contract:</span>
                <span className="text-ink-primary">0x8a92...3F0d</span>
              </div>
              <div className="flex justify-between items-center text-ink-muted">
                <span>Audit TxHash:</span>
                <span className="text-violet-400 truncate max-w-[140px]">
                  0x7f3c8a912e04d...
                </span>
              </div>
              <div className="flex justify-between items-center text-ink-muted">
                <span>Oracle Consensus:</span>
                <span className="text-success-400">12 / 12 Nodes Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ VERIFIABLE BLOCKCHAIN AUDIT TRAIL (Phase 11 Requirement 4) â”€â”€ */}
      <ComplaintBlockchainTrail complaintId={complaint.id} />

      {/* â”€â”€ MODALS (Requirement 5 & Evidence Inspection) â”€â”€ */}

      {/* 1. Change Priority Modal */}
      {modalAction === 'priority' && (
        <ConfirmationModal
          open={true}
          onClose={() => setModalAction(null)}
          title={`Update Triage Priority: ${complaint.id}`}
          description={`Set the operational resolution priority for this streetlight grievance.`}
          confirmLabel="Save Priority"
          cancelLabel="Cancel"
          onConfirm={handleConfirmPriorityChange}
        >
          <div className="space-y-4 my-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Select New Priority:
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-primary py-2.5 px-3 text-sm text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="CRITICAL" className="bg-surface-primary text-danger-400">
                  CRITICAL (Emergency Blackout - 24h SLA)
                </option>
                <option value="HIGH" className="bg-surface-primary text-warning-400">
                  HIGH (Major Obstruction / Flickering - 48h SLA)
                </option>
                <option value="MEDIUM" className="bg-surface-primary text-violet-400">
                  MEDIUM (Optical Misalignment - 72h SLA)
                </option>
                <option value="LOW" className="bg-surface-primary text-emerald-400">
                  LOW (Minor Cosmetic / Inquiry - 7d SLA)
                </option>
              </select>
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* 2. Mark as Closed Modal */}
      {modalAction === 'close' && (
        <ConfirmationModal
          open={true}
          onClose={() => setModalAction(null)}
          title={`Mark Complaint ${complaint.id} as Closed?`}
          description={`Are you sure you want to mark this incident as formally CLOSED? This will advance the 9-stage lifecycle pipeline to COMPLAINT CLOSED and record resolution signatures on the local audit trail.`}
          confirmLabel="Confirm & Close Complaint"
          cancelLabel="Cancel"
          danger={true}
          onConfirm={handleConfirmCloseComplaint}
        />
      )}

      {/* 3. Image Evidence Inspection Modal */}
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
                  Timestamp: {activeEvidenceImage.timestamp}
                </span>
                <p className="text-ink-secondary">{activeEvidenceImage.caption}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveEvidenceImage(null)}
                className="shrink-0"
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
