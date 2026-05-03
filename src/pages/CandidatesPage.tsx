import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  CANDIDATES as SEED_CANDIDATES,
  ROLES,
  roleTitle,
  type CandidateMini,
} from "@/lib/mockData"
import { StatusPill, type StatusVariant } from "@/components/notion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AnimatedSelect } from "@/components/ui/animated-select"
import { ScoreRangeFilter } from "@/components/ui/score-range"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { StreamLoader } from "@/components/StreamLoader"

// Mocked deep-detail content rendered inside the candidate modal.
// Same shape and tone as the original sidepanel — kept inline so the modal
// is self-contained and we don't need to extend CandidateMini.
const ALT_SCORE_ROWS = [
  { name: "Product thinking depth", score: 10, rationale: "Frames trade-offs without prompting; walks through downstream effects before I ask." },
  { name: "Ambiguity & speed balance", score: 9, rationale: "Concrete examples of shipping under constraints; iterates rather than perfecting." },
  { name: "Cross-functional collaboration", score: 8, rationale: "Collaborates well when aligned; hasn't had to navigate strong disagreement recently." },
  { name: "B2B SaaS product intuition", score: 10, rationale: "Understands enterprise adoption friction; real examples of power-user tooling." },
]
const LINKEDIN_ROWS: { l: string; v: string; good: boolean | null }[] = [
  { l: "Overall vibe", v: "Strong — thoughtful, grounded, no performative hustle content", good: true },
  { l: "Profile inflation", v: "Clean — titles match stated tenure", good: true },
  { l: "Posting activity", v: "Active · 3 posts in last 90 days", good: null },
  { l: "Post quality", v: "Depth: medium-high · Likely authentic writing", good: null },
  { l: "AI writing detected", v: "Low probability", good: true },
  { l: "Avg engagement", v: "~140 likes per post", good: null },
]
const TRANSCRIPT_ROWS = [
  { from: "Alt", text: "Tell me about a design decision where you had to navigate a real trade-off between user needs and business constraints." },
  { from: "You", text: "At my last role, we redesigned onboarding. Product wanted a 3-step wizard for conversion, but research showed users needed more context upfront. We ran an A/B — longer flow won on 30-day retention even though it dropped top-of-funnel." },
  { from: "Alt", text: "What was the business reaction when you pushed back on conversion numbers in favour of retention?" },
  { from: "You", text: "There was friction. I had to present the data twice and get the CEO involved. But the retention numbers made the case — it's now a principle in our design system docs." },
]
type DetailTab = "linkedin" | "transcript" | "notes"

// Longer-form Alt narrative for the modal's "Alt Description" block. Composed
// from the one-line reasoning + a second sentence with concrete evidence and a
// third sentence framing what to probe in a follow-up interview.
function expandedAltDescription(c: CandidateMini): string {
  const second: Record<CandidateMini["altRec"], string> = {
    shortlist: `In their interview, ${c.name.split(" ")[0]} consistently surfaced trade-offs without prompting and supported each claim with a concrete example from their last role.`,
    reject: `In their interview, ${c.name.split(" ")[0]} struggled to ground answers in concrete examples and leaned on framework-speak when pressed for specifics.`,
    review: `In their interview, ${c.name.split(" ")[0]} showed a split profile — strong execution stories but lighter on the systems framing your past shortlists have nailed.`,
  }
  const third: Record<CandidateMini["altRec"], string> = {
    shortlist: `Worth probing in the next round: depth on enterprise rollout patterns and how they navigate cross-functional disagreement when stakeholders are misaligned.`,
    reject: `If you want to second-guess this call, the place to look is their portfolio writeup — there may be context the interview format didn't surface.`,
    review: `This one is a coin-flip. Recommend a 30-min follow-up focused specifically on the criteria where they scored below your bar, before a final decision.`,
  }
  return `${c.reasoning} ${second[c.altRec]} ${third[c.altRec]}`
}

