import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Building2,
  Wrench,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext'
import { DEMO_USERS } from '@/mock-data/users'
import { AuthLayout } from '@/layouts'
import { Button, Input } from '@/components/ui'

const ROLE_ICONS = {
  admin: Shield,
  municipality: Building2,
  technician: Wrench,
  user: User,
}

const ROLE_COLORS = {
  admin: 'text-violet-400 border-violet-500/40 bg-violet-500/10 hover:border-violet-400',
  municipality: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400',
  technician: 'text-amber-400 border-amber-500/40 bg-amber-500/10 hover:border-amber-400',
  user: 'text-violet-400 border-violet-500/40 bg-violet-500/10 hover:border-violet-400',
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Form state
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [selectedDemoRole, setSelectedDemoRole] = useState(null)

  // Validate form fields
  function validate() {
    const nextErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field-level error on edit
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (authError) {
      setAuthError('')
    }
  }

  // Handle Quick Demo Fill
  function handleSelectDemo(demoUser) {
    setFormData({
      email: demoUser.email,
      password: demoUser.password,
    })
    setSelectedDemoRole(demoUser.role)
    setErrors({})
    setAuthError('')
  }

  // Handle Form Submission
  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setAuthError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const loggedUser = await login(formData.email, formData.password)

      // Determine redirect path
      const intendedDestination = location.state?.from?.pathname
      const defaultDashboard = getRoleDashboardPath(loggedUser.role)

      // Check if intended path matches user role clearance
      const isMatchingRoleRoute = intendedDestination && intendedDestination.startsWith(`/${loggedUser.role}`)
      const targetUrl = isMatchingRoleRoute ? intendedDestination : defaultDashboard

      navigate(targetUrl, { replace: true })
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // One-click demo login direct action
  async function handleOneClickDemo(demoUser, e) {
    e.stopPropagation()
    handleSelectDemo(demoUser)
    setIsSubmitting(true)
    setAuthError('')
    try {
      const loggedUser = await login(demoUser.email, demoUser.password)
      const defaultDashboard = getRoleDashboardPath(loggedUser.role)
      navigate(defaultDashboard, { replace: true })
    } catch (err) {
      setAuthError(err.message || 'Demo authentication failed.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      badge="Secure Access Gateway"
      heroTitle="Unified Lighting Control & Smart City Operations"
      heroSubtitle="Sign in with your role-specific credentials to monitor grid metrics, dispatch field crews, or audit energy consumption."
    >
      <div className="card-glass border-line/80 p-7 sm:p-9 shadow-2xl relative">
        {/* Header */}
        <div className="mb-6 space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-ink-primary">
            Welcome back
          </h2>
          <p className="text-sm text-ink-muted">
            Enter your credentials to access your designated command console.
          </p>
        </div>

        {/* Global Alert Banner */}
        {authError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-danger-500/40 bg-danger-500/10 p-3.5 text-xs text-danger-400 animate-fade-in"
          >
            <AlertCircle size={17} className="shrink-0 text-danger-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Error</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email field */}
          <Input
            id="login-email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. admin@lumichain.io"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={Mail}
            disabled={isSubmitting}
            required
          />

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-ink-secondary"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                  className="rounded-full p-1 text-ink-muted hover:text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />
          </div>

          {/* Submit button */}
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
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Console
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* â”€â”€ DEMO LOGIN QUICK-FILL SECTION â”€â”€ */}
        <div className="mt-8 pt-6 border-t border-line/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Sparkles size={13} className="text-violet-400" />
              <span>Demo Login Quick-Fill</span>
            </div>
            <span className="text-[11px] text-ink-muted">Click role to populate</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_USERS.map((demo) => {
              const Icon = ROLE_ICONS[demo.role] || User
              const colorClass = ROLE_COLORS[demo.role] || 'text-violet-400 border-line bg-surface-card'
              const isSelected = selectedDemoRole === demo.role && formData.email === demo.email

              return (
                <div
                  key={demo.id}
                  onClick={() => handleSelectDemo(demo)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-2.5 cursor-pointer transition-all duration-150 select-none ${
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/15 ring-1 ring-violet-500/50'
                      : 'border-line/70 bg-surface-primary/70 hover:border-violet-500/40 hover:bg-surface-primary'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectDemo(demo)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
                    >
                      <Icon size={11} />
                      {demo.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={13} className="text-violet-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs font-medium text-ink-primary truncate">
                    {demo.name}
                  </p>
                  <p className="text-[10px] text-ink-muted truncate font-mono">
                    {demo.email}
                  </p>

                  <div className="mt-2 pt-1 border-t border-line/40 flex items-center justify-between">
                    <span className="text-[9px] text-ink-muted font-mono">{demo.password}</span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={(e) => handleOneClickDemo(demo, e)}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-medium hover:underline inline-flex items-center gap-0.5"
                    >
                      Auto-login â†’
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Need an account?{' '}
          <Link
            to="/register"
            className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
