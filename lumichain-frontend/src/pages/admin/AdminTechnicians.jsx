import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  Building2,
  Users,
  Flame,
  PlusCircle,
  Briefcase,
  TrendingUp,
} from 'lucide-react'
import { useComplaints } from '@/context/ComplaintsContext'
import {
  StatCard,
  Button,
  LoadingState,
  EmptyState,
} from '@/components/ui'
import { TechnicianCard } from '@/components/technicians'

export default function AdminTechnicians() {
  const navigate = useNavigate()
  const { technicians, loading } = useComplaints()

  const [search, setSearch] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL')
  const [selectedMunicipality, setSelectedMunicipality] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL') // 'ALL' | 'AVAILABLE' | 'BUSY'

  // Dynamic filter options
  const specializations = useMemo(() => {
    const set = new Set(technicians.map((t) => t.specialization).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [technicians])

  const municipalities = useMemo(() => {
    const set = new Set(technicians.map((t) => t.municipality).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [technicians])

  // Filtered technicians
  const filteredTechnicians = useMemo(() => {
    return technicians.filter((t) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.zone?.toLowerCase().includes(q)

      const matchesSpec =
        selectedSpecialization === 'ALL' || t.specialization === selectedSpecialization

      const matchesMuni =
        selectedMunicipality === 'ALL' || t.municipality === selectedMunicipality

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'AVAILABLE' && t.currentWorkload < t.maxWorkload) ||
        (selectedStatus === 'BUSY' && t.currentWorkload >= t.maxWorkload)

      return matchesSearch && matchesSpec && matchesMuni && matchesStatus
    })
  }, [technicians, search, selectedSpecialization, selectedMunicipality, selectedStatus])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingState label="Loading technician workforce directory..." />
      </div>
    )
  }

  // Aggregate stats
  const totalCount = technicians.length
  const availableCount = technicians.filter((t) => t.currentWorkload < t.maxWorkload).length
  const onFieldCount = technicians.filter((t) => t.currentWorkload > 0).length
  const totalCompleted = technicians.reduce((acc, t) => acc + (t.totalJobsCompleted || 0), 0)
  const avgRating = (
    technicians.reduce((acc, t) => acc + (t.rating || 4.8), 0) / (technicians.length || 1)
  ).toFixed(2)

  return (
    <div className="space-y-6 pb-16">
      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Workforce & Resource Allocation
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
            Field Technicians & Specialists
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Inspect certifications, active field workloads, SLA resolution times, and deployment ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-mono text-violet-300">
            <span>{availableCount} Available for Dispatch</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ KPI STAT CARDS â”€â”€ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Technicians"
          value={totalCount}
          subtitle="Certified Personnel"
          tone="neutral"
          icon={Users}
        />
        <StatCard
          title="Active On Field"
          value={onFieldCount}
          subtitle="Executing Work Orders"
          tone="info"
          icon={Briefcase}
        />
        <StatCard
          title="Available Now"
          value={availableCount}
          subtitle="Ready for Instant Dispatch"
          tone="success"
          icon={CheckCircle2}
        />
        <StatCard
          title="Average CSAT Rating"
          value={`â˜… ${avgRating}`}
          subtitle="Out of 5.0 Rating"
          tone="warning"
          icon={Star}
        />
        <StatCard
          title="Total Fixes Completed"
          value={totalCompleted}
          subtitle="Oracle Verified Closures"
          tone="info"
          icon={ShieldCheck}
        />
      </div>

      {/* â”€â”€ SEARCH & FILTER CONTROLS â”€â”€ */}
      <div className="rounded-2xl border border-line bg-surface-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Bar (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              placeholder="Search technician by name, specialization, or zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary pl-9 pr-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Specialization Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary px-3 py-2 text-xs text-ink-primary focus:border-violet-500 focus:outline-none truncate"
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec} className="bg-surface-primary">
                  {spec === 'ALL' ? 'All Specializations' : spec}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary px-3 py-2 text-xs text-ink-primary focus:border-violet-500 focus:outline-none truncate"
            >
              <option value="ALL">All Municipalities</option>
              {municipalities
                .filter((m) => m !== 'ALL')
                .map((m) => (
                  <option key={m} value={m} className="bg-surface-primary">
                    {m}
                  </option>
                ))}
            </select>
          </div>

          {/* Availability Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-primary px-3 py-2 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Availability</option>
              <option value="AVAILABLE">Available for Jobs</option>
              <option value="BUSY">At Max Capacity</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line/60">
          <span>
            Showing <strong className="text-ink-primary">{filteredTechnicians.length}</strong> of{' '}
            <strong className="text-ink-primary">{technicians.length}</strong> technicians
          </span>

          {(search || selectedSpecialization !== 'ALL' || selectedMunicipality !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedSpecialization('ALL')
                setSelectedMunicipality('ALL')
                setSelectedStatus('ALL')
              }}
              className="text-violet-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ TECHNICIAN CARDS GRID (Requirement 5) â”€â”€ */}
      {filteredTechnicians.length === 0 ? (
        <EmptyState
          title="No Technicians Found"
          description="No specialists match the current search or filter criteria."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedSpecialization('ALL')
                setSelectedMunicipality('ALL')
                setSelectedStatus('ALL')
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTechnicians.map((tech) => (
            <TechnicianCard
              key={tech.id}
              technician={tech}
              onViewDetails={() => navigate(`/admin/technicians/${tech.id}`)}
              compact={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
