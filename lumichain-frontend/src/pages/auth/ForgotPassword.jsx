import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { mockForgotPassword } from '@/services/authService'
import { AuthLayout } from '@/layouts'
import { Button, Input } from '@/components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setError('Email address is required.')
      return false
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.')
      return false
    }
    setError('')
    return true
  }

  function handleChange(e) {
    setEmail(e.target.value)
    if (error) setError('')
    if (serverError) setServerError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await mockForgotPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      setServerError(err.message || 'Unable to request password reset. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleResetForm() {
    setIsSubmitted(false)
    setEmail('')
    setError('')
    setServerError('')
  }

  return (
    <AuthLayout
      badge="Identity Security"
      heroTitle="Secure Recovery for Municipal Operators"
      heroSubtitle="Verify your identity through encrypted email dispatch to restore administrative control over your assigned grid sectors."
    >
      <div className="card-glass border-line/80 p-7 sm:p-9 shadow-2xl relative">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-ink-primary">
                Reset your password
              </h2>
              <p className="text-sm text-ink-muted">
                Enter your registered email address and we&apos;ll send an authorized recovery link.
              </p>
            </div>

            {/* Server Error */}
            {serverError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-danger-500/40 bg-danger-500/10 p-3.5 text-xs text-danger-400 animate-fade-in"
              >
                <AlertCircle size={17} className="shrink-0 text-danger-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">Request Failed</span>
                  <span>{serverError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="forgot-email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="e.g. admin@lumichain.io"
                value={email}
                onChange={handleChange}
                error={error}
                leftIcon={Mail}
                disabled={isSubmitting}
                required
              />

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
                      Sending Recovery Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-primary transition-colors font-medium"
              >
                <ArrowLeft size={13} />
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="py-4 text-center space-y-5 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-success-500/30 bg-success-500/15 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <CheckCircle2 size={32} className="text-success-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-ink-primary">Check your email</h3>
              <p className="text-sm text-ink-muted max-w-sm mx-auto">
                We&apos;ve sent a password reset token and verification instructions to:
              </p>
              <div className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-violet-300">
                {email}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface-primary/60 p-4 text-left text-xs text-ink-secondary space-y-2">
              <p className="font-semibold text-ink-primary">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-ink-muted">
                <li>Follow the link within 15 minutes to reset your password.</li>
                <li>Ensure you have access to your assigned 2FA municipal device.</li>
                <li>Check your spam folder if the email doesn&apos;t arrive in 2 minutes.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetForm}
                className="w-full sm:w-auto gap-2 text-xs"
              >
                <RefreshCw size={13} />
                Try another email
              </Button>

              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="sm" className="w-full gap-2 text-xs">
                  <ArrowLeft size={13} />
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
