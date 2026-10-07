import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Layers,
  Zap,
  Wrench,
  Clock,
  ExternalLink,
  ShieldCheck,
  Radio,
  RotateCcw,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import { Button, EmptyState } from '@/components/ui'
import { cn } from '@/utils'

export default function NotificationsPage({ roleTitle = 'Platform' }) {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    resetToDefault,
  } = useNotifications()

  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'UNREAD' | 'FAULT' | 'BLOCKCHAIN' | 'WORK_ORDER'

  const filteredList = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'UNREAD') return !n.read
      if (activeFilter === 'FAULT') return n.category === 'FAULT' || n.type === 'danger'
      if (activeFilter === 'BLOCKCHAIN') return n.category === 'BLOCKCHAIN'
      if (activeFilter === 'WORK_ORDER') return n.category === 'WORK_ORDER' || n.category === 'DISPATCH' || n.category === 'REPAIR'
      return true
    })
  }, [notifications, activeFilter])

  function getCategoryIcon(notif) {
    if (notif.category === 'FAULT' || notif.type === 'danger') {
      return <AlertTriangle className="h-5 w-5 text-rose-400" />
    }
    if (notif.category === 'BLOCKCHAIN') {
      return <Layers className="h-5 w-5 text-violet-400" />
    }
    if (notif.category === 'ENERGY') {
      return <Zap className="h-5 w-5 text-emerald-400" />
    }
    if (notif.category === 'WORK_ORDER' || notif.category === 'DISPATCH' || notif.category === 'REPAIR') {
      return <Wrench className="h-5 w-5 text-purple-400" />
    }
    if (notif.category === 'SLA') {
      return <Clock className="h-5 w-5 text-amber-400" />
    }
    return <Bell className="h-5 w-5 text-violet-400" />
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Live Oracle Dispatch Feed
            </span>
            <span className="text-xs text-ink-muted">Â· {unreadCount} Unread Alerts</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            {roleTitle} Notifications & Alerts
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Real-time telemetry pings, blockchain rollup receipts, SLA status alerts, and work order transitions.
          </p>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>Mark All as Read</span>
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs text-ink-muted hover:text-danger-400 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Feed</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="text-xs text-ink-muted hover:text-ink-primary gap-1.5"
            title="Reset to default mock feed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-subtle/80 border border-line/50 text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold transition-all',
            activeFilter === 'ALL'
              ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
              : 'text-ink-muted hover:text-ink-primary',
          )}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('UNREAD')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
            activeFilter === 'UNREAD'
              ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
              : 'text-ink-muted hover:text-ink-primary',
          )}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-violet-400/20 px-1.5 py-0.2 text-[10px] font-mono">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('FAULT')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold transition-all',
            activeFilter === 'FAULT'
              ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
              : 'text-ink-muted hover:text-ink-primary',
          )}
        >
          Faults & Alerts
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('BLOCKCHAIN')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold transition-all',
            activeFilter === 'BLOCKCHAIN'
              ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
              : 'text-ink-muted hover:text-ink-primary',
          )}
        >
          Blockchain Events
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('WORK_ORDER')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold transition-all',
            activeFilter === 'WORK_ORDER'
              ? 'bg-violet-500 text-ink-primary shadow-md shadow-violet-500/20'
              : 'text-ink-muted hover:text-ink-primary',
          )}
        >
          Work Orders & Dispatch
        </button>
      </div>

      {/* Notifications List */}
      {filteredList.length === 0 ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <EmptyState
            icon={Inbox}
            title="No notifications in this view"
            description="All alerts have been reviewed or cleared. New IoT events will stream in automatically."
            action={
              <Button variant="outline" size="sm" onClick={() => setActiveFilter('ALL')}>
                View All Notifications
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((notif) => (
            <article
              key={notif.id}
              className={cn(
                'card-glass relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 transition-all border-line/70 hover:border-violet-500/40 hover:shadow-md',
                !notif.read && 'border-violet-500/30 bg-gradient-to-r from-surface-card via-surface-card to-violet-950/15',
              )}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm',
                    notif.type === 'danger'
                      ? 'border-rose-500/30 bg-rose-500/10'
                      : notif.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : notif.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-violet-500/30 bg-violet-500/10',
                  )}
                >
                  {getCategoryIcon(notif)}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-ink-primary">
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.2 text-[10px] font-mono font-bold text-violet-300">
                        NEW
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-ink-muted">
                      Â· {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed max-w-2xl">
                    {notif.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {notif.link && (
                  <Link to={notif.link}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs gap-1.5 hover:text-violet-400"
                    >
                      <span>View Details</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                )}

                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notif.id)}
                    aria-label="Mark notification as read"
                    className="p-1.5 rounded-lg text-ink-muted hover:text-violet-400 hover:bg-surface-subtle transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => deleteNotification(notif.id)}
                  aria-label="Delete notification"
                  className="p-1.5 rounded-lg text-ink-muted hover:text-danger-400 hover:bg-surface-subtle transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
