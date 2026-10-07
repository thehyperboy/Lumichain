import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  PlusCircle,
  MapPin,
  Camera,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowLeft,
  X,
  Upload,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintsContext'
import { getStreetlights } from '@/services/api'
import {
  Button,
  MapPlaceholder,
  FileUpload,
  useToast,
} from '@/components/ui'
import { cn } from '@/utils'

const ISSUE_TYPES = [
  {
    id: 'Complete Blackout',
    label: 'Complete Blackout',
    urgency: 'Emergency',
    tone: 'danger',
    description: 'Streetlight is completely unlit at night, creating a hazardous dark spot.',
  },
  {
    id: 'Flickering / Buzzing',
    label: 'Flickering / Buzzing',
    urgency: 'High',
    tone: 'warning',
    description: 'Light flickers erratically or emits an audible buzzing electrical sound.',
  },
  {
    id: 'Damaged / Tilted Pole',
    label: 'Damaged / Tilted Pole',
    urgency: 'Critical',
    tone: 'danger',
    description: 'Physical impact from vehicle or soil erosion causing pole to tilt.',
  },
  {
    id: 'Broken Fixture / Exposed Wire',
    label: 'Broken Fixture / Exposed Wire',
    urgency: 'Critical',
    tone: 'danger',
    description: 'Hanging glass or exposed electrical wires accessible to pedestrians.',
  },
  {
    id: 'Low Intensity / Dimming',
    label: 'Low Intensity / Dimming',
    urgency: 'Medium',
    tone: 'info',
    description: 'Light is significantly dimmer than adjacent streetlights.',
  },
  {
    id: 'Daylight Burner (Always ON)',
    label: 'Daylight Burner (Always ON)',
    urgency: 'Low',
    tone: 'neutral',
    description: 'Light remains switched on during bright daylight hours wasting energy.',
  },
]

