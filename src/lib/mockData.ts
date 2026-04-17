// Cross-role candidate data. Single source of truth for Home triage summary,
// Candidate Review Panel, and anywhere the Alt reasons across roles.

export type AltRec = "shortlist" | "reject" | "review"
export type Confidence = "high" | "medium" | "low"

export interface RoleMini {
  id: string
  title: string
}

export interface CandidateMini {
  id: string
  name: string
  roleId: string
  score: number // 1-10
  altRec: AltRec
  confidence: Confidence
  // One-liner reasoning Alt would expose in proposal UI
  reasoning: string
  completedAt: string // relative label
  status: "pending" | "shortlisted" | "rejected"
}

export const ROLES: RoleMini[] = [
  { id: "r1", title: "Sr. Product Designer" },
  { id: "r2", title: "Founding Engineer" },
  { id: "r3", title: "Product Marketing Lead" },
]

// Status reflects what Alt autonomously did: shortlisted = pushed to ATS,
// rejected = filtered out, pending = dilemma / flagged for admin review.
// Only altRec=review or low-confidence cases land as pending.
export const CANDIDATES: CandidateMini[] = [
  {
    id: "c1",
    name: "Priya Sharma",
    roleId: "r1",
    score: 9,
    altRec: "shortlist",
    confidence: "high",
    reasoning: "Strong systems thinking, concrete B2B examples — matches past shortlists cleanly.",
    completedAt: "2h ago",
    status: "shortlisted",
  },
  {
    id: "c2",
    name: "Lena Fischer",
    roleId: "r1",
    score: 9,
    altRec: "shortlist",
    confidence: "high",
    reasoning: "Clear trade-off framing in every scenario. Profile similar to Arjun (shortlisted).",
    completedAt: "6h ago",
    status: "shortlisted",
  },
  {
    id: "c3",
    name: "Daniel Okafor",
    roleId: "r2",
    score: 8,
    altRec: "shortlist",
    confidence: "high",
    reasoning: "Ships fast, clear ownership stories. Past YC founding engineer.",
    completedAt: "3h ago",
    status: "shortlisted",
  },
  {
    id: "c4",
    name: "Tom Walsh",
    roleId: "r1",
    score: 5,
    altRec: "reject",
    confidence: "high",
    reasoning: "Consumer-heavy background, struggled on B2B prompts. Below threshold.",
    completedAt: "3d ago",
    status: "rejected",
  },
  {
    id: "c5",
    name: "Jamie Park",
    roleId: "r3",
    score: 4,
    altRec: "reject",
    confidence: "high",
    reasoning: "Thin on positioning work. Couldn't articulate ICP in role-play.",
    completedAt: "1d ago",
    status: "rejected",
  },
  {
    id: "c6",
    name: "Marcus Chen",
    roleId: "r1",
    score: 6,
    altRec: "review",
    confidence: "low",
    reasoning: "Split profile — strong execution, weak systems framing. You've been split on similar candidates 3 of 5 times.",
    completedAt: "2d ago",
    status: "pending",
  },
]

export function roleTitle(id: string) {
  return ROLES.find(r => r.id === id)?.title ?? "—"
}

// Triage counts across all pending candidates, used by the Home summary card.
export interface TriageCounts {
  total: number
  shortlists: number
  rejects: number
  edgeCases: number
  rolesTouched: number
}

export function computeTriage(candidates: CandidateMini[] = CANDIDATES): TriageCounts {
  const pending = candidates.filter(c => c.status === "pending")
  const shortlists = pending.filter(c => c.altRec === "shortlist").length
  const rejects = pending.filter(c => c.altRec === "reject").length
  const edgeCases = pending.filter(c => c.altRec === "review").length
  const rolesTouched = new Set(pending.map(c => c.roleId)).size
  return { total: pending.length, shortlists, rejects, edgeCases, rolesTouched }
}

// ─── Rich answer parts ─────────────────────────────────────────
// The Alt doesn't just reply with text — it can attach structured parts
// that the admin can act on inline (CTAs, toggles, document downloads,
// score reports, evidence quotes, checklists, candidate references).

export type CtaSemantic =
  | "primary"      // main action, solid dark
  | "neutral"      // bordered, muted
  | "success"      // shortlist / approve — green
  | "destructive"  // reject / delete — red
  | "warning"      // caution — amber
  | "info"         // blue retro accent

