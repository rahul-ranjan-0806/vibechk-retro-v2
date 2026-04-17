import { useMemo, useState } from "react"
import {
  CANDIDATES as SEED_CANDIDATES,
  ROLES,
  roleTitle,
  type CandidateMini,
} from "@/lib/mockData"

type StatusFilter = "all" | "pending" | "shortlisted" | "rejected"
type RecFilter = "all" | "shortlist" | "reject" | "review"
type TimeFilter = "all" | "today" | "week"

// Maps completedAt relative labels to a rough bucket so time filter works
// against the mock data. "today" covers <24h, "week" covers <=7d.
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

function scoreColor(s: number): string {
  if (s >= 8) return "text-[#3B6D11]"
  if (s >= 7) return "text-[#0F6E56]"
  if (s >= 5) return "text-[#854F0B]"
  return "text-[#A32D2D]"
}

function StatusBadge({ status }: { status: CandidateMini["status"] }) {
  const s: Record<CandidateMini["status"], string> = {
    shortlisted: "bg-[#EAF3DE] text-[#3B6D11]",
    rejected: "bg-[#FCEBEB] text-[#A32D2D]",
    pending: "bg-muted text-muted-foreground",
  }
  const l: Record<CandidateMini["status"], string> = {
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    pending: "Pending",
  }
  return <span className={`text-[10px] font-pixel font-medium px-1.5 py-0.5 ${s[status]}`}>{l[status]}</span>
}

