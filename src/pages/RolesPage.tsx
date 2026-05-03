import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { AnimatedSelect } from "@/components/ui/animated-select"
import { ScoreRangeFilter } from "@/components/ui/score-range"

// ── Types ─────────────────────────────────────────────────────

interface Role { id: string; title: string; department: string; status: "draft"|"live"|"paused"; candidateCount: number; createdAt: string }
interface Criterion { id: string; name: string; source: "jd"|"bp"; testedBy: "questions"|"inferred"; description: string; sourceDetail: string; howTested: string }
interface Candidate { id: number; name: string; score: number; color: "green"|"teal"|"amber"|"red"; time: string; agentDecision: "shortlisted"|"rejected"|"pending" }
interface ChatMsg { from: "agent"|"user"; text: string }

// ── Data ──────────────────────────────────────────────────────

const ROLES: Role[] = [
  { id: "spd", title: "Senior Product Designer", department: "Product", status: "draft", candidateCount: 12, createdAt: "3 days ago" },
  { id: "swe", title: "Senior Software Engineer", department: "Engineering", status: "live", candidateCount: 34, createdAt: "1 week ago" },
  { id: "pmg", title: "Product Manager", department: "Product", status: "live", candidateCount: 8, createdAt: "2 weeks ago" },
]

const CRITERIA: Criterion[] = [
  { id: "c1", name: "Product thinking depth", source: "jd", testedBy: "questions", description: "Assesses whether the candidate thinks in systems — identifying trade-offs, edge cases, and downstream effects. Goes beyond aesthetics to business and user impact.", sourceDetail: 'JD · "strong systems thinking" requirement', howTested: "Direct questions + inferred from portfolio work described" },
  { id: "c2", name: "Ambiguity & speed balance", source: "jd", testedBy: "questions", description: "Can the candidate move fast without sacrificing quality? Looking for evidence of shipping under constraints and iterating rather than perfecting upfront.", sourceDetail: 'JD · "comfortable with ambiguity and moving fast"', howTested: "Behavioural questions + portfolio timeline analysis" },
  { id: "c3", name: "Cross-functional collaboration", source: "bp", testedBy: "inferred", description: "How effectively does the candidate work with engineers and PMs? Ability to give and receive feedback and influence without authority matters at the senior level.", sourceDetail: "Best practice for senior IC design roles", howTested: "Inferred from how candidate describes past team dynamics" },
  { id: "c4", name: "B2B SaaS product intuition", source: "jd", testedBy: "questions", description: "Does the candidate understand the specific constraints of B2B SaaS — density, power users, enterprise workflows, and adoption friction?", sourceDetail: 'JD · "ideally in B2B SaaS" experience requirement', howTested: "Direct questions about B2B design tradeoffs vs consumer" },
]

const CANDIDATES: Candidate[] = [
  { id: 13, name: "Alessandro Maximilian Buchanan-Westchester III", score: 9, color: "green", time: "1h ago", agentDecision: "shortlisted" },
  { id: 1, name: "Priya Sharma", score: 9, color: "green", time: "2h ago", agentDecision: "shortlisted" },
  { id: 2, name: "Lena Fischer", score: 9, color: "green", time: "6h ago", agentDecision: "shortlisted" },
  { id: 3, name: "Arjun Mehta", score: 8, color: "green", time: "5h ago", agentDecision: "shortlisted" },
  { id: 4, name: "Sarah Kim", score: 8, color: "green", time: "1d ago", agentDecision: "shortlisted" },
  { id: 5, name: "Rohan Das", score: 7, color: "teal", time: "1d ago", agentDecision: "shortlisted" },
  { id: 6, name: "Ananya Iyer", score: 7, color: "teal", time: "2d ago", agentDecision: "shortlisted" },
  { id: 7, name: "Marcus Chen", score: 6, color: "amber", time: "2d ago", agentDecision: "rejected" },
  { id: 8, name: "Divya Nair", score: 6, color: "amber", time: "3d ago", agentDecision: "pending" },
  { id: 9, name: "Tom Walsh", score: 5, color: "amber", time: "3d ago", agentDecision: "pending" },
  { id: 10, name: "Neha Gupta", score: 5, color: "amber", time: "4d ago", agentDecision: "pending" },
  { id: 11, name: "Amit Patel", score: 4, color: "red", time: "5d ago", agentDecision: "rejected" },
  { id: 12, name: "James O'Brien", score: 3, color: "red", time: "6d ago", agentDecision: "rejected" },
]

// ── Profile link data ────────────────────────────────────────

interface ProfileData { key: string; short: string; label: string; bg: string; sub: string; provided: boolean; tldr: string; url?: string }

const PROFILE_LINKS: ProfileData[] = [
  { key: "linkedin", short: "in", label: "LinkedIn", bg: "#0A66C2", sub: "View profile →", provided: true,
    tldr: "5+ years in product design roles. Currently Senior Product Designer at a Series B fintech startup. Previously at Atlassian (3 yrs) working on Jira workflows. Strong network in the B2B SaaS design community — 1,200+ connections, mostly PMs and engineers. Endorsements heavy on systems thinking and prototyping. No red flags.",
    url: "https://linkedin.com/in/priya-sharma" },
  { key: "github", short: "gh", label: "GitHub", bg: "#24292e", sub: "8 repos · active", provided: true,
    tldr: "8 public repos, mostly design system tooling and Figma plugins. Top repo: a Tailwind token generator with 340 stars. Commits are consistent — ~3–4x/week over the last year. Code quality is clean, well-documented. Contributes to one open-source design system. No red flags.",
    url: "https://github.com/priya-sharma" },
  { key: "huggingface", short: "hf", label: "HuggingFace", bg: "#FF9D00", sub: "Not provided", provided: false,
    tldr: "" },
  { key: "resume", short: "cv", label: "Resume", bg: "#E24B4A", sub: "View PDF →", provided: true,
    tldr: "2-page resume. Clean layout, well-structured. Highlights: Led redesign of onboarding flow (40% improvement in activation), built and maintained a design system serving 12 product teams, shipped 3 major features in 6 months at current role. Education: BFA in Interaction Design, SVA." },
]

