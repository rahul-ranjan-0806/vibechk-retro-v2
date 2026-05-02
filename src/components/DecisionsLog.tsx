import { useEffect, useMemo, useState, type ReactNode } from "react"
import { CANDIDATES, ROLES, ALTS_MINI, roleTitle } from "@/lib/mockData"
import { AnimatedSelect } from "@/components/ui/animated-select"

// ── Decision categories ────────────────────────────────────────

type DecisionType =
  | "stellar"
  | "dilemma"
  | "shortlisted"
  | "rejected"
  | "jd_drafted"
  | "memory_suggestion"
  | "role_published"

interface DecisionEntry {
  id: string
  type: DecisionType
  altId: string
  timeAgo: string
  // Candidate-related
  candidateName?: string
  roleId?: string
  score?: number
  reasoning?: string
  // JD-related
  jdSources?: string[]
  jdSummary?: string
  // Memory-related
  memoryFact?: string
  memorySource?: string
  // Role-published
  roleStatus?: string
}

const ALT_FOR_ROLE: Record<string, string> = {
  r1: "sashank",
  r2: "sashank",
  r3: "kinnari",
}

// Build the log from real candidates + a few synthetic non-candidate entries
function buildDecisions(): DecisionEntry[] {
  const out: DecisionEntry[] = []

  for (const c of CANDIDATES) {
    const altId = ALT_FOR_ROLE[c.roleId] ?? "sashank"
    const base = {
      id: `cand-${c.id}`,
      altId,
      timeAgo: c.completedAt,
      candidateName: c.name,
      roleId: c.roleId,
      score: c.score,
      reasoning: c.reasoning,
    }
    if (c.score >= 9 && c.status === "shortlisted") {
      out.push({ ...base, type: "stellar" })
    } else if (c.status === "shortlisted") {
      out.push({ ...base, type: "shortlisted" })
    } else if (c.status === "rejected") {
      out.push({ ...base, type: "rejected" })
    } else if (c.status === "pending") {
      out.push({ ...base, type: "dilemma" })
    }
  }

  // Synthetic non-candidate entries
  out.push({
    id: "jd-r1",
    type: "jd_drafted",
    altId: "sashank",
    timeAgo: "5h ago",
    roleId: "r1",
    jdSources: ["Slack #hiring", "LinkedIn template", "Existing Sr. PM role"],
    jdSummary: "Drafted JD for Sr. Product Designer from 3 sources. 4 eval criteria generated.",
  })
  out.push({
    id: "jd-r2",
    type: "jd_drafted",
    altId: "sashank",
    timeAgo: "2d ago",
    roleId: "r2",
    jdSources: ["Founding eng spec doc", "Notion handbook"],
    jdSummary: "Drafted JD for Founding Engineer based on spec doc + handbook.",
  })
  out.push({
    id: "mem-1",
    type: "memory_suggestion",
    altId: "sashank",
    timeAgo: "8h ago",
    memoryFact: "Sashank prefers candidates who can articulate trade-offs over those who default to 'best practices'.",
    memorySource: "Slack thread · #design-hiring",
  })
  out.push({
    id: "mem-2",
    type: "memory_suggestion",
    altId: "sashank",
    timeAgo: "1d ago",
    memoryFact: "Avoid candidates from agencies — pace mismatch with startup environment.",
    memorySource: "Email · review notes from last cycle",
  })
  out.push({
    id: "mem-3",
    type: "memory_suggestion",
    altId: "kinnari",
    timeAgo: "3d ago",
    memoryFact: "PMM hires should have shipped a public-facing launch; audit history matters.",
    memorySource: "Notion · 'PMM hiring criteria'",
  })
  out.push({
    id: "role-pub-r3",
    type: "role_published",
    altId: "kinnari",
    timeAgo: "2d ago",
    roleId: "r3",
    roleStatus: "live",
  })

  return out
}

// ── Visual category config ────────────────────────────────────

interface CategoryStyle {
  icon: ReactNode
  label: string
  iconBg: string
  iconFg: string
  accent: string  // border-l accent color
  chipBg: string  // filter chip active bg
  chipFg: string  // filter chip active fg
}

function StellarIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
}
function DilemmaIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
}
function FileIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
}
function BrainIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 0 1 12 18Z"/></svg>
}
function RocketIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>
}