export default function UserReportFault() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createComplaint } = useComplaints()
  const { toast } = useToast()

  const currentCitizenName = user?.name || 'Ananya Gupta'

  // Streetlights list for location selector
  const [streetlights, setStreetlights] = useState([])
  const [loadingLights, setLoadingLights] = useState(true)
  const [poleSearch, setPoleSearch] = useState('')
  const [selectedStreetlight, setSelectedStreetlight] = useState(null)

  // Form inputs
  const [selectedIssueType, setSelectedIssueType] = useState('Complete Blackout')
  const [description, setDescription] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Success state
  const [createdComplaint, setCreatedComplaint] = useState(null)

  // Load streetlight nodes
  useEffect(() => {
    async function loadNodes() {
      try {
        const data = await getStreetlights()
        setStreetlights(data)
        // Default to first luminaire
        if (data.length > 0) {
          setSelectedStreetlight(data[0])
        }
      } catch (err) {
        console.error('Failed to load streetlight assets:', err)
      } finally {
        setLoadingLights(false)
      }
    }
    loadNodes()
  }, [])

  // Filter streetlights by search input
  const filteredStreetlights = useMemo(() => {
    if (!poleSearch) return streetlights
    const q = poleSearch.toLowerCase()
    return streetlights.filter(
      (s) =>
        s.poleNumber.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.ward.toLowerCase().includes(q),
    )
  }, [streetlights, poleSearch])

  // Form validation
  function validate() {
    const errs = {}
    if (!selectedStreetlight) {
      errs.streetlight = 'Please select a streetlight pole or location.'
    }
    if (!selectedIssueType) {
      errs.issueType = 'Please select an issue type.'
    }
    if (!description.trim() || description.trim().length < 10) {
      errs.description = 'Please provide a detailed description (at least 10 characters).'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle submit
  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    setTimeout(() => {
      const newReport = createComplaint({
        streetlightId: selectedStreetlight.id,
        poleId: selectedStreetlight.poleNumber,
        location: selectedStreetlight.location,
        municipality: selectedStreetlight.municipality || 'New Delhi Municipal Council (NDMC)',
        title: `${selectedIssueType} on ${selectedStreetlight.poleNumber}`,
        description: description.trim(),
        citizenName: currentCitizenName,
        citizenContact: user?.phone || '+91 98112 44321',
        zone: selectedStreetlight.zone,
        ward: selectedStreetlight.ward,
        issueType: selectedIssueType,
        evidenceImages: uploadedImage
          ? [
              {
                id: `ev-cit-${Date.now()}`,
                title: 'Citizen Daylight Incident Photo',
                type: 'BEFORE',
                url: uploadedImage.preview,
                caption: uploadedImage.name || 'Photo captured by reporting citizen.',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              },
            ]
          : [
              {
                id: `ev-cit-${Date.now()}`,
                title: 'Citizen Incident Photo Capture',
                type: 'BEFORE',
                url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
                caption: `Photo evidence logged for ${selectedIssueType} at ${selectedStreetlight.location}`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              },
            ],
      })

      setIsSubmitting(false)
      setCreatedComplaint(newReport)

      toast({
        title: 'Grievance Registered Successfully',
        description: `Ticket ${newReport.id} created and dispatched to municipal operations queue.`,
        variant: 'success',
      })
    }, 450)
  }

  // Preset sample photo helper
  function handleUseSamplePhoto() {
    setUploadedImage({
      name: 'Sample-Night-Blackout.jpg',
      preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    })
  }

  // Reset form
  function handleReset() {
    setCreatedComplaint(null)
    setDescription('')
    setUploadedImage(null)
    setErrors({})
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* â”€â”€ BREADCRUMB â”€â”€ */}
      <div className="flex items-center justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-violet-400">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Public Lighting Fault Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary mt-1">
            Report a Streetlight Problem
          </h1>
        </div>

        <Link to="/user/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-muted">
            <ArrowLeft size={14} />
            My Dashboard
          </Button>
        </Link>
      </div>

      {/* â”€â”€ SUCCESS SCREEN (Requirement 2) â”€â”€ */}
      {createdComplaint ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-surface-card via-surface-card/95 to-emerald-950/20 p-6 sm:p-10 text-center shadow-card space-y-6 animate-in zoom-in-95">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <CheckCircle2 size={40} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Grievance Cryptographically Sealed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink-primary">
              Report Submitted Successfully!
            </h2>
            <p className="text-sm text-ink-secondary max-w-md mx-auto">
              Your grievance has been logged onto the municipal ledger and broadcast to the IoT oracle mesh.
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="rounded-2xl border border-line bg-surface-primary/80 p-5 max-w-md mx-auto space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted uppercase font-mono">Assigned Ticket ID:</span>
              <span className="font-mono text-lg font-black text-violet-400">
                {createdComplaint.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted uppercase font-mono">Luminaire Pole:</span>
              <span className="font-mono font-bold text-ink-primary">
                {createdComplaint.poleId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted uppercase font-mono">Target Resolution SLA:</span>
              <span className="font-mono text-emerald-400 font-semibold">24 Hours Target</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link to={`/user/complaints/${createdComplaint.id}`}>
              <Button variant="primary" size="lg" className="gap-2 font-bold shadow-md">
                <span>Track This Report Live â†’</span>
              </Button>
            </Link>

            <Button variant="secondary" size="lg" onClick={handleReset}>
              Report Another Issue
            </Button>

            <Link to="/user/dashboard">
              <Button variant="ghost" size="lg" className="text-ink-muted">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* â”€â”€ REPORT FORM (Requirement 2) â”€â”€ */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. SELECT LOCATION & POLE */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">
                  1. Select Streetlight Location & Pole
                </h3>
              </div>
              <span className="text-xs font-mono text-ink-muted">Step 1 of 3</span>
            </div>

            {/* Searchable Pole Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Search & Select Luminaire Asset:
              </label>

              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <input
                  type="text"
                  placeholder="Filter by pole ID (e.g. PL-ND-103) or street address..."
                  value={poleSearch}
                  onChange={(e) => setPoleSearch(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-primary pl-9 pr-3 py-2.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Streetlights List Dropdown / Quick Select */}
              <div className="max-h-36 overflow-y-auto rounded-xl border border-line bg-surface-primary/60 divide-y divide-line/40">
                {filteredStreetlights.slice(0, 6).map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      setSelectedStreetlight(node)
                      setErrors((prev) => ({ ...prev, streetlight: null }))
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors',
                      selectedStreetlight?.id === node.id
                        ? 'bg-violet-500/15 text-violet-300 font-semibold'
                        : 'hover:bg-surface-hover/60 text-ink-secondary',
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-violet-400 font-bold">
                        {node.poleNumber}
                      </span>
                      <span className="truncate">{node.location}</span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-muted shrink-0">
                      {node.ward}
                    </span>
                  </button>
                ))}
              </div>

              {errors.streetlight && (
                <p className="text-xs text-danger-400 font-mono">{errors.streetlight}</p>
              )}
            </div>

            {/* Selected Pole Preview & MapPlaceholder */}
            {selectedStreetlight && (
              <div className="space-y-3 pt-2">
                <div className="rounded-xl border border-violet-500/30 bg-surface-primary p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-ink-muted font-mono block text-[10px] uppercase">
                      Selected Pole Asset:
                    </span>
                    <strong className="text-violet-400 font-mono text-sm">
                      {selectedStreetlight.poleNumber} ({selectedStreetlight.id})
                    </strong>
                    <p className="text-ink-secondary mt-0.5">{selectedStreetlight.location}</p>
                  </div>
                  <div className="text-left sm:text-right font-mono text-[11px] text-ink-muted">
                    <div>Coordinates: {selectedStreetlight.lat}, {selectedStreetlight.lng}</div>
                    <div className="text-violet-300">{selectedStreetlight.ward}</div>
                  </div>
                </div>

                {/* MapPlaceholder Requirement */}
                <MapPlaceholder
                  label={`Map Pin: ${selectedStreetlight.poleNumber}`}
                  description={`${selectedStreetlight.location} (${selectedStreetlight.lat}, ${selectedStreetlight.lng})`}
                  className="min-h-[160px]"
                />
              </div>
            )}
          </div>

          {/* 2. CHOOSE ISSUE TYPE */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">
                  2. Choose Fault / Defect Type
                </h3>
              </div>
              <span className="text-xs font-mono text-ink-muted">Step 2 of 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ISSUE_TYPES.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => {
                    setSelectedIssueType(issue.id)
                    setErrors((prev) => ({ ...prev, issueType: null }))
                  }}
                  className={cn(
                    'rounded-xl border p-3.5 text-left transition-all space-y-1',
                    selectedIssueType === issue.id
                      ? 'border-violet-500/50 bg-violet-950/20 ring-1 ring-violet-500/30 shadow-md'
                      : 'border-line bg-surface-primary/70 hover:border-line-strong hover:bg-surface-primary',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-primary">
                      {issue.label}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase',
                        issue.tone === 'danger'
                          ? 'bg-danger-500/20 text-danger-400'
                          : issue.tone === 'warning'
                            ? 'bg-warning-500/20 text-warning-400'
                            : 'bg-violet-500/20 text-violet-400',
                      )}
                    >
                      {issue.urgency}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    {issue.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Describe What You Observed:
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setErrors((prev) => ({ ...prev, description: null }))
                }}
                placeholder="e.g., Streetlight completely dark since yesterday evening. Pedestrian road crossing is pitch black near the bus stop."
                className="w-full rounded-xl border border-line bg-surface-primary p-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-violet-500 focus:outline-none leading-relaxed"
              />
              <div className="flex justify-between text-[10px] text-ink-muted font-mono">
                <span>Minimum 10 characters</span>
                <span>{description.length} characters</span>
              </div>
              {errors.description && (
                <p className="text-xs text-danger-400 font-mono">{errors.description}</p>
              )}
            </div>
          </div>

          {/* 3. IMAGE UPLOAD WITH PREVIEW (Requirement 2) */}
          <div className="rounded-2xl border border-line bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-violet-400" />
                <h3 className="text-base font-bold text-ink-primary">
                  3. Upload Evidence Photo (Optional but Recommended)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className="text-xs text-violet-400 hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} />
                Use Sample Photo
              </button>
            </div>

            {/* File Upload Dropzone */}
            {!uploadedImage ? (
              <FileUpload
                label="Take a photo or upload capture"
                hint="Supports PNG, JPG up to 10MB"
                accept="image/*"
                onChange={(files) => {
                  if (files && files[0]) {
                    const file = files[0]
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      setUploadedImage({
                        name: file.name,
                        preview: e.target.result,
                      })
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            ) : (
              /* Image Preview Box */
              <div className="relative overflow-hidden rounded-xl border border-line bg-surface-primary p-3 space-y-2">
                <div className="relative aspect-video max-h-56 w-full overflow-hidden rounded-lg bg-black/60">
                  <img
                    src={uploadedImage.preview}
                    alt="Upload Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-danger-600 transition-colors"
                    title="Remove Photo"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-mono truncate">{uploadedImage.name}</span>
                  <span className="text-emerald-400 font-semibold">Ready for attachment âœ“</span>
                </div>
              </div>
            )}
          </div>

          {/* â”€â”€ SUBMIT BUTTON â”€â”€ */}
          <div className="flex items-center justify-between pt-2">
            <Link to="/user/dashboard">
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="gap-2 font-bold px-8 shadow-[0_0_15px_rgba(139,92,246,0.35)]"
            >
              <PlusCircle size={16} />
              <span>{isSubmitting ? 'Logging on Municipal Ledger...' : 'Submit Grievance Report'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
