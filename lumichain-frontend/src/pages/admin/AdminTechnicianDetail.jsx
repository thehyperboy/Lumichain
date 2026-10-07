import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Wrench,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Activity,
  Award,
  Zap,
} from 'lucide-react'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Breadcrumb,
  Button,
  StatusBadge,
  PriorityBadge,
  LoadingState,
  ErrorState,
} from '@/components/ui'
import { cn } from '@/utils'

export default function AdminTechnicianDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTechnician, loading } = useComplaints()

  const technician = getTechnician(id)

  if (loading && !technician) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Fetching technician profile and performance record for ${id}...`} />
      </div>
    )
  }

  if (!technician) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Technician Not Found"
          description={`No certified personnel record found with identifier "${id}".`}
          onRetry={() => navigate('/admin/technicians')}
          retryLabel="Return to Technicians Directory"
        />
      </div>
    )
  }

  const {
    name,
    specialization,
    secondarySkill,
    municipality,
    zone,
    email,
    phone,
    rating = 4.9,
    reviewsCount = 84,
    currentWorkload = 0,
    maxWorkload = 5,
    availability = 'Available Now',
    totalJobsCompleted = 142,
    averageResolutionTimeHours = 2.1,
    experienceYears = 6,
    performance = {},
    activeJobs = [],
    recentHistory = [],
    avatar,
  } = technician

  const isFull = currentWorkload >= maxWorkload
  const workloadPercent = Math.min(100, Math.round((currentWorkload / maxWorkload) * 100))

  const breadcrumbs = [
    { label: 'Admin', path: '/admin/dashboard' },
    { label: 'Technicians', path: '/admin/technicians' },
    { label: name },
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ BREADCRUMB & HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <div className="space-y-1">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            {name}
          </h1>
        </div>

        <Link to="/admin/technicians">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
            <ArrowLeft size={14} />
            All Technicians
          </Button>
        </Link>
      </div>

      {/* â”€â”€ PROFILE CARD HERO â”€â”€ */}
      <div className="rounded-2xl border border-line bg-gradient-to-r from-surface-card via-surface-card/95 to-violet-950/20 p-5 sm:p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-line shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 font-mono text-2xl font-bold text-violet-300">
                  {name.split(' ').map((n) => n[0]).join('')}
                </div>
              )}
              <span
                className={cn(
                  'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface-card',
                  isFull ? 'bg-amber-400' : 'bg-emerald-400',
                )}
              />
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-ink-primary">{name}</h2>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 text-xs font-mono font-medium text-violet-300 flex items-center gap-1">
                  <Wrench size={11} />
                  {specialization}
                </span>
                {secondarySkill && (
                  <span className="rounded-full border border-line bg-surface-primary px-2.5 py-0.5 text-xs text-ink-muted">
                    {secondarySkill}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                  <Star size={12} className="fill-amber-400" />
                  {rating} / 5.0 ({reviewsCount} Reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={12} className="text-ink-secondary" />
                  {municipality}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-ink-secondary" />
                  {zone}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Award size={12} className="text-ink-secondary" />
                  {experienceYears} Years Exp.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 text-xs font-mono text-ink-secondary pt-0.5">
                <span className="flex items-center gap-1">
                  <Phone size={11} /> {phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={11} /> {email}
                </span>
              </div>
            </div>
          </div>

          {/* Workload Gauge Summary */}
          <div className="rounded-xl border border-line/80 bg-surface-primary/80 p-4 min-w-[220px] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Current Workload:</span>
              <span className="font-mono font-bold text-ink-primary">
                {currentWorkload} / {maxWorkload} Jobs
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-surface-card overflow-hidden border border-line">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isFull ? 'bg-rose-500' : 'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]',
                )}
                style={{ width: `${Math.max(10, workloadPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={isFull ? 'text-rose-400' : 'text-emerald-400'}>
                {availability}
              </span>
              <span className="text-ink-muted">{totalJobsCompleted} Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ 4 PERFORMANCE METRIC CARDS (Requirement 5) â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-ink-muted">
            On-Time Resolution
          </div>
          <div className="text-2xl font-black font-mono text-violet-400">
            {performance.onTimeRate || '98.5%'}
          </div>
          <p className="text-[11px] text-ink-muted">Delivered within committed SLA hours</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-ink-muted">
            First-Time Fix Rate
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {performance.firstTimeFixRate || '95.2%'}
          </div>
          <p className="text-[11px] text-ink-muted">Zero repeat failure within 30 days</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-ink-muted">
            SLA Compliance
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {performance.slaCompliance || '99.1%'}
          </div>
          <p className="text-[11px] text-ink-muted">Conforms to municipal grievance code</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-ink-muted">
            Average Resolution Time
          </div>
          <div className="text-2xl font-black font-mono text-ink-primary">
            {averageResolutionTimeHours}h
          </div>
          <p className="text-[11px] text-ink-muted">From dispatch receipt to verified signoff</p>
        </div>
      </div>

      {/* â”€â”€ 2-COLUMN: ACTIVE JOBS + RECENT HISTORY (Requirement 5) â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Active Jobs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-violet-400" />
              <h3 className="text-sm font-bold text-ink-primary">
                Active Assigned Jobs ({activeJobs.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-ink-muted">Live Tasks</span>
          </div>

          {activeJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-card/60 p-8 text-center space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <div className="text-xs font-semibold text-ink-primary">No Active Jobs</div>
              <p className="text-xs text-ink-muted">
                Technician currently has zero active dispatches and is available for assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-line bg-surface-card p-4 space-y-2.5 shadow-sm hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-violet-400">
                      {job.id} â€¢ {job.complaintId}
                    </span>
                    <PriorityBadge priority={job.priority} />
                  </div>

                  <div className="text-xs font-semibold text-ink-primary">
                    {job.title}
                  </div>

                  <div className="text-[11px] text-ink-muted flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-ink-secondary" />
                      {job.location} ({job.poleId})
                    </span>
                    <span className="font-mono text-violet-300">ETA: ~{job.etaHours || 2.0}h</span>
                  </div>

                  <div className="pt-2 border-t border-line/40 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-ink-muted">
                      Dispatched: {job.assignedAt}
                    </span>
                    <Link to={`/admin/complaints/${job.complaintId}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-violet-400 gap-1 py-0.5 px-2">
                        Inspect Ticket
                        <ExternalLink size={11} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Service History & Completed Jobs (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-ink-primary">
                Service History & Verification Log ({recentHistory.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">On-Chain Verified</span>
          </div>

          {recentHistory.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface-card/60 p-8 text-center text-xs text-ink-muted">
              No historical job records logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-line bg-surface-card p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink-primary">
                        {item.id}
                      </span>
                      <span className="text-xs font-mono text-ink-muted">({item.complaintId})</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                      Duration: {item.durationHours}h
                    </span>
                  </div>

                  <p className="text-xs text-ink-secondary bg-surface-primary/60 p-2.5 rounded-lg border border-line/50">
                    {item.actionTaken}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-ink-muted pt-1">
                    <span>
                      Pole {item.poleId} â€¢ {item.location}
                    </span>
                    <span className="font-mono text-emerald-400 flex items-center gap-1">
                      <ShieldCheck size={11} />
                      Verified: {item.verifiedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
