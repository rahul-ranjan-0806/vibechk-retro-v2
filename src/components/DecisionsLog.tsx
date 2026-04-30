import { useEffect, useMemo, useState } from "react"
import { CANDIDATES, ROLES, ALTS_MINI, roleTitle, type CandidateMini } from "@/lib/mockData"
import { StatusPill } from "@/components/notion"

// Roleid → altId mapping (which Alt owns which role's decisions)
const ALT_FOR_ROLE: Record<string, string> = {
  r1: "sashank",
  r2: "sashank",
  r3: "kinnari",
}

type TimeWindow = "all" | "today" | "week" | "month"
type SortBy = "newest" | "oldest" | "score-desc"

const TIME_LABELS: Record<TimeWindow, string> = {
  all: "All time",
  today: "Today",
  week: "Past week",
  month: "Past month",
}

const SORT_LABELS: Record<SortBy, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "score-desc": "Highest score",
}

// Parse "2h ago" / "3d ago" / "1w ago" → hours
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

interface Decision extends CandidateMini { altId: string }

export function DecisionsLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [altFilter, setAltFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<TimeWindow>("all")
  const [sortBy, setSortBy] = useState<SortBy>("newest")

  // Esc closes
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, onClose])

  const decisions = useMemo<Decision[]>(() => {
    return CANDIDATES
      .filter(c => c.status !== "pending")
      .map(c => ({ ...c, altId: ALT_FOR_ROLE[c.roleId] ?? "sashank" }))
  }, [])

  const filtered = useMemo(() => {
    return decisions
      .filter(d => altFilter === "all" || d.altId === altFilter)
      .filter(d => withinWindow(d.completedAt, timeFilter))
      .sort((a, b) => {
        if (sortBy === "score-desc") return b.score - a.score
        const ah = relativeToHours(a.completedAt)
        const bh = relativeToHours(b.completedAt)
        return sortBy === "newest" ? ah - bh : bh - ah
      })
  }, [decisions, altFilter, timeFilter, sortBy])

  const counts = useMemo(() => {
    const shortlisted = filtered.filter(d => d.status === "shortlisted").length
    const rejected = filtered.filter(d => d.status === "rejected").length
    return { total: filtered.length, shortlisted, rejected }
  }, [filtered])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/20 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-[480px] bg-background border-l border-border shadow-modal flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="shrink-0 px-5 h-12 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">📜</span>
            <h2 className="text-sm font-semibold">Activity log</h2>
            <span className="text-xs text-muted-foreground tabular-nums">· {counts.total} {counts.total === 1 ? "decision" : "decisions"}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted/60" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Filter bar */}
        <div className="shrink-0 px-5 py-3 border-b border-border flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-10">Alt</label>
            <div className="flex items-center gap-1 flex-wrap">
              <FilterChip active={altFilter === "all"} onClick={() => setAltFilter("all")}>All</FilterChip>
              {ALTS_MINI.map(a => (
                <FilterChip key={a.id} active={altFilter === a.id} onClick={() => setAltFilter(a.id)}>
                  {a.name}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-10">Time</label>
            <div className="flex items-center gap-1">
              {(Object.keys(TIME_LABELS) as TimeWindow[]).map(t => (
                <FilterChip key={t} active={timeFilter === t} onClick={() => setTimeFilter(t)}>
                  {TIME_LABELS[t]}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-10">Sort</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="text-xs bg-background border border-border rounded-sm px-2 py-1 outline-none focus:border-foreground/40"
            >
              {(Object.keys(SORT_LABELS) as SortBy[]).map(s => (
                <option key={s} value={s}>{SORT_LABELS[s]}</option>
              ))}
            </select>
            {(altFilter !== "all" || timeFilter !== "all") && (
              <button
                onClick={() => { setAltFilter("all"); setTimeFilter("all") }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Summary line */}
        <div className="shrink-0 px-5 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
          {counts.shortlisted} pushed to ATS · {counts.rejected} rejected
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-muted-foreground">
              <p className="text-sm">No decisions match the current filters</p>
              <p className="text-xs mt-1">Try widening the time window or selecting a different Alt.</p>
            </div>
          ) : (
            filtered.map((d, i) => {
              const alt = ALTS_MINI.find(a => a.id === d.altId)
              const isShortlisted = d.status === "shortlisted"
              return (
                <div key={d.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border/60" : ""}`}>
                  <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold tabular-nums shrink-0 bg-muted text-foreground">
                    {d.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <StatusPill status={isShortlisted ? "success" : "danger"}>
                        {isShortlisted ? "Pushed to ATS" : "Rejected"}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {roleTitle(d.roleId)} · {alt?.name ?? "Alt"} · {d.completedAt}
                    </p>
                    <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">{d.reasoning}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-2.5 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>Auto-handled by Alt · reversible within 30 days</span>
          <span className="tabular-nums">{ROLES.length} roles</span>
        </div>
      </aside>
    </>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-0.5 rounded-sm border transition-colors ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}
    >
      {children}
    </button>
  )
}