// Color-coded verdict rows surfaced under the chat input. Statement-style —
// each one pairs a concrete fact about the candidate (the Alt's lead claim)
// with a brief piece of evidence drawn from the interview/profile.
type VerdictTone = "good" | "bad"
interface VerdictRow { label: string; tone: VerdictTone; evidence: string }
function verdictRowsFor(c: CandidateMini): VerdictRow[] {
  if (c.score >= 9) return [
    { label: "Experience of 5+ years", tone: "good", evidence: "6 yrs at Atlassian + 2 yrs current Series-B role" },
    { label: "Strong B2B portfolio", tone: "good", evidence: "Last 3 roles all enterprise SaaS — fintech, devtools, HR" },
    { label: "Past hire pattern match", tone: "good", evidence: "Closely tracks Arjun M. (8/10, shortlisted last quarter)" },
    { label: "Ships fast", tone: "good", evidence: "3 major launches in 6 months at current role" },
    { label: "Clear systems thinking", tone: "good", evidence: "Walked through downstream effects unprompted" },
  ]
  if (c.score >= 7) return [
    { label: "Experience of 5+ years", tone: "good", evidence: "5 yrs in product roles, 2 senior" },
    { label: "Solid execution stories", tone: "good", evidence: "Onboarding redesign yielded 40% activation lift" },
    { label: "Pattern-matches past hires", tone: "good", evidence: "Same trajectory as 2 of your last 4 shortlists" },
    { label: "Light on B2B depth", tone: "bad", evidence: "Mostly consumer apps at last 2 roles" },
  ]
  if (c.score >= 5) return [
    { label: "Strong on execution", tone: "good", evidence: "Concrete shipping examples in every prompt" },
    { label: "Limited B2B exposure", tone: "bad", evidence: "Stripe is the only enterprise tool referenced" },
    { label: "Weak systems framing", tone: "bad", evidence: "Struggled when asked about cross-team dependencies" },
  ]
  return [
    { label: "No B2B experience", tone: "bad", evidence: "Resume + LinkedIn show only consumer products" },
    { label: "Below score threshold", tone: "bad", evidence: `Scored ${c.score}/10 vs. your 7/10 floor` },
    { label: "Off-pattern profile", tone: "bad", evidence: "Doesn't match any past shortlisted candidate" },
  ]
}
const VERDICT_TONE_CLS: Record<VerdictTone, string> = {
  good: "bg-status-success/15 text-status-success-foreground border-status-success-foreground/30",
  bad: "bg-status-danger/15 text-status-danger-foreground border-status-danger-foreground/30",
}

// Starter prompts in the candidate chat — clickable, send the prompt directly.
const CANDIDATE_CHAT_SUGGESTIONS = [
  "Why did you score them this way?",
  "Compare them to similar candidates",
  "Draft a follow-up message",
  "Show interview highlights",
]

// Context pills attached to a user message — surface what the message is
// "about" (the candidate, an external profile link, etc.) without baking the
// reference into prose.
interface ContextPill { label: string; href?: string; bg?: string; short?: string }
interface CandidateChatMsg { from: "user" | "alt"; text: string; pills?: ContextPill[] }
function mockAltReply(prompt: string, c: CandidateMini): string {
  const p = prompt.toLowerCase()
  if (p.includes("why") || p.includes("score")) {
    return `${c.score}/10 came from four criteria — they nailed product thinking and B2B intuition, slightly under on ambiguity balance. The overall profile matches three of your past shortlists.`
  }
  if (p.includes("compare")) {
    return `Closest matches in your history: Arjun Mehta (8/10, shortlisted) and Lena Fischer (9/10, shortlisted). Both had similar cross-functional patterns and shipped at the same scale.`
  }
  if (p.includes("draft") || p.includes("follow") || p.includes("message")) {
    return `I'll draft a short, specific note referencing their B2B example — want it warm-and-direct or more formal?`
  }
  if (p.includes("highlight") || p.includes("transcript")) {
    return `Top moments: (1) trade-off framing on the onboarding redesign, (2) clear ICP articulation, (3) handled the ambiguity prompt without falling back to frameworks.`
  }
  return `Good question — pulling that from the interview transcript and your past decisions now.`
}

type StatusFilter = "all" | "pending" | "shortlisted" | "rejected"
type RecFilter = "all" | "shortlist" | "reject" | "review"
type TimeFilter = "all" | "today" | "week"

function matchesTime(completed: string, bucket: TimeFilter): boolean {
  if (bucket === "all") return true
  const m = completed.match(/(\d+)\s*(h|d|w|min)/i)
  if (!m) return false
  const n = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()
  const hours = unit === "h" ? n : unit === "min" ? n / 60 : unit === "d" ? n * 24 : unit === "w" ? n * 24 * 7 : 0
  if (bucket === "today") return hours < 24
  if (bucket === "week") return hours <= 24 * 7
  return true
}

function StellarTag({ score }: { score: number }) {
  if (score < 9) return null
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/20 to-yellow-300/20 text-amber-700 border border-amber-400/40 inline-flex items-center gap-1 dark:text-amber-300 dark:from-amber-400/15 dark:to-yellow-300/15">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
      Stellar
    </span>
  )
}

function scoreColor(s: number): string {
  if (s >= 8) return "text-status-success-foreground"
  if (s >= 7) return "text-status-info-foreground"
  if (s >= 5) return "text-status-warning-foreground"
  return "text-status-danger-foreground"
}

function StatusBadge({ status }: { status: CandidateMini["status"] }) {
  const v: Record<CandidateMini["status"], StatusVariant> = {
    shortlisted: "success",
    rejected: "danger",
    pending: "warning",
  }
  const l: Record<CandidateMini["status"], string> = {
    shortlisted: "Pushed to ATS",
    rejected: "Rejected",
    pending: "Your call",
  }
  return <StatusPill status={v[status]}>{l[status]}</StatusPill>
}

function AltRecBadge({ rec, confidence }: { rec: CandidateMini["altRec"]; confidence: CandidateMini["confidence"] }) {
  if (rec === "shortlist") return <StatusPill status="success">Alt: Shortlist ↑</StatusPill>
  if (rec === "reject") return <StatusPill status="danger">Alt: Reject ↓</StatusPill>
  return <StatusPill status="warning">{confidence === "low" ? "Alt: Your call" : "Alt: Review"}</StatusPill>
}

