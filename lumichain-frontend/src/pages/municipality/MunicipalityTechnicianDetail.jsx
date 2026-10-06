import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Wrench,
  Star,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  Award,
  ExternalLink,
} from 'lucide-react'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  Breadcrumb,
  Button,
  PriorityBadge,
  LoadingState,
  ErrorState,
} from '@/components/ui'
import { cn } from '@/utils'

export default function MunicipalityTechnicianDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTechnician, loading } = useComplaints()

  const technician = getTechnician(id)

  if (loading && !technician) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label={`Fetching technician record for ${id}...`} />
      </div>
    )
  }

  if (!technician) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Technician Not Found"
          description={`No field technician record found with identifier "${id}".`}
          onRetry={() => navigate('/municipality/technicians')}
          retryLabel="Return to Ward Technicians"
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
    { label: 'Ward Dashboard', path: '/municipality/dashboard' },
    { label: 'Technicians', path: '/municipality/technicians' },
    { label: name },
  ]

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-4">
        <div className="space-y-1">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            {name}
          </h1>
        </div>

        <Link to="/municipality/technicians">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
            <ArrowLeft size={14} />
            Ward Technicians
          </Button>
        </Link>
      </div>

      {/* Hero profile card */}
      <div className="rounded-2xl border border-line bg-gradient-to-r from-surface-card via-surface-card/95 to-violet-950/20 p-5 sm:p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
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
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-ink-primary">{name}</h2>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 text-xs font-mono font-medium text-violet-300 flex items-center gap-1">
                  <Wrench size={11} />
                  {specialization}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                  <Star size={12} className="fill-amber-400" />
                  {rating} / 5.0
                </span>
                <span>{municipality}</span>
                <span>{zone}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 text-xs font-mono text-ink-secondary">
                <span>Phone: {phone}</span>
                <span>Email: {email}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line/80 bg-surface-primary/80 p-4 min-w-[200px] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-ink-muted">Active Workload:</span>
              <span className="font-mono font-bold text-ink-primary">
                {currentWorkload} / {maxWorkload} Jobs
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-card overflow-hidden border border-line">
              <div
                className={cn('h-full rounded-full', isFull ? 'bg-rose-500' : 'bg-violet-400')}
                style={{ width: `${Math.max(10, workloadPercent)}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-violet-300">{availability}</div>
          </div>
        </div>
      </div>

      {/* Active Jobs in Ward */}
      <div className="rounded-2xl border border-line bg-surface-card p-5 space-y-4">
        <h3 className="text-base font-bold text-ink-primary">
          Current Active Jobs ({activeJobs.length})
        </h3>
        {activeJobs.length === 0 ? (
          <p className="text-xs text-ink-muted">No active work orders currently assigned.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-line bg-surface-primary/70 p-3.5 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-violet-400">
                    {job.id} â€¢ {job.complaintId}
                  </span>
                  <PriorityBadge priority={job.priority} />
                </div>
                <div className="text-xs font-semibold text-ink-primary">{job.title}</div>
                <div className="text-[11px] text-ink-muted">{job.location}</div>
                <div className="pt-2 border-t border-line/40 flex justify-end">
                  <Link to={`/municipality/complaints/${job.complaintId}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-violet-400 gap-1 py-0.5">
                      Inspect Incident
                      <ExternalLink size={11} />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