const AGENT_RESPONSES = [
  "Got it — cosmetic change, applying now. Anything else you'd like to adjust?",
  "Sure, updating that phrasing. Want me to also check the role title?",
  "That change would affect the eval rubric — flagging it for team review. Want a cosmetic alternative instead?",
  "Done — the JD reads more clearly now. Anything else?",
]
// ── Helpers ───────────────────────────────────────────────────

const scoreColors = { green: "text-status-success-foreground", teal: "text-status-info-foreground", amber: "text-status-warning-foreground", red: "text-status-danger-foreground" }
const dotColors = { green: "bg-status-success-dot", teal: "bg-status-info-foreground", amber: "bg-status-warning-dot", red: "bg-status-danger-dot" }

function StellarTag({ score }: { score: number }) {
  if (score < 9) return null
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/20 to-yellow-300/20 text-amber-700 border border-amber-400/40 inline-flex items-center gap-1 dark:text-amber-300 dark:from-amber-400/15 dark:to-yellow-300/15">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
      Stellar
    </span>
  )
}

const scoreToColor = (s: number): keyof typeof scoreColors => s >= 8 ? "green" : s >= 7 ? "teal" : s >= 5 ? "amber" : "red"
const scoreBucket = (s: number): "excellent"|"good"|"mixed"|"weak" => s >= 9 ? "excellent" : s >= 7 ? "good" : s >= 5 ? "mixed" : "weak"

const RATIONALE_BANK: Record<string, Record<"excellent"|"good"|"mixed"|"weak", string>> = {
  c1: {
    excellent: "Frames trade-offs without prompting; walks through downstream effects before I ask.",
    good: "Reaches systems framing when pushed, though default is happy-path first.",
    mixed: "Can describe what shipped, but struggles to articulate why it was the right call.",
    weak: "Answers stay on feature specs — no sign of thinking beyond the immediate ask.",
  },
  c2: {
    excellent: "Concrete examples of shipping under constraints; iterates rather than perfecting.",
    good: "Comfortable with ambiguity but defaults to thorough discovery before committing.",
    mixed: "Wants more defined requirements than the role implies; speed is likely an issue.",
    weak: "Portfolio shows long cycles — no evidence of rapid iteration.",
  },
  c3: {
    excellent: "Specific stories about influencing eng and PM without authority; feedback flows both ways.",
    good: "Collaborates well when aligned; hasn't had to navigate strong disagreement recently.",
    mixed: "References team work but light on detail — hard to tell their actual contribution.",
    weak: "Describes mostly solo work or hands-off collaboration; fit for this role is questionable.",
  },
  c4: {
    excellent: "Understands enterprise adoption friction; real examples of power-user tooling.",
    good: "Grasps the broad shape of B2B but lighter on specifics like permissions and density.",
    mixed: "Consumer-leaning instincts; would need a ramp on B2B patterns.",
    weak: "No meaningful B2B exposure — answers are generic or misapplied.",
  },
}

// Deterministic small offset so per-criterion scores cluster around the overall but aren't identical
function criterionScore(candidateId: number, criterionIndex: number, overall: number): number {
  const offset = ((candidateId + criterionIndex * 2) % 3) - 1
  return Math.max(1, Math.min(10, overall + offset))
}

interface AltScoreRow { criterionId: string; name: string; score: number; rationale: string }

function getAltScoresFor(c: Candidate): AltScoreRow[] {
  return CRITERIA.map((cr, i) => {
    const score = criterionScore(c.id, i, c.score)
    return { criterionId: cr.id, name: cr.name, score, rationale: RATIONALE_BANK[cr.id][scoreBucket(score)] }
  })
}

function StatusBadge({ status }: { status: string }) {
  const s = { draft: "bg-status-warning text-status-warning-foreground", live: "bg-status-success text-status-success-foreground", paused: "bg-muted text-muted-foreground" }
  return <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${(s as any)[status] || s.paused}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
}

function CandStatusBadge({ status }: { status: string }) {
  const s: any = { shortlisted: "bg-status-success text-status-success-foreground", rejected: "bg-status-danger text-status-danger-foreground", pending: "bg-status-warning text-status-warning-foreground" }
  const l: any = { shortlisted: "Pushed to ATS", rejected: "Rejected", pending: "Your call" }
  return <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${s[status]||s.pending}`}>{l[status]||"Your call"}</span>
}

function RetroTag({ variant, children }: { variant: "jd"|"bp"|"neutral"; children: React.ReactNode }) {
  const s = { jd: "bg-status-success text-status-success-foreground border border-status-success-dot/30", bp: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20", neutral: "bg-muted text-muted-foreground border border-border" }
  return <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${s[variant]}`}>{children}</span>
}

// ── Profile Panel ────────────────────────────────────────────