// Profile sources submitted by the candidate — each opens an in-modal side panel
// with the agent's TLDR for that source.
interface ProfileSource { key: string; short: string; label: string; bg: string; sub: string; provided: boolean; tldr: string; url?: string }

const PROFILE_SOURCES: ProfileSource[] = [
  { key: "linkedin", short: "in", label: "LinkedIn", bg: "#0A66C2", sub: "View profile →", provided: true,
    tldr: "5+ years in product design roles. Currently Senior Product Designer at a Series B fintech startup. Previously at Atlassian (3 yrs). Strong network in the B2B SaaS design community — 1,200+ connections, mostly PMs and engineers. Endorsements heavy on systems thinking and prototyping. No red flags.",
    url: "https://linkedin.com/in/" },
  { key: "github", short: "gh", label: "GitHub", bg: "#24292e", sub: "8 repos · active", provided: true,
    tldr: "8 public repos, mostly design system tooling and Figma plugins. Top repo: a Tailwind token generator with 340 stars. Commits are consistent — ~3–4×/week. Code quality is clean, well-documented. Contributes to one open-source design system. No red flags.",
    url: "https://github.com/" },
  { key: "resume", short: "cv", label: "Resume", bg: "#E24B4A", sub: "View PDF →", provided: true,
    tldr: "2-page resume, clean layout. Highlights: led redesign of onboarding flow (40% activation improvement), built and maintained a design system serving 12 product teams, shipped 3 major features in 6 months at current role. Education: BFA in Interaction Design, SVA." },
  { key: "huggingface", short: "hf", label: "HuggingFace", bg: "#FF9D00", sub: "Not provided", provided: false,
    tldr: "" },
]

