import { useState } from 'react'
import {
  Settings,
  Shield,
  Sliders,
  Cpu,
  Lock,
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Server,
  Key,
} from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { useAuth } from '@/context'
import { cn } from '@/utils'

export default function AdminSettings() {
  const { user } = useAuth()
  const { toast } = useToast()

  // Form State
  const [adminName, setAdminName] = useState(user?.name || 'Vikas Mehra')
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@lumichain.gov')
  const [adminPhone, setAdminPhone] = useState('+91 98110 54321')
  const [department, setDepartment] = useState('Central Smart City Mission - MoHUA')

  // SLA Configurations (in hours)
  const [criticalSla, setCriticalSla] = useState('24')
  const [highSla, setHighSla] = useState('48')
  const [mediumSla, setMediumSla] = useState('72')
  const [autoEscalate, setAutoEscalate] = useState(true)

  // Blockchain RPC & Contract Configurations
  const [networkName, setNetworkName] = useState('Polygon zkEVM Municipal L2')
  const [rpcEndpoint, setRpcEndpoint] = useState('https://polygon-zkevm-rpc.lumichain.gov')
  const [contractAddress, setContractAddress] = useState('0x8a927f31c2847a9284102948c901928374613F0d')
  const [gasLimit, setGasLimit] = useState('65000')

  // IoT Sentinel Thresholds
  const [luxThreshold, setLuxThreshold] = useState('5.0')
  const [neighborQuorum, setNeighborQuorum] = useState('3')

  // Validation & Saving
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  function validate() {
    const errs = {}
    if (!adminName.trim()) errs.adminName = 'Administrator name is required.'
    if (!adminEmail.trim() || !/\S+@\S+\.\S+/.test(adminEmail)) errs.adminEmail = 'Valid official email is required.'
    if (!adminPhone.trim() || adminPhone.length < 10) errs.adminPhone = 'Valid 10-digit phone number is required.'
    if (!criticalSla || isNaN(criticalSla) || Number(criticalSla) <= 0) errs.criticalSla = 'Critical SLA must be a positive number.'
    if (!rpcEndpoint.trim() || !rpcEndpoint.startsWith('http')) errs.rpcEndpoint = 'Valid HTTP/HTTPS RPC endpoint required.'
    if (!contractAddress.trim() || !contractAddress.startsWith('0x')) errs.contractAddress = 'Valid hex Ethereum contract address required.'
    return errs
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the highlighted fields before saving settings.',
        variant: 'danger',
      })
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: 'System Settings Saved',
        description: 'Global SLA parameters and Web3 contract configurations have been updated on-chain.',
        variant: 'success',
      })
    }, 500)
  }

  function handleReset() {
    setCriticalSla('24')
    setHighSla('48')
    setMediumSla('72')
    setAutoEscalate(true)
    setRpcEndpoint('https://polygon-zkevm-rpc.lumichain.gov')
    setContractAddress('0x8a927f31c2847a9284102948c901928374613F0d')
    setLuxThreshold('5.0')
    setNeighborQuorum('3')
    setErrors({})
    toast({
      title: 'Defaults Restored',
      description: 'System parameters reset to baseline standards.',
      variant: 'info',
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              <Shield className="h-3 w-3" />
              Central Control Console
            </span>
            <span className="text-xs text-ink-muted">Â· Protocol v2.4</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            System Settings & Security Configuration
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Configure statutory resolution SLAs, cryptographic oracle endpoints, and hardware sensor sensitivity thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
            className="text-xs gap-1.5 font-bold shadow-md shadow-violet-500/20"
          >
            <Save size={13} />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </Button>
        </div>
      </div>

      {/* â”€â”€ SECTION 1: Administrator Profile & Contact â”€â”€ */}
      <div className="card-glass border-line/70 p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-line/50 pb-3">
          <Shield className="h-5 w-5 text-violet-400" />
          <h2 className="text-base font-bold text-ink-primary">
            1. Administrator Identity & Credentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Administrator Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => {
                setAdminName(e.target.value)
                setErrors((prev) => ({ ...prev, adminName: null }))
              }}
              className={cn(
                'w-full rounded-xl border bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500',
                errors.adminName ? 'border-rose-500' : 'border-line/70',
              )}
            />
            {errors.adminName && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.adminName}</p>
            )}
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Official Gov Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value)
                setErrors((prev) => ({ ...prev, adminEmail: null }))
              }}
              className={cn(
                'w-full rounded-xl border bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500',
                errors.adminEmail ? 'border-rose-500' : 'border-line/70',
              )}
            />
            {errors.adminEmail && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.adminEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Emergency Contact Hotline
            </label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => {
                setAdminPhone(e.target.value)
                setErrors((prev) => ({ ...prev, adminPhone: null }))
              }}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Department / Ministry
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ SECTION 2: Statutory Resolution SLAs â”€â”€ */}
      <div className="card-glass border-line/70 p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-line/50 pb-3">
          <Clock className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-bold text-ink-primary">
            2. Resolution SLA Thresholds (Hours)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Critical (Emergency Blackout) SLA:
            </label>
            <div className="relative">
              <input
                type="number"
                value={criticalSla}
                onChange={(e) => setCriticalSla(e.target.value)}
                className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 pr-12 text-xs font-mono font-bold text-ink-primary focus:border-violet-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-ink-muted font-mono">hrs</span>
            </div>
            <span className="text-[10px] text-ink-muted mt-1 block">Default: 24 Hours</span>
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              High Priority (Major Flickering) SLA:
            </label>
            <div className="relative">
              <input
                type="number"
                value={highSla}
                onChange={(e) => setHighSla(e.target.value)}
                className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 pr-12 text-xs font-mono font-bold text-ink-primary focus:border-violet-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-ink-muted font-mono">hrs</span>
            </div>
            <span className="text-[10px] text-ink-muted mt-1 block">Default: 48 Hours</span>
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Medium / Low (Sensor Misalignment) SLA:
            </label>
            <div className="relative">
              <input
                type="number"
                value={mediumSla}
                onChange={(e) => setMediumSla(e.target.value)}
                className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 pr-12 text-xs font-mono font-bold text-ink-primary focus:border-violet-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-ink-muted font-mono">hrs</span>
            </div>
            <span className="text-[10px] text-ink-muted mt-1 block">Default: 72 Hours</span>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2.5 text-xs text-ink-primary cursor-pointer">
            <input
              type="checkbox"
              checked={autoEscalate}
              onChange={(e) => setAutoEscalate(e.target.checked)}
              className="rounded border-line bg-surface-subtle text-cyan-500 focus:ring-violet-500 h-4 w-4"
            />
            <span>Auto-escalate tickets to Zonal Superintendent if SLA has less than 4 hours remaining.</span>
          </label>
        </div>
      </div>

      {/* â”€â”€ SECTION 3: Web3 Blockchain & Oracle Configurations â”€â”€ */}
      <div className="card-glass border-line/70 p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-line/50 pb-3">
          <Layers className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-ink-primary">
            3. Web3 Ledger & Cryptographic Smart Contract
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block text-ink-muted font-sans font-medium mb-1">
              Municipal L2 Network Name
            </label>
            <input
              type="text"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-ink-muted font-sans font-medium mb-1">
              RPC Endpoint Node
            </label>
            <input
              type="text"
              value={rpcEndpoint}
              onChange={(e) => setRpcEndpoint(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-violet-400 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-ink-muted font-sans font-medium mb-1">
              Grievance Ledger Smart Contract Address
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-emerald-400 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ SECTION 4: Hardware Sentinel Sensitivity â”€â”€ */}
      <div className="card-glass border-line/70 p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-line/50 pb-3">
          <Cpu className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-bold text-ink-primary">
            4. IoT Sentinel Sensitivity & Neighbor Quorum
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Optical Blackout Trigger Threshold:
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={luxThreshold}
                onChange={(e) => setLuxThreshold(e.target.value)}
                className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 pr-14 text-xs font-mono font-bold text-ink-primary focus:border-violet-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-ink-muted font-mono">Lux</span>
            </div>
            <span className="text-[10px] text-ink-muted mt-1 block">
              Readings below this during dusk cycle trigger failure state.
            </span>
          </div>

          <div>
            <label className="block text-ink-muted font-medium mb-1">
              Neighbor Node Verification Quorum:
            </label>
            <select
              value={neighborQuorum}
              onChange={(e) => setNeighborQuorum(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-surface-subtle p-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="2">2 / 3 Neighbor Nodes</option>
              <option value="3">3 / 4 Neighbor Nodes (Recommended)</option>
              <option value="4">4 / 4 Neighbor Nodes (Strict)</option>
            </select>
            <span className="text-[10px] text-ink-muted mt-1 block">
              Consensus required to eliminate false sensor positives.
            </span>
          </div>
        </div>
      </div>

      {/* Save Button Footer */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSaving}
          className="gap-2 font-bold shadow-lg shadow-violet-500/25"
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
        </Button>
      </div>
    </form>
  )
}