const CATEGORY: Record<DecisionType, CategoryStyle> = {
  stellar:           { icon: <StellarIcon />,  label: "Stellar",          iconBg: "bg-amber-100 dark:bg-amber-500/20",       iconFg: "text-amber-700 dark:text-amber-300",        accent: "border-amber-400/70",  chipBg: "bg-amber-100 dark:bg-amber-500/20",       chipFg: "text-amber-700 dark:text-amber-300" },
  dilemma:           { icon: <DilemmaIcon />,  label: "Dilemma",          iconBg: "bg-status-warning",                       iconFg: "text-status-warning-foreground",            accent: "border-status-warning-dot/70", chipBg: "bg-status-warning",                  chipFg: "text-status-warning-foreground" },
  shortlisted:       { icon: <CheckIcon />,    label: "Auto-shortlisted", iconBg: "bg-status-success",                       iconFg: "text-status-success-foreground",            accent: "border-status-success-dot/60", chipBg: "bg-status-success",                  chipFg: "text-status-success-foreground" },
  rejected:          { icon: <XIcon />,        label: "Auto-rejected",    iconBg: "bg-status-danger",                        iconFg: "text-status-danger-foreground",             accent: "border-status-danger-dot/60",  chipBg: "bg-status-danger",                   chipFg: "text-status-danger-foreground" },
  jd_drafted:        { icon: <FileIcon />,     label: "JD drafted",       iconBg: "bg-muted",                                iconFg: "text-foreground",                           accent: "border-border",                chipBg: "bg-muted",                            chipFg: "text-foreground" },
  memory_suggestion: { icon: <BrainIcon />,    label: "Memory",           iconBg: "bg-purple-100 dark:bg-purple-500/20",     iconFg: "text-purple-700 dark:text-purple-300",      accent: "border-purple-400/60", chipBg: "bg-purple-100 dark:bg-purple-500/20",  chipFg: "text-purple-700 dark:text-purple-300" },
  role_published:    { icon: <RocketIcon />,   label: "Role published",   iconBg: "bg-accent-blue/15",                       iconFg: "text-accent-blue",                          accent: "border-accent-blue/50",chipBg: "bg-accent-blue/15",                   chipFg: "text-accent-blue" },
}

// ── Time helpers ──────────────────────────────────────────────

type TimeWindow = "all" | "today" | "week" | "month"

const TIME_LABELS: Record<TimeWindow, string> = {
  all: "All time", today: "Today", week: "Past week", month: "Past month",
}

function relativeToHours(rel: string): number {
  const m = rel.match(/(\d+)\s*(min|h|d|w)/i)
  if (!m) return Number.MAX_SAFE_INTEGER
  const n = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()
  if (unit === "min") return n / 60
  if (unit === "h") return n
  if (unit === "d") return n * 24
  if (unit === "w") return n * 24 * 7
  return n
}

function withinWindow(rel: string, win: TimeWindow): boolean {
  if (win === "all") return true
  const hours = relativeToHours(rel)
  if (win === "today") return hours < 24
  if (win === "week") return hours <= 24 * 7
  if (win === "month") return hours <= 24 * 30
  return true
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onNavigateToCandidate?: (name: string, mockRoleId: string) => void
  onNavigateToRole?: (mockRoleId: string) => void
  onOpenOverlay?: (prefill?: string) => void
}

const CATEGORY_FILTERS: { id: DecisionType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "stellar", label: "Stellar" },
  { id: "dilemma", label: "Dilemmas" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "rejected", label: "Rejected" },
  { id: "jd_drafted", label: "JD activity" },
  { id: "memory_suggestion", label: "Memories" },
  { id: "role_published", label: "Roles" },
]

