import { useState } from "react"
import { PixelSprite } from "@/components/PixelSprite"
import {
  CANDIDATES as SEED_CANDIDATES,
  ROLES,
  roleTitle,
  type CandidateMini,
} from "@/lib/mockData"

type Page = "home" | "roles" | "candidates" | "alts" | "org" | "settings"

// ── Setup banner (dismissible) ──────────────────────────────

interface SetupItem {
  id: string; title: string; description: string
  status: "done" | "pending" | "warning"; cta: string; ctaTarget: Page | null
}

const SETUP_ITEMS: SetupItem[] = [
  { id: "alt", title: "Create your Alt", description: "Train it with your voice and values.", status: "done", cta: "View Alt →", ctaTarget: "alts" },
  { id: "role", title: "Set up a role", description: "Create a posting and eval criteria.", status: "done", cta: "View roles →", ctaTarget: "roles" },
  { id: "ats", title: "Connect your ATS", description: "Sync shortlisted candidates to Dover.", status: "done", cta: "Manage →", ctaTarget: "settings" },
  { id: "threshold", title: "Set shortlist threshold", description: "Define when Alt auto-shortlists.", status: "warning", cta: "Set threshold →", ctaTarget: "roles" },
  { id: "slack", title: "Enable Slack notifications", description: "Get notified for exceptional candidates.", status: "pending", cta: "Set up →", ctaTarget: "settings" },
]

// ── Role pipeline mock data ─────────────────────────────────

const PIPELINE: { roleId: string; thisWeek: number; lastWeek: number }[] = [
  { roleId: "r1", thisWeek: 6, lastWeek: 4 },
  { roleId: "r2", thisWeek: 2, lastWeek: 5 },
  { roleId: "r3", thisWeek: 0, lastWeek: 3 },
]

function pipelineStatus(thisWeek: number, lastWeek: number) {
  if (thisWeek === 0) return { label: "Stalled", dot: "bg-status-danger-dot", text: "text-status-danger-foreground" }
  if (thisWeek < lastWeek * 0.6) return { label: "Slowing", dot: "bg-status-warning-dot", text: "text-status-warning-foreground" }
  return { label: "Healthy", dot: "bg-status-success-dot", text: "text-status-success-foreground" }
}

// ── Alt triage helpers ──────────────────────────────────────

function AltRecPill({ rec, confidence }: { rec: CandidateMini["altRec"]; confidence: CandidateMini["confidence"] }) {
  const base = "text-[10px] rounded-md px-1.5 py-0.5"
  if (rec === "shortlist") return <span className={`${base} bg-status-success text-status-success-foreground`}>Alt: Shortlist ↑</span>
  if (rec === "reject") return <span className={`${base} bg-status-danger text-status-danger-foreground`}>Alt: Pass ↓</span>
  return <span className={`${base} bg-status-warning text-status-warning-foreground`}>{confidence === "low" ? "Alt: Your call" : "Alt: Review"}</span>
}

function StellarTag({ score }: { score: number }) {
  if (score < 9) return null
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/20 to-yellow-300/20 text-amber-700 border border-amber-400/40 inline-flex items-center gap-1 dark:text-amber-300 dark:from-amber-400/15 dark:to-yellow-300/15">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
      Stellar
    </span>
  )
}

function scoreColor(score: number) {
  if (score >= 7) return { bg: "bg-status-success", fg: "text-status-success-foreground" }
  if (score >= 5) return { bg: "bg-status-warning", fg: "text-status-warning-foreground" }
  return { bg: "bg-status-danger", fg: "text-status-danger-foreground" }
}

// ── Page ─────────────────────────────────────────────────────

