import { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Shield,
  Building2,
  Wrench,
  User,
  MoreVertical,
  CheckCircle2,
  Lock,
  PlusCircle,
  Mail,
  UserCheck,
} from 'lucide-react'
import { DEMO_USERS } from '@/mock-data/users'
import { useTableControls } from '@/hooks'
import {
  Button,
  Pagination,
  EmptyState,
  ConfirmationModal,
  UserAvatar,
  useToast,
} from '@/components'
import { cn } from '@/utils'

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', icon: Shield },
  municipality: { label: 'Municipality', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Building2 },
  technician: { label: 'Technician', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Wrench },
  user: { label: 'Resident', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: User },
}

export default function AdminUsers() {
  const { toast } = useToast()
  const [usersList, setUsersList] = useState(DEMO_USERS)
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalAction, setModalAction] = useState(null) // 'deactivate' | 'edit_role'

  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    resetFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    filteredCount,
  } = useTableControls({
    data: usersList,
    searchFields: ['name', 'email', 'department', 'role'],
    initialFilters: { role: 'ALL' },
    pageSize: 8,
  })

  function handleConfirmDeactivate() {
    if (!selectedUser) return
    toast({
      title: 'User Access Revoked',
      description: `Account for ${selectedUser.name} (${selectedUser.email}) has been deactivated.`,
      variant: 'warning',
    })
    setSelectedUser(null)
    setModalAction(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              <Users className="h-3 w-3" />
              Identity & Access Management (IAM)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            User Directory & Access Control
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage administrative credentials, municipal officers, certified field engineers, and verified resident accounts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            toast({
              title: 'Invitation Dispatch',
              description: 'Sending new onboarding link to municipal personnel.',
              variant: 'info',
            })
          }}
          className="text-xs gap-1.5 font-bold shadow-md shadow-violet-500/20"
        >
          <PlusCircle size={14} />
          <span>Invite New User</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-glass border-line/70 p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-surface-card/90 py-2 pl-9 pr-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted font-medium">Filter Role:</span>
            <select
              value={filters.role}
              onChange={(e) => setFilter('role', e.target.value)}
              className="rounded-xl border border-line/60 bg-surface-card py-1.5 px-3 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Roles ({usersList.length})</option>
              <option value="admin">Administrator</option>
              <option value="municipality">Municipality Officer</option>
              <option value="technician">Field Specialist</option>
              <option value="user">Resident Citizen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {paginatedData.length === 0 ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <EmptyState
            icon={Users}
            title="No users found"
            description="No user accounts match your search filter."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Search Filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card-glass overflow-hidden rounded-2xl border border-line/70 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line/60 bg-surface-subtle/80 text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
                <tr>
                  <th className="py-3.5 pl-4 pr-3">User Profile</th>
                  <th className="px-3 py-3.5">System Role</th>
                  <th className="px-3 py-3.5">Department / Jurisdiction</th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {paginatedData.map((u) => {
                  const roleMeta = ROLE_CONFIG[u.role] || ROLE_CONFIG.user
                  const RoleIcon = roleMeta.icon

                  return (
                    <tr key={u.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} size="sm" />
                          <div>
                            <span className="font-semibold text-ink-primary text-xs block">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-ink-muted font-mono flex items-center gap-1 mt-0.5">
                              <Mail size={11} />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
                            roleMeta.color,
                          )}
                        >
                          <RoleIcon size={12} />
                          <span>{roleMeta.label}</span>
                        </span>
                      </td>

                      <td className="px-3 py-3 text-ink-secondary text-xs">
                        <span className="font-medium">{u.department || 'General Administration'}</span>
                        {u.ward && (
                          <span className="block text-[10px] text-ink-muted font-mono mt-0.5">
                            {u.ward}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 size={11} />
                          Active
                        </span>
                      </td>

                      <td className="py-3 pl-3 pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u)
                            setModalAction('deactivate')
                          }}
                          className="text-xs text-ink-muted hover:text-danger-400 p-1"
                          title="Revoke User Access"
                        >
                          <Lock size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-line/60 bg-surface-subtle/30 flex items-center justify-between">
              <span className="text-xs text-ink-muted font-mono">
                Showing {filteredCount} users
              </span>
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction === 'deactivate'}
        onClose={() => {
          setSelectedUser(null)
          setModalAction(null)
        }}
        onConfirm={handleConfirmDeactivate}
        title="Revoke Account Permissions"
        description={`Are you sure you want to suspend system access for ${selectedUser?.name}? They will be unable to log in until reinstated.`}
        confirmText="Suspend Access"
        variant="danger"
      />
    </div>
  )
}
