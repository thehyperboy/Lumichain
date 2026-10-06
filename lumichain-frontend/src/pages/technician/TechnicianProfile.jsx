import { useState } from 'react'
import {
  Wrench,
  Star,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Award,
  ShieldCheck,
  Calendar,
  Zap,
  Save,
  Truck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import { Button, useToast, UserAvatar } from '@/components/ui'
import { cn } from '@/utils'

export default function TechnicianProfile() {
  const { user } = useAuth()
  const { technicians } = useComplaints()
  const { toast } = useToast()

  const currentTechName = user?.name || 'Rohan Mehta'
  const techProfile =
    technicians.find(
      (t) =>
        t.name?.toLowerCase().includes(currentTechName.toLowerCase()) ||
        currentTechName.toLowerCase().includes(t.name?.toLowerCase()),
    ) || technicians[0]

  const [name, setName] = useState(currentTechName)
  const [phone, setPhone] = useState(techProfile?.phone || '+91 98721 00984')
  const [email, setEmail] = useState(user?.email || techProfile?.email || 'technician@lumichain.gov')
  const [specialization, setSpecialization] = useState(techProfile?.specialization || 'LED Driver & Ballast Specialist')
  const [vehicleId, setVehicleId] = useState('DL-04-TC-1984 (Service Van #2)')
  const [isAvailable, setIsAvailable] = useState(true)

  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Technician name is required.'
    if (!phone.trim() || phone.length < 10) errs.phone = 'Valid 10-digit mobile number is required.'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required.'
    return errs
  }

  function handleSave(e) {
    if (e) e.preventDefault()
    const errs = validate()
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the highlighted fields.',
        variant: 'danger',
      })
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: 'Profile Updated',
        description: 'Technician contact details, specialization, and availability updated on-chain.',
        variant: 'success',
      })
    }, 450)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              <Wrench className="h-3 w-3" />
              Certified Field Specialist
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary mt-1">
            Field Technician Profile & Console
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your credentials, on-call dispatch availability, and certified equipment badges.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSaving}
          className="text-xs gap-1.5 font-bold shadow-md shadow-violet-500/20"
        >
          <Save size={13} />
          <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
        </Button>
      </div>

      {/* Hero Badge */}
      <div className="rounded-2xl border border-line bg-surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 font-mono text-2xl font-bold text-violet-300">
            {name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-primary">{name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-0.5">
              <span className="text-violet-400 font-medium">{specialization}</span>
              <span>â€¢</span>
              <span className="text-amber-400 font-mono flex items-center gap-1">
                <Star size={11} className="fill-amber-400" /> â˜… {techProfile?.rating || 4.9} / 5.0
              </span>
              <span>â€¢</span>
              <span className="text-emerald-400 font-mono">
                {techProfile?.totalJobsCompleted || 48} Repaired
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-muted">Duty Status:</span>
          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all border',
              isAvailable
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-line bg-surface-primary text-ink-muted',
            )}
          >
            {isAvailable ? 'â— Available for Dispatch' : 'â—‹ Off Duty / Paused'}
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="rounded-2xl border border-line bg-surface-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-primary border-b border-line/60 pb-3">
          Contact & Notification Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: null }))
              }}
              className={cn(
                'w-full rounded-xl border bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none',
                errors.name ? 'border-rose-500' : 'border-line/70',
              )}
            />
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Direct Mobile Hotline (SMS Work Orders) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setErrors((prev) => ({ ...prev, phone: null }))
              }}
              className={cn(
                'w-full rounded-xl border bg-surface-subtle p-2.5 text-xs font-mono text-ink-primary focus:border-violet-500 focus:outline-none',
                errors.phone ? 'border-rose-500' : 'border-line/70',
              )}
            />
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Field Specialist Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: null }))
              }}
              className={cn(
                'w-full rounded-xl border bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none',
                errors.email ? 'border-rose-500' : 'border-line/70',
              )}
            />
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Primary Technical Specialization
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="LED Driver & Ballast Specialist">LED Driver & Ballast Specialist</option>
              <option value="High-Voltage Mast Electrician">High-Voltage Mast Electrician</option>
              <option value="IoT Photocell & Mesh Oracle Technician">IoT Photocell & Mesh Oracle Technician</option>
              <option value="Structural Mast & Bracket Rigging">Structural Mast & Bracket Rigging</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-ink-muted font-medium mb-1">
              Assigned Field Service Vehicle / Tool Unit
            </label>
            <input
              type="text"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Verified Skills & Certifications */}
      <div className="rounded-2xl border border-line bg-surface-card p-6 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-primary border-b border-line/60 pb-3">
          Verified On-Chain Certifications
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-line/80 bg-surface-subtle/80 space-y-1">
            <div className="font-semibold text-ink-primary">High-Voltage Mast Rigging</div>
            <div className="text-[11px] text-emerald-400 font-mono">Verified Class-A (CEA 2024)</div>
          </div>
          <div className="p-3.5 rounded-xl border border-line/80 bg-surface-subtle/80 space-y-1">
            <div className="font-semibold text-ink-primary">IoT Mesh Oracle Firmware</div>
            <div className="text-[11px] text-emerald-400 font-mono">ESP32 & LoRa Gateway Certified</div>
          </div>
          <div className="p-3.5 rounded-xl border border-line/80 bg-surface-subtle/80 space-y-1">
            <div className="font-semibold text-ink-primary">Electrical Safety & PPE</div>
            <div className="text-[11px] text-emerald-400 font-mono">Zero Incident Record (6 Yrs)</div>
          </div>
        </div>
      </div>
    </form>
  )
}