function AltRecBadge({ rec, confidence }: { rec: CandidateMini["altRec"]; confidence: CandidateMini["confidence"] }) {
  const base = "text-[10px] font-pixel px-1.5 py-0.5"
  if (rec === "shortlist") return <span className={`${base} bg-[#EAF3DE] text-[#3B6D11]`}>Alt: Shortlist ↑</span>
  if (rec === "reject") return <span className={`${base} bg-[#FCEBEB] text-[#A32D2D]`}>Alt: Pass ↓</span>
  return <span className={`${base} bg-[#FAEEDA] text-[#854F0B]`}>{confidence === "low" ? "Alt: Your call" : "Alt: Review"}</span>
}

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateMini[]>(SEED_CANDIDATES)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [recFilter, setRecFilter] = useState<RecFilter>("all")
  const [minScore, setMinScore] = useState(1)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return candidates.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !roleTitle(c.roleId).toLowerCase().includes(q)) return false
      if (roleFilter !== "all" && c.roleId !== roleFilter) return false
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (recFilter !== "all" && c.altRec !== recFilter) return false
      if (c.score < minScore) return false
      if (!matchesTime(c.completedAt, timeFilter)) return false
      return true
    })
  }, [candidates, search, roleFilter, statusFilter, recFilter, minScore, timeFilter])

  const visibleIds = filtered.map(c => c.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id))

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        visibleIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        visibleIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  const bulkApply = (status: CandidateMini["status"]) => {
    if (selectedIds.size === 0) return
    setCandidates(cs => cs.map(c => selectedIds.has(c.id) ? { ...c, status } : c))
    setSelectedIds(new Set())
  }

  const selected = candidates.find(c => c.id === openId) ?? null

  const applyOne = (id: string, status: CandidateMini["status"]) => {
    setCandidates(cs => cs.map(c => c.id === id ? { ...c, status } : c))
  }

  const resetFilters = () => {
    setSearch("")
    setRoleFilter("all")
    setStatusFilter("all")
    setRecFilter("all")
    setMinScore(1)
    setTimeFilter("all")
  }

  const activeFilterCount = [
    search !== "",
    roleFilter !== "all",
    statusFilter !== "all",
    recFilter !== "all",
    minScore > 1,
    timeFilter !== "all",
  ].filter(Boolean).length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border shrink-0 bg-background">
        <div className="max-w-6xl mx-auto px-8 pt-5 pb-3">
          <div className="flex items-baseline gap-3 mb-3">
            <h1 className="text-base font-medium">Candidates</h1>
            <span className="text-[10px] font-pixel text-muted-foreground">
              {filtered.length} of {candidates.length} · across {ROLES.length} roles
            </span>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="ml-auto text-[10px] font-pixel text-muted-foreground hover:text-foreground underline">
                Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Search + filter row */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or role..."
              className="text-xs font-pixel border border-border px-3 py-1.5 bg-background outline-none placeholder:text-muted-foreground w-56 focus:border-foreground/40"
            />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="text-[10px] font-pixel border border-border px-2 py-1.5 bg-background">
              <option value="all">All roles</option>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="text-[10px] font-pixel border border-border px-2 py-1.5 bg-background">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={recFilter} onChange={e => setRecFilter(e.target.value as RecFilter)}
              className="text-[10px] font-pixel border border-border px-2 py-1.5 bg-background">
              <option value="all">All Alt recs</option>
              <option value="shortlist">Shortlist</option>
              <option value="reject">Pass</option>
              <option value="review">Review</option>
            </select>
            <select value={timeFilter} onChange={e => setTimeFilter(e.target.value as TimeFilter)}
              className="text-[10px] font-pixel border border-border px-2 py-1.5 bg-background">
              <option value="all">Any time</option>
              <option value="today">Last 24h</option>
              <option value="week">Last 7 days</option>
            </select>
            <div className="flex items-center gap-2 text-[10px] font-pixel">
              <span className="text-muted-foreground">Score ≥</span>
              <input type="range" min={1} max={10} step={1} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="accent-foreground h-1 w-24" />
              <span className="tabular-nums w-3 text-center">{minScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="shrink-0 border-b border-border bg-[#4466ff]/[0.04]">
          <div className="max-w-6xl mx-auto px-8 py-2 flex items-center gap-3">
            <span className="text-[11px] font-pixel">
              <strong className="tabular-nums">{selectedIds.size}</strong> selected
            </span>
            <button onClick={() => bulkApply("shortlisted")}
              className="text-[11px] font-pixel px-3 py-1.5 bg-[#EAF3DE] text-[#3B6D11] hover:opacity-90 transition-opacity">
              Shortlist
            </button>
            <button onClick={() => bulkApply("rejected")}
              className="text-[11px] font-pixel px-3 py-1.5 bg-[#FCEBEB] text-[#A32D2D] hover:opacity-90 transition-opacity">
              Reject
            </button>
            <button onClick={() => bulkApply("pending")}
              className="text-[11px] font-pixel px-3 py-1.5 border border-border hover:bg-muted transition-colors">
              Move to pending
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-[10px] font-pixel text-muted-foreground hover:text-foreground">
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-4">
            {filtered.length === 0 ? (
              <div className="border border-border p-8 text-center">
                <p className="text-xs font-pixel text-muted-foreground">
                  No candidates match these filters.
                </p>
              </div>
            ) : (
              <div className="border border-border overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 border-b border-border">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible}
                    aria-label="Select all visible"
                    ref={el => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected }}
                    className="w-3.5 h-3.5 accent-foreground cursor-pointer" />
                  <div className="w-10 shrink-0">
                    <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">Score</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">Candidate</span>
                  </div>
                  <div className="w-44 shrink-0">
                    <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">Role</span>
                  </div>
                  <div className="w-28 shrink-0">
                    <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">Alt</span>
                  </div>
                  <div className="w-24 shrink-0">
                    <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">Status</span>
                  </div>
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">Time</span>
                  </div>
                </div>

                {filtered.map((c, i) => {
                  const isOpen = openId === c.id
                  const isSelected = selectedIds.has(c.id)
                  return (
                    <div key={c.id}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                        isOpen ? "bg-muted/50" : isSelected ? "bg-[#4466ff]/[0.04]" : i % 2 ? "bg-muted/10" : ""
                      } hover:bg-muted/40`}
                      onClick={() => setOpenId(c.id)}
                    >
                      <input type="checkbox" checked={isSelected}
                        onClick={e => e.stopPropagation()}
                        onChange={() => toggleRow(c.id)}
                        aria-label={`Select ${c.name}`}
                        className="w-3.5 h-3.5 accent-foreground cursor-pointer" />
                      <div className="w-10 shrink-0">
                        <span className={`text-base font-medium tabular-nums ${scoreColor(c.score)}`}>{c.score}</span>
                        <span className="text-[9px] font-pixel text-muted-foreground">/10</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug truncate">{c.reasoning}</p>
                      </div>
                      <div className="w-44 shrink-0">
                        <p className="text-[11px] font-pixel text-muted-foreground truncate">{roleTitle(c.roleId)}</p>
                      </div>
                      <div className="w-28 shrink-0">
                        <AltRecBadge rec={c.altRec} confidence={c.confidence} />
                      </div>
                      <div className="w-24 shrink-0">
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-[10px] font-pixel text-muted-foreground">{c.completedAt}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Slide-over detail */}
        <div className={`shrink-0 border-l border-border overflow-hidden transition-all duration-200 ${selected ? "w-[420px]" : "w-0"}`}>
          {selected && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
                <span className="text-xs font-pixel font-medium">Candidate detail</span>
                <button onClick={() => setOpenId(null)}
                  className="text-muted-foreground hover:text-foreground text-base leading-none px-1" aria-label="Close">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Identity */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 flex items-center justify-center text-sm font-pixel font-medium text-white shrink-0 bg-foreground`}>
                    {selected.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-medium leading-tight truncate">{selected.name}</h2>
                    <p className="text-[11px] font-pixel text-muted-foreground truncate">{roleTitle(selected.roleId)} · {selected.completedAt}</p>
                  </div>
                </div>

                {/* Score + status */}
                <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border mb-4">
                  <div className={`text-4xl font-medium leading-none tabular-nums ${scoreColor(selected.score)}`}>
                    {selected.score}<span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AltRecBadge rec={selected.altRec} confidence={selected.confidence} />
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground">{selected.reasoning}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="border border-border mb-4">
                  {[
                    { label: "Role", value: roleTitle(selected.roleId) },
                    { label: "Interviewed", value: selected.completedAt },
                    { label: "Alt confidence", value: selected.confidence.charAt(0).toUpperCase() + selected.confidence.slice(1) },
                    { label: "Alt recommendation", value: selected.altRec === "shortlist" ? "Shortlist" : selected.altRec === "reject" ? "Pass" : "Needs your call" },
                    { label: "Current status", value: selected.status.charAt(0).toUpperCase() + selected.status.slice(1) },
                  ].map((row, i) => (
                    <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                      <span className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 border-t border-border px-5 py-3 flex items-center gap-2">
                <button
                  onClick={() => applyOne(selected.id, "shortlisted")}
                  disabled={selected.status === "shortlisted"}
                  className="text-[11px] font-pixel px-3 py-1.5 bg-[#EAF3DE] text-[#3B6D11] disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => applyOne(selected.id, "rejected")}
                  disabled={selected.status === "rejected"}
                  className="text-[11px] font-pixel px-3 py-1.5 bg-[#FCEBEB] text-[#A32D2D] disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Reject
                </button>
                <button
                  onClick={() => applyOne(selected.id, "pending")}
                  disabled={selected.status === "pending"}
                  className="text-[11px] font-pixel px-3 py-1.5 border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Pending
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
