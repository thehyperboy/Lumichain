import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Clock,
  Copy,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  Flame,
  Cpu,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Sparkles,
  Radio,
} from 'lucide-react'
import { getBlockchainTransactions } from '@/services/api'
import {
  Button,
  Pagination,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from '@/components/ui'
import {
  BlockchainTransactionCard,
  BlockchainVerificationModal,
  truncateHash,
} from '@/components/blockchain'
import { EVENT_TYPE_CONFIG } from '@/mock-data/blockchain'
import { cn } from '@/utils'

export default function AdminBlockchainAudit() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEventType, setSelectedEventType] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedComplaintId, setSelectedComplaintId] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Integrity Modal & Clipboard State
  const [selectedTx, setSelectedTx] = useState(null)
  const [copiedHash, setCopiedHash] = useState(null)
  const [copiedWallet, setCopiedWallet] = useState(null)

  // Fetch transactions on mount
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const data = await getBlockchainTransactions()
        if (isMounted) {
          setTransactions(data)
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load blockchain transactions.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Unique Complaint IDs for filter dropdown
  const uniqueComplaints = useMemo(() => {
    const ids = new Set(transactions.map((tx) => tx.complaintId).filter(Boolean))
    return Array.from(ids).sort()
  }, [transactions])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = transactions.length
    const verified = transactions.filter((tx) => tx.verificationStatus === 'VERIFIED').length
    const pending = transactions.filter((tx) => tx.verificationStatus === 'PENDING').length
    const blocksCount = new Set(transactions.map((tx) => tx.blockNumber)).size

    return { total, verified, pending, blocksCount }
  }, [transactions])

  // Filtered and Sorted Dataset
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (tx) =>
          tx.txHash?.toLowerCase().includes(q) ||
          tx.walletAddress?.toLowerCase().includes(q) ||
          tx.actor?.toLowerCase().includes(q) ||
          tx.complaintId?.toLowerCase().includes(q) ||
          String(tx.blockNumber).includes(q),
      )
    }

    // Event type
    if (selectedEventType !== 'ALL') {
      result = result.filter((tx) => tx.eventType === selectedEventType)
    }

    // Status
    if (selectedStatus !== 'ALL') {
      result = result.filter((tx) => tx.verificationStatus === selectedStatus)
    }

    // Complaint ID
    if (selectedComplaintId !== 'ALL') {
      result = result.filter((tx) => tx.complaintId === selectedComplaintId)
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })

    return result
  }, [transactions, searchQuery, selectedEventType, selectedStatus, selectedComplaintId, sortOrder])

  // Paginated Slices
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTransactions.slice(start, start + pageSize)
  }, [filteredTransactions, currentPage, pageSize])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedEventType, selectedStatus, selectedComplaintId, sortOrder])

  // Copy handlers
  function handleCopyTxHash(hash, id) {
    navigator.clipboard?.writeText(hash)
    setCopiedHash(id)
    toast({
      title: 'Tx Hash Copied',
      description: truncateHash(hash, 10, 8),
      variant: 'info',
    })
    setTimeout(() => setCopiedHash(null), 1800)
  }

  function handleCopyWallet(wallet, id) {
    navigator.clipboard?.writeText(wallet)
    setCopiedWallet(id)
    toast({
      title: 'Wallet Address Copied',
      description: truncateHash(wallet, 8, 6),
      variant: 'info',
    })
    setTimeout(() => setCopiedWallet(null), 1800)
  }

  function handleResetFilters() {
    setSearchQuery('')
    setSelectedEventType('ALL')
    setSelectedStatus('ALL')
    setSelectedComplaintId('ALL')
    setSortOrder('newest')
  }

  if (loading) {
    return (
      <div className="py-24">
        <LoadingState message="Connecting to municipal blockchain RPC node..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-glass border-line/60 p-12 text-center">
        <ErrorState
          title="Blockchain RPC Connection Failure"
          message={error}
          action={
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry Connection
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" />
              LumiChain zkEVM L2 Explorer
            </span>
            <span className="text-xs text-ink-muted">Â· Block Height #19,842,214</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            Blockchain Audit Logs & State Ledger
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Cryptographically sealed timeline of streetlight fault detections, technician work order dispatches, and citizen resolution approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-line/70 bg-surface-card/80 px-3.5 py-2 text-xs font-mono text-ink-muted flex items-center gap-2 shadow-sm">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Contract: <strong className="text-violet-400">0x8a92...3F0d</strong></span>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards (Requirement 2) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Transactions */}
        <div className="card-glass border-line/60 p-4 transition-all hover:border-violet-500/40">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Total Transactions</span>
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink-primary">
            {metrics.total}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Across {metrics.blocksCount} confirmed blocks
          </span>
        </div>

        {/* Verified Transactions */}
        <div className="card-glass border-line/60 p-4 transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Cryptographically Verified</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {metrics.verified}
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-0.5 block flex items-center gap-1">
            <Check className="h-3 w-3" /> 100% Merkle Root Match
          </span>
        </div>

        {/* Pending Transactions */}
        <div className="card-glass border-line/60 p-4 transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Pending Mempool</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {metrics.pending}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Awaiting next batch rollup
          </span>
        </div>

        {/* Gas & Consensus Rate */}
        <div className="card-glass border-line/60 p-4 transition-all hover:border-purple-500/30">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium">
            <span>Network Efficiency</span>
            <Flame className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink-primary">
            44.2k <span className="text-xs text-ink-muted font-normal">gwei avg</span>
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            PBFT Zero-Knowledge Finality
          </span>
        </div>
      </div>

      {/* Filter and Search Controls (Requirement 2) */}
      <div className="card-glass border-line/70 p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search by tx hash, wallet, actor */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by Tx Hash (0x...), Wallet, Actor, Ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-surface-card/90 py-2 pl-9 pr-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center rounded-lg border border-line/60 bg-surface-subtle p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  viewMode === 'table'
                    ? 'bg-surface-card text-violet-400 shadow-sm'
                    : 'text-ink-muted hover:text-ink-primary',
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  viewMode === 'cards'
                    ? 'bg-surface-card text-violet-400 shadow-sm'
                    : 'text-ink-muted hover:text-ink-primary',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Event Type, Complaint ID, Status, Date Sorting */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 pt-2 border-t border-line/40 text-xs">
          {/* Event Type Filter */}
          <div>
            <label className="text-[11px] font-medium text-ink-muted block mb-1">
              Event Type
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-surface-card py-1.5 px-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="FAILURE_DETECTED">Failure Detected</option>
              <option value="COMPLAINT_CREATED">Complaint Created</option>
              <option value="MUNICIPALITY_NOTIFIED">Municipality Notified</option>
              <option value="TECHNICIAN_ASSIGNED">Technician Assigned</option>
              <option value="REPAIR_COMPLETED">Repair Completed</option>
              <option value="REPAIR_VERIFIED">Repair Verified</option>
              <option value="COMPLAINT_CLOSED">Complaint Closed</option>
            </select>
          </div>

          {/* Complaint ID Filter */}
          <div>
            <label className="text-[11px] font-medium text-ink-muted block mb-1">
              Complaint Ticket
            </label>
            <select
              value={selectedComplaintId}
              onChange={(e) => setSelectedComplaintId(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-surface-card py-1.5 px-2.5 text-xs text-ink-primary font-mono focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Complaints</option>
              {uniqueComplaints.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-medium text-ink-muted block mb-1">
              Audit Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-surface-card py-1.5 px-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>

          {/* Date Sorting */}
          <div>
            <label className="text-[11px] font-medium text-ink-muted block mb-1">
              Timestamp Sort
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-surface-card py-1.5 px-2.5 text-xs text-ink-primary focus:border-violet-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end col-span-2 sm:col-span-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="w-full text-xs gap-1 py-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table View or Cards View */}
      {filteredTransactions.length === 0 ? (
        <div className="card-glass border-line/60 p-12 text-center">
          <EmptyState
            icon={ShieldAlert}
            title="No blockchain transactions found"
            description="No on-chain audit records match your selected search query or event filters."
            action={
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Active Filters
              </Button>
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="card-glass overflow-hidden rounded-2xl border border-line/70 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line/60 bg-surface-subtle/80 text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
                <tr>
                  <th className="py-3.5 pl-4 pr-3">Tx Hash</th>
                  <th className="px-3 py-3.5">Block #</th>
                  <th className="px-3 py-3.5">Event Type</th>
                  <th className="px-3 py-3.5">Complaint ID</th>
                  <th className="px-3 py-3.5">Signer / Actor</th>
                  <th className="px-3 py-3.5">Timestamp</th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Integrity Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-mono">
                {paginatedTransactions.map((tx) => {
                  const eventConfig = EVENT_TYPE_CONFIG[tx.eventType] || {
                    label: tx.eventType,
                    bg: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
                  }

                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-surface-subtle/50"
                    >
                      {/* Truncated Hash with hover tooltip & copy */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-bold text-violet-400 hover:text-violet-300 cursor-help"
                            title={tx.txHash}
                          >
                            {truncateHash(tx.txHash, 6, 4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTxHash(tx.txHash, tx.id)}
                            className="text-ink-muted hover:text-violet-400 transition-colors p-0.5"
                            title="Copy full transaction hash"
                          >
                            {copiedHash === tx.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Block # */}
                      <td className="px-3 py-3 text-ink-secondary">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Layers className="h-3 w-3 text-violet-400" />
                          #{tx.blockNumber}
                        </span>
                      </td>

                      {/* Event Type Badge */}
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-sans font-semibold',
                            eventConfig.bg,
                          )}
                        >
                          {eventConfig.label}
                        </span>
                      </td>

                      {/* Complaint ID link */}
                      <td className="px-3 py-3">
                        <Link
                          to={`/admin/complaints/${tx.complaintId}`}
                          className="font-bold text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <span>{tx.complaintId}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>

                      {/* Signer / Actor */}
                      <td className="px-3 py-3 font-sans">
                        <div className="text-xs font-semibold text-ink-primary truncate max-w-[150px]">
                          {tx.actor}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-ink-muted">
                          <span title={tx.walletAddress}>
                            {truncateHash(tx.walletAddress, 6, 4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyWallet(tx.walletAddress, tx.id)}
                            className="hover:text-violet-400 transition-colors"
                            title="Copy wallet address"
                          >
                            {copiedWallet === tx.id ? (
                              <Check className="h-2.5 w-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-2.5 w-2.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-3 py-3 text-[11px] text-ink-muted font-sans whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{tx.timestamp}</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="px-3 py-3 text-center">
                        {tx.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <ShieldCheck className="h-3 w-3" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                            <ShieldAlert className="h-3 w-3" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions: Verify Integrity */}
                      <td className="py-3 pl-3 pr-4 text-right font-sans">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          className="text-xs gap-1 hover:border-violet-500/40 hover:text-violet-400 py-1 px-2.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                          <span>Verify</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-4 border-t border-line/60 bg-surface-subtle/30 flex items-center justify-between">
            <span className="text-xs text-ink-muted font-mono">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} logs
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedTransactions.map((tx) => (
              <BlockchainTransactionCard
                key={tx.id}
                tx={tx}
                onVerify={setSelectedTx}
                complaintLinkBase="/admin/complaints"
              />
            ))}
          </div>

          {/* Card View Pagination */}
          <div className="p-4 card-glass border-line/60 flex items-center justify-between">
            <span className="text-xs text-ink-muted font-mono">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} transactions
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Cryptographic Integrity Result Modal (Requirement 3) */}
      <BlockchainVerificationModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </div>
  )
}
