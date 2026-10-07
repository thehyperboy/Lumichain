import { useState, useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { getComplaints } from '@/services/api'
import {
  ComplaintTable,
  Button,
  LoadingState,
  ErrorState,
  ConfirmationModal,
  useToast,
} from '@/components'
import { useComplaints } from '@/context'

export default function AdminComplaints() {
  const { complaints, loading, updateComplaintPriority, closeComplaint } = useComplaints()
  const { toast } = useToast()

  // Modal State for Admin Actions
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [modalAction, setModalAction] = useState(null) // 'priority' | 'close'
  const [newPriority, setNewPriority] = useState('CRITICAL')

  // Admin action triggers
  function handleOpenAction(complaint) {
    setSelectedComplaint(complaint)
    setNewPriority(complaint.priority)
    setModalAction('priority')
  }

  function handleConfirmPriorityChange() {
    if (!selectedComplaint) return
    updateComplaintPriority(selectedComplaint.id, newPriority)
    toast({
      title: 'Priority Updated',
      description: `Ticket ${selectedComplaint.id} priority changed to ${newPriority}.`,
      variant: 'success',
    })
    setSelectedComplaint(null)
    setModalAction(null)
  }

  function handleConfirmCloseComplaint() {
    if (!selectedComplaint) return
    closeComplaint(selectedComplaint.id, 'Formally closed on-chain by Central Administrator.')
    toast({
      title: 'Ticket Marked as Closed',
      description: `Complaint ${selectedComplaint.id} has been formally closed on-chain.`,
      variant: 'success',
    })
    setSelectedComplaint(null)
    setModalAction(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Synchronizing municipal incident complaints..." />
      </div>
    )
  }


  // Tally counts
  const criticalCount = complaints.filter((c) => c.priority === 'CRITICAL' && c.status !== 'CLOSED').length
  const openCount = complaints.filter((c) => c.status === 'OPEN').length
  const inProgressCount = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED',
  ).length

  return (
    <div className="space-y-6 pb-12">
      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Grievance & Incident Resolution
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Citizen Complaints & Triage
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Inspect citizen fault reports, AI-verified sensor tickets, and manage municipal resolution SLAs.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-danger-500/30 bg-danger-500/10 px-3 py-1 text-xs font-mono text-danger-300">
            <span>{criticalCount} Critical Active</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-warning-500/30 bg-warning-500/10 px-3 py-1 text-xs font-mono text-warning-300">
            <span>{openCount} Open Unassigned</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-mono text-violet-300">
            <span>{inProgressCount} Under Repair</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1.5 text-xs ml-1"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </div>

      {/* â”€â”€ REUSABLE COMPLAINT TABLE â”€â”€ */}
      <ComplaintTable
        complaints={complaints}
        detailBasePath="/admin/complaints"
        role="admin"
        onAction={handleOpenAction}
        pageSize={8}
      />

      {/* â”€â”€ ACTION MODALS (Requirement 5) â”€â”€ */}
      {/* 1. Change Priority Modal */}
      {modalAction === 'priority' && selectedComplaint && (
        <ConfirmationModal
          open={true}
          onClose={() => {
            setSelectedComplaint(null)
            setModalAction(null)
          }}
          title={`Triage Incident: ${selectedComplaint.id}`}
          description={`Select new priority tier for "${selectedComplaint.title}" or proceed to close.`}
          confirmLabel="Update Priority"
          cancelLabel="Cancel"
          onConfirm={handleConfirmPriorityChange}
        >
          <div className="space-y-4 my-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Target Priority Level:
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-primary py-2.5 px-3 text-sm text-ink-primary focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="CRITICAL" className="bg-surface-primary text-danger-400">CRITICAL (Emergency Blackout)</option>
                <option value="HIGH" className="bg-surface-primary text-warning-400">HIGH (Major Obstruction / Flickering)</option>
                <option value="MEDIUM" className="bg-surface-primary text-violet-400">MEDIUM (Optical Misalignment)</option>
                <option value="LOW" className="bg-surface-primary text-emerald-400">LOW (Cosmetic / Tagging)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between">
              <span className="text-xs text-ink-muted">Want to close this ticket instead?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setModalAction('close')}
                className="text-xs gap-1"
              >
                <Lock size={12} />
                <span>Mark as Closed</span>
              </Button>
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* 2. Mark as Closed Confirmation Modal */}
      {modalAction === 'close' && selectedComplaint && (
        <ConfirmationModal
          open={true}
          onClose={() => {
            setSelectedComplaint(null)
            setModalAction(null)
          }}
          title={`Close Incident ${selectedComplaint.id}?`}
          description={`Are you sure you want to mark this complaint as formally CLOSED? This will update local state and sign the resolution verification on the audit trail.`}
          confirmLabel="Yes, Close Complaint"
          cancelLabel="Cancel"
          danger={true}
          onConfirm={handleConfirmCloseComplaint}
        />
      )}
    </div>
  )
}
