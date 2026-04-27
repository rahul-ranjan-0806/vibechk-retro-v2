import { useCallback, useEffect, useRef, useState } from "react"
import { X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GitGraph, type GitGraphData } from "./GitGraph"
import { ServersPanel } from "./ServersPanel"

const POLL_MS = 3000

export function GitGraphOverlay() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<GitGraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const pollRef = useRef<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/__git/graph", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Hotkey: Cmd/Ctrl + Shift + G
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && (e.key === "G" || e.key === "g")) {
        e.preventDefault()
        setOpen(v => !v)
      } else if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    fetchData()
    if (!autoRefresh) return
    pollRef.current = window.setInterval(fetchData, POLL_MS)
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [open, autoRefresh, fetchData])

  const toggleExpand = useCallback((name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    if (!data) return
    setExpanded(new Set(data.branches.map(b => b.name)))
  }, [data])

  const collapseAll = useCallback(() => setExpanded(new Set()), [])

  if (!open) return null

  const totalCommits = data?.branches.reduce((s, b) => s + b.commits.length, 0) ?? 0

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-semibold tracking-wider text-foreground">GIT GRAPH</span>
          {data && (
            <>
              <span className="text-[11px] font-mono text-muted-foreground">
                {data.branches.length} branches · {totalCommits} commits
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">·</span>
              <span className="text-[11px] font-mono text-muted-foreground truncate">
                HEAD: <span className="text-foreground">{data.current}</span>
              </span>
            </>
          )}
          {loading && <span className="text-[11px] font-mono text-muted-foreground">refreshing…</span>}
          {error && <span className="text-[11px] font-mono text-destructive">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px] font-mono" onClick={expandAll} disabled={!data}>
            expand all
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] font-mono" onClick={collapseAll} disabled={!expanded.size}>
            collapse all
          </Button>
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground cursor-pointer pl-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="accent-foreground"
            />
            auto-refresh
          </label>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground px-1">esc</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} title="Close">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative">
        {!data && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-mono">
            loading git graph…
          </div>
        )}
        {error && !data && (
          <div className="absolute inset-0 flex items-center justify-center text-destructive text-xs font-mono">
            error: {error}
          </div>
        )}
        {data && (
          <GitGraph data={data} expanded={expanded} onToggleExpand={toggleExpand} />
        )}
        <ServersPanel />
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-border bg-card text-[10px] font-mono text-muted-foreground flex items-center gap-4">
        <span>scroll = zoom</span>
        <span>middle-click drag = pan</span>
        <span>click branch = expand / collapse</span>
      </div>
    </div>
  )
}