export interface CtaOption {
  label: string
  semantic?: CtaSemantic
  hint?: string
}

export type AltMsgPart =
  | { kind: "cta"; label: string; semantic?: CtaSemantic; hint?: string }
  | { kind: "cta-group"; options: CtaOption[] }
  | { kind: "toggle"; label: string; description?: string; defaultOn?: boolean }
  | { kind: "document"; title: string; filetype: string; size: string; note?: string }
  | {
      kind: "report"
      title: string
      subtitle?: string
      rows: { label: string; value: string; emphasis?: "positive" | "negative" | "neutral" }[]
    }
  | { kind: "candidate-ref"; candidateId: string; note?: string }
  | { kind: "evidence"; quote: string; source: string; date?: string }
  | {
      kind: "checklist"
      title?: string
      items: { id: string; label: string; description?: string; defaultChecked?: boolean }[]
      submitLabel?: string
    }

export interface AltMessage {
  text: string
  parts?: AltMsgPart[]
}

// ─── Canned responses ──────────────────────────────────────────
// Keyed to what an admin might type on Home. Each one tries to demo a
// different combination of parts so the chat feels substantive.

interface AltResponseRule {
  match: RegExp
  reply: AltMessage
}

export const ALT_CHAT_RESPONSES: AltResponseRule[] = [
  {
    match: /marcus/i,
    reply: {
      text:
        "Marcus is the one dilemma I couldn't resolve — 6/10, split profile. Strong execution, weak systems framing. You've passed on similar profiles 3 of 5 times this quarter, and the 2 you shortlisted (Arjun, Priya) both grew into strong ICs. Here's what I have on him:",
      parts: [
        { kind: "candidate-ref", candidateId: "c6", note: "Applied via the public link 2 days ago. Held back from the ATS pending your call." },
        {
          kind: "evidence",
          quote:
            "Execution-heavy candidates who can't frame trade-offs usually burn out in the first year. Bias toward people who think in systems.",
          source: "Your memory, added Mar 14",
        },
        {
          kind: "cta-group",
          options: [
            { label: "Push Marcus to ATS", semantic: "success" },
            { label: "Reject", semantic: "destructive" },
            { label: "Open transcript", semantic: "neutral" },
          ],
        },
      ],
    },
  },
  {
    match: /priorit|today|focus|morning/i,
    reply: {
      text:
        "I've already handled most of the queue. Only Marcus is left for your call — should take about 10 minutes.",
      parts: [
        {
          kind: "checklist",
          title: "Today's queue",
          items: [
            { id: "s1", label: "3 pushed to ATS — Priya, Lena, Daniel", description: "High confidence, cleared autopilot.", defaultChecked: true },
            { id: "s2", label: "2 filtered out — Tom, Jamie", description: "Clearly below threshold. No similar overrides in the last 30 days.", defaultChecked: true },
            { id: "s3", label: "Spend 10 minutes on Marcus", description: "The one dilemma — I'd want your read before he moves either way.", defaultChecked: false },
          ],
          submitLabel: "Open Marcus",
        },
        {
          kind: "toggle",
          label: "Narrow the dilemma band",
          description: "Fewer candidates will land in 'your call' — I'll commit harder on borderline scores.",
          defaultOn: false,
        },
      ],
    },
  },
  {
    match: /priya/i,
    reply: {
      text:
        "Priya scored a 9 and I've already pushed her to the ATS — her trade-off framing maps cleanly onto the Arjun + Lena profiles you've already said yes to.",
      parts: [
        {
          kind: "report",
          title: "Priya Sharma — score breakdown",
          subtitle: "Sr. Product Designer · completed 2h ago · pushed to ATS",
          rows: [
            { label: "Trade-off framing", value: "9 / 10", emphasis: "positive" },
            { label: "Systems thinking", value: "9 / 10", emphasis: "positive" },
            { label: "B2B intuition", value: "8 / 10", emphasis: "positive" },
            { label: "Cross-functional", value: "7 / 10", emphasis: "neutral" },
            { label: "Overall", value: "9 / 10", emphasis: "positive" },
          ],
        },
        {
          kind: "evidence",
          quote:
            "I'd rather ship 80% right than wait three weeks to get to 95. The delta never pays for itself if engineers start building on the wrong assumption.",
          source: "Priya, interview transcript",
          date: "2h ago",
        },
        {
          kind: "cta-group",
          options: [
            { label: "Open in ATS", semantic: "primary" },
            { label: "Pull back from ATS", semantic: "destructive" },
          ],
        },
      ],
    },
  },
  {
    match: /strict|threshold|systems thinking|overriding|overrode/i,
    reply: {
      text:
        "Looking at your last two weeks — yes, you've been stricter. You overrode 4 of 6 of my shortlist recommendations where systems-thinking scored 6 or lower. That's double your quarterly rate. Here's the breakdown:",
      parts: [
        {
          kind: "report",
          title: "Recent override rate",
          subtitle: "Last 14 days vs. quarterly average",
          rows: [
            { label: "Shortlist → reject overrides", value: "67%", emphasis: "negative" },
            { label: "Quarterly average", value: "31%", emphasis: "neutral" },
            { label: "Common reason", value: "Systems thinking < 7", emphasis: "neutral" },
            { label: "Candidates affected", value: "4 of 6" },
          ],
        },
        {
          kind: "document",
          title: "Override analysis.pdf",
          filetype: "PDF",
          size: "184 KB",
          note: "Full list with transcript excerpts and reasoning.",
        },
        {
          kind: "cta-group",
          options: [
            { label: "Lower push-to-ATS threshold", semantic: "info", hint: "40 → 35" },
            { label: "Keep current threshold", semantic: "neutral" },
          ],
        },
      ],
    },
  },
  {
    match: /reject|pass|draft/i,
    reply: {
      text:
        "Drafted a rejection for Tom. It references his consumer background and the B2B gap specifically — not a template. Worth a 30-second review before sending.",
      parts: [
        {
          kind: "document",
          title: "Tom Walsh — rejection draft.md",
          filetype: "Markdown",
          size: "2 KB",
          note: "Personalized: references his Stripe Checkout story and the ICP question he struggled with.",
        },
        {
          kind: "toggle",
          label: "Save tone as a template for future rejections",
          description: "I'll match this voice next time without asking.",
          defaultOn: false,
        },
        {
          kind: "cta-group",
          options: [
            { label: "Send as-is", semantic: "primary" },
            { label: "Edit first", semantic: "neutral" },
            { label: "Regenerate", semantic: "neutral" },
            { label: "Discard", semantic: "destructive" },
          ],
        },
      ],
    },
  },
  {
    match: /pause|freeze|stop/i,
    reply: {
      text:
        "You can pause the role while you rethink the rubric. Candidates who've already applied will see a paused state on the interview link; no new candidates enter the queue.",
      parts: [
        {
          kind: "toggle",
          label: "Pause Sr. Product Designer role",
          description: "Reversible. I'll notify you when you reactivate.",
          defaultOn: false,
        },
        { kind: "cta", label: "Pause role", semantic: "warning" },
      ],
    },
  },
  {
    match: /export|download|report/i,
    reply: {
      text: "Pulled together this week's decisions with scores, reasoning, and your overrides. Useful for the Friday check-in with Kinnari.",
      parts: [
        {
          kind: "document",
          title: "This week's decisions.csv",
          filetype: "CSV",
          size: "28 KB",
          note: "11 shortlists, 7 rejects, 2 pending.",
        },
        {
          kind: "cta",
          label: "Share with Kinnari",
          semantic: "info",
        },
      ],
    },
  },
  {
    match: /shortlist|should i/i,
    reply: {
      text:
        "Looking at past decisions at this score range, you push ~75% of candidates with strong trade-off framing to the ATS. If that's the signal you're weighing, my read is lean yes. Flagging that you've been stricter on systems-thinking the last two weeks.",
      parts: [
        {
          kind: "cta-group",
          options: [
            { label: "Push to ATS", semantic: "success" },
            { label: "Reject", semantic: "destructive" },
            { label: "Show me the comparisons", semantic: "neutral" },
          ],
        },
      ],
    },
  },
]

export function matchAltResponse(input: string): AltMessage {
  const trimmed = input.trim()
  for (const r of ALT_CHAT_RESPONSES) {
    if (r.match.test(trimmed)) return r.reply
  }
  return {
    text:
      "Good question. I can reason across your past decisions, the active candidates, and what you've told me matters — just point me at what you're weighing and I'll show you what I see.",
  }
}
