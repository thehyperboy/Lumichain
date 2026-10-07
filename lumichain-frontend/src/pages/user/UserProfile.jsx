import { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Bell,
  Save,
  CheckCircle2,
  Shield,
  Home,
  Radio,
} from 'lucide-react'
import { Button, useToast, UserAvatar } from '@/components/ui'
import { useAuth } from '@/context'
import { cn } from '@/utils'

export default function UserProfile() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || 'Ananya Gupta')
  const [email, setEmail] = useState(user?.email || 'citizen@lumichain.gov')
  const [phone, setPhone] = useState(user?.phone || '+91 98112 44321')
  const [ward, setWard] = useState(user?.ward || 'Ward 15 (Janpath)')
  const [address, setAddress] = useState('Flat 402, Metro Enclave, Janpath Road, New Delhi 110001')

  // Notification preferences
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [signoffAlerts, setSignoffAlerts] = useState(true)
  const [wardBulletins, setWardBulletins] = useState(false)

  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Full name is required.'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email address is required.'
    if (!phone.trim() || phone.length < 10) errs.phone = 'Valid 10-digit mobile number is required.'
    if (!ward.trim()) errs.ward = 'Residential ward is required.'
    return errs
  }

  function handleSave(e) {
    e.preventDefault()
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
        title: 'Resident Profile Updated',
        description: 'Your citizen identity and ward alert preferences have been updated.',
        variant: 'success',
      })
    }, 400)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Verified Resident Profile
            </span>
            <span className="text-xs text-ink-muted">Â· {ward}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            My Resident Profile & Preferences
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Update your registered grievance contact number, residential ward, and dispatch alert subscriptions.
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
      <div className="card-glass border-line/70 p-6 flex items-center gap-4">
        <UserAvatar name={name} size="lg" />
        <div>
          <h2 className="text-lg font-bold text-ink-primary">{name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-0.5">
            <span className="text-violet-400 font-mono font-medium">{phone}</span>
            <span>â€¢</span>
            <span className="text-ink-secondary">{ward}</span>
            <span>â€¢</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
              Verified Citizen
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form Details */}
      <div className="card-glass border-line/70 p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2 border-b border-line/50 pb-3">
          <User className="h-4 w-4 text-violet-400" />
          Resident Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Full Legal Name <span className="text-rose-400">*</span>
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
            {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Registered Mobile (SMS Alerts) <span className="text-rose-400">*</span>
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
            {errors.phone && <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Email Address <span className="text-rose-400">*</span>
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
              Residential Ward <span className="text-rose-400">*</span>
            </label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="Ward 15 (Janpath)">Ward 15 (Janpath)</option>
              <option value="Ward 16 (Connaught Place)">Ward 16 (Connaught Place)</option>
              <option value="Ward 17 (Barakhamba)">Ward 17 (Barakhamba)</option>
              <option value="Ward 09 (Kashmere Gate)">Ward 09 (Kashmere Gate)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-ink-muted font-medium mb-1">
              Residential Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notification Subscriptions */}
      <div className="card-glass border-line/70 p-6 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2 border-b border-line/50 pb-3">
          <Bell className="h-4 w-4 text-amber-400" />
          Alert Subscriptions
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="mt-0.5 rounded border-line bg-surface-subtle text-cyan-500 focus:ring-violet-500 h-4 w-4"
            />
            <div>
              <span className="font-semibold text-ink-primary block">SMS Work Order Alerts</span>
              <span className="text-ink-muted text-[11px]">Receive an SMS text when a technician is dispatched to your reported streetlight.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={signoffAlerts}
              onChange={(e) => setSignoffAlerts(e.target.checked)}
              className="mt-0.5 rounded border-line bg-surface-subtle text-cyan-500 focus:ring-violet-500 h-4 w-4"
            />
            <div>
              <span className="font-semibold text-ink-primary block">Citizen Signoff Notifications</span>
              <span className="text-ink-muted text-[11px]">Receive instant alert when a repair is finished and ready for resident inspection.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wardBulletins}
              onChange={(e) => setWardBulletins(e.target.checked)}
              className="mt-0.5 rounded border-line bg-surface-subtle text-cyan-500 focus:ring-violet-500 h-4 w-4"
            />
            <div>
              <span className="font-semibold text-ink-primary block">Ward Lighting Bulletins</span>
              <span className="text-ink-muted text-[11px]">Receive scheduled maintenance and energy conservation announcements.</span>
            </div>
          </label>
        </div>
      </div>
    </form>
  )
}