function ProfilePanel({ profileKey, onClose }: { profileKey: string; onClose: () => void }) {
  const profile = PROFILE_LINKS.find(p => p.key === profileKey)
  if (!profile) return null

  const isResume = profileKey === "resume"

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: profile.bg }}>{profile.short}</div>
          <span className="text-xs font-medium">{profile.label}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* TLDR */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">TL;DR</p>
          <p className="text-[11px] leading-relaxed text-foreground bg-muted/40 border border-border rounded-md p-3">{profile.tldr}</p>
        </div>

        {isResume ? (
          <>
            {/* Mock PDF preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Resume preview</p>
              <div className="border border-border rounded-lg bg-card text-foreground p-5 flex flex-col gap-3 shadow-sm">
                <div className="border-b border-border/40 pb-3">
                  <p className="text-sm font-medium">Priya Sharma</p>
                  <p className="text-xs text-muted-foreground">Senior Product Designer · San Francisco, CA</p>
                  <p className="text-xs text-muted-foreground">priya.sharma@email.com · (555) 123-4567</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Experience</p>
                  <div className="mb-2">
                    <p className="text-[11px] font-medium">Senior Product Designer — Finova (Series B)</p>
                    <p className="text-xs text-muted-foreground">Jan 2023 – Present</p>
                    <p className="text-xs leading-relaxed mt-0.5">· Led redesign of onboarding flow — 40% improvement in activation rate</p>
                    <p className="text-xs leading-relaxed">· Shipped 3 major features in 6 months, working directly with CEO</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-[11px] font-medium">Product Designer — Atlassian</p>
                    <p className="text-xs text-muted-foreground">Mar 2020 – Dec 2022</p>
                    <p className="text-xs leading-relaxed mt-0.5">· Owned Jira workflow builder for teams of 50–500</p>
                    <p className="text-xs leading-relaxed">· Built and maintained design system serving 12 product teams</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Education</p>
                  <p className="text-xs">BFA Interaction Design — School of Visual Arts, NYC (2019)</p>
                </div>
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 text-[11px] px-3 py-2 border border-border rounded-md hover:bg-muted transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download resume (PDF)
            </button>
          </>
        ) : (
          /* Source link for non-resume profiles */
          profile.url && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Source</p>
              <a href={profile.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[11px] px-3 py-2 border border-border rounded-md hover:bg-muted transition-colors text-link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {profile.url}
              </a>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ── Role List ─────────────────────────────────────────────────

const ROLE_INITIALS: Record<string, string> = { spd: "SPD", swe: "SWE", pmg: "PM" }

function RoleList({ selectedId, onSelect, collapsed }: { selectedId: string; onSelect: (id: string) => void; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="w-12 shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-200">
        <div className="p-2 border-b border-border flex items-center justify-center">
          <span className="text-[11px] font-medium text-muted-foreground">▦</span>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col">
          {ROLES.map(role => (
            <button key={role.id} onClick={() => onSelect(role.id)} title={role.title}
              className={`w-full flex items-center justify-center py-3 border-b border-border transition-colors hover:bg-muted/50 border-l-2 ${selectedId === role.id ? "bg-muted/60 border-l-foreground" : "border-l-transparent"}`}>
              <span className={`text-[11px] font-bold ${selectedId === role.id ? "text-foreground" : "text-muted-foreground"}`}>
                {ROLE_INITIALS[role.id] || role.id.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-56 shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-200">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-medium">All roles</h2>
        <button className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors">+ New</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ROLES.map(role => (
          <button key={role.id} onClick={() => onSelect(role.id)}
            className={`w-full text-left p-3.5 border-b border-border transition-colors hover:bg-muted/50 border-l-2 ${selectedId === role.id ? "bg-muted/60 border-l-foreground" : "border-l-transparent"}`}>
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <p className="text-sm font-medium leading-snug">{role.title}</p>
              <StatusBadge status={role.status} />
            </div>
            <p className="text-[11px] text-muted-foreground">{role.department} · {role.candidateCount} candidates</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Collapsible Section ──────────────────────────────────────

function CollapsibleSection({ title, meta, defaultOpen = true, children }: { title: string; meta?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-1.5 group">
          <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
          <div className="flex items-center gap-2">
            {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
            <span className={`text-[11px] text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

// ── Job Posting Tab ───────────────────────────────────────────

function JDEditorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ from: "agent", text: "Hey! I can help refine the JD. Cosmetic changes go through directly — anything affecting the interview flow or eval criteria needs team review first." }])
  const [input, setInput] = useState("")
  const [idx, setIdx] = useState(0)
  const [closing, setClosing] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight }, [msgs])
  useEffect(() => { if (open && !closing) { const t = setTimeout(() => inputRef.current?.focus(), 300); return () => clearTimeout(t) } }, [open, closing])

  const send = () => {
    const msg = input.trim(); if (!msg) return
    setMsgs(p => [...p, { from: "user", text: msg }]); setInput("")
    setTimeout(() => { setMsgs(p => [...p, { from: "agent", text: AGENT_RESPONSES[idx % AGENT_RESPONSES.length] }]); setIdx(i => i+1) }, 800)
  }

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 180)
  }

  if (!open && !closing) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}
      style={{ background: "hsl(var(--background) / 0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className={`bg-background border border-border rounded-lg shadow-modal flex overflow-hidden ${closing ? "modal-pop-exit" : "modal-pop-enter"}`}
        style={{ width: "95vw", height: "95vh" }}>

        {/* Left — Notion-style JD editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <div className="shrink-0 px-6 pt-5 pb-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-1">Job Description</p>
              <h2 className="text-lg font-medium">Senior Product Designer</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Last edited 2h ago</span>
              {/* Import */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => document.getElementById("jd-import-input")?.click()}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Import
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-sm bg-status-danger/15 text-status-danger-foreground border border-status-danger/30">PDF</span>
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-sm bg-accent-blue/15 text-accent-blue border border-accent-blue/30">MD</span>
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border">DOC</span>
                </div>
              </div>
              <input id="jd-import-input" type="file" accept=".pdf,.doc,.docx,.md,.txt" className="hidden" onChange={() => {}} />
              {/* Download dropdown */}
              <div className="relative">
                <button onClick={() => setDownloadOpen(d => !d)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {downloadOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDownloadOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                      {[
                        { label: "PDF", ext: ".pdf", icon: "📄" },
                        { label: "Word", ext: ".docx", icon: "📝" },
                        { label: "Markdown", ext: ".md", icon: "📋" },
                      ].map(f => (
                        <button key={f.ext} onClick={() => setDownloadOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left hover:bg-muted/50 transition-colors">
                          <span>{f.icon}</span>
                          <span>Download as {f.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground text-sm leading-none px-1">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-10 py-8">
            <div className="max-w-2xl mx-auto">
              {/* Title */}
              <h1 className="text-2xl font-bold text-foreground mb-1 outline-none" contentEditable suppressContentEditableWarning>
                Senior Product Designer
              </h1>
              <p className="text-sm text-muted-foreground mb-6" contentEditable suppressContentEditableWarning>
                Product · San Francisco / Remote · Full-time
              </p>

              {/* Intro */}
              <p className="text-[15px] leading-relaxed text-foreground mb-6" contentEditable suppressContentEditableWarning>
                We're looking for a <strong>Senior Product Designer</strong> to join our growing product team. You'll own end-to-end design for our core hiring workflow — from discovery to shipped features — working directly with founders and engineers.
              </p>

              {/* H2 — What you'll do */}
              <h2 className="text-lg font-semibold text-foreground mt-8 mb-3 outline-none" contentEditable suppressContentEditableWarning>What you'll do</h2>
              <div className="flex flex-col gap-1.5 mb-6">
                {[
                  "Lead design for 2–3 product areas with full ownership of research, wireframes, and specs",
                  "Run design crits and shape the design system alongside engineers",
                  "Partner with PMs to drive roadmap decisions using qualitative + quantitative data",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 group">
                    <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-[15px] mt-0.5 shrink-0 transition-colors cursor-grab select-none">⠿</span>
                    <p className="text-[15px] leading-relaxed text-foreground flex-1 outline-none" contentEditable suppressContentEditableWarning>• {item}</p>
                  </div>
                ))}
                <button className="text-xs text-muted-foreground hover:text-foreground mt-1 text-left pl-7 transition-colors">+ Add item</button>
              </div>

              {/* H2 — What we're looking for */}
              <h2 className="text-lg font-semibold text-foreground mt-8 mb-3 outline-none" contentEditable suppressContentEditableWarning>What we're looking for</h2>
              <div className="flex flex-col gap-1.5 mb-6">
                {[
                  "4+ years of product design experience, ideally in B2B SaaS",
                  "Strong systems thinking — you design for scale, not just the happy path",
                  "Comfortable with ambiguity and moving fast without sacrificing craft",
                  "LinkedIn profile and a portfolio of shipped work required",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 group">
                    <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-[15px] mt-0.5 shrink-0 transition-colors cursor-grab select-none">⠿</span>
                    <p className="text-[15px] leading-relaxed text-foreground flex-1 outline-none" contentEditable suppressContentEditableWarning>• {item}</p>
                  </div>
                ))}
                <button className="text-xs text-muted-foreground hover:text-foreground mt-1 text-left pl-7 transition-colors">+ Add item</button>
              </div>

              {/* H2 — About */}
              <h2 className="text-lg font-semibold text-foreground mt-8 mb-3 outline-none" contentEditable suppressContentEditableWarning>About Alt Inc.</h2>
              <p className="text-[15px] leading-relaxed text-foreground mb-4 outline-none" contentEditable suppressContentEditableWarning>
                We're building AI avatars that scale founder taste. Our Alts conduct pre-screening conversations so small teams can hire like they have a recruiting org behind them — without losing the signal that makes their bar special.
              </p>
              <p className="text-[15px] leading-relaxed text-foreground mb-6 outline-none" contentEditable suppressContentEditableWarning>
                12 people, seed stage, remote-first (PT ±4h). Learn more at <a href="#" className="text-link underline underline-offset-2 hover:opacity-80">alt.inc</a>.
              </p>

              {/* H3 — Perks */}
              <h3 className="text-base font-medium text-foreground mt-8 mb-2 outline-none" contentEditable suppressContentEditableWarning>Perks & benefits</h3>
              <p className="text-[15px] leading-relaxed text-foreground mb-1 outline-none" contentEditable suppressContentEditableWarning>
                • Competitive equity package (4-year vest, 1-year cliff)
              </p>
              <p className="text-[15px] leading-relaxed text-foreground mb-1 outline-none" contentEditable suppressContentEditableWarning>
                • 100% covered health, dental, vision for you + dependents
              </p>
              <p className="text-[15px] leading-relaxed text-foreground mb-1 outline-none" contentEditable suppressContentEditableWarning>
                • $2,500 home office budget
              </p>
              <p className="text-[15px] leading-relaxed text-foreground mb-6 outline-none" contentEditable suppressContentEditableWarning>
                • Flexible PTO — we trust you to manage your time
              </p>

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-foreground">
                  Apply at <a href="#" className="text-link underline underline-offset-2 hover:opacity-80">alt.inc/apply/senior-product-designer</a> · Questions? Reach out to <a href="#" className="text-link underline underline-offset-2 hover:opacity-80">hiring@alt.inc</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Agent chat */}
        <div className="w-[360px] shrink-0 flex flex-col overflow-hidden bg-background">
          <div className="shrink-0 px-4 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent-blue">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
              </svg>
              <span className="text-xs font-medium">Sabu</span>
            </div>
            <p className="text-xs text-muted-foreground">Cosmetic edits apply instantly. Changes to eval criteria or interview flow need team review.</p>
          </div>
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {msgs.map((m, i) => (
              <div key={i} className={`text-[11px] leading-relaxed rounded-lg px-3 py-2 ${
                m.from === "agent"
                  ? "bg-muted/60 border border-border rounded-md self-start max-w-[90%]"
                  : "bg-foreground text-background self-end max-w-[85%]"
              }`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2 shrink-0">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); if (e.key === "Escape") handleClose() }}
              placeholder="Describe the change..."
              className="flex-1 text-[11px] rounded-lg bg-muted/40 border border-border px-3 py-2 outline-none placeholder:text-muted-foreground focus:border-foreground/40" />
            <button onClick={send} disabled={!input.trim()}
              className="text-[11px] rounded-lg px-3 py-2 bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function JobPostingTab({ status, onStatusChange }: { status: "draft"|"live"|"paused"; onStatusChange: (s: "draft"|"live"|"paused") => void }) {
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <>
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-page-wide mx-auto px-12 pt-8 pb-24 flex flex-col gap-10">

            {/* JD */}
            <CollapsibleSection title="Job description">
              <div className="relative bg-muted/40 border border-border rounded-lg p-4 text-sm leading-relaxed">
                <button onClick={() => setEditorOpen(true)}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Edit with Sabu
                </button>
                <p className="mb-2 pr-32">We're looking for a <strong>Senior Product Designer</strong> to join our growing product team. You'll own end-to-end design for our core hiring workflow — from discovery to shipped features — working directly with founders and engineers.</p>
                <p className="mb-1 font-medium">What you'll do:</p>
                <p className="mb-1">· Lead design for 2–3 product areas with full ownership of research, wireframes, and specs</p>
                <p className="mb-1">· Run design crits and shape the design system alongside engineers</p>
                <p className="mb-3">· Partner with PMs to drive roadmap decisions using qualitative + quantitative data</p>
                <p className="mb-1 font-medium">What we're looking for:</p>
                <p className="mb-1">· 4+ years of product design experience, ideally in B2B SaaS</p>
                <p className="mb-1">· Strong systems thinking — you design for scale, not just the happy path</p>
                <p className="mb-1">· Comfortable with ambiguity and moving fast without sacrificing craft</p>
                <p>· LinkedIn profile and a portfolio of shipped work required</p>
              </div>
            </CollapsibleSection>

            {/* Requirements + Share with candidates — side by side */}
            <div className="flex gap-6 items-start">
              <div className="flex-1 min-w-0">
                <CollapsibleSection title="Requirements">
                  <div className="border border-border rounded-lg overflow-hidden">
                    {[{ short: "in", label: "LinkedIn", color: "#0A66C2" }, { short: "gh", label: "GitHub", color: "#24292e" }].map((r, i) => (
                      <div key={r.label} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[11px] font-bold px-1 py-0.5 rounded text-white" style={{ background: r.color }}>{r.short}</span>
                          {r.label}
                        </div>
                        <AnimatedSelect
                          size="sm"
                          defaultValue="required"
                          options={[
                            { value: "required", label: "Required" },
                            { value: "optional", label: "Optional" },
                            { value: "off", label: "Off" },
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>

              <div className="flex-1 min-w-0">
                <CollapsibleSection title="Share with candidates">
                  <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
                    <span className="text-xs text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">alt.inc/apply/senior-product-designer</span>
                    <button className="text-xs border border-border rounded-md px-2 py-1 bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0">Copy</button>
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            {/* Collaborators */}
            <CollapsibleSection title="Collaborators">
              <div className="flex flex-col gap-2">
                {[{ i: "SG", n: "Sashank G." }, { i: "KG", n: "Kinnari G." }].map(c => (
                  <div key={c.i} className="flex items-center gap-2.5 px-3 py-2 border border-border rounded-lg bg-muted/20">
                    <div className="w-6 h-6 rounded-md bg-accent-blue/10 text-accent-blue flex items-center justify-center text-[11px] font-medium shrink-0">{c.i}</div>
                    <span className="text-sm">{c.n}</span>
                  </div>
                ))}
                <button className="text-xs text-link text-left hover:underline mt-0.5">+ Add collaborator</button>
              </div>
            </CollapsibleSection>

          </div>
        </div>
      </div>
    </div>

    <JDEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} />
    </>
  )
}

// ── Interview Config Tab ──────────────────────────────────────

function InterviewConfigTab() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="overflow-y-auto flex-1"><div className="max-w-page-wide mx-auto px-12 pt-8 pb-24 flex flex-col gap-10">
      <CollapsibleSection title="Interviewing Alt">
        <div className="flex items-center gap-3 p-2.5 bg-muted/40 border border-border rounded-lg w-fit">
          <div className="w-8 h-8 bg-accent-blue/10 text-accent-blue flex items-center justify-center text-xs font-medium rounded-md">SG</div>
          <div>
            <p className="text-sm font-medium">Sashank's Alt</p>
            <p className="text-[11px] text-muted-foreground">Founder · Active</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Eval criteria" meta="4 criteria · JD + best practices">
        <div className="border border-border rounded-lg overflow-hidden">
          {CRITERIA.map((c, i) => (
            <div key={c.id} className={i > 0 ? "border-t border-border" : ""}>
              <button onClick={() => toggleExpand(c.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors">
                <span className={`text-[11px] text-muted-foreground transition-transform inline-block ${expanded[c.id] ? "rotate-90" : ""}`}>▶</span>
                <span className="text-sm font-medium flex-1">{c.name}</span>
                <RetroTag variant={c.source === "jd" ? "jd" : "bp"}>{c.source === "jd" ? "JD" : "Best practice"}</RetroTag>
                <RetroTag variant="bp" >{c.testedBy === "questions" ? "Questions" : "Inferred"}</RetroTag>
              </button>
              {expanded[c.id] && (
                <div className="px-3 pb-3 pt-0 border-t border-border bg-muted/20">
                  <p className="text-xs leading-relaxed text-foreground mt-2.5 mb-2.5">{c.description}</p>
                  <div className="grid grid-cols-2 gap-3 mb-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Source</p>
                      <p className="text-xs leading-relaxed">{c.sourceDetail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">How tested</p>
                      <p className="text-xs leading-relaxed">{c.howTested}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Interview flow" meta="~22 min">
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Intro & warm-up (3 min)", detail: "Alt introduces itself, confirms the role, and eases the candidate in with light conversational prompts." },
            { label: "Role & experience walkthrough (5 min)", detail: "Candidate walks through recent roles. Alt probes for ownership, scope, and decisions they drove." },
            { label: "Deep dive — product thinking (7 min)", detail: "Alt poses a product scenario and adapts follow-ups in real time to test structured reasoning and tradeoffs." },
            { label: "Cross-functional scenario (5 min)", detail: "Alt presents a collaboration or conflict prompt (e.g. eng/design pushback) to gauge communication and stakeholder handling." },
            { label: "Candidate Q&A (2 min)", detail: "Alt answers the candidate's questions about role, team, and culture using founder memories." },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 bg-muted/40 border border-border rounded-lg">
              <div className="w-5 h-5 bg-border flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0 mt-0.5 rounded-sm">{i+1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{step.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

    </div></div>
  )
}

// ── Candidates Tab ────────────────────────────────────────────

function CandidatesTab({ roleTitle, activeProfile, onProfileOpen, onProfileClose, initialCandidateName, onCandidateConsumed }: { roleTitle: string; activeProfile: string | null; onProfileOpen: (key: string) => void; onProfileClose: () => void; initialCandidateName?: string | null; onCandidateConsumed?: () => void }) {
  const [threshold, setThreshold] = useState(7)
  const [thresholdOpen, setThresholdOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number|null>(null)
  const [overrides] = useState<Record<number, string>>({})
  const [detailTab, setDetailTab] = useState<"transcript"|"linkedin"|"notes">("linkedin")

  // Filter state — mirrors global Candidates page
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all"|"pending"|"shortlisted"|"rejected">("all")
  const [recFilter, setRecFilter] = useState<"all"|"shortlist"|"reject"|"review">("all")
  const [scoreMin, setScoreMin] = useState(1)
  const [scoreMax, setScoreMax] = useState(10)

  // Detail panel width — user-resizable via the divider between table and detail
  const [detailWidth, setDetailWidth] = useState(420)
  const splitRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !splitRef.current) return
      const rect = splitRef.current.getBoundingClientRect()
      // Mouse x → desired detail width = right edge - mouse - small handle gutter
      const next = rect.right - e.clientX - 4
      setDetailWidth(Math.max(280, Math.min(720, next)))
    }
    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  // Auto-select candidate when navigated from /candidates page
  useEffect(() => {
    if (!initialCandidateName) return
    const target = CANDIDATES.find(c => c.name.toLowerCase() === initialCandidateName.toLowerCase())
    if (target) {
      setSelectedId(target.id)
      onProfileClose()
    }
    onCandidateConsumed?.()
  }, [initialCandidateName])

  const getStatus = (c: Candidate) => overrides[c.id] || c.agentDecision

  // Map agentDecision → Alt rec semantics so we can filter on it the same
  // way the global Candidates page does
  const altRecOf = (c: Candidate): "shortlist"|"reject"|"review" =>
    c.agentDecision === "shortlisted" ? "shortlist" :
    c.agentDecision === "rejected" ? "reject" : "review"

  const filtered = [...CANDIDATES]
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && getStatus(c) !== statusFilter) return false
      if (recFilter !== "all" && altRecOf(c) !== recFilter) return false
      if (c.score < scoreMin || c.score > scoreMax) return false
      return true
    })
    .sort((a, b) => b.score - a.score)

  const activeFilterCount = [
    search !== "",
    statusFilter !== "all",
    recFilter !== "all",
    scoreMin > 1 || scoreMax < 10,
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setRecFilter("all")
    setScoreMin(1)
    setScoreMax(10)
  }

  const selected = CANDIDATES.find(c => c.id === selectedId)

  const selectCandidate = (id: number) => {
    setSelectedId(id)
    onProfileClose() // switching candidate closes profile panel & expands roles
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Filter bar — same shape as global Candidates page */}
      <div className="shrink-0">
        <div className="max-w-page-wide mx-auto px-12 pt-8 pb-4 flex items-center gap-2 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="text-xs border border-border rounded-md px-3 py-1.5 bg-background outline-none placeholder:text-muted-foreground w-56 focus:border-foreground/40"
          />
          <AnimatedSelect<typeof statusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "pending", label: "Your call" },
              { value: "shortlisted", label: "Pushed to ATS" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
          <AnimatedSelect<typeof recFilter>
            value={recFilter}
            onChange={setRecFilter}
            options={[
              { value: "all", label: "All Alt recs" },
              { value: "shortlist", label: "Shortlist" },
              { value: "reject", label: "Pass" },
              { value: "review", label: "Review" },
            ]}
          />
          <ScoreRangeFilter
            min={1}
            max={10}
            lower={scoreMin}
            upper={scoreMax}
            onChange={(l, u) => { setScoreMin(l); setScoreMax(u) }}
          />
          <button onClick={() => setThresholdOpen(o => !o)}
            className={`text-xs px-2 py-1.5 border rounded-md transition-colors ml-auto ${thresholdOpen ? "border-foreground bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
            Threshold
          </button>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
              Clear {activeFilterCount}
            </button>
          )}
        </div>

        {/* Threshold panel — collapsible row under the filter bar */}
        <div className={`overflow-hidden transition-all duration-200 ${thresholdOpen ? "max-h-32" : "max-h-0"}`}>
          <div className="max-w-page-wide mx-auto px-12 pb-3">
            <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-md px-3 py-2.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Push-to-ATS threshold</span>
              <input type="range" min={1} max={10} step={1} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="flex-1 accent-foreground h-1" />
              <span className="text-sm font-medium w-4 text-center tabular-nums">{threshold}</span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Candidates scoring <strong className="text-foreground">{threshold}+</strong> auto-pushed to ATS · Alt decides the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Body — page-wide parent stays fixed; table column inside it contracts
          when the detail panel opens. Resizer sits between them.
          Profile panel (LinkedIn etc.) still slides in from outside the page-wide cap. */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div ref={splitRef} className="max-w-page-wide mx-auto px-12 pb-6 h-full flex">
            <div className="flex-1 min-w-0 overflow-y-auto">
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
                <p className="text-xs text-muted-foreground">No candidates match these filters.</p>
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
                  <div className="w-10 shrink-0"><span className="text-xs text-muted-foreground">Score</span></div>
                  <div className="flex-1"><span className="text-xs text-muted-foreground">Candidate</span></div>
                  <div className="w-32 shrink-0"><span className="text-xs text-muted-foreground">Alt</span></div>
                  <div className="w-28 shrink-0"><span className="text-xs text-muted-foreground">Status</span></div>
                  <div className="w-16 shrink-0 text-right"><span className="text-xs text-muted-foreground">Time</span></div>
                </div>

                <AnimatePresence initial={false}>
                {filtered.map((c, i) => {
                  const status = getStatus(c)
                  const rec = altRecOf(c)
                  const altLabel = rec === "shortlist" ? "Alt: Shortlist ↑" : rec === "reject" ? "Alt: Pass ↓" : "Alt: Your call"
                  const altCls = rec === "shortlist"
                    ? "bg-status-success text-status-success-foreground"
                    : rec === "reject"
                    ? "bg-status-danger text-status-danger-foreground"
                    : "bg-status-warning text-status-warning-foreground"
                  const hideStatus = c.score >= 9 && status === "shortlisted"
                  return (
                    <motion.div key={c.id} onClick={() => selectCandidate(c.id)}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.18, ease: "easeIn" } }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors overflow-hidden ${
                        selectedId === c.id ? "bg-muted/50" : i % 2 ? "bg-muted/10" : ""
                      } hover:bg-muted/40`}
                    >
                      <div className="w-10 shrink-0">
                        <span className={`text-base font-medium tabular-nums ${scoreColors[c.color]}`}>{c.score}</span>
                        <span className="text-[11px] text-muted-foreground">/10</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium truncate min-w-0">{c.name}</p>
                          <span className="shrink-0"><StellarTag score={c.score} /></span>
                        </div>
                      </div>
                      <div className="w-32 shrink-0">
                        <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${altCls}`}>{altLabel}</span>
                      </div>
                      <div className="w-28 shrink-0">
                        {!hideStatus && <CandStatusBadge status={status} />}
                      </div>
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-xs text-muted-foreground">{c.time}</span>
                      </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </motion.div>
            )}
            </AnimatePresence>
            </div>

            {/* Resizer + detail panel — inside the page-wide parent so the
                parent's width stays fixed; only the table column contracts. */}
            {selected && (
              <>
                <div onMouseDown={startResize}
                  className="w-1 mx-1 shrink-0 cursor-col-resize bg-border/40 hover:bg-foreground/40 active:bg-foreground/60 transition-colors rounded-full"
                  title="Drag to resize"
                />
                <div style={{ width: detailWidth }} className="shrink-0 overflow-y-auto border border-border rounded-lg">
                  <div className="px-5 py-5">
              {/* Candidate header — name + role */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-11 h-11 flex items-center justify-center text-sm font-medium text-white shrink-0 ${dotColors[selected.color]}`}>
                  {selected.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-medium leading-tight truncate">{selected.name}</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{roleTitle}</p>
                </div>
              </div>

              {/* Score card */}
              <CollapsibleSection title="Score summary">
                <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border rounded-lg mb-4">
                  <div className={`text-5xl font-medium leading-none tabular-nums ${scoreColors[selected.color]}`}>
                    {selected.score}<span className="text-lg text-muted-foreground">/10</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs leading-relaxed mb-2">Strong systems thinker with clear communication. Showed good instinct for trade-offs. Slightly thin on B2B SaaS specifics — worth probing in final interview.</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CandStatusBadge status={getStatus(selected)} />
                      <StellarTag score={selected.score} />
                      <span className="text-xs text-muted-foreground">Interviewed {selected.time}</span>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Alt scores */}
              <CollapsibleSection title="Alt scores">
                <div className="border border-border rounded-lg overflow-hidden mb-4">
                  {getAltScoresFor(selected).map((row, i) => (
                    <div key={row.criterionId} className={`flex items-start gap-3 px-3 py-2.5 bg-muted/30 ${i > 0 ? "border-t border-border" : ""}`}>
                      <div className={`flex flex-col items-center w-8 shrink-0 ${scoreColors[scoreToColor(row.score)]}`}>
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
              </CollapsibleSection>

              {/* Profile links — click to open right panel */}
              <CollapsibleSection title="Profile links">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PROFILE_LINKS.map(p => (
                    <button key={p.key} onClick={() => p.provided && onProfileOpen(p.key)} disabled={!p.provided}
                      className={`flex items-center gap-2 p-2.5 border text-left transition-colors ${!p.provided ? "border-border opacity-40 cursor-not-allowed" : activeProfile === p.key ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/40 cursor-pointer"}`}>
                      <div className="w-6 h-6 flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: p.bg }}>{p.short}</div>
                      <div>
                        <p className="text-xs font-medium">{p.label}</p>
                        <p className="text-xs text-muted-foreground">{p.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Detail tabs */}
              <CollapsibleSection title="Assessment detail">
                <div className="flex border-b border-border mb-3">
                  {(["linkedin","transcript","notes"] as const).map(t => (
                    <button key={t} onClick={() => setDetailTab(t)}
                      className={`text-[11px] px-3 py-1.5 border-b-2 transition-colors ${detailTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                      {t === "linkedin" ? "LinkedIn analysis" : t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>

                {detailTab === "transcript" && (
                  <div className="flex flex-col gap-2">
                    {[
                      { from: "Alt", text: "Tell me about a design decision where you had to navigate a real trade-off between user needs and business constraints." },
                      { from: "You", text: "At my last role, we redesigned onboarding. Product wanted a 3-step wizard for conversion, but research showed users needed more context upfront. We ran an A/B — longer flow won on 30-day retention even though it dropped top-of-funnel." },
                      { from: "Alt", text: "What was the business reaction when you pushed back on conversion numbers in favour of retention?" },
                      { from: "You", text: "There was friction. I had to present the data twice and get the CEO involved. But the retention numbers made the case — it's now a principle in our design system docs." },
                    ].map((b, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-[11px] text-muted-foreground w-6 shrink-0 pt-1.5">{b.from}</span>
                        <div className="flex-1 text-[11px] leading-relaxed bg-muted/40 border border-border rounded-md px-2.5 py-2">{b.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "linkedin" && (
                  <div className="flex flex-col gap-1.5">
                    {[
                      { l: "Overall vibe", v: "Strong — thoughtful, grounded, no performative hustle content", good: true },
                      { l: "Profile inflation", v: "Clean — titles match stated tenure", good: true },
                      { l: "Posting activity", v: "Active · 3 posts in last 90 days", good: null },
                      { l: "Post quality", v: "Depth: medium-high · Likely authentic writing", good: null },
                      { l: "AI writing detected", v: "Low probability", good: true },
                      { l: "Avg engagement", v: "~140 likes per post", good: null },
                    ].map(s => (
                      <div key={s.l} className="flex justify-between items-start p-2 bg-muted/30 border border-border rounded-md">
                        <span className="text-[11px] text-muted-foreground">{s.l}</span>
                        <span className={`text-[11px] text-right max-w-[200px] ${s.good === true ? "text-status-success-foreground" : s.good === false ? "text-status-danger-foreground" : "text-foreground"}`}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "notes" && (
                  <textarea className="w-full border border-border rounded-md p-2.5 text-[11px] bg-background outline-none placeholder:text-muted-foreground min-h-[70px] resize-none leading-relaxed" placeholder="Add a private note about this candidate..." />
                )}
              </CollapsibleSection>

              {/* ATS row */}
              <CollapsibleSection title="ATS actions">
                <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-md">
                  {getStatus(selected) === "shortlisted" ? (
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-status-success text-status-success-foreground">Shortlisted to ATS</span>
                  ) : (
                    <CandStatusBadge status={getStatus(selected)} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Manual overrides pause Alt's autonomy for this role · <button className="underline hover:text-foreground transition-colors">Manage in settings</button>
                </p>
              </CollapsibleSection>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile panel — slides in from right when a link is clicked */}
        <div className={`shrink-0 overflow-hidden transition-all duration-200 ${activeProfile ? "w-96" : "w-0"}`}>
          {activeProfile && <ProfilePanel profileKey={activeProfile} onClose={onProfileClose} />}
        </div>
      </div>
    </div>
  )
}

// ── Role Detail ───────────────────────────────────────────────

function RoleDetail({ role, activeProfile, onProfileOpen, onProfileClose, onBackToList, initialCandidateName, onCandidateConsumed }: { role: Role; activeProfile: string | null; onProfileOpen: (key: string) => void; onProfileClose: () => void; onBackToList?: () => void; initialCandidateName?: string | null; onCandidateConsumed?: () => void }) {
  const defaultTab = role.status === "live" || initialCandidateName ? "candidates" : "job-posting"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [status, setStatus] = useState<"draft"|"live"|"paused">(role.status)

  const tabs = [
    { id: "job-posting", label: "Job posting" },
    { id: "interview-config", label: "Interview config" },
    { id: "candidates", label: "Candidates", badge: role.candidateCount },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page title block — back link + name/status on left, doc actions floated right */}
      <div className="shrink-0">
        <div className="max-w-page-wide mx-auto px-12 pt-8 pb-0">
          <button onClick={onBackToList} className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3 -ml-1 px-1 py-0.5 hover:bg-muted rounded-sm transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to roles
          </button>
          <div className="flex items-start justify-between gap-6 mb-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📋</span>
                <h1 className="text-h1">{role.title}</h1>
                {/* Status pill — sits next to the title so the lifecycle
                    state is visible at a glance without opening any tab. */}
                <div className="flex items-center bg-muted rounded-md overflow-hidden border border-border">
                  <button onClick={() => setStatus("live")}
                    className={`text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 transition-colors ${status === "live" ? "bg-status-success text-status-success-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-status-success-dot" : "bg-muted-foreground/40"}`} />
                    Live
                  </button>
                  <button onClick={() => setStatus("draft")}
                    className={`text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 transition-colors ${status === "draft" ? "bg-status-warning text-status-warning-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === "draft" ? "bg-status-warning-dot" : "bg-muted-foreground/40"}`} />
                    Draft
                  </button>
                  <button onClick={() => setStatus("paused")}
                    className={`text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 transition-colors ${status === "paused" ? "bg-status-danger text-status-danger-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === "paused" ? "bg-status-danger-dot" : "bg-muted-foreground/40"}`} />
                    Paused
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-1">
                <span className="text-sm text-muted-foreground">{role.department}</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-sm text-muted-foreground">Created {role.createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 pt-1">
              <span>Edited just now</span>
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share with Candidate
              </button>
              <button className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-sm" title="More">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 border-b border-border/60 -mx-2 px-2">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] border-b-2 transition-colors -mb-px ${activeTab === t.id ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
                {t.badge !== undefined && <span className="text-[11px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-xs tabular-nums">{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "job-posting" && <JobPostingTab status={status} onStatusChange={setStatus} />}
        {activeTab === "interview-config" && <InterviewConfigTab />}
        {activeTab === "candidates" && <CandidatesTab roleTitle={role.title} activeProfile={activeProfile} onProfileOpen={onProfileOpen} onProfileClose={onProfileClose} initialCandidateName={initialCandidateName} onCandidateConsumed={onCandidateConsumed} />}
      </div>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────

export function RolesPage({ onEntityChange, selectedRoleId, onSelectRole: _onSelectRole, onBackToList, initialCandidateName, onCandidateConsumed }: { onEntityChange?: (e: { type: "role"|"candidate"|"alt"; name: string; meta?: Record<string,string> } | undefined) => void; selectedRoleId?: string | null; onSelectRole?: (id: string) => void; onBackToList?: () => void; initialCandidateName?: string | null; onCandidateConsumed?: () => void }) {
  const [activeProfile, setActiveProfile] = useState<string | null>(null)
  const selectedRole = selectedRoleId ? ROLES.find(r => r.id === selectedRoleId) ?? null : null

  useEffect(() => {
    if (selectedRole) {
      onEntityChange?.({ type: "role", name: selectedRole.title, meta: { id: selectedRole.id, status: selectedRole.status, candidateCount: String(selectedRole.candidateCount) } })
    } else {
      onEntityChange?.(undefined)
    }
  }, [selectedRoleId])

  // Reset profile drilldown when role changes
  useEffect(() => { setActiveProfile(null) }, [selectedRoleId])

  const openProfile = (key: string) => setActiveProfile(key)
  const closeProfile = () => setActiveProfile(null)

  return (
    <div className="flex h-full overflow-hidden">
      {selectedRole ? (
        <RoleDetail key={selectedRole.id} role={selectedRole} activeProfile={activeProfile} onProfileOpen={openProfile} onProfileClose={closeProfile} onBackToList={onBackToList} initialCandidateName={initialCandidateName} onCandidateConsumed={onCandidateConsumed} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-display">roles page</p>
        </div>
      )}
    </div>
  )
}
