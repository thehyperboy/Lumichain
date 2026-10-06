import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  RefreshCw,
  Wrench,
  CheckCheck,
  ShieldCheck,
  SlidersHorizontal,
  Clock,
  Eye,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  ComplaintTable,
  Button,
  Modal,
  ConfirmationModal,
  PriorityBadge,
  StatusBadge,
  LoadingState,
  useToast,
  ComplaintTimeline,
} from '@/components'
import { AssignTechnicianModal } from '@/components/technicians'

export default function MunicipalityComplaints() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    complaints,
    loading,
    updateComplaintPriority,
    verifyComplaint,
  } = useComplaints()
  const { toast } = useToast()

  // Scope filter: by default filter to logged in municipality, with option to show all
  const [showOnlyMyMuni, setShowOnlyMyMuni] = useState(true)

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [priorityModalOpen, setPriorityModalOpen] = useState(false)
  const [trackModalOpen, setTrackModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [targetPriority, setTargetPriority] = useState('HIGH')

  const userMuniName =
    user?.municipality ||
    user?.department ||
    'North Delhi Municipal Corp (NDMC-North)'

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    if (!showOnlyMyMuni) return complaints

    const q = userMuniName.toLowerCase().replace(/[^a-z0-9]/g, '')
    return complaints.filter((c) => {
      const cMuni = (c.municipality || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return (
        (cMuni.includes('north') && q.includes('north')) ||
        (cMuni.includes('central') && q.includes('central')) ||
        (cMuni.includes('south') && q.includes('south')) ||
        (cMuni.includes('east') && q.includes('east')) ||
        cMuni === q ||
        q.includes(cMuni)
      )
    })
  }, [complaints, showOnlyMyMuni, userMuniName])

  // Handle row action menu click
  function handleOpenActionMenu(complaint) {
    setSelectedComplaint(complaint)
    setTargetPriority(complaint.priority)
    setActionMenuOpen(true)
  }

  // Action 1: View Details
  function handleActionView() {
    if (!selectedComplaint) return
    setActionMenuOpen(false)
    navigate(`/municipality/complaints/${selectedComplaint.id}`)
  }

  // Action 2: Assign Technician
  function handleActionAssign() {
    setActionMenuOpen(false)
    setAssignModalOpen(true)
  }

  // Action 3: Change Priority
  function handleActionPriority() {
    setActionMenuOpen(false)
    setPriorityModalOpen(true)
  }

  function handleConfirmPriorityChange() {
    if (!selectedComplaint) return
    updateComplaintPriority(selectedComplaint.id, targetPriority)
    toast({
      title: 'Priority Updated',
      description: `Complaint ${selectedComplaint.id} priority changed to ${targetPriority}.`,
      variant: 'success',
    })
    setPriorityModalOpen(false)
    setSelectedComplaint(null)
  }

  // Action 4: Track Repair
  function handleActionTrack() {
    setActionMenuOpen(false)
    setTrackModalOpen(true)
  }

  // Action 5: Verify Complaint
  function handleActionVerify() {
    setActionMenuOpen(false)
    setVerifyModalOpen(true)
  }

  function handleConfirmVerify() {
    if (!selectedComplaint) return
    verifyComplaint(
      selectedComplaint.id,
      `Verified by Municipal Officer ${user?.name || 'Priya Sharma'} via inspection console.`,
    )
    toast({
      title: 'Complaint Verified On-Chain',
      description: `Repair on ${selectedComplaint.id} verified. Luminaire illumination confirmed.`,
      variant: 'success',
    })
    setVerifyModalOpen(false)
    setSelectedComplaint(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Loading municipal grievance records..." />
      </div>
    )
  }

  // Counts
  const unassignedCount = filteredComplaints.filter((c) => !c.assignedTo && c.status !== 'CLOSED').length
  const inRepairCount = filteredComplaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length
  const readyVerifyCount = filteredComplaints.filter((c) => c.status === 'REPAIR_COMPLETED').length

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Ward Incident Resolution
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Citizen Grievances & Work Orders
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Triage fault alerts, assign certified technicians, and verify repair SLAs for {userMuniName}.
          </p>
        </div>

        {/* Quick Tally Chips & Scope Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowOnlyMyMuni(!showOnlyMyMuni)}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-3 py-1 text-xs font-mono text-ink-secondary hover:border-violet-500/40 hover:text-violet-300 transition-colors"
          >
            <Building2 size={13} className="text-violet-400" />
            <span>{showOnlyMyMuni ? 'Filtered: My Ward' : 'Showing: All Municipalities'}</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-warning-500/30 bg-warning-500/10 px-3 py-1 text-xs font-mono text-warning-300">
            <span>{unassignedCount} Unassigned</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-mono text-violet-300">
            <span>{inRepairCount} In Field</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ REUSABLE COMPLAINT TABLE (Requirement 3) â”€â”€ */}
      <ComplaintTable
        complaints={filteredComplaints}
        detailBasePath="/municipality/complaints"
        role="municipality"
        onAction={handleOpenActionMenu}
        pageSize={8}
      />

      {/* â”€â”€ MODAL: 5 MUNICIPALITY ACTIONS SELECTION (Requirement 3) â”€â”€ */}
      {actionMenuOpen && selectedComplaint && (
        <Modal
          open={true}
          onClose={() => setActionMenuOpen(false)}
          title={`Ward Triage Actions: ${selectedComplaint.id}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {/* Target complaint info */}
            <div className="rounded-xl border border-line bg-surface-primary/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-violet-400">
                  {selectedComplaint.id}
                </span>
                <PriorityBadge priority={selectedComplaint.priority} />
              </div>
              <div className="text-xs font-semibold text-ink-primary truncate">
                {selectedComplaint.title}
              </div>
              <div className="text-[11px] text-ink-muted">
                {selectedComplaint.location} â€¢ Status: <strong className="text-violet-300">{selectedComplaint.status}</strong>
              </div>
            </div>

            <p className="text-xs text-ink-muted">
              Select an administrative action to perform on this grievance ticket:
            </p>

            {/* 5 Actions Buttons List */}
            <div className="space-y-2">
              {/* 1. View Details */}
              <button
                type="button"
                onClick={handleActionView}
                className="w-full flex items-center justify-between rounded-xl border border-line bg-surface-card p-3 text-left hover:border-violet-500/40 hover:bg-surface-hover/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
                    <Eye size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-primary group-hover:text-violet-300">
                      1. View Complaint Details
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      Inspect full telemetry, evidence images & 9-stage audit
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-ink-muted group-hover:text-violet-400" />
              </button>

              {/* 2. Assign Technician */}
              <button
                type="button"
                onClick={handleActionAssign}
                className="w-full flex items-center justify-between rounded-xl border border-line bg-surface-card p-3 text-left hover:border-violet-500/40 hover:bg-surface-hover/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-primary group-hover:text-amber-300">
                      2. Assign Field Technician
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      {selectedComplaint.assignedTo
                        ? `Currently assigned to ${selectedComplaint.assignedTo} (Reassign)`
                        : 'Choose certified technician from available pool'}
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-ink-muted group-hover:text-amber-400" />
              </button>

              {/* 3. Change Priority */}
              <button
                type="button"
                onClick={handleActionPriority}
                className="w-full flex items-center justify-between rounded-xl border border-line bg-surface-card p-3 text-left hover:border-violet-500/40 hover:bg-surface-hover/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-primary group-hover:text-rose-300">
                      3. Change Triage Priority
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      Adjust SLA target (Critical, High, Medium, Low)
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-ink-muted group-hover:text-rose-400" />
              </button>

              {/* 4. Track Repair */}
              <button
                type="button"
                onClick={handleActionTrack}
                className="w-full flex items-center justify-between rounded-xl border border-line bg-surface-card p-3 text-left hover:border-violet-500/40 hover:bg-surface-hover/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Activity size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-primary group-hover:text-blue-300">
                      4. Track Repair Progression
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      View live repair status, assigned tech, and ETA
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-ink-muted group-hover:text-blue-400" />
              </button>

              {/* 5. Verify Complaint */}
              <button
                type="button"
                onClick={handleActionVerify}
                className="w-full flex items-center justify-between rounded-xl border border-line bg-surface-card p-3 text-left hover:border-emerald-500/50 hover:bg-surface-hover/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCheck size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-primary group-hover:text-emerald-300">
                      5. Verify Completed Repair
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      Sign off on lux restoration and register on-chain proof
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-ink-muted group-hover:text-emerald-400" />
              </button>
            </div>

            <div className="pt-2 border-t border-line/60 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setActionMenuOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* â”€â”€ MODAL: ASSIGN TECHNICIAN â”€â”€ */}
      {assignModalOpen && selectedComplaint && (
        <AssignTechnicianModal
          open={true}
          onClose={() => {
            setAssignModalOpen(false)
            setSelectedComplaint(null)
          }}
          complaint={selectedComplaint}
        />
      )}

      {/* â”€â”€ MODAL: CHANGE PRIORITY â”€â”€ */}
      {priorityModalOpen && selectedComplaint && (
        <ConfirmationModal
          open={true}
          onClose={() => {
            setPriorityModalOpen(false)
            setSelectedComplaint(null)
          }}
          title={`Change Priority: ${selectedComplaint.id}`}
          description={`Update triage urgency for "${selectedComplaint.title}"`}
          confirmLabel="Update Priority"
          cancelLabel="Cancel"
          onConfirm={handleConfirmPriorityChange}
        >
          <div className="space-y-3 my-2 text-xs">
            <label className="block font-semibold uppercase tracking-wider text-ink-muted">
              Select Urgency Level:
            </label>
            <select
              value={targetPriority}
              onChange={(e) => setTargetPriority(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary py-2.5 px-3 text-sm text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              <option value="CRITICAL" className="bg-surface-primary text-danger-400">
                CRITICAL (Emergency Blackout - 24h SLA)
              </option>
              <option value="HIGH" className="bg-surface-primary text-warning-400">
                HIGH (Major Flickering / Damaged Casing - 48h SLA)
              </option>
              <option value="MEDIUM" className="bg-surface-primary text-violet-400">
                MEDIUM (Sensor Misalignment - 72h SLA)
              </option>
              <option value="LOW" className="bg-surface-primary text-emerald-400">
                LOW (Cosmetic / Low Urgency - 7d SLA)
              </option>
            </select>
          </div>
        </ConfirmationModal>
      )}

      {/* â”€â”€ MODAL: TRACK REPAIR (Action 4) â”€â”€ */}
      {trackModalOpen && selectedComplaint && (
        <Modal
          open={true}
          onClose={() => {
            setTrackModalOpen(false)
            setSelectedComplaint(null)
          }}
          title={`Track Repair Progression: ${selectedComplaint.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-primary p-3 text-xs">
              <div>
                <span className="font-mono text-violet-400 font-bold mr-2">
                  {selectedComplaint.id}
                </span>
                <span className="text-ink-primary font-semibold">
                  {selectedComplaint.title}
                </span>
              </div>
              <StatusBadge status={selectedComplaint.status} />
            </div>

            <div className="max-h-[350px] overflow-y-auto pr-1">
              <ComplaintTimeline timeline={selectedComplaint.timeline} />
            </div>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between">
              <Link to={`/municipality/complaints/${selectedComplaint.id}`}>
                <Button variant="ghost" size="sm" className="text-xs text-violet-400 gap-1">
                  Full Audit Page
                  <ExternalLink size={12} />
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTrackModalOpen(false)
                  setSelectedComplaint(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* â”€â”€ MODAL: VERIFY COMPLAINT (Action 5) â”€â”€ */}
      {verifyModalOpen && selectedComplaint && (
        <ConfirmationModal
          open={true}
          onClose={() => {
            setVerifyModalOpen(false)
            setSelectedComplaint(null)
          }}
          title={`Verify Incident Resolution: ${selectedComplaint.id}`}
          description={`Sign off on the completed physical repair. This will advance the incident timeline to REPAIR VERIFIED with cryptographic oracle proof.`}
          confirmLabel="Sign & Verify Repair"
          cancelLabel="Cancel"
          onConfirm={handleConfirmVerify}
        />
      )}
    </div>
  )
}