// Deterministic per-role pill — bordered chip with a colored dot. Same role
// always reads the same color across the table.
const ROLE_PILL_COLORS: Record<string, string> = {
  r1: "bg-accent-blue",
  r2: "bg-status-success-dot",
  r3: "bg-status-warning-dot",
}
function RolePill({ roleId, active, onClick }: { roleId: string; active?: boolean; onClick?: (roleId: string) => void }) {
  const dot = ROLE_PILL_COLORS[roleId] ?? "bg-muted-foreground"
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(roleId) }}
      className={`inline-flex items-center gap-1.5 max-w-full text-[11px] px-2 py-0.5 rounded-md border bg-card text-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40 ${active ? "border-foreground" : "border-border"}`}
      title={`Filter by ${roleTitle(roleId)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="truncate">{roleTitle(roleId)}</span>
    </button>
  )
}

export function CandidatesPage({ onEntityChange, onNavigateToCandidate }: { onEntityChange?: (e: { type: "role"|"candidate"|"alt"; name: string; meta?: Record<string,string> } | undefined) => void; onNavigateToCandidate?: (candidateName: string, mockRoleId: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("linkedin")
  const [chatMsgs, setChatMsgs] = useState<CandidateChatMsg[]>([])
  const [chatInput, setChatInput] = useState("")
  // When set, the right panel renders the source's description in place of the
  // chat. Sending a message from this view switches the panel back to chat mode
  // with the user's message carrying both candidate + source as context pills.
  const [sourceView, setSourceView] = useState<ProfileSource | null>(null)
  const [sourceInput, setSourceInput] = useState("")
  // Toggle for the right-side chat panel. When off, the left-column assessment
  // stays at the same width and is centered horizontally in the modal.
  const [showChat, setShowChat] = useState(true)
  // Shared transition config — header spacer, body spacer, and the chat
  // panel slide all consume this exact object so they fire on the same
  // React commit and complete on the same frame.
  const chatTransition = { duration: 0.36, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }
  // A session id that starts when the modal opens and clears when it closes.
  // The right panel keys off this so the entry animation plays once per
  // modal-open lifecycle — not when paginating between candidates.
  const [modalSession, setModalSession] = useState<number | null>(null)
  useEffect(() => {
    if (openId && modalSession === null) setModalSession(Date.now())
    else if (!openId && modalSession !== null) setModalSession(null)
  }, [openId, modalSession])
  // True while Alt is "thinking" — shows a StreamLoader bubble in the chat.
  const [isReplying, setIsReplying] = useState(false)
  const replyTimeoutRef = useRef<number | null>(null)
  // Reset all right-panel state when a different candidate opens.
  useEffect(() => {
    setChatMsgs([])
    setChatInput("")
    setSourceView(null)
    setSourceInput("")
    setIsReplying(false)
    if (replyTimeoutRef.current !== null) { clearTimeout(replyTimeoutRef.current); replyTimeoutRef.current = null }
  }, [openId])

  // Append the user message immediately, then after a delay append the alt reply.
  const pushUserAndReply = (userMsg: CandidateChatMsg) => {
    if (!selected) return
    setChatMsgs(p => [...p, userMsg])
    setIsReplying(true)
    if (replyTimeoutRef.current !== null) clearTimeout(replyTimeoutRef.current)
    replyTimeoutRef.current = window.setTimeout(() => {
      setChatMsgs(p => [...p, { from: "alt", text: mockAltReply(userMsg.text, selected) }])
      setIsReplying(false)
      replyTimeoutRef.current = null
    }, 1100)
  }
  const selected = SEED_CANDIDATES.find(c => c.id === openId) ?? null
  useEffect(() => {
    if (selected) {
      onEntityChange?.({ type: "candidate", name: selected.name, meta: { id: selected.id, score: String(selected.score), altRec: selected.altRec, roleId: selected.roleId } })
    } else {
      onEntityChange?.(undefined)
    }
  }, [openId])

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [recFilter, setRecFilter] = useState<RecFilter>("all")
  const [scoreMin, setScoreMin] = useState(1)
  const [scoreMax, setScoreMax] = useState(10)
  // When the user filters by clicking a role pill (not the dropdown), play the
  // row exit/entry animation 25% faster — feels more responsive to a direct hit.
  const [pillFilterFast, setPillFilterFast] = useState(false)
  const fastTimerRef = useRef<number | null>(null)
  const filterByRolePill = (roleId: string) => {
    if (fastTimerRef.current !== null) clearTimeout(fastTimerRef.current)
    setPillFilterFast(true)
    setRoleFilter(prev => prev === roleId ? "all" : roleId)
    fastTimerRef.current = window.setTimeout(() => { setPillFilterFast(false); fastTimerRef.current = null }, 350)
  }
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SEED_CANDIDATES.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !roleTitle(c.roleId).toLowerCase().includes(q)) return false
      if (roleFilter !== "all" && c.roleId !== roleFilter) return false
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (recFilter !== "all" && c.altRec !== recFilter) return false
      if (c.score < scoreMin || c.score > scoreMax) return false
      if (!matchesTime(c.completedAt, timeFilter)) return false
      return true
    })
  }, [search, roleFilter, statusFilter, recFilter, scoreMin, scoreMax, timeFilter])

  // Pagination within the open modal — walks the filtered list (or the full set
  // if the open candidate has been filtered out).
  const navList = filtered.length > 0 ? filtered : SEED_CANDIDATES
  const navIndex = selected ? navList.findIndex(c => c.id === selected.id) : -1
  const navTotal = navList.length
  const goPrev = () => { if (navIndex > 0) setOpenId(navList[navIndex - 1].id) }
  const goNext = () => { if (navIndex >= 0 && navIndex < navTotal - 1) setOpenId(navList[navIndex + 1].id) }
  const isFirst = navIndex <= 0
  const isLast = navIndex < 0 || navIndex >= navTotal - 1

  // Esc closes; arrow keys page through the (now-defined) navList
  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenId(null); return }
      if (e.key === "ArrowLeft" && !isFirst) { e.preventDefault(); goPrev() }
      else if (e.key === "ArrowRight" && !isLast) { e.preventDefault(); goNext() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openId, isFirst, isLast, navIndex, navList])

  const resetFilters = () => {
    setSearch("")
    setRoleFilter("all")
    setStatusFilter("all")
    setRecFilter("all")
    setScoreMin(1)
    setScoreMax(10)
    setTimeFilter("all")
  }

  const activeFilterCount = [
    search !== "",
    roleFilter !== "all",
    statusFilter !== "all",
    recFilter !== "all",
    scoreMin > 1 || scoreMax < 10,
    timeFilter !== "all",
  ].filter(Boolean).length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-page-wide mx-auto px-12 pt-16 pb-24">
            {/* ── Page title ──────────────────────────────── */}
            <h1 className="text-h1 mb-2">Candidates</h1>
            <p className="text-sm text-muted-foreground mb-12">
              {filtered.length} of {SEED_CANDIDATES.length} · across {ROLES.length} roles. Open a role's Candidates tab to act on these.
            </p>

            {/* ── Search + filter row ─────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or role..."
                className="text-xs border border-border rounded-md px-3 py-1.5 bg-background outline-none placeholder:text-muted-foreground w-56 focus:border-foreground/40"
              />
              <AnimatedSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { value: "all", label: "All roles" },
                  ...ROLES.map(r => ({ value: r.id, label: r.title })),
                ]}
              />
              <AnimatedSelect<StatusFilter>
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "pending", label: "Your call" },
                  { value: "shortlisted", label: "Pushed to ATS" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <AnimatedSelect<RecFilter>
                value={recFilter}
                onChange={setRecFilter}
                options={[
                  { value: "all", label: "All Alt recs" },
                  { value: "shortlist", label: "Shortlist" },
                  { value: "reject", label: "Reject" },
                  { value: "review", label: "Review" },
                ]}
              />
              <AnimatedSelect<TimeFilter>
                value={timeFilter}
                onChange={setTimeFilter}
                options={[
                  { value: "all", label: "Any time" },
                  { value: "today", label: "Last 24h" },
                  { value: "week", label: "Last 7 days" },
                ]}
              />
              <ScoreRangeFilter
                min={1}
                max={10}
                lower={scoreMin}
                upper={scoreMax}
                onChange={(l, u) => { setScoreMin(l); setScoreMax(u) }}
              />
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">
                  Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="border border-border rounded-lg p-8 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  No candidates match these filters. Try clearing search or widening the score range.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 border-b border-border">
                  <div className="w-10 shrink-0">
                    <span className="text-xs text-muted-foreground">Score</span>
                  </div>
                  <div className="w-44 shrink-0">
                    <span className="text-xs text-muted-foreground">Candidate</span>
                    <span className="ml-1.5 text-[10px] tabular-nums text-muted-foreground/70 bg-muted/60 border border-border rounded-sm px-1 py-px">{filtered.length}</span>
                  </div>
                  <div className="w-40 shrink-0">
                    <span className="text-xs text-muted-foreground">Role</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Description</span>
                  </div>
                  <div className="w-28 shrink-0">
                    <span className="text-xs text-muted-foreground">Alt</span>
                  </div>
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">Time</span>
                  </div>
                </div>

                <TooltipProvider delayDuration={350}>
                <AnimatePresence initial={false}>
                {filtered.map((c, i) => {
                  const isOpen = openId === c.id
                  const handleRowClick = () => setOpenId(c.id)
                  return (
                    <motion.div key={c.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: pillFilterFast ? 0.135 : 0.18, ease: "easeIn" } }}
                      transition={{ duration: pillFilterFast ? 0.165 : 0.22, ease: "easeOut" }}
                      className={`flex items-start gap-3 px-3 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors overflow-hidden ${
                        isOpen ? "bg-muted/50" : i % 2 ? "bg-muted/10" : ""
                      } hover:bg-muted/40`}
                      onClick={handleRowClick}
                    >
                      <div className="w-10 shrink-0">
                        <span className={`text-base font-medium tabular-nums ${scoreColor(c.score)}`}>{c.score}</span>
                        <span className="text-[11px] text-muted-foreground">/10</span>
                      </div>
                      <div className="w-44 shrink-0 min-w-0">
                        <div className="flex items-start gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium truncate hover:text-accent-blue transition-colors">{c.name}</p>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="start" sideOffset={8} className="max-w-xs p-0 bg-popover text-popover-foreground border border-border rounded-md shadow-md">
                              <div className="px-3.5 py-3 flex flex-col gap-2.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xl font-medium tabular-nums leading-none ${scoreColor(c.score)}`}>{c.score}</span>
                                  <span className="text-[10px] text-muted-foreground">/10</span>
                                  <div className="ml-auto flex items-center gap-1">
                                    <AltRecBadge rec={c.altRec} confidence={c.confidence} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold leading-tight">{c.name}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{roleTitle(c.roleId)} · {c.completedAt}</p>
                                </div>
                                <p className="text-[11px] leading-relaxed text-foreground/90">{c.reasoning}</p>
                                <div className="flex items-center gap-1.5 pt-1.5 border-t border-border">
                                  {!(c.score >= 9 && c.status === "shortlisted") && <StatusBadge status={c.status} />}
                                  <StellarTag score={c.score} />
                                  <span className="ml-auto text-[10px] text-muted-foreground">Click to open in role →</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          <StellarTag score={c.score} />
                        </div>
                      </div>
                      <div className="w-40 shrink-0">
                        <RolePill
                          roleId={c.roleId}
                          active={roleFilter === c.roleId}
                          onClick={filterByRolePill}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Two-line clamp + min-h reserve keeps every row at
                            the same height regardless of reasoning length. */}
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2 min-h-[2.25rem]">{c.reasoning}</p>
                      </div>
                      <div className="w-28 shrink-0">
                        <AltRecBadge rec={c.altRec} confidence={c.confidence} />
                      </div>
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-xs text-muted-foreground">{c.completedAt}</span>
                      </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
                </TooltipProvider>
              </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>

      {/* Candidate detail modal — opens on row click */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="candidate-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "hsl(var(--background) / 0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpenId(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="bg-background border-2 border-border rounded-lg shadow-modal overflow-hidden flex flex-col"
              style={{ width: "85vw", height: "85vh" }}
            >
              {/* Verdict header — nav cluster (prev / name / next) lines up
                  with the body's left edge in both states; chrome (Chat /
                  counter / Close) floats absolutely at the right so it sits
                  over the chat panel when open. No bottom divider. */}
              <div className="shrink-0 relative px-5 py-3">
              <div className="flex items-center">
              <motion.div
                layout
                transition={chatTransition}
                className={`flex items-center gap-2 w-[640px] shrink-0 ${showChat ? "" : "mx-auto"}`}
              >
                <button
                  onClick={goPrev}
                  disabled={isFirst}
                  aria-label="Previous candidate"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/40 transition-colors min-w-0 group">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-medium text-background shrink-0 bg-foreground">
                        {selected.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-sm font-semibold truncate">{selected.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="min-w-[280px] max-h-[60vh] overflow-y-auto bg-gradient-to-b from-background via-background to-muted dark:from-popover dark:via-popover dark:to-muted border-border"
                  >
                    {navList.map((c, i) => (
                      <DropdownMenuItem
                        key={c.id}
                        onSelect={() => setOpenId(c.id)}
                        className="flex items-center gap-2.5 cursor-pointer text-xs"
                      >
                        <span className="w-7 text-muted-foreground tabular-nums shrink-0">{i + 1}.</span>
                        <span className={`text-sm font-medium tabular-nums w-7 shrink-0 ${scoreColor(c.score)}`}>{c.score}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-muted-foreground truncate text-[11px]">{roleTitle(c.roleId)}</span>
                        {c.id === selected.id && <Check className="w-3.5 h-3.5 text-accent-blue shrink-0" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Next sits directly to the right of the candidate's basic
                    details, so prev/name/next read as a tight nav cluster. */}
                <button
                  onClick={goNext}
                  disabled={isLast}
                  aria-label="Next candidate"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>

              </motion.div>
              </div>

                {/* Chrome — absolutely positioned so the nav cluster's
                    placement isn't affected by chrome width. */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowChat(s => !s)}
                    aria-pressed={showChat}
                    title={showChat ? "Hide chat" : "Show chat"}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      showChat
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Chat
                  </button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {navIndex + 1} of {navTotal}
                  </span>
                  <button onClick={() => setOpenId(null)}
                    className="ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-md w-7 h-7 flex items-center justify-center" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>

              {/* Body — two columns:
                  Left = the full assessment (verdict, narrative, scores, sources, interview, ATS, transcript)
                  Right = a chat about this candidate (or the source's description, when a source chip is clicked)
                  When the chat panel is toggled off, the assessment column keeps its width
                  and centers in the modal (does not stretch). */}
              <div className="flex-1 min-h-0 flex overflow-hidden">

                {/* ── Left column — assessment ─────────────────────────────
                    Centered in the available area when chat is closed; when
                    the chat slides in, the left spacer collapses and content
                    slides leftward to make room. Width itself is fixed at
                    640px, so text never re-wraps during the transition.
                    Scroll lives on the content div so the spacer animation
                    doesn't reflow a scrollable container every frame. */}
                <div className="flex-1 min-w-0 min-h-0 flex">
                <motion.div
                  layout
                  transition={chatTransition}
                  className={`w-[640px] shrink-0 overflow-y-auto px-7 py-6 ${showChat ? "" : "mx-auto"}`}
                >
                  {/* Verdict cluster — moved here from the header. The first thing the eye lands on. */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`text-3xl font-medium leading-none tabular-nums ${scoreColor(selected.score)} shrink-0`}>
                      {selected.score}<span className="text-base text-muted-foreground">/10</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AltRecBadge rec={selected.altRec} confidence={selected.confidence} />
                      <StatusBadge status={selected.status} />
                      <StellarTag score={selected.score} />
                    </div>
                  </div>

                  {/* Alt Description — labelled, longer-form narrative */}
                  <h3 className="text-sm font-semibold text-foreground mb-3">Alt Description</h3>
                  <p className="text-sm leading-relaxed text-foreground mb-8">{expandedAltDescription(selected)}</p>

                  {/* Alt scores — per-criterion breakdown */}
                  <h3 className="text-sm font-semibold text-foreground mb-3">Alt scores</h3>
                  <div className="border border-border rounded-lg overflow-hidden mb-8">
                    {ALT_SCORE_ROWS.map((row, i) => (
                      <div key={row.name} className={`flex items-start gap-3 px-3 py-2.5 bg-muted/30 ${i > 0 ? "border-t border-border" : ""}`}>
                        <div className={`flex flex-col items-center w-8 shrink-0 ${scoreColor(row.score)}`}>
                          <span className="text-base font-medium leading-none tabular-nums">{row.score}</span>
                          <span className="text-[11px] text-muted-foreground">/10</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium mb-0.5">{row.name}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{row.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sources from candidate — clicking a chip swaps the right
                      panel to that source's description, with its own chat input. */}
                  <h3 className="text-sm font-semibold text-foreground mb-3">Sources from candidate</h3>
                  <div className="flex flex-wrap gap-1.5 mb-8">
                    {PROFILE_SOURCES.map(p => {
                      const disabled = !p.provided
                      const isActive = sourceView?.key === p.key
                      return (
                        <button
                          key={p.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => { setSourceView(isActive ? null : p); setSourceInput("") }}
                          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors ${
                            disabled
                              ? "border-dashed border-border text-muted-foreground/60 cursor-not-allowed"
                              : isActive
                                ? "border-foreground bg-muted/40"
                                : "border-border bg-background hover:border-foreground/40 hover:bg-muted/40"
                          }`}
                        >
                          <span className="w-5 h-5 flex items-center justify-center rounded-sm text-[10px] font-bold text-white shrink-0" style={{ background: p.bg }}>{p.short}</span>
                          <span className="text-xs font-medium">{p.label}</span>
                          <span className="text-[11px] text-muted-foreground">{p.sub}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Interview — compact 2-row strip */}
                  <h3 className="text-sm font-semibold text-foreground mb-3">Interview</h3>
                  <div className="border border-border rounded-lg overflow-hidden bg-background mb-8">
                    {[
                      { label: "Confidence", value: selected.confidence.charAt(0).toUpperCase() + selected.confidence.slice(1) },
                      { label: "Interviewed", value: selected.completedAt },
                    ].map((row, i) => (
                      <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ATS status */}
                  <h3 className="text-sm font-semibold text-foreground mb-3">ATS status</h3>
                  <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-md mb-2">
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-8">
                    Overriding the Alt's call pauses auto-decisions for this role until you re-enable them · <button className="underline hover:text-foreground transition-colors">Manage in settings</button>
                  </p>

                  {/* Assessment detail — tabs for LinkedIn analysis / Transcript / Notes */}
                  <h3 className="text-sm font-semibold text-foreground mb-3">Assessment detail</h3>
                  <div className="flex border-b border-border mb-3">
                    {(["linkedin","transcript","notes"] as const).map(t => (
                      <button key={t} onClick={() => setDetailTab(t)}
                        className={`text-[11px] px-3 py-1.5 border-b-2 transition-colors ${detailTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        {t === "linkedin" ? "LinkedIn analysis" : t.charAt(0).toUpperCase()+t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {detailTab === "linkedin" && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      {LINKEDIN_ROWS.map((s, i) => (
                        <div key={s.l} className={`flex items-start justify-between gap-3 px-3 py-2 bg-muted/30 ${i > 0 ? "border-t border-border" : ""}`}>
                          <span className="text-xs text-muted-foreground shrink-0">{s.l}</span>
                          <span className={`text-xs font-medium text-right ${s.good === true ? "text-status-success-foreground" : s.good === false ? "text-status-danger-foreground" : "text-foreground"}`}>{s.v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === "transcript" && (
                    <div className="flex flex-col gap-2">
                      {TRANSCRIPT_ROWS.map((b, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[11px] text-muted-foreground w-6 shrink-0 pt-1.5">{b.from}</span>
                          <div className="flex-1 text-[11px] leading-relaxed bg-muted/40 border border-border rounded-md px-2.5 py-2">{b.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === "notes" && (
                    <textarea className="w-full border border-border rounded-md p-2.5 text-[11px] bg-background outline-none placeholder:text-muted-foreground min-h-[80px] resize-none leading-relaxed" placeholder="Add a private note about this candidate..." />
                  )}
                </motion.div>
                </div>

                {/* ── Right column — chat OR source description ───────────
                    Floating panel. Reserves its 40% slot in the flex layout
                    on mount so the left content (fixed at w-[640px]) never
                    re-wraps. The motion is purely a translate — the panel
                    slides leftward into its final position from off-screen
                    right, without any width expansion. */}
                <AnimatePresence initial={false}>
                {showChat && (
                <motion.div
                  key={modalSession ?? "closed"}
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={chatTransition}
                  className="shrink-0 basis-[40%] p-3 overflow-hidden"
                >
                <div className="h-full w-full bg-muted/15 border border-border rounded-lg shadow-lg flex flex-col min-h-0 overflow-hidden">
                  {sourceView ? (
                    /* ── Source description mode ───────────────────────── */
                    <>
                      <div className="shrink-0 flex items-center gap-2.5 px-5 py-4 border-b border-border">
                        <span className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: sourceView.bg }}>
                          {sourceView.short}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{sourceView.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{sourceView.sub}</p>
                        </div>
                        <button onClick={() => setSourceView(null)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-sm w-6 h-6 flex items-center justify-center shrink-0" aria-label="Close source view">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Alt's TLDR</p>
                        <p className="text-sm leading-relaxed text-foreground">{sourceView.tldr}</p>
                        {sourceView.url && (
                          <a href={sourceView.url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-4 text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                            Open external
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10"/></svg>
                          </a>
                        )}
                      </div>
                      {/* Source-mode input — sending switches the panel back to
                          chat mode and tags the user message with two pills:
                          the candidate's name + the source. */}
                      <div className="shrink-0 px-5 py-3 border-t border-border bg-background">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const t = sourceInput.trim()
                            if (!t) return
                            const pills: ContextPill[] = [
                              { label: selected.name },
                              { label: sourceView.label, href: sourceView.url, bg: sourceView.bg, short: sourceView.short },
                            ]
                            pushUserAndReply({ from: "user", text: t, pills })
                            setSourceView(null)
                            setSourceInput("")
                          }}
                          className="flex items-end gap-2"
                        >
                          <input
                            value={sourceInput}
                            onChange={e => setSourceInput(e.target.value)}
                            placeholder={`Ask about ${sourceView.label}...`}
                            className="flex-1 text-xs border border-border rounded-md px-3 py-2 bg-background outline-none placeholder:text-muted-foreground focus:border-foreground/40"
                          />
                          <button type="submit" disabled={!sourceInput.trim()}
                            className="text-xs px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity">
                            ↑
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    /* ── Default chat mode ──────────────────────────────────
                       Empty state mirrors the wireframe: heading + input +
                       verdicts vertically centered. Once the conversation
                       starts, messages flow at the top, the input pins to the
                       bottom, and verdicts sit just above the input. */
                    chatMsgs.length === 0 && !isReplying ? (
                      /* Anchored to the top — heading sits at the same offset
                         regardless of how many verdict rows the next candidate
                         has, so paginating doesn't shift the layout. */
                      <div className="flex-1 flex flex-col px-8 pt-[72px] gap-7 overflow-y-auto">
                        <h3 className="text-xl font-medium text-foreground text-center">
                          Ask anything about {selected.name.split(" ")[0]}
                        </h3>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const t = chatInput.trim()
                            if (!t) return
                            pushUserAndReply({ from: "user", text: t })
                            setChatInput("")
                          }}
                          className="w-full"
                        >
                          <div className="flex items-end gap-2 border border-border rounded-lg bg-background px-3 py-2.5 focus-within:border-foreground/40 transition-colors">
                            <input
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              placeholder="Ask the Alt about this candidate… (/ for commands)"
                              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-center placeholder:text-center focus:text-left"
                            />
                            <button type="submit" disabled={!chatInput.trim()}
                              className="text-xs px-2.5 py-1 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity">
                              ↑
                            </button>
                          </div>
                        </form>

                        <div className="w-full flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">Alt's verdicts about {selected.name.split(" ")[0]}:</p>
                          {/* Tabular verdicts — colored statement pill + evidence
                              underneath. The pill carries the tone (green/red),
                              evidence stays muted so the eye lands on the verdict first. */}
                          <div className="border border-border rounded-lg overflow-hidden">
                            {verdictRowsFor(selected).map((v, i) => (
                              <div key={v.label} className={`flex flex-col gap-1.5 px-3 py-2.5 bg-background ${i > 0 ? "border-t border-border" : ""}`}>
                                <span className={`self-start text-[11px] font-medium px-2 py-0.5 rounded-md border ${VERDICT_TONE_CLS[v.tone]}`}>
                                  {v.label}
                                </span>
                                {/* pl-2 matches the pill's px-2, so the evidence
                                    text sits flush under the verdict text — not
                                    under the pill's left border. */}
                                <p className="text-[11px] text-muted-foreground leading-relaxed pl-2">{v.evidence}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                          {chatMsgs.map((m, i) => m.from === "user" ? (
                            <div key={i} className="self-end max-w-[85%] flex flex-col items-end gap-1.5">
                              {m.pills && m.pills.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {m.pills.map((pill, pi) => {
                                    const inner = (
                                      <>
                                        {pill.short && pill.bg && (
                                          <span className="w-3.5 h-3.5 flex items-center justify-center rounded-sm text-[8px] font-bold text-white shrink-0" style={{ background: pill.bg }}>{pill.short}</span>
                                        )}
                                        <span>{pill.label}</span>
                                      </>
                                    )
                                    const cls = "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border border-border bg-background text-foreground"
                                    return pill.href
                                      ? <a key={pi} href={pill.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
                                      : <span key={pi} className={cls}>{inner}</span>
                                  })}
                                </div>
                              )}
                              <div className="text-xs leading-relaxed bg-foreground text-background rounded-md px-3 py-2">
                                {m.text}
                              </div>
                            </div>
                          ) : (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-md bg-foreground text-background text-[10px] font-bold flex items-center justify-center shrink-0">A</div>
                              <div className="text-xs leading-relaxed bg-background border border-border rounded-md px-3 py-2">{m.text}</div>
                            </div>
                          ))}
                          {isReplying && (
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-md bg-foreground text-background text-[10px] font-bold flex items-center justify-center shrink-0">A</div>
                              <StreamLoader />
                            </div>
                          )}
                        </div>

                        {/* Verdicts strip — pill-only condensed form. Once
                            the chat is active, evidence drops away and the
                            user keeps just the headline judgments visible. */}
                        <div className="shrink-0 px-5 pt-3 flex flex-wrap gap-1.5">
                          {verdictRowsFor(selected).map(v => (
                            <span key={v.label}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${VERDICT_TONE_CLS[v.tone]}`}>
                              {v.label}
                            </span>
                          ))}
                        </div>

                        <div className="shrink-0 px-5 py-3 mt-2 border-t border-border bg-background">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const t = chatInput.trim()
                              if (!t) return
                              pushUserAndReply({ from: "user", text: t })
                              setChatInput("")
                            }}
                            className="flex items-end gap-2"
                          >
                            <input
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              placeholder="Ask the Alt about this candidate… (/ for commands)"
                              className="flex-1 text-xs border border-border rounded-md px-3 py-2 bg-background outline-none placeholder:text-muted-foreground focus:border-foreground/40"
                            />
                            <button type="submit" disabled={!chatInput.trim()}
                              className="text-xs px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity">
                              ↑
                            </button>
                          </form>
                        </div>
                      </>
                    )
                  )}
                </div>
                </motion.div>
                )}
                </AnimatePresence>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
