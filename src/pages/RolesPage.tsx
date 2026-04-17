import { useState, useRef, useEffect } from "react"
import { usePanelRef } from "react-resizable-panels"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

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

const scoreColors = { green: "text-[#3B6D11]", teal: "text-[#0F6E56]", amber: "text-[#854F0B]", red: "text-[#A32D2D]" }
const dotColors = { green: "bg-[#639922]", teal: "bg-[#1D9E75]", amber: "bg-[#BA7517]", red: "bg-[#E24B4A]" }

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
  const s = { draft: "bg-[#FAEEDA] text-[#854F0B]", live: "bg-[#EAF3DE] text-[#3B6D11]", paused: "bg-muted text-muted-foreground" }
  return <span className={`text-[10px] px-1.5 py-0.5 font-pixel font-medium ${(s as any)[status] || s.paused}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
}

function CandStatusBadge({ status }: { status: string }) {
  const s: any = { shortlisted: "bg-[#EAF3DE] text-[#3B6D11]", rejected: "bg-[#FCEBEB] text-[#A32D2D]", pending: "bg-muted text-muted-foreground" }
  const l: any = { shortlisted: "Shortlisted", rejected: "Rejected", pending: "Pending" }
  return <span className={`text-[10px] px-1.5 py-0.5 font-pixel font-medium ${s[status]||s.pending}`}>{l[status]||"Pending"}</span>
}

function RetroTag({ variant, children }: { variant: "jd"|"bp"|"neutral"; children: React.ReactNode }) {
  const s = { jd: "bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]", bp: "bg-[#E6F1FB] text-[#185FA5] border border-[#B5D4F4]", neutral: "bg-muted text-muted-foreground border border-border" }
  return <span className={`text-[9px] px-1.5 py-0.5 font-pixel font-medium ${s[variant]}`}>{children}</span>
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
          <div className="w-5 h-5 flex items-center justify-center text-[8px] font-pixel font-bold text-white shrink-0" style={{ background: profile.bg }}>{profile.short}</div>
          <span className="text-xs font-pixel font-medium">{profile.label}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* TLDR */}
        <div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.12em] text-muted-foreground mb-2">TL;DR</p>
          <p className="text-[11px] font-pixel leading-relaxed text-foreground bg-muted/40 border border-border p-3">{profile.tldr}</p>
        </div>

        {isResume ? (
          <>
            {/* Mock PDF preview */}
            <div>
              <p className="text-[9px] font-pixel uppercase tracking-[0.12em] text-muted-foreground mb-2">Resume preview</p>
              <div className="border border-border bg-white text-foreground p-5 flex flex-col gap-3 shadow-sm">
                <div className="border-b border-border/40 pb-3">
                  <p className="text-sm font-medium">Priya Sharma</p>
                  <p className="text-[10px] font-pixel text-muted-foreground">Senior Product Designer · San Francisco, CA</p>
                  <p className="text-[10px] font-pixel text-muted-foreground">priya.sharma@email.com · (555) 123-4567</p>
                </div>
                <div>
                  <p className="text-[9px] font-pixel font-medium uppercase tracking-wider mb-1">Experience</p>
                  <div className="mb-2">
                    <p className="text-[11px] font-medium">Senior Product Designer — Finova (Series B)</p>
                    <p className="text-[10px] font-pixel text-muted-foreground">Jan 2023 – Present</p>
                    <p className="text-[10px] leading-relaxed mt-0.5">· Led redesign of onboarding flow — 40% improvement in activation rate</p>
                    <p className="text-[10px] leading-relaxed">· Shipped 3 major features in 6 months, working directly with CEO</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-[11px] font-medium">Product Designer — Atlassian</p>
                    <p className="text-[10px] font-pixel text-muted-foreground">Mar 2020 – Dec 2022</p>
                    <p className="text-[10px] leading-relaxed mt-0.5">· Owned Jira workflow builder for teams of 50–500</p>
                    <p className="text-[10px] leading-relaxed">· Built and maintained design system serving 12 product teams</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-pixel font-medium uppercase tracking-wider mb-1">Education</p>
                  <p className="text-[10px]">BFA Interaction Design — School of Visual Arts, NYC (2019)</p>
                </div>
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 text-[11px] font-pixel px-3 py-2 border border-border hover:bg-muted transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download resume (PDF)
            </button>
          </>
        ) : (
          /* Source link for non-resume profiles */
          profile.url && (
            <div>
              <p className="text-[9px] font-pixel uppercase tracking-[0.12em] text-muted-foreground mb-2">Source</p>
              <a href={profile.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[11px] font-pixel px-3 py-2 border border-border hover:bg-muted transition-colors text-blue-600">
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
          <span className="text-[9px] font-pixel font-medium text-muted-foreground">▦</span>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col">
          {ROLES.map(role => (
            <button key={role.id} onClick={() => onSelect(role.id)} title={role.title}
              className={`w-full flex items-center justify-center py-3 border-b border-border transition-colors hover:bg-muted/50 border-l-2 ${selectedId === role.id ? "bg-muted/60 border-l-foreground" : "border-l-transparent"}`}>
              <span className={`text-[9px] font-pixel font-bold ${selectedId === role.id ? "text-foreground" : "text-muted-foreground"}`}>
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
        <h2 className="text-xs font-pixel font-medium uppercase tracking-wider">All roles</h2>
        <button className="text-[10px] font-pixel text-muted-foreground hover:text-foreground border border-border px-2 py-1 transition-colors">+ New</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ROLES.map(role => (
          <button key={role.id} onClick={() => onSelect(role.id)}
            className={`w-full text-left p-3.5 border-b border-border transition-colors hover:bg-muted/50 border-l-2 ${selectedId === role.id ? "bg-muted/60 border-l-foreground" : "border-l-transparent"}`}>
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <p className="text-sm font-medium leading-snug">{role.title}</p>
              <StatusBadge status={role.status} />
            </div>
            <p className="text-[11px] text-muted-foreground font-pixel">{role.department} · {role.candidateCount} candidates</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Collapsible Section ──────────────────────────────────────

function CollapsibleSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-1.5 group">
          <p className="text-[9px] font-pixel uppercase tracking-[0.12em] text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
          <span className={`text-[9px] font-pixel text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

// ── Job Posting Tab ───────────────────────────────────────────

function JobPostingTab({ status, onStatusChange }: { status: "draft"|"live"; onStatusChange: (s: "draft"|"live") => void }) {
  const [agentOpen, setAgentOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ from: "agent", text: "Hey! I can help refine the JD. Cosmetic changes go through directly — anything affecting the interview flow or eval criteria needs team review first." }])
  const [input, setInput] = useState("")
  const [idx, setIdx] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)
  const agentPanelRef = usePanelRef()

  const send = () => {
    const msg = input.trim(); if (!msg) return
    setMsgs(p => [...p, { from: "user", text: msg }]); setInput("")
    setTimeout(() => { setMsgs(p => [...p, { from: "agent", text: AGENT_RESPONSES[idx % AGENT_RESPONSES.length] }]); setIdx(i => i+1) }, 800)
  }

  const openAgent = () => { agentPanelRef.current?.resize(35); setAgentOpen(true) }
  const closeAgent = () => { agentPanelRef.current?.collapse(); setAgentOpen(false) }

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight }, [msgs])

  return (
    <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">

      {/* Scrollable content column */}
      <ResizablePanel defaultSize={100} minSize={30} className="overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-6 flex flex-col gap-6">

            {/* JD */}
            <CollapsibleSection title="Job description">
              <div className="relative bg-muted/40 border border-border p-4 text-sm leading-relaxed mb-3">
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] text-muted-foreground font-pixel">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Locked
                </div>
                <p className="mb-2">We're looking for a <strong>Senior Product Designer</strong> to join our growing product team. You'll own end-to-end design for our core hiring workflow — from discovery to shipped features — working directly with founders and engineers.</p>
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
              <button onClick={openAgent} className="flex items-center gap-2 text-xs font-pixel px-3 py-1.5 border border-border hover:bg-muted transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit with agent
              </button>
            </CollapsibleSection>

            {/* Requirements */}
            <CollapsibleSection title="Requirements">
              <div className="border border-border overflow-hidden">
                {[{ short: "in", label: "LinkedIn", color: "#0A66C2" }, { short: "gh", label: "GitHub", color: "#24292e" }].map((r, i) => (
                  <div key={r.label} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[9px] font-pixel font-bold px-1 py-0.5 text-white" style={{ background: r.color }}>{r.short}</span>
                      {r.label}
                    </div>
                    <select className="text-[10px] font-pixel border border-border px-2 py-1 bg-background text-foreground">
                      <option>Required</option><option>Optional</option><option>Off</option>
                    </select>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Share with candidates */}
            <CollapsibleSection title="Share with candidates">
              <div className="flex items-center gap-2 bg-muted/40 border border-border px-3 py-2.5">
                <span className="text-xs font-pixel text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">alt.inc/apply/senior-product-designer</span>
                <button className="text-[10px] font-pixel border border-border px-2 py-1 bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0">Copy</button>
              </div>
            </CollapsibleSection>

            {/* Collaborators */}
            <CollapsibleSection title="Collaborators">
              <div className="flex flex-col gap-2">
                {[{ i: "SG", n: "Sashank G." }, { i: "KG", n: "Kinnari G." }].map(c => (
                  <div key={c.i} className="flex items-center gap-2.5 px-3 py-2 border border-border bg-muted/20">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-pixel font-medium shrink-0">{c.i}</div>
                    <span className="text-sm">{c.n}</span>
                  </div>
                ))}
                <button className="text-[10px] font-pixel text-blue-600 text-left hover:underline mt-0.5">+ Add collaborator</button>
              </div>
            </CollapsibleSection>

          </div>
        </div>
      </ResizablePanel>

      {/* Draggable resize handle */}
      <ResizableHandle withHandle />

      {/* Agent panel — resizable, collapsible (closed by default) */}
      <ResizablePanel
        defaultSize={0}
        minSize={20}
        collapsible
        collapsedSize={0}
        panelRef={agentPanelRef}
        onResize={(size) => setAgentOpen(size.asPercentage > 0)}
        className="overflow-hidden"
      >
        {agentOpen && (
          <div className="flex flex-col h-full border-l border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <span className="text-xs font-pixel font-medium">Edit with agent</span>
              <button onClick={closeAgent} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
            </div>
            <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {msgs.map((m, i) => (
                <div key={i} className={`text-[11px] font-pixel leading-relaxed px-2.5 py-2 ${m.from === "agent" ? "bg-muted/60 border border-border" : "bg-foreground text-background self-end max-w-[85%]"}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="p-2.5 border-t border-border flex gap-2 shrink-0">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Describe the change..."
                className="flex-1 text-[11px] font-pixel bg-muted/40 border border-border px-2.5 py-1.5 outline-none placeholder:text-muted-foreground" />
              <button onClick={send} className="text-[11px] font-pixel px-3 py-1.5 bg-foreground text-background hover:opacity-90">Send</button>
            </div>
          </div>
        )}
      </ResizablePanel>

    </ResizablePanelGroup>
  )
}

// ── Interview Config Tab ──────────────────────────────────────

function InterviewConfigTab() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="overflow-y-auto flex-1"><div className="max-w-5xl mx-auto px-8 py-6 flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-pixel font-medium uppercase tracking-wider">Eval criteria</h3>
          <span className="text-[10px] font-pixel text-muted-foreground">4 criteria · JD + best practices</span>
        </div>
        <div className="border border-border overflow-hidden">
          {CRITERIA.map((c, i) => (
            <div key={c.id} className={i > 0 ? "border-t border-border" : ""}>
              <button onClick={() => toggleExpand(c.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors">
                <span className={`text-[9px] font-pixel text-muted-foreground transition-transform inline-block ${expanded[c.id] ? "rotate-90" : ""}`}>▶</span>
                <span className="text-sm font-medium flex-1">{c.name}</span>
                <RetroTag variant={c.source === "jd" ? "jd" : "bp"}>{c.source === "jd" ? "JD" : "Best practice"}</RetroTag>
                <RetroTag variant="bp" >{c.testedBy === "questions" ? "Questions" : "Inferred"}</RetroTag>
              </button>
              {expanded[c.id] && (
                <div className="px-3 pb-3 pt-0 border-t border-border bg-muted/20">
                  <p className="text-xs leading-relaxed text-foreground mt-2.5 mb-2.5">{c.description}</p>
                  <div className="grid grid-cols-2 gap-3 mb-2.5">
                    <div>
                      <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1">Source</p>
                      <p className="text-xs leading-relaxed">{c.sourceDetail}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1">How tested</p>
                      <p className="text-xs leading-relaxed">{c.howTested}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-pixel font-medium uppercase tracking-wider mb-2.5">Interviewing Alt</h3>
        <div className="flex items-center gap-3 p-2.5 bg-muted/40 border border-border w-fit">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-pixel font-medium">SG</div>
          <div>
            <p className="text-sm font-medium">Sashank's Alt</p>
            <p className="text-[11px] font-pixel text-muted-foreground">Founder · Active</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-pixel font-medium uppercase tracking-wider">Interview flow</h3>
          <span className="text-[10px] font-pixel text-muted-foreground">~22 min</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {["Intro & warm-up (3 min)", "Role & experience walkthrough (5 min)", "Deep dive — product thinking (7 min)", "Cross-functional scenario (5 min)", "Candidate Q&A (2 min)"].map((step, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-muted/40 border border-border">
              <div className="w-5 h-5 bg-border flex items-center justify-center text-[10px] font-pixel font-medium text-muted-foreground shrink-0">{i+1}</div>
              <span className="text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>

    </div></div>
  )
}

// ── Candidates Tab ────────────────────────────────────────────

function CandidatesTab({ activeProfile, onProfileOpen, onProfileClose }: { activeProfile: string | null; onProfileOpen: (key: string) => void; onProfileClose: () => void }) {
  // TODO (review): threshold slider icon should move to the candidate column header alongside search/filter
  const [threshold, setThreshold] = useState(7)
  const [thresholdOpen, setThresholdOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"score"|"time">("score")
  const [selectedId, setSelectedId] = useState<number|null>(null)
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [detailTab, setDetailTab] = useState<"transcript"|"linkedin"|"notes">("transcript")

  const getStatus = (c: Candidate) => overrides[c.id] || c.agentDecision

  const sorted = [...CANDIDATES].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score
    const ord = ["2h ago","5h ago","6h ago","1d ago","1d ago","2d ago","2d ago","3d ago","3d ago","4d ago","5d ago","6d ago"]
    return ord.indexOf(a.time) - ord.indexOf(b.time)
  })

  const selected = CANDIDATES.find(c => c.id === selectedId)

  const selectCandidate = (id: number) => {
    setSelectedId(id)
    onProfileClose() // switching candidate closes profile panel & expands roles
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Threshold panel */}
      <div className={`shrink-0 border-b border-border bg-muted/30 overflow-hidden transition-all duration-200 ${thresholdOpen ? "max-h-20 py-3 px-4" : "max-h-0"}`}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-pixel text-muted-foreground whitespace-nowrap">Shortlist threshold</span>
          <input type="range" min={1} max={10} step={1} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="flex-1 accent-foreground h-1" />
          <span className="text-sm font-pixel font-medium w-4 text-center tabular-nums">{threshold}</span>
          <span className="text-[10px] font-pixel text-muted-foreground">/10</span>
        </div>
        <p className="text-[10px] font-pixel text-muted-foreground mt-1.5">
          Candidates scoring <strong className="text-foreground">{threshold}+</strong> auto-shortlisted · below reviewed by agent
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Candidate list */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="p-2.5 border-b border-border flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <input placeholder="Search candidates..." className="flex-1 text-[11px] font-pixel border border-border px-2 py-1.5 bg-background outline-none placeholder:text-muted-foreground" />
              <button onClick={() => setThresholdOpen(o => !o)} title="Shortlist threshold"
                className={`p-1.5 border transition-colors ${thresholdOpen ? "border-foreground bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                  <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                  <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
                  <line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-pixel text-muted-foreground">Sort:</span>
              {(["score","time"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} className={`text-[10px] font-pixel px-2 py-0.5 border transition-colors ${sortBy === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                  {s === "score" ? "Score ↓" : "Time ↓"}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input placeholder='Filter: e.g. "5+ yrs, Figma"' className="flex-1 text-[10px] font-pixel border border-border px-2 py-1 bg-background outline-none placeholder:text-muted-foreground" />
              <button className="text-[10px] font-pixel px-2 py-1 border border-border hover:bg-muted transition-colors">↗</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sorted.map(c => {
              const status = getStatus(c)
              return (
                <button key={c.id} onClick={() => selectCandidate(c.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-border text-left transition-colors hover:bg-muted/40 border-l-2 ${selectedId === c.id ? "bg-muted/50 border-l-foreground" : "border-l-transparent"}`}>
                  <div className={`flex flex-col items-center w-8 shrink-0 ${scoreColors[c.color]}`}>
                    <span className="text-base font-medium leading-none tabular-nums">{c.score}</span>
                    <span className="text-[9px] font-pixel text-muted-foreground">/10</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[10px] font-pixel text-muted-foreground">{c.time}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <CandStatusBadge status={status} />
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColors[c.color]}`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Candidate detail */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs font-pixel text-muted-foreground">Select a candidate to review</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto"><div className="max-w-2xl mx-auto px-6 py-5">
              {/* Score card */}
              <CollapsibleSection title="Score summary">
                <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border mb-4">
                  <div className={`text-5xl font-medium leading-none tabular-nums ${scoreColors[selected.color]}`}>
                    {selected.score}<span className="text-lg text-muted-foreground">/10</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs leading-relaxed mb-2">Strong systems thinker with clear communication. Showed good instinct for trade-offs. Slightly thin on B2B SaaS specifics — worth probing in final interview.</p>
                    <div className="flex items-center gap-2">
                      <CandStatusBadge status={getStatus(selected)} />
                      <span className="text-[10px] font-pixel text-muted-foreground">Interviewed {selected.time}</span>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Alt scores */}
              <CollapsibleSection title="Alt scores">
                <div className="border border-border mb-4">
                  {getAltScoresFor(selected).map((row, i) => (
                    <div key={row.criterionId} className={`flex items-start gap-3 px-3 py-2.5 bg-muted/30 ${i > 0 ? "border-t border-border" : ""}`}>
                      <div className={`flex flex-col items-center w-8 shrink-0 ${scoreColors[scoreToColor(row.score)]}`}>
                        <span className="text-base font-medium leading-none tabular-nums">{row.score}</span>
                        <span className="text-[9px] font-pixel text-muted-foreground">/10</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-0.5">{row.name}</p>
                        <p className="text-[11px] font-pixel text-muted-foreground leading-relaxed">{row.rationale}</p>
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
                      <div className="w-6 h-6 flex items-center justify-center text-[9px] font-pixel font-bold text-white shrink-0" style={{ background: p.bg }}>{p.short}</div>
                      <div>
                        <p className="text-xs font-medium">{p.label}</p>
                        <p className="text-[10px] font-pixel text-muted-foreground">{p.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Detail tabs */}
              <CollapsibleSection title="Assessment detail">
                <div className="flex border-b border-border mb-3">
                  {(["transcript","linkedin","notes"] as const).map(t => (
                    <button key={t} onClick={() => setDetailTab(t)}
                      className={`text-[11px] font-pixel px-3 py-1.5 border-b-2 transition-colors ${detailTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
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
                        <span className="text-[9px] font-pixel text-muted-foreground w-6 shrink-0 pt-1.5">{b.from}</span>
                        <div className="flex-1 text-[11px] leading-relaxed bg-muted/40 border border-border px-2.5 py-2">{b.text}</div>
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
                      <div key={s.l} className="flex justify-between items-start p-2 bg-muted/30 border border-border">
                        <span className="text-[11px] font-pixel text-muted-foreground">{s.l}</span>
                        <span className={`text-[11px] font-pixel text-right max-w-[200px] ${s.good === true ? "text-[#3B6D11]" : s.good === false ? "text-[#A32D2D]" : "text-foreground"}`}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "notes" && (
                  <textarea className="w-full border border-border p-2.5 text-[11px] font-pixel bg-background outline-none placeholder:text-muted-foreground min-h-[70px] resize-none leading-relaxed" placeholder="Add a private note about this candidate..." />
                )}
              </CollapsibleSection>

              {/* ATS row */}
              <CollapsibleSection title="ATS actions">
                <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border">
                  <CandStatusBadge status={getStatus(selected)} />
                  {getStatus(selected) === "shortlisted" && <span className="text-[10px] font-pixel text-muted-foreground">· in ATS</span>}
                </div>
                <p className="text-[10px] font-pixel text-muted-foreground text-center mt-2">
                  Manual shortlisting is off · <button className="underline hover:text-foreground transition-colors">Turn on in settings</button>
                </p>
              </CollapsibleSection>
            </div></div>
          )}
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

function RoleDetail({ role, activeProfile, onProfileOpen, onProfileClose }: { role: Role; activeProfile: string | null; onProfileOpen: (key: string) => void; onProfileClose: () => void }) {
  const defaultTab = role.status === "live" ? "candidates" : "job-posting"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [status, setStatus] = useState<"draft"|"live">(role.status === "live" ? "live" : "draft")

  const tabs = [
    { id: "job-posting", label: "Job posting" },
    { id: "interview-config", label: "Interview config" },
    { id: "candidates", label: "Candidates", badge: role.candidateCount },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border shrink-0">
        <div className="max-w-5xl mx-auto px-8 pt-5 pb-0">
          <div className="flex items-center gap-3 mb-1 mt-2">
            <h1 className="text-base font-medium">{role.title}</h1>
            <div className="flex border border-border overflow-hidden">
              <button onClick={() => setStatus("draft")} className={`text-[10px] font-pixel px-2.5 py-1 transition-colors ${status === "draft" ? "bg-[#FAEEDA] text-[#854F0B]" : "text-muted-foreground hover:text-foreground"}`}>Draft</button>
              <button onClick={() => setStatus("live")} className={`text-[10px] font-pixel px-2.5 py-1 transition-colors ${status === "live" ? "bg-[#EAF3DE] text-[#3B6D11]" : "text-muted-foreground hover:text-foreground"}`}>Live</button>
            </div>
          </div>
          <p className="text-[10px] font-pixel text-muted-foreground mb-3">{role.department} · Created {role.createdAt}</p>
          <div className="flex items-center">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-pixel border-b-2 transition-colors -mb-px ${activeTab === t.id ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
                {t.badge !== undefined && <span className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground">{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "job-posting" && <JobPostingTab status={status} onStatusChange={setStatus} />}
        {activeTab === "interview-config" && <InterviewConfigTab />}
        {activeTab === "candidates" && <CandidatesTab activeProfile={activeProfile} onProfileOpen={onProfileOpen} onProfileClose={onProfileClose} />}
      </div>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────

export function RolesPage() {
  const [selectedId, setSelectedId] = useState(ROLES[0].id)
  const [activeProfile, setActiveProfile] = useState<string | null>(null)
  const selectedRole = ROLES.find(r => r.id === selectedId)!

  const openProfile = (key: string) => setActiveProfile(key)
  const closeProfile = () => setActiveProfile(null)

  return (
    <div className="flex h-full overflow-hidden">
      <RoleList selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setActiveProfile(null) }} collapsed={activeProfile !== null} />
      <RoleDetail key={selectedId} role={selectedRole} activeProfile={activeProfile} onProfileOpen={openProfile} onProfileClose={closeProfile} />
    </div>
  )
}
