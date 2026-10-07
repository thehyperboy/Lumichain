import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Cpu,
  User,
  Wrench,
  CheckCheck,
  ShieldCheck,
  Eye,
  Camera,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
} from 'lucide-react'
import {
  Breadcrumb,
  StatusBadge,
  PriorityBadge,
  Button,
  LoadingState,
  ErrorState,
  ConfirmationModal,
  Modal,
  MapPlaceholder,
  useToast,
  ComplaintBlockchainTrail,
} from '@/components'
import { ComplaintTimeline } from '@/components/complaints'
import { useComplaints, useAuth } from '@/context'
import { cn } from '@/utils'

export default function UserComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    getComplaint,
    complaints,
    loading: ctxLoading,
    closeComplaint,
    reopenComplaint,
  } = useComplaints()

  // Retrieve current in-memory complaint from shared context
  const complaint = getComplaint(id) || complaints.find((c) => c.id === id)

  // Action Modals State
  const [activeModal, setActiveModal] = useState(null) // 'confirm_resolution' | 'not_fixed' | 'image_preview'
  const [selectedImage, setSelectedImage] = useState(null)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Eligible for citizen verification
  const isAwaitingCitizen =
    complaint?.status === 'REPAIR_COMPLETED' || complaint?.status === 'VERIFIED'
  const isClosed = complaint?.status === 'CLOSED'

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Citizen Portal', href: '/user/dashboard' },
    { label: 'My Complaints', href: '/user/complaints' },
    { label: complaint?.id || id },
  ]

  // Handlers for Citizen Actions
  function handleConfirmResolution() {
    if (!complaint) return
    setIsSubmitting(true)

    const note =
      feedbackNote.trim() ||
      'Citizen inspected site and confirmed streetlight is fully operational and safely restored.'

    closeComplaint(complaint.id, note)

    toast({
      title: 'Resolution Confirmed!',
      description: `Thank you for confirming resolution for ticket ${complaint.id}. The grievance has been closed on-chain.`,
      variant: 'success',
    })

    setIsSubmitting(false)
    setActiveModal(null)
    setFeedbackNote('')
  }

  function handleMarkNotFixed() {
    if (!complaint) return
    setIsSubmitting(true)

    const note =
      feedbackNote.trim() ||
      'Citizen flagged that the streetlight is still dark/malfunctioning. Re-escalated to field team.'

    reopenComplaint(complaint.id, note)

    toast({
      title: 'Ticket Re-escalated to Field Team',
      description: `Ticket ${complaint.id} has been moved back to In-Progress with CRITICAL priority for urgent inspection.`,
      variant: 'warning',
    })

    setIsSubmitting(false)
    setActiveModal(null)
    setFeedbackNote('')
  }

  if (ctxLoading && !complaint) {
    return (
      <div className="py-20">
        <LoadingState message="Loading incident ticket records..." />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="card-glass border-line/60 p-12 text-center">
          <ErrorState
            title="Incident Ticket Not Found"
            message={`No record exists matching ID "${id}". It may have been archived or removed.`}
            action={
              <Button
                variant="outline"
                onClick={() => navigate('/user/complaints')}
                className="mt-4"
              >
                Return to My Complaints
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb items={breadcrumbItems} />
        <Link
          to="/user/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Reports</span>
        </Link>
      </div>

      {/* Main Ticket Header Banner */}
      <div className="card-glass relative overflow-hidden border-line/80 p-6 shadow-xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xl font-bold text-violet-400">
                {complaint.id}
              </span>
              <span className="font-mono text-xs text-ink-muted">
                ({complaint.ticketNumber || 'TK-NODE'})
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-ink-primary sm:text-2xl">
              {complaint.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-ink-secondary">{complaint.location}</span>
              </span>
              <span>Â·</span>
              <span className="font-mono text-ink-secondary">
                Pole ID: {complaint.poleId || 'N/A'}
              </span>
              <span>Â·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Reported {complaint.createdAt}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons for Citizen in Top Banner */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAwaitingCitizen && (
              <>
                <Button
                  variant="primary"
                  onClick={() => setActiveModal('confirm_resolution')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-ink-primary font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Resolution</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveModal('not_fixed')}
                  className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Not Fixed</span>
                </Button>
              </>
            )}

            {isClosed && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400">
                <CheckCheck className="h-4 w-4" />
                <span>Resolved & Closed On-Chain</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PHASE 10 REQUIREMENT 4: CITIZEN ACTION CALLOUT BANNER */}
      {isAwaitingCitizen && (
        <div className="card-glass border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-surface-card to-emerald-950/20 p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-500/20 text-amber-400 shadow-md">
                <CheckCheck className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink-primary flex items-center gap-2">
                  Field Repair Completed â€” Please Inspect & Confirm
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    Awaiting Citizen Feedback
                  </span>
                </h3>
                <p className="text-xs text-ink-muted max-w-2xl leading-relaxed">
                  The municipal technician has reported this luminaire restored to normal illumination.
                  As the local resident, your feedback completes the proof-of-resolution ledger.
                  Is the light shining properly at night?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="primary"
                onClick={() => setActiveModal('confirm_resolution')}
                className="bg-emerald-500 hover:bg-emerald-400 text-ink-primary font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Resolution</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveModal('not_fixed')}
                className="border-rose-500/50 text-rose-400 hover:bg-rose-500/15 font-semibold flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Not Fixed</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Grid: Left 2 cols (Details + Timeline), Right 1 col (Telemetry + Map) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Issue Description & Citizen Notes */}
          <div className="card-glass border-line/60 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2 border-b border-line/60 pb-3">
              <Info className="h-4 w-4 text-violet-400" />
              Incident Narrative & Citizen Report
            </h3>

            <div>
              <span className="text-xs font-medium text-ink-muted">Citizen Description:</span>
              <p className="mt-1 text-sm text-ink-secondary leading-relaxed bg-surface-subtle/60 rounded-xl p-4 border border-line/40">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-line/50 bg-surface-card p-3">
                <span className="text-ink-muted block text-[11px]">Reported By</span>
                <span className="font-semibold text-ink-primary mt-0.5 block">
                  {complaint.citizenName || 'Local Citizen'}
                </span>
                <span className="text-[10px] text-ink-muted font-mono">
                  {complaint.citizenContact || 'Contact on file'}
                </span>
              </div>

              <div className="rounded-xl border border-line/50 bg-surface-card p-3">
                <span className="text-ink-muted block text-[11px]">Municipal Jurisdiction</span>
                <span className="font-semibold text-ink-primary mt-0.5 block truncate">
                  {complaint.ward || 'Ward 15'}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {complaint.zone || 'Central Zone'}
                </span>
              </div>

              <div className="rounded-xl border border-line/50 bg-surface-card p-3">
                <span className="text-ink-muted block text-[11px]">Last Updated</span>
                <span className="font-semibold text-ink-primary mt-0.5 block">
                  {complaint.updatedAt || complaint.createdAt}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> State Synced
                </span>
              </div>
            </div>
          </div>

          {/* Reusable 9-Stage Lifecycle Timeline */}
          <div className="card-glass border-line/60 p-6">
            <ComplaintTimeline timeline={complaint.timeline || []} />
          </div>

          {/* Photographic Evidence Gallery */}
          {complaint.evidenceImages && complaint.evidenceImages.length > 0 && (
            <div className="card-glass border-line/60 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                  <Camera className="h-4 w-4 text-violet-400" />
                  Photographic Evidence & Telemetry Images ({complaint.evidenceImages.length})
                </h3>
                <span className="text-xs text-ink-muted">Click thumbnail to inspect</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.evidenceImages.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    onClick={() => {
                      setSelectedImage(ev)
                      setActiveModal('image_preview')
                    }}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-line/60 bg-surface-subtle transition-all hover:border-violet-500/40 hover:shadow-lg"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-surface-card">
                      <img
                        src={ev.url}
                        alt={ev.title || `Evidence ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink-primary truncate">
                          {ev.title || `Evidence Capture #${idx + 1}`}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-muted line-clamp-2">
                        {ev.caption || ev.notes || 'Recorded on site.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): AI classification, Technician, and Map */}
        <div className="space-y-6">
          {/* AI Sentinel Classification */}
          <div className="card-glass border-line/60 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2 border-b border-line/60 pb-2.5">
              <Cpu className="h-4 w-4 text-violet-400" />
              AI Sentinel Telemetry Analysis
            </h3>

            <div className="rounded-xl border border-line/50 bg-surface-subtle/80 p-4 space-y-3">
              <div>
                <span className="text-[11px] text-ink-muted block">AI Diagnostic Label</span>
                <span className="text-xs font-semibold text-violet-400 mt-0.5 block">
                  {complaint.aiClassification || 'Optical Lux Cutout & Ballast Anomaly'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-muted">Diagnostic Confidence</span>
                  <span className="font-mono font-bold text-ink-primary">
                    {complaint.aiConfidence || 96.8}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-card">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                    style={{ width: `${complaint.aiConfidence || 96.8}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-ink-muted leading-relaxed">
                Byzantine mesh consensus cross-referenced adjoining photocell sensors to confirm non-operational state.
              </p>
            </div>
          </div>

          {/* Assigned Technician & Repair Status */}
          <div className="card-glass border-line/60 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2 border-b border-line/60 pb-2.5">
              <Wrench className="h-4 w-4 text-amber-400" />
              Field Dispatch Status
            </h3>

            {complaint.assignedTo ? (
              <div className="rounded-xl border border-line/50 bg-surface-subtle/80 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink-primary block">
                      {complaint.assignedTo}
                    </span>
                    <span className="text-[11px] text-ink-muted block">
                      Ward Field Specialist
                    </span>
                  </div>
                </div>

                {complaint.repairNotes && (
                  <div className="rounded-lg bg-surface-card p-2.5 border border-line/40">
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">
                      Technician Field Notes:
                    </span>
                    <p className="text-xs text-ink-secondary mt-1">
                      {complaint.repairNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-line/50 bg-surface-subtle/80 p-4 text-center">
                <Clock className="h-8 w-8 text-amber-400 mx-auto opacity-70 mb-2" />
                <span className="text-xs font-semibold text-ink-primary block">
                  Pending Field Assignment
                </span>
                <p className="text-[11px] text-ink-muted mt-1">
                  Municipal dispatch engineers have queued this report for morning shift routing.
                </p>
              </div>
            )}
          </div>

          {/* Streetlight Node Location & MapPlaceholder */}
          <div className="card-glass border-line/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                Physical Luminaire Site
              </h3>
              <span className="font-mono text-xs text-violet-400">
                {complaint.poleId || 'PL-ND-103'}
              </span>
            </div>

            <MapPlaceholder
              poleId={complaint.poleId || 'PL-ND-103'}
              location={complaint.location}
              status={complaint.status === 'CLOSED' ? 'WORKING' : 'FAILED'}
              className="h-48 rounded-xl"
            />

            <div className="text-[11px] text-ink-muted space-y-1">
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="font-mono text-ink-secondary">28.6139Â° N, 77.2090Â° E</span>
              </div>
              <div className="flex justify-between">
                <span>Power Grid:</span>
                <span className="text-ink-secondary">Substation feeder line 4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ IMMUTABLE BLOCKCHAIN AUDIT TRAIL (Phase 11 Requirement 4) â”€â”€ */}
      <ComplaintBlockchainTrail complaintId={complaint.id} />

      {/* CONFIRMATION MODAL: Confirm Resolution */}
      <ConfirmationModal
        isOpen={activeModal === 'confirm_resolution'}
        onClose={() => {
          setActiveModal(null)
          setFeedbackNote('')
        }}
        onConfirm={handleConfirmResolution}
        title="Confirm Streetlight Repair Resolution"
        confirmText="Confirm & Close Ticket"
        cancelText="Cancel"
        variant="success"
        isLoading={isSubmitting}
      >
        <div className="space-y-4 py-1">
          <p className="text-sm text-ink-secondary leading-relaxed">
            Are you satisfied that luminaire <strong className="text-ink-primary">{complaint.poleId}</strong> at{' '}
            <strong className="text-ink-primary">{complaint.location}</strong> has been fully repaired and is illuminating normally?
          </p>

          <p className="text-xs text-ink-muted">
            Confirming resolution will permanently record citizen approval on the blockchain audit ledger and advance the ticket to <strong className="text-emerald-400">CLOSED</strong>.
          </p>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-ink-primary block">
              Optional feedback or notes for the municipality:
            </label>
            <textarea
              rows={2}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Verified yesterday evening at 8 PM. Light is bright and junction box is sealed."
              className="w-full rounded-xl border border-line/60 bg-surface-subtle p-2.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </ConfirmationModal>

      {/* CONFIRMATION MODAL: Not Fixed / Reopen */}
      <ConfirmationModal
        isOpen={activeModal === 'not_fixed'}
        onClose={() => {
          setActiveModal(null)
          setFeedbackNote('')
        }}
        onConfirm={handleMarkNotFixed}
        title="Report Issue as NOT FIXED"
        confirmText="Re-escalate to Field Team"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      >
        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <p>
              Flagging this report will immediately reopen ticket <strong className="text-rose-200">{complaint.id}</strong> with <strong className="text-rose-200">CRITICAL</strong> priority and alert the ward supervisor.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-primary block">
              Please specify why the repair was incomplete: <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Light was flickering and shut down again at 9 PM; fixture bracket is still misaligned."
              className="w-full rounded-xl border border-line/60 bg-surface-subtle p-2.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>
      </ConfirmationModal>

      {/* MODAL: Photographic Evidence Fullscreen Preview */}
      <Modal
        isOpen={activeModal === 'image_preview' && !!selectedImage}
        onClose={() => {
          setActiveModal(null)
          setSelectedImage(null)
        }}
        title={selectedImage?.title || 'Evidence Inspection'}
        size="lg"
      >
        {selectedImage && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl bg-surface-subtle border border-line/60">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[60vh] w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-ink-muted border-t border-line/50 pt-2">
              <span>{selectedImage.caption || selectedImage.notes}</span>
              <span className="font-mono">{selectedImage.timestamp}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
