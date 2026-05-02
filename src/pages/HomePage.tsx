import { useState } from "react"
import { DecisionsLog } from "@/components/DecisionsLog"
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
  const base = "text-xs rounded-md px-1.5 py-0.5"
  if (rec === "shortlist") return <span className={`${base} bg-status-success text-status-success-foreground`}>Alt: Shortlist ↑</span>
  if (rec === "reject") return <span className={`${base} bg-status-danger text-status-danger-foreground`}>Alt: Pass ↓</span>
  return <span className={`${base} bg-status-warning text-status-warning-foreground`}>{confidence === "low" ? "Alt: Your call" : "Alt: Review"}</span>
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

function scoreColor(score: number) {
  if (score >= 7) return { bg: "bg-status-success", fg: "text-status-success-foreground" }
  if (score >= 5) return { bg: "bg-status-warning", fg: "text-status-warning-foreground" }
  return { bg: "bg-status-danger", fg: "text-status-danger-foreground" }
}

// ── Page ─────────────────────────────────────────────────────

export function HomePage({ onNavigate, onOpenOverlay, onNavigateToCandidate, onNavigateToRole }: { onNavigate: (p: Page) => void; onOpenOverlay?: (prefill?: string) => void; onNavigateToCandidate?: (name: string, mockRoleId: string) => void; onNavigateToRole?: (mockRoleId: string) => void }) {
  const [setupDismissed, setSetupDismissed] = useState(false)
  const [autoExpanded, setAutoExpanded] = useState(true)
  const [logOpen, setLogOpen] = useState(false)

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
  const setupPercent = Math.round((doneCount / SETUP_ITEMS.length) * 100)
  const incomplete = SETUP_ITEMS.filter(i => i.status !== "done")
    .sort((a, b) => {
      const rank = (s: SetupItem["status"]) => s === "warning" ? 0 : s === "pending" ? 1 : 2
      return rank(a.status) - rank(b.status)
    })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Notion-style breadcrumb header */}
      <div className="shrink-0 h-11 flex items-center justify-between px-3 border-b border-border/40">
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="hover:bg-muted px-1.5 py-0.5 rounded-sm cursor-default">Home</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Edited just now</span>
          <button className="px-2 py-1 hover:bg-muted rounded-sm">Share</button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-sm" title="Comments">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-sm" title="Favorite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-sm" title="More">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-page-wide mx-auto px-12 pt-16 pb-24">

          {/* ── Page title ──────────────────────────────── */}
          <h1 className="text-display mb-2">Hiring Triage</h1>
          <p className="text-sm text-muted-foreground mb-12">Sashank's Alt · since yesterday</p>

          {/* ── Alt summary ──────────────────────────────── */}
          <div className="mb-14 group flex items-start gap-2 -ml-7">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0 pt-0.5">
              <button className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-sm" title="Add block"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg></button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base leading-[1.6] text-foreground">
                {autoSentence} {dilemmaClause}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => onOpenOverlay?.()}
                  className="text-sm rounded-sm px-3 py-1.5 bg-accent-blue text-white hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                  <span>Ask Sabu</span>
                  <span className="text-[11px] opacity-70">⌘K</span>
                </button>
                <button onClick={() => setLogOpen(true)}
                  className="text-sm rounded-sm px-3 py-1.5 border border-border text-foreground hover:bg-muted/60 transition-colors inline-flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                  <span>Activity log</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Dilemmas (action-required) ────────────────── */}
          {(dilemmas.length > 0 || (!setupComplete && !setupDismissed)) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12 items-stretch [&>*:only-child]:lg:col-span-2">
              {dilemmas.length > 0 && (
                <div>
                  <p className="text-[15px] font-semibold text-foreground mb-3">
                    Needs your call · {dilemmas.length}
                  </p>
                  <div className="flex flex-col gap-3">
                    {dilemmas.map(c => {
                      const sc = scoreColor(c.score)
                      return (
                        <div key={c.id} className="rounded-md bg-status-warning/30 px-4 py-3 group">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-base font-semibold tabular-nums shrink-0 ${sc.bg} ${sc.fg}`}>
                              {c.score}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-[15px] font-semibold">{c.name}</p>
                                <StellarTag score={c.score} />
                                <span className="text-xs text-muted-foreground">{roleTitle(c.roleId)}</span>
                                <AltRecPill rec={c.altRec} confidence={c.confidence} />
                              </div>
                              <p className="text-sm leading-relaxed text-foreground/80 mb-3">{c.reasoning}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button className="text-[13px] rounded-sm px-2.5 py-1 bg-status-success text-status-success-foreground hover:opacity-90 transition-opacity">
                                  Shortlist
                                </button>
                                <button className="text-[13px] rounded-sm px-2.5 py-1 bg-status-danger text-status-danger-foreground hover:opacity-90 transition-opacity">
                                  Reject
                                </button>
                                <button onClick={() => onOpenOverlay?.(`Why did you score ${c.name} ${c.score}?`)}
                                  className="text-[13px] rounded-sm px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                  Discuss
                                </button>
                                <button onClick={() => onNavigate("candidates")}
                                  className="text-[13px] rounded-sm px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto">
                                  Open →
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

              {/* ── Setup callout ────────────────────────── */}
              {!setupComplete && !setupDismissed && (
                <div className="flex flex-col">
                  <p className="text-[15px] font-semibold text-foreground mb-3">
                    Finish setup · {setupPercent}%
                  </p>
                  <div className="rounded-md bg-muted/60 px-4 py-3 flex flex-col flex-1 justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-xl shrink-0 leading-none">💡</div>
                      <div className="flex-1 h-1 rounded-full bg-foreground/10 overflow-hidden">
                        <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${setupPercent}%` }} />
                      </div>
                      <button onClick={() => setSetupDismissed(true)} className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded-sm hover:bg-foreground/5 shrink-0">✕</button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {incomplete.map(item => {
                        const dotColor = item.status === "warning" ? "bg-status-warning-dot" : "bg-border"
                        return (
                          <div key={item.id} className="flex items-center gap-2 group">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                            <p className="text-sm text-foreground flex-1 truncate">{item.title}</p>
                            {item.ctaTarget && (
                              <button onClick={() => onNavigate(item.ctaTarget!)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                {item.cta}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Auto-decisions (collapsed) ────────────────── */}
          {totalHandled > 0 && (
            <div className="mb-12">
              <button
                onClick={() => setAutoExpanded(!autoExpanded)}
                className="flex items-center gap-2 mb-3 group"
              >
                <p className="text-[15px] font-semibold text-foreground">
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
                <p className="text-xs text-muted-foreground">
                  {pushed.length} pushed to ATS, {rejected.length} rejected. <button onClick={() => setAutoExpanded(true)} className="text-foreground hover:underline">Review →</button>
                </p>
              )}

              {autoExpanded && (
                <div>
                  {[...pushed, ...rejected].map((c, i) => {
                    const sc = scoreColor(c.score)
                    const isShortlisted = c.status === "shortlisted"
                    return (
                      <div key={c.id} className={`flex items-center gap-3 px-2 py-2 hover:bg-muted/60 rounded-sm transition-colors ${i > 0 ? "border-t border-border/40" : ""}`}>
                        <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-sm font-semibold tabular-nums shrink-0 ${sc.bg} ${sc.fg}`}>
                          {c.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm truncate">{c.name}</p>
                            <StellarTag score={c.score} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{roleTitle(c.roleId)}</p>
                        </div>
                        <span className={`text-xs rounded-xs px-1.5 py-0.5 shrink-0 ${
                          isShortlisted ? "bg-status-success text-status-success-foreground" : "bg-status-danger text-status-danger-foreground"
                        }`}>
                          {isShortlisted ? "Pushed to ATS" : "Rejected"}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{c.completedAt}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Role pipelines ───────────────────────────── */}
          <div className="mb-12">
            <p className="text-[15px] font-semibold text-foreground mb-2">Role pipelines</p>
            <div>
              {PIPELINE.map((p, i) => {
                const role = ROLES.find(r => r.id === p.roleId)
                if (!role) return null
                const status = pipelineStatus(p.thisWeek, p.lastWeek)
                const delta = p.thisWeek - p.lastWeek
                const deltaStr = delta > 0 ? `+${delta}` : `${delta}`
                return (
                  <button key={p.roleId} onClick={() => onNavigate("roles")}
                    className={`w-full flex items-center gap-3 px-2 py-2 hover:bg-muted/60 transition-colors text-left rounded-sm group ${i > 0 ? "border-t border-border/40" : ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                    <span className="text-muted-foreground text-sm shrink-0">📋</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{role.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {p.thisWeek} this week
                        <span className={`ml-1 ${delta >= 0 ? "text-status-success-foreground" : "text-status-danger-foreground"}`}>
                          ({deltaStr})
                        </span>
                      </span>
                      <span className={`text-xs rounded-xs px-1.5 py-0.5 ${status.text} bg-muted`}>{status.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      <DecisionsLog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onNavigateToCandidate={onNavigateToCandidate}
        onNavigateToRole={onNavigateToRole}
        onOpenOverlay={onOpenOverlay}
      />
    </div>
  )
}
