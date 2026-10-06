import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  Play,
  FileText,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCheck,
  Sparkles,
  ExternalLink,
  Lightbulb,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Breadcrumb,
  Button,
  PriorityBadge,
  StatusBadge,
  ConfirmationModal,
  Modal,
  FileUpload,
  LoadingState,
  ErrorState,
  useToast,
  ComplaintTimeline,
} from '@/components'
import { cn } from '@/utils'

export default function TechnicianRepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    getComplaint,
    startRepair,
    addRepairNotes,
    uploadEvidence,
    completeRepair,
    loading: ctxLoading,
  } = useComplaints()
  const { toast } = useToast()

  const currentTechName = user?.name || 'Rohan Mehta'
  const complaint = getComplaint(id)

  // Modals state
  const [startModalOpen, setStartModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)

  // Form states
  const [repairNotesInput, setRepairNotesInput] = useState(complaint?.repairNotes || '')
  const [evidenceType, setEvidenceType] = useState('AFTER') // 'BEFORE' | 'AFTER'
  const [evidenceCaption, setEvidenceCaption] = useState('')
  const [previewFiles, setPreviewFiles] = useState([])

  if (ctxLoading && !complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Retrieving repair docket ${id}...`} />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Work Order Not Found"
          description={`No active repair assignment located for ticket "${id}".`}
          onRetry={() => navigate('/technician/repairs')}
          retryLabel="Return to Assigned Tasks"
        />
      </div>
    )
  }

  const {
    poleId,
    streetlightId,
    location,
    title,
    description,
    priority,
    status,
    createdAt,
    assignedTo,
    aiClassification,
    aiConfidence,
    repairStartedAt,
    repairCompletedAt,
    repairNotes,
    evidenceImages = [],
  } = complaint

  const isAssigned = status === 'ASSIGNED'
  const isInProgress = status === 'IN_PROGRESS'
  const isCompleted = status === 'REPAIR_COMPLETED'
  const isVerified = status === 'VERIFIED'
  const isClosed = status === 'CLOSED'

  // Action 1: Start Field Repair
  function handleConfirmStartRepair() {
    startRepair(
      complaint.id,
      `Field Specialist ${currentTechName} checked in on-site at ${location}. Replacement work started.`,
    )
    toast({
      title: 'Field Repair Started',
      description: `Ticket ${complaint.id} status changed to IN PROGRESS. Mobile timer active.`,
      variant: 'success',
    })
    setStartModalOpen(false)
  }

  // Action 2: Save Repair Notes
  function handleSaveRepairNotes() {
    if (!repairNotesInput.trim()) return
    addRepairNotes(complaint.id, repairNotesInput)
    toast({
      title: 'Repair Notes Saved',
      description: 'Diagnostic actions recorded in the session audit trail.',
      variant: 'success',
    })
    setNotesModalOpen(false)
  }

  // Action 3: Upload Before/After Evidence
  function handleSaveEvidence() {
    const mockSampleUrls = {
      BEFORE: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      AFTER: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    }

    const uploaded = uploadEvidence(complaint.id, {
      title: `${evidenceType === 'BEFORE' ? 'Pre-Repair Fault' : 'Post-Repair Restored'} Photographic Evidence`,
      type: evidenceType,
      caption: evidenceCaption || `${evidenceType} repair capture by technician ${currentTechName}`,
      url: mockSampleUrls[evidenceType],
    })

    toast({
      title: 'Evidence Uploaded',
      description: `${evidenceType} evidence capture added to complaint ${complaint.id}.`,
      variant: 'success',
    })

    setEvidenceCaption('')
    setPreviewFiles([])
    setEvidenceModalOpen(false)
  }

  // Action 4: Mark Repair Completed
  function handleConfirmCompleteRepair() {
    completeRepair(
      complaint.id,
      repairNotesInput || 'Replaced luminaire electronics and validated circuit breaker.',
    )
    toast({
      title: 'Repair Marked Completed',
      description: `Work on ${complaint.id} successfully finished. Ready for IoT sensor verification.`,
      variant: 'success',
    })
    setCompleteModalOpen(false)
  }

  const breadcrumbs = [
    { label: 'Field Console', path: '/technician/dashboard' },
    { label: 'Assigned Repairs', path: '/technician/repairs' },
    { label: complaint.id },
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ BREADCRUMB & HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <div className="space-y-1">
          <Breadcrumb items={breadcrumbs} />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary font-mono">
              {complaint.id}
            </h1>
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>
        </div>

        <Link to="/technician/repairs">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
            <ArrowLeft size={14} />
            Assigned Tasks
          </Button>
        </Link>
      </div>

      {/* â”€â”€ STATUS-AWARE WORKFLOW CONTROLS (Requirement 3) â”€â”€ */}
      <div className="rounded-2xl border border-line bg-gradient-to-r from-surface-card via-surface-card/95 to-violet-950/20 p-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                isAssigned && 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                isInProgress && 'border-violet-500/30 bg-violet-500/10 text-violet-400 animate-pulse',
                isCompleted && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                (isVerified || isClosed) && 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
              )}
            >
              {isAssigned && <Clock size={22} />}
              {isInProgress && <Wrench size={22} />}
              {(isCompleted || isVerified || isClosed) && <CheckCircle2 size={22} />}
            </div>

            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
                Current Workflow Stage
              </div>
              <h3 className="text-base font-bold text-ink-primary">
                {isAssigned && '1. Work Order Assigned â€” Ready to Start'}
                {isInProgress && '2. Field Repair In Progress'}
                {isCompleted && '3. Repair Completed â€” Pending Optical Verification'}
                {isVerified && '4. Oracle Verified â€” Illumination Active'}
                {isClosed && '5. Formally Closed on Blockchain'}
              </h3>
            </div>
          </div>

          {/* Action buttons appearing strictly in order depending on status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. When ASSIGNED: Accept & Start Repair */}
            {isAssigned && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStartModalOpen(true)}
                className="gap-1.5 text-xs font-semibold shadow-md"
              >
                <Play size={13} fill="currentColor" />
                <span>Start Field Repair</span>
              </Button>
            )}

            {/* 2. When IN_PROGRESS: Add Notes, Upload Evidence, Mark Completed */}
            {isInProgress && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setNotesModalOpen(true)}
                  className="gap-1.5 text-xs font-medium"
                >
                  <FileText size={13} />
                  <span>Add Repair Notes</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEvidenceModalOpen(true)}
                  className="gap-1.5 text-xs font-medium"
                >
                  <Camera size={13} />
                  <span>Upload Before/After</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCompleteModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                >
                  <CheckCheck size={14} />
                  <span>Mark Repair Completed</span>
                </Button>
              </>
            )}

            {/* 3. When REPAIR_COMPLETED: Proceed to Verification Check */}
            {isCompleted && (
              <Link to={`/technician/repairs/${complaint.id}/verify`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold shadow-[0_0_14px_rgba(139,92,246,0.4)]"
                >
                  <ShieldCheck size={14} />
                  <span>Run Post-Repair Check â†’</span>
                </Button>
              </Link>
            )}

            {/* 4. When VERIFIED or CLOSED: State badge */}
            {(isVerified || isClosed) && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-mono font-bold text-emerald-300">
                <ShieldCheck size={14} />
                <span>Verified Active On-Chain</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ 2-COLUMN GRID â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Problem, AI, Evidence, Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Incident Overview */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">Fault Description & Location</h3>
              </div>
              <span className="text-xs font-mono text-ink-muted">
                Reported {createdAt}
              </span>
            </div>

            <div>
              <h4 className="text-lg font-bold text-ink-primary">{title}</h4>
              <p className="mt-2 text-sm text-ink-secondary bg-surface-primary/50 rounded-xl p-3.5 border border-line/60 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-xl border border-line/70 bg-surface-primary/60 p-3 space-y-1">
                <span className="font-mono text-[10px] uppercase text-ink-muted flex items-center gap-1">
                  <MapPin size={11} className="text-violet-400" /> Physical Coordinates
                </span>
                <div className="font-semibold text-ink-primary truncate">{location}</div>
                <div className="text-ink-muted">{complaint.ward} Â· {complaint.zone}</div>
              </div>

              <div className="rounded-xl border border-line/70 bg-surface-primary/60 p-3 space-y-1">
                <span className="font-mono text-[10px] uppercase text-ink-muted flex items-center gap-1">
                  <Lightbulb size={11} className="text-violet-400" /> Luminaire Asset
                </span>
                <div className="font-semibold text-ink-primary">{poleId} ({streetlightId})</div>
                <div className="text-violet-400 font-mono text-[11px]">LED Mast Head 150W</div>
              </div>
            </div>

            {/* Existing Repair Notes if added */}
            {repairNotes && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3.5 space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase text-violet-400">
                  Technician Field Notes:
                </span>
                <p className="text-xs text-ink-primary leading-relaxed font-mono">
                  {repairNotes}
                </p>
              </div>
            )}
          </div>

          {/* 2. Before / After Evidence Gallery (Requirement 3) */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">
                  Before & After Evidence Captures ({evidenceImages.length})
                </h3>
              </div>
              {isInProgress && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEvidenceModalOpen(true)}
                  className="gap-1 text-xs py-1"
                >
                  <Upload size={12} />
                  Add Photo
                </Button>
              )}
            </div>

            {evidenceImages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-primary/40 p-8 text-center text-xs text-ink-muted space-y-2">
                <Camera size={24} className="mx-auto text-ink-muted" />
                <p>No photos uploaded yet. Capture before/after evidence while repair is in progress.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evidenceImages.map((img) => (
                  <div
                    key={img.id}
                    className="overflow-hidden rounded-xl border border-line bg-surface-primary/70 shadow-sm"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                      <img
                        src={img.url}
                        alt={img.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2 left-2 rounded bg-black/70 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] text-violet-300 border border-white/10">
                        {img.type ? `${img.type} REPAIR` : 'INSPECTION'}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold truncate">
                        {img.title}
                      </div>
                    </div>
                    <div className="p-3 text-xs text-ink-secondary">
                      <p className="line-clamp-2">{img.caption}</p>
                      <span className="mt-1 block font-mono text-[10px] text-ink-muted">
                        Captured: {img.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Reusable Complaint Timeline */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 shadow-sm">
            <ComplaintTimeline timeline={complaint.timeline} />
          </div>
        </div>

        {/* Right Column (4 cols): Quick actions, AI Diagnosis, Sensor Target */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Failure Diagnosis */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-ink-primary">AI Failure Classification</h3>
              </div>
              <Sparkles size={13} className="text-violet-400" />
            </div>

            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-violet-400">
                Predicted Defect:
              </span>
              <p className="text-xs font-semibold text-ink-primary">
                {aiClassification || 'Photocell Cutout & Voltage Drop Anomaly'}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface-primary/70 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Model Confidence:</span>
                <span className="font-mono text-violet-400 font-bold">
                  {aiConfidence || 97.4}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Recommended Action:</span>
                <span className="text-ink-primary">Replace LED Driver / Ballast</span>
              </div>
            </div>
          </div>

          {/* Post-Repair Acceptance Target */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-ink-primary">Target Verification Metrics</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Thresholds</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-surface-primary/50">
                <span className="text-ink-muted">Light Output:</span>
                <span className="text-emerald-400 font-bold">&gt; 75 Lux (Nominal)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-surface-primary/50">
                <span className="text-ink-muted">Operating Current:</span>
                <span className="text-ink-primary">0.60A â€“ 0.75A</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-surface-primary/50">
                <span className="text-ink-muted">Line Voltage:</span>
                <span className="text-ink-primary">220V â€“ 240V AC</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-surface-primary/50">
                <span className="text-ink-muted">Neighbor Consensus:</span>
                <span className="text-violet-400">2 / 2 Nodes Required</span>
              </div>
            </div>
          </div>

          {/* Action Link for Next Phase */}
          {isCompleted && (
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-surface-card to-violet-950/30 p-5 space-y-3 shadow-md">
              <h4 className="text-sm font-bold text-violet-300">
                Ready for Optical Telemetry Check
              </h4>
              <p className="text-xs text-ink-muted">
                Your physical repair is logged. Run the automated oracle check to verify lux output with neighbor poles.
              </p>
              <Link to={`/technician/repairs/${complaint.id}/verify`} className="block">
                <Button variant="primary" size="sm" className="w-full justify-center gap-1.5 text-xs font-semibold">
                  <ShieldCheck size={14} />
                  <span>Verify Repair Now â†’</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ MODAL 1: START REPAIR â”€â”€ */}
      {startModalOpen && (
        <ConfirmationModal
          open={true}
          onClose={() => setStartModalOpen(false)}
          title={`Start Repair on ${complaint.id}?`}
          description={`Confirm arrival at ${location} (${poleId}). This will advance the incident timeline to REPAIR STARTED.`}
          confirmLabel="Start Field Repair"
          cancelLabel="Cancel"
          onConfirm={handleConfirmStartRepair}
        />
      )}

      {/* â”€â”€ MODAL 2: ADD REPAIR NOTES â”€â”€ */}
      {notesModalOpen && (
        <Modal
          open={true}
          onClose={() => setNotesModalOpen(false)}
          title="Document Field Repair Notes"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">
              Record the diagnostic findings, component serial numbers replaced, and safety procedures performed on pole {poleId}:
            </p>

            <textarea
              rows={4}
              value={repairNotesInput}
              onChange={(e) => setRepairNotesInput(e.target.value)}
              placeholder="e.g., Replaced damaged 150W ballast with unit SN-BLST-491. Verified ground fault protection and re-clamped luminaire bracket."
              className="w-full rounded-xl border border-line bg-surface-primary p-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-line/60">
              <Button variant="secondary" size="sm" onClick={() => setNotesModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveRepairNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* â”€â”€ MODAL 3: UPLOAD EVIDENCE (FileUpload with preview) (Requirement 3) â”€â”€ */}
      {evidenceModalOpen && (
        <Modal
          open={true}
          onClose={() => setEvidenceModalOpen(false)}
          title="Upload Photographic Telemetry Evidence"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Evidence Stage:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEvidenceType('BEFORE')}
                  className={cn(
                    'rounded-xl border p-2.5 text-xs font-semibold transition-colors',
                    evidenceType === 'BEFORE'
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                      : 'border-line bg-surface-primary text-ink-muted hover:text-ink-primary',
                  )}
                >
                  BEFORE Repair (Fault View)
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceType('AFTER')}
                  className={cn(
                    'rounded-xl border p-2.5 text-xs font-semibold transition-colors',
                    evidenceType === 'AFTER'
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                      : 'border-line bg-surface-primary text-ink-muted hover:text-ink-primary',
                  )}
                >
                  AFTER Repair (Restored View)
                </button>
              </div>
            </div>

            {/* Accessible FileUpload Dropzone */}
            <FileUpload
              label="Select or drop photo capture"
              hint="PNG or JPG photo capture up to 10MB"
              accept="image/*"
              onChange={(files) => setPreviewFiles(files)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Evidence Caption / Technical Observation:
              </label>
              <input
                type="text"
                value={evidenceCaption}
                onChange={(e) => setEvidenceCaption(e.target.value)}
                placeholder="e.g., Replacement LED driver powered on, 88 Lux measured."
                className="w-full rounded-xl border border-line bg-surface-primary py-2 px-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line/60">
              <Button variant="secondary" size="sm" onClick={() => setEvidenceModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEvidence}>
                Upload & Attach
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* â”€â”€ MODAL 4: MARK REPAIR COMPLETED â”€â”€ */}
      {completeModalOpen && (
        <ConfirmationModal
          open={true}
          onClose={() => setCompleteModalOpen(false)}
          title={`Mark Repair Completed on ${complaint.id}?`}
          description={`Are you sure you want to mark physical repair as COMPLETED? This will finalize your field task and advance to sensor verification.`}
          confirmLabel="Mark Repair Completed"
          cancelLabel="Cancel"
          onConfirm={handleConfirmCompleteRepair}
        >
          <div className="my-2 p-3 rounded-xl border border-line bg-surface-primary text-xs space-y-1">
            <div className="text-ink-primary font-semibold">
              Action Procedure Documented:
            </div>
            <div className="text-ink-muted font-mono">
              {repairNotesInput || 'Components replaced and field checks performed.'}
            </div>
          </div>
        </ConfirmationModal>
      )}
    </div>
  )
}