export function HomePage({ onNavigate, onOpenOverlay }: { onNavigate: (p: Page) => void; onOpenOverlay?: (prefill?: string) => void }) {
  const [setupDismissed, setSetupDismissed] = useState(false)
  const [autoExpanded, setAutoExpanded] = useState(true)

  // Derived data
  const pushed = SEED_CANDIDATES.filter(c => c.status === "shortlisted")
  const rejected = SEED_CANDIDATES.filter(c => c.status === "rejected")
  const dilemmas = SEED_CANDIDATES.filter(c => c.status === "pending")
  const totalHandled = pushed.length + rejected.length

  // Alt summary sentence
  const summaryParts: string[] = []
  if (pushed.length) summaryParts.push(`pushed ${pushed.length} to the ATS`)
  if (rejected.length) summaryParts.push(`filtered ${rejected.length} out`)
  const autoSentence = summaryParts.length ? `I've ${summaryParts.join(" and ")} since yesterday.` : ""
  const dilemmaClause = dilemmas.length === 0
    ? "You're caught up — no dilemmas to weigh in on."
    : `${dilemmas.length} candidate${dilemmas.length !== 1 ? "s" : ""} need${dilemmas.length === 1 ? "s" : ""} your call.`

  // Setup
  const doneCount = SETUP_ITEMS.filter(i => i.status === "done").length
  const setupComplete = doneCount === SETUP_ITEMS.length
  const incomplete = SETUP_ITEMS.filter(i => i.status !== "done")
    .sort((a, b) => {
      const rank = (s: SetupItem["status"]) => s === "warning" ? 0 : s === "pending" ? 1 : 2
      return rank(a.status) - rank(b.status)
    })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-6">

          {/* ── Alt summary ──────────────────────────────── */}
          <div className="flex items-start gap-3 mb-8">
            <div className="pt-0.5 shrink-0"><PixelSprite size={28} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-accent-blue">Sashank's Alt</span>
                <span className="text-[10px] text-muted-foreground">· since yesterday</span>
                <button onClick={() => onOpenOverlay?.()}
                  className="ml-auto text-[11px] rounded-md px-3 py-1.5 bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-1.5">
                  <span>Ask Sabu</span>
                  <span className="text-[9px] opacity-70">⌘K</span>
                </button>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {autoSentence} {dilemmaClause}
              </p>
            </div>
          </div>

          {/* ── Dilemmas (action-required) ────────────────── */}
          {dilemmas.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">
                Needs your call · {dilemmas.length}
              </p>
              <div className="flex flex-col gap-2.5">
                {dilemmas.map(c => {
                  const sc = scoreColor(c.score)
                  return (
                    <div key={c.id} className="rounded-xl border-2 border-dashed border-accent-blue bg-accent-blue/[0.035] p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-medium shrink-0 ${sc.bg} ${sc.fg}`}>
                          {c.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-medium">{c.name}</p>
                            <StellarTag score={c.score} />
                            <span className="text-[10px] text-muted-foreground">{roleTitle(c.roleId)}</span>
                            <AltRecPill rec={c.altRec} confidence={c.confidence} />
                          </div>
                          <p className="text-[12px] leading-relaxed text-foreground/80 mb-3">{c.reasoning}</p>
                          <div className="flex items-center gap-2">
                            <button className="text-[11px] rounded-md px-3 py-1.5 bg-status-success text-status-success-foreground hover:opacity-90 transition-opacity">
                              Shortlist
                            </button>
                            <button className="text-[11px] rounded-md px-3 py-1.5 bg-status-danger text-status-danger-foreground hover:opacity-90 transition-opacity">
                              Reject
                            </button>
                            <button onClick={() => onOpenOverlay?.(`Why did you score ${c.name} ${c.score}?`)}
                              className="text-[11px] rounded-md px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                              Discuss with Sabu
                            </button>
                            <button onClick={() => onNavigate("candidates")}
                              className="text-[11px] rounded-md px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors ml-auto">
                              Open transcript →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Role pipelines ───────────────────────────── */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Role pipelines</p>
            <div className="border border-border rounded-lg overflow-hidden">
              {PIPELINE.map((p, i) => {
                const role = ROLES.find(r => r.id === p.roleId)
                if (!role) return null
                const status = pipelineStatus(p.thisWeek, p.lastWeek)
                const delta = p.thisWeek - p.lastWeek
                const deltaStr = delta > 0 ? `+${delta}` : `${delta}`
                return (
                  <button key={p.roleId} onClick={() => onNavigate("roles")}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{role.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {p.thisWeek} this week
                        <span className={`ml-1 ${delta >= 0 ? "text-status-success-foreground" : "text-status-danger-foreground"}`}>
                          ({deltaStr})
                        </span>
                      </span>
                      <span className={`text-[10px] rounded-md px-1.5 py-0.5 ${status.text} bg-muted/60`}>{status.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Auto-decisions (collapsed) ────────────────── */}
          {totalHandled > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setAutoExpanded(!autoExpanded)}
                className="flex items-center gap-2 mb-3 group"
              >
                <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                  Handled by Alt · {totalHandled}
                </p>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-muted-foreground transition-transform ${autoExpanded ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {!autoExpanded && (
                <p className="text-[11px] text-muted-foreground">
                  {pushed.length} pushed to ATS, {rejected.length} rejected. <button onClick={() => setAutoExpanded(true)} className="text-foreground hover:underline">Review →</button>
                </p>
              )}

              {autoExpanded && (
                <div className="border border-border rounded-lg overflow-hidden">
                  {[...pushed, ...rejected].map((c, i) => {
                    const sc = scoreColor(c.score)
                    const isShortlisted = c.status === "shortlisted"
                    return (
                      <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium shrink-0 ${sc.bg} ${sc.fg}`}>
                          {c.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm truncate">{c.name}</p>
                            <StellarTag score={c.score} />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{roleTitle(c.roleId)}</p>
                        </div>
                        <span className={`text-[10px] rounded-md px-1.5 py-0.5 shrink-0 ${
                          isShortlisted ? "bg-status-success text-status-success-foreground" : "bg-status-danger text-status-danger-foreground"
                        }`}>
                          {isShortlisted ? "Pushed to ATS" : "Rejected"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{c.completedAt}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Setup banner (dismissible) ────────────────── */}
          {!setupComplete && !setupDismissed && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Finish setup</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${(doneCount / SETUP_ITEMS.length) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{doneCount}/{SETUP_ITEMS.length}</span>
                  </div>
                </div>
                <button onClick={() => setSetupDismissed(true)} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
              </div>
              <div className="flex flex-col gap-1.5">
                {incomplete.map(item => {
                  const dotColor = item.status === "warning" ? "bg-status-warning-dot" : "bg-border"
                  return (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <p className="text-[11px] text-foreground flex-1">{item.title}</p>
                      {item.ctaTarget && (
                        <button onClick={() => onNavigate(item.ctaTarget!)}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                          {item.cta}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
