import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { ChevronRight, ChevronDown, GitBranch as GitBranchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { branchColor } from "./branchColor"

export interface GitCommit {
  sha: string
  shortSha: string
  subject: string
  author: string
  date: string
  timestamp: number
  parents: string[]
}

export interface GitBranch {
  name: string
  tip: string | null
  commits: GitCommit[]
}

export interface GitGraphData {
  current: string
  branches: GitBranch[]
  generatedAt: number
}

interface Props {
  data: GitGraphData
  expanded: Set<string>
  onToggleExpand: (name: string) => void
}

const BRANCH_R = 26
const RING_RADIUS_FACTOR = 0.22
const PANEL_WIDTH = 300
const PANEL_OFFSET = 28

type Side = "right" | "left" | "below" | "above"

interface BranchLayout {
  name: string
  bx: number
  by: number
  side: Side
  panelLeft: number
  panelTop: number
  connectorEnd: { x: number; y: number }
}

export function GitGraph({ data, expanded, onToggleExpand }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 1000, height: 700 })
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Static layout — branches on a circle, panels positioned by quadrant
  const layouts = useMemo<BranchLayout[]>(() => {
    const N = data.branches.length
    if (!N) return []
    const cx = dims.width / 2
    const cy = dims.height / 2
    const ringR = Math.min(dims.width, dims.height) * RING_RADIUS_FACTOR

    return data.branches.map((b, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      const bx = cx + dx * ringR
      const by = cy + dy * ringR

      let side: Side
      if (Math.abs(dx) >= Math.abs(dy)) side = dx >= 0 ? "right" : "left"
      else side = dy >= 0 ? "below" : "above"

      const panelHeightApprox = Math.min(400, b.commits.length * 26 + 38)
      let panelLeft = 0, panelTop = 0
      let connectorEnd = { x: bx, y: by }

      switch (side) {
        case "right":
          panelLeft = bx + BRANCH_R + PANEL_OFFSET
          panelTop = by - panelHeightApprox / 2
          connectorEnd = { x: panelLeft, y: by }
          break
        case "left":
          panelLeft = bx - BRANCH_R - PANEL_OFFSET - PANEL_WIDTH
          panelTop = by - panelHeightApprox / 2
          connectorEnd = { x: panelLeft + PANEL_WIDTH, y: by }
          break
        case "below":
          panelLeft = bx - PANEL_WIDTH / 2
          panelTop = by + BRANCH_R + PANEL_OFFSET
          connectorEnd = { x: bx, y: panelTop }
          break
        case "above":
          panelLeft = bx - PANEL_WIDTH / 2
          panelTop = by - BRANCH_R - PANEL_OFFSET - panelHeightApprox
          connectorEnd = { x: bx, y: panelTop + panelHeightApprox }
          break
      }

      return { name: b.name, bx, by, side, panelLeft, panelTop, connectorEnd }
    })
  }, [data.branches, dims])

  const layoutByName = useMemo(() => {
    const m = new Map<string, BranchLayout>()
    for (const l of layouts) m.set(l.name, l)
    return m
  }, [layouts])

  // Pan (middle mouse) / zoom (wheel)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    setTransform(t => {
      const nextK = Math.max(0.2, Math.min(3, t.k * (1 + delta)))
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return t
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const ratio = nextK / t.k
      return {
        k: nextK,
        x: mx - (mx - t.x) * ratio,
        y: my - (my - t.y) * ratio,
      }
    })
  }, [])

  // Native handlers because React's synthetic onMouseDown doesn't reliably suppress middle-click autoscroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDown = (e: MouseEvent) => {
      if (e.button !== 1) return
      e.preventDefault()
      panRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
      setIsPanning(true)
    }
    const onMove = (e: MouseEvent) => {
      if (!panRef.current) return
      e.preventDefault()
      setTransform(t => ({ ...t, x: e.clientX - panRef.current!.x, y: e.clientY - panRef.current!.y }))
    }
    const onUp = (e: MouseEvent) => {
      if (!panRef.current) return
      if (e.button !== 1 && e.type === "mouseup") return
      panRef.current = null
      setIsPanning(false)
    }
    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault()
    }

    el.addEventListener("mousedown", onDown)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    el.addEventListener("auxclick", onAuxClick)

    return () => {
      el.removeEventListener("mousedown", onDown)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      el.removeEventListener("auxclick", onAuxClick)
    }
  }, [transform.x, transform.y])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background"
      onWheel={handleWheel}
      style={{
        cursor: isPanning ? "grabbing" : "default",
        backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: `${24 * transform.k}px ${24 * transform.k}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
      >
        {/* Connector lines */}
        <svg
          className="absolute pointer-events-none"
          width={dims.width}
          height={dims.height}
          style={{ left: 0, top: 0, overflow: "visible" }}
        >
          {layouts.map(l => {
            if (!expanded.has(l.name)) return null
            return (
              <line
                key={l.name}
                x1={l.bx}
                y1={l.by}
                x2={l.connectorEnd.x}
                y2={l.connectorEnd.y}
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
              />
            )
          })}
        </svg>

        {/* Branch nodes */}
        {data.branches.map(b => {
          const l = layoutByName.get(b.name)!
          const isExpanded = expanded.has(b.name)
          const isCurrent = b.name === data.current
          return (
            <button
              key={b.name}
              onClick={() => onToggleExpand(b.name)}
              className={cn(
                "absolute flex flex-col items-center gap-1.5 group",
              )}
              style={{
                left: l.bx - BRANCH_R,
                top: l.by - BRANCH_R,
              }}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border bg-card text-card-foreground shadow-sm transition-colors",
                  "hover:bg-accent hover:border-foreground/40",
                  isCurrent && "border-foreground ring-2 ring-foreground/15",
                )}
                style={{
                  width: BRANCH_R * 2,
                  height: BRANCH_R * 2,
                  borderColor: isCurrent ? undefined : branchColor(b.name),
                }}
              >
                <GitBranchIcon className="w-4 h-4" style={{ color: branchColor(b.name) }} />
              </div>
              <div className="flex flex-col items-center gap-0.5 pointer-events-none whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  <span className={cn(
                    "text-xs font-mono",
                    isCurrent ? "font-semibold text-foreground" : "text-foreground/80",
                  )}>
                    {b.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {b.commits.length} commit{b.commits.length === 1 ? "" : "s"}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1 py-px rounded-sm bg-foreground text-background">
                      HEAD
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}

        {/* Commit panels */}
        {data.branches.map(b => {
          if (!expanded.has(b.name)) return null
          const l = layoutByName.get(b.name)!
          return (
            <div
              key={b.name + ":panel"}
              className="absolute bg-card border border-border rounded-md shadow-md overflow-hidden"
              style={{
                left: l.panelLeft,
                top: l.panelTop,
                width: PANEL_WIDTH,
                maxHeight: 400,
              }}
              onWheel={e => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
                <span className="text-[11px] font-mono font-medium text-foreground truncate">{b.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {b.commits.length}
                </span>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 400 - 33 }}>
                {b.commits.map(c => {
                  const isNew = c.timestamp > 0 && (Date.now() / 1000 - c.timestamp) < 3600
                  return (
                  <div
                    key={c.sha}
                    className="group px-3 py-1.5 border-b border-border/60 last:border-b-0 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                        {c.shortSha}
                      </span>
                      <span className="text-[11px] text-foreground truncate flex-1" title={c.subject}>
                        {c.subject}
                      </span>
                      {isNew && (
                        <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-px rounded-sm bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground truncate">
                        {c.author}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/70">·</span>
                      <span className="text-[9px] font-mono text-muted-foreground/70">
                        {c.date}
                      </span>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