export function DecisionsLog({ open, onClose, onNavigateToCandidate, onNavigateToRole, onOpenOverlay }: Props) {
  const [altFilter, setAltFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<TimeWindow>("all")
  const [categoryFilter, setCategoryFilter] = useState<DecisionType | "all">("all")
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, onClose])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const all = useMemo(() => buildDecisions(), [])

  const filtered = useMemo(() => {
    return all
      .filter(d => categoryFilter === "all" || d.type === categoryFilter)
      .filter(d => altFilter === "all" || d.altId === altFilter)
      .filter(d => withinWindow(d.timeAgo, timeFilter))
      .sort((a, b) => relativeToHours(a.timeAgo) - relativeToHours(b.timeAgo))
  }, [all, categoryFilter, altFilter, timeFilter])

  // Counts per category for the chip badges
  const counts = useMemo(() => {
    const base: Record<string, number> = { all: all.length }
    for (const d of all) base[d.type] = (base[d.type] ?? 0) + 1
    return base
  }, [all])

  return (
    <>
      {/* Backdrop — darken */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-background border-l border-border shadow-modal flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="shrink-0 px-5 h-12 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold">Activity</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              · {filtered.length} of {all.length}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted/60" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Category chips */}
        <div className="shrink-0 px-5 pt-3 flex items-center gap-1 flex-wrap">
          {CATEGORY_FILTERS.map(f => {
            const count = counts[f.id] ?? 0
            const active = categoryFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`text-xs px-2 py-1 rounded-sm border transition-colors ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}
              >
                {f.label}
                <span className="ml-1 opacity-60 tabular-nums">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Secondary filters */}
        <div className="shrink-0 px-5 py-3 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Alt</span>
            <AnimatedSelect
              size="sm"
              value={altFilter}
              onChange={setAltFilter}
              options={[
                { value: "all", label: "All" },
                ...ALTS_MINI.map(a => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Time</span>
            <AnimatedSelect<TimeWindow>
              size="sm"
              value={timeFilter}
              onChange={setTimeFilter}
              options={(Object.keys(TIME_LABELS) as TimeWindow[]).map(t => ({ value: t, label: TIME_LABELS[t] }))}
            />
          </div>
          {(altFilter !== "all" || timeFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={() => { setAltFilter("all"); setTimeFilter("all"); setCategoryFilter("all") }}
              className="ml-auto text-muted-foreground hover:text-foreground underline"
            >
              Reset
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto border-t border-border">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-muted-foreground">
              <p className="text-sm">No activity matches these filters</p>
              <p className="text-xs mt-1">Try a wider time window or different category.</p>
            </div>
          ) : (
            filtered.map((d, i) => (
              <DecisionRow
                key={d.id}
                d={d}
                isFirst={i === 0}
                onNavigateToCandidate={onNavigateToCandidate}
                onNavigateToRole={onNavigateToRole}
                onOpenOverlay={onOpenOverlay}
                onToast={setToast}
                onClose={onClose}
              />
            ))
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-sm bg-foreground text-background text-xs shadow-modal z-10">
            {toast}
          </div>
        )}
      </aside>
    </>
  )
}

// ── Row ───────────────────────────────────────────────────────

interface RowProps {
  d: DecisionEntry
  isFirst: boolean
  onNavigateToCandidate?: (name: string, mockRoleId: string) => void
  onNavigateToRole?: (mockRoleId: string) => void
  onOpenOverlay?: (prefill?: string) => void
  onToast: (msg: string) => void
  onClose: () => void
}

function DecisionRow({ d, isFirst, onNavigateToCandidate, onNavigateToRole, onOpenOverlay, onToast, onClose }: RowProps) {
  const cat = CATEGORY[d.type]
  const alt = ALTS_MINI.find(a => a.id === d.altId)
  const role = d.roleId ? ROLES.find(r => r.id === d.roleId) : null

  return (
    <div className={`flex items-start gap-3 px-5 py-3.5 border-l-2 ${cat.accent} hover:bg-muted/30 transition-colors ${!isFirst ? "border-t border-border/60" : ""}`}>
      {/* Icon */}
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${cat.iconBg} ${cat.iconFg}`}>
        {cat.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[11px] font-semibold ${cat.iconFg}`}>{cat.label}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{alt?.name ?? "Alt"}</span>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">{d.timeAgo}</span>
        </div>

        {/* Title + body */}
        {renderBody(d, role)}

        {/* CTAs */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {renderCTAs(d, { onNavigateToCandidate, onNavigateToRole, onOpenOverlay, onToast, onClose })}
        </div>
      </div>
    </div>
  )
}

function renderBody(d: DecisionEntry, role: typeof ROLES[number] | null | undefined): ReactNode {
  switch (d.type) {
    case "stellar":
    case "dilemma":
    case "shortlisted":
    case "rejected":
      return (
        <>
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium truncate">{d.candidateName}</p>
            {d.score !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">{d.score}/10</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{role?.title ?? roleTitle(d.roleId ?? "")}</p>
          {d.reasoning && <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{d.reasoning}</p>}
        </>
      )
    case "jd_drafted":
      return (
        <>
          <p className="text-sm font-medium truncate">{role?.title ?? roleTitle(d.roleId ?? "")}</p>
          <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{d.jdSummary}</p>
          {d.jdSources && (
            <p className="text-xs text-muted-foreground mt-1">
              Sources: {d.jdSources.join(" · ")}
            </p>
          )}
        </>
      )
    case "memory_suggestion":
      return (
        <>
          <p className="text-sm text-foreground leading-relaxed">"{d.memoryFact}"</p>
          {d.memorySource && <p className="text-xs text-muted-foreground mt-1">From: {d.memorySource}</p>}
        </>
      )
    case "role_published":
      return (
        <>
          <p className="text-sm font-medium truncate">{role?.title ?? roleTitle(d.roleId ?? "")}</p>
          <p className="text-xs text-foreground/80 mt-0.5">Role published. Interview link is live and accepting applicants.</p>
        </>
      )
  }
}

interface ActionCtx {
  onNavigateToCandidate?: (name: string, mockRoleId: string) => void
  onNavigateToRole?: (mockRoleId: string) => void
  onOpenOverlay?: (prefill?: string) => void
  onToast: (msg: string) => void
  onClose: () => void
}

function CtaButton({ children, onClick, variant = "secondary" }: { children: ReactNode; onClick: () => void; variant?: "primary" | "secondary" | "ghost" }) {
  const cls = variant === "primary"
    ? "bg-foreground text-background hover:opacity-90"
    : variant === "ghost"
      ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      : "border border-border text-foreground hover:bg-muted/60"
  return (
    <button onClick={onClick} className={`text-xs rounded-sm px-2.5 py-1 transition-colors ${cls}`}>
      {children}
    </button>
  )
}

function renderCTAs(d: DecisionEntry, ctx: ActionCtx): ReactNode {
  const navCand = () => {
    if (d.candidateName && d.roleId && ctx.onNavigateToCandidate) {
      ctx.onNavigateToCandidate(d.candidateName, d.roleId)
      ctx.onClose()
    }
  }
  const navRole = () => {
    if (d.roleId && ctx.onNavigateToRole) {
      ctx.onNavigateToRole(d.roleId)
      ctx.onClose()
    }
  }
  const ask = (q: string) => {
    ctx.onOpenOverlay?.(q)
    ctx.onClose()
  }

  switch (d.type) {
    case "stellar":
      return <>
        <CtaButton variant="primary" onClick={navCand}>Open candidate</CtaButton>
        <CtaButton onClick={() => ctx.onToast("Loop-in message drafted")}>Loop in team</CtaButton>
        <CtaButton variant="ghost" onClick={() => ask(`What stood out about ${d.candidateName}?`)}>Discuss with Sabu</CtaButton>
      </>
    case "dilemma":
      return <>
        <CtaButton variant="primary" onClick={navCand}>Open transcript</CtaButton>
        <CtaButton onClick={() => ctx.onToast(`${d.candidateName} shortlisted`)}>Shortlist</CtaButton>
        <CtaButton onClick={() => ctx.onToast(`${d.candidateName} rejected`)}>Reject</CtaButton>
        <CtaButton variant="ghost" onClick={() => ask(`Why did you flag ${d.candidateName}?`)}>Discuss</CtaButton>
      </>
    case "shortlisted":
      return <>
        <CtaButton variant="primary" onClick={navCand}>Open in role</CtaButton>
        <CtaButton onClick={() => ctx.onToast("Welcome message drafted")}>Draft welcome</CtaButton>
      </>
    case "rejected":
      return <>
        <CtaButton variant="primary" onClick={navCand}>Open in role</CtaButton>
        <CtaButton onClick={() => ctx.onToast("Rejection email drafted")}>Send rejection</CtaButton>
      </>
    case "jd_drafted":
      return <>
        <CtaButton variant="primary" onClick={navRole}>Edit JD</CtaButton>
        <CtaButton onClick={navRole}>Open role</CtaButton>
        <CtaButton variant="ghost" onClick={() => ctx.onToast("Sources opened")}>View sources</CtaButton>
      </>
    case "memory_suggestion":
      return <>
        <CtaButton variant="primary" onClick={() => ctx.onToast("Added to Alt's memory")}>Add to Alt</CtaButton>
        <CtaButton onClick={() => ctx.onToast("Edit drawer opened")}>Edit</CtaButton>
        <CtaButton variant="ghost" onClick={() => ctx.onToast("Suggestion dismissed")}>Dismiss</CtaButton>
      </>
    case "role_published":
      return <>
        <CtaButton variant="primary" onClick={navRole}>Open role</CtaButton>
        <CtaButton onClick={() => ctx.onToast("Interview link copied")}>Share link</CtaButton>
        <CtaButton variant="ghost" onClick={navRole}>Pause</CtaButton>
      </>
  }
}
