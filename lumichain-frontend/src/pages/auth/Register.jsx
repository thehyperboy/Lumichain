import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Wrench,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext'
import { AuthLayout } from '@/layouts'
import { Button, Input } from '@/components/ui'

const REGISTER_ROLES = [
  {
    value: 'user',
    label: 'Citizen / Resident',
    description: 'Report outage issues & track municipal streetlight status',
    icon: User,
  },
  {
    value: 'technician',
    label: 'Field Technician',
    description: 'Receive repair tickets, verify luminaires & update telemetry',
    icon: Wrench,
  },
  {
    value: 'municipality',
    label: 'Municipality Admin',
    description: 'Manage ward zones, approve budgets & inspect energy stats',
    icon: Building2,
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  // Password rules checklist calculations
  const password = formData.password
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  // Password strength score 0 - 4
  const passedCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  function getStrengthLabel() {
    if (!password) return { text: 'None', color: 'bg-surface-hover', textColor: 'text-ink-muted' }
    if (passedCount <= 2) return { text: 'Weak', color: 'bg-danger-500', textColor: 'text-danger-400' }
    if (passedCount <= 4) return { text: 'Medium', color: 'bg-warning-500', textColor: 'text-warning-400' }
    return { text: 'Strong', color: 'bg-success-500', textColor: 'text-success-400' }
  }

  const strength = getStrengthLabel()

  function validate() {
    const nextErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required.'
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = 'Full name must be at least 2 characters.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = 'Please provide a valid email format (e.g. user@city.gov).'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (!hasMinLength) {
      nextErrors.password = 'Password must be at least 8 characters long.'
    } else if (!hasUpper) {
      nextErrors.password = 'Password must include at least one uppercase letter (A-Z).'
    } else if (!hasNumber) {
      nextErrors.password = 'Password must include at least one number (0-9).'
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirmation password is required.'
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (authError) {
      setAuthError('')
    }
  }

  function handleSelectRole(roleVal) {
    setFormData((prev) => ({ ...prev, role: roleVal }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAuthError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const newUser = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      const targetPath = getRoleDashboardPath(newUser.role)
      navigate(targetPath, { replace: true })
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      badge="Network Registration"
      heroTitle="Join the Next-Gen Municipal Smart Grid"
      heroSubtitle="Create your verified identity to monitor local illuminance telemetry, participate in municipal reporting, or manage maintenance work orders."
    >
      <div className="card-glass border-line/80 p-7 sm:p-9 shadow-2xl relative">
        {/* Header */}
        <div className="mb-6 space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-ink-primary">
            Create an account
          </h2>
          <p className="text-sm text-ink-muted">
            Select your municipal jurisdiction role and set up access credentials.
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-danger-500/40 bg-danger-500/10 p-3.5 text-xs text-danger-400 animate-fade-in"
          >
            <AlertCircle size={17} className="shrink-0 text-danger-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Registration Error</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Select Your Portal Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {REGISTER_ROLES.map((r) => {
                const Icon = r.icon
                const isSelected = formData.role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleSelectRole(r.value)}
                    disabled={isSubmitting}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/40'
                        : 'border-line/70 bg-surface-primary/70 text-ink-secondary hover:border-violet-500/40 hover:bg-surface-primary'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-violet-400 mb-1.5' : 'text-ink-muted mb-1.5'} />
                    <span className="text-xs font-semibold leading-tight">{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Full Name */}
          <Input
            id="register-name"
            label="Full Name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Aarav Singh"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            leftIcon={User}
            disabled={isSubmitting}
            required
          />

          {/* Email Address */}
          <Input
            id="register-email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. you@lumichain.io"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={Mail}
            disabled={isSubmitting}
            required
          />

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-ink-secondary"
            >
              Password
            </label>
            <Input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Minimum 8 chars, 1 uppercase, 1 number"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={Lock}
              disabled={isSubmitting}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-full p-1 text-ink-muted hover:text-ink-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />

            {/* Password strength indicator bar */}
            {password.length > 0 && (
              <div className="pt-1.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Password Strength:</span>
                  <span className={`font-semibold ${strength.textColor}`}>{strength.text}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden bg-surface-hover">
                  <div className={`h-full rounded-full transition-all ${passedCount >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full rounded-full transition-all ${passedCount >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full rounded-full transition-all ${passedCount >= 3 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full rounded-full transition-all ${passedCount >= 4 ? strength.color : 'bg-transparent'}`} />
                </div>

                {/* Password rule checklist */}
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-success-400' : 'text-ink-muted'}`}>
                    {hasMinLength ? <Check size={12} /> : <X size={12} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-success-400' : 'text-ink-muted'}`}>
                    {hasUpper ? <Check size={12} /> : <X size={12} />}
                    <span>Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-success-400' : 'text-ink-muted'}`}>
                    {hasNumber ? <Check size={12} /> : <X size={12} />}
                    <span>At least 1 number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-success-400' : 'text-ink-muted'}`}>
                    {hasSpecial ? <Check size={12} /> : <X size={12} />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-medium text-ink-secondary"
            >
              Confirm Password
            </label>
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={Lock}
              disabled={isSubmitting}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="rounded-full p-1 text-ink-muted hover:text-ink-primary transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3 text-sm font-semibold tracking-wide shadow-lg shadow-violet-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
