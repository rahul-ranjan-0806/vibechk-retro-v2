import { useEffect, useRef, useState, useCallback } from "react"
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"

// ── Types ────────────────────────────────────────────────────

export type MemorySource = "slack" | "linkedin" | "manual" | "interview" | "document" | "whatsapp"
export type MemoryCategory = "hiring" | "values" | "communication" | "company" | "role-specific" | "past-decisions"

export interface MemoryNode {
  id: string
  label: string
  fullText: string
  category: MemoryCategory
  source: MemorySource
  sourceUrl?: string
  weight: number
  createdAt: string
}

export interface MemoryEdge {
  source: string
  target: string
}

interface SimNode extends SimulationNodeDatum {
  id: string
  label: string
  fullText: string
  category: MemoryCategory
  source: MemorySource
  sourceUrl?: string
  weight: number
  createdAt: string
}

// ── Color config ─────────────────────────────────────────────

export const SOURCE_COLORS: Record<MemorySource, string> = {
  slack: "#4A154B",
  linkedin: "#0A66C2",
  manual: "#3B6D11",
  interview: "#854F0B",
  document: "#A32D2D",
  whatsapp: "#25D366",
}

export const SOURCE_LABELS: Record<MemorySource, string> = {
  slack: "Slack",
  linkedin: "LinkedIn",
  manual: "Manual",
  interview: "Interview",
  document: "Document",
  whatsapp: "WhatsApp",
}

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  hiring: "Hiring philosophy",
  values: "Values & principles",
  communication: "Communication style",
  company: "Company context",
  "role-specific": "Role-specific",
  "past-decisions": "Past decisions",
}

// ── Component ────────────────────────────────────────────────

interface MemoryMindMapProps {
  memories: MemoryNode[]
  edges: MemoryEdge[]
  onNodeClick?: (memory: MemoryNode) => void
  selectedId?: string | null
}

export function MemoryMindMap({ memories, edges, onNodeClick, selectedId }: MemoryMindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<SimNode[]>([])
  const [links, setLinks] = useState<SimulationLinkDatum<SimNode>[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const initialDimensionsRef = useRef<{ width: number; height: number } | null>(null)
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)

  // Measure container — only capture initial size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0 && !initialDimensionsRef.current) {
        initialDimensionsRef.current = { width, height }
        setDimensions({ width, height })
      }
    })
    obs.observe(container)
    return () => obs.disconnect()
  }, [])

  // Run simulation
  useEffect(() => {
    if (!memories.length) return

    const simNodes: SimNode[] = memories.map(m => ({
      ...m,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
    }))

    const simLinks: SimulationLinkDatum<SimNode>[] = edges
      .filter(e => simNodes.find(n => n.id === e.source) && simNodes.find(n => n.id === e.target))
      .map(e => ({ source: e.source, target: e.target }))

    // Source-based clustering
    const sources = [...new Set(memories.map(m => m.source))]
    const sourceAngle = (src: MemorySource) => {
      const idx = sources.indexOf(src)
      return (idx / sources.length) * Math.PI * 2
    }
    const clusterRadius = Math.min(dimensions.width, dimensions.height) * 0.32

    const sim = forceSimulation<SimNode>(simNodes)
      .force("link", forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks).id(d => d.id).distance(140).strength(0.1))
      .force("charge", forceManyBody().strength(-250))
      .force("center", forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.15))
      .force("collide", forceCollide().radius(d => (d as SimNode).weight * 5 + 32))
      .force("x", forceX<SimNode>().x(d => {
        const angle = sourceAngle(d.source)
        return dimensions.width / 2 + Math.cos(angle) * clusterRadius
      }).strength(0.25))
      .force("y", forceY<SimNode>().y(d => {
        const angle = sourceAngle(d.source)
        return dimensions.height / 2 + Math.sin(angle) * clusterRadius
      }).strength(0.25))
      .on("tick", () => {
        setNodes([...simNodes])
        setLinks([...simLinks])
      })

    simulationRef.current = sim
    return () => { sim.stop() }
  }, [memories, edges, dimensions])

  const getNodeRadius = useCallback((weight: number) => weight * 3 + 8, [])
  const dragNodeRef = useRef<SimNode | null>(null)

  const handleDragStart = useCallback((node: SimNode, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragNodeRef.current = node
    node.fx = node.x
    node.fy = node.y
    simulationRef.current?.alphaTarget(0.3).restart()
  }, [])

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    const node = dragNodeRef.current
    if (!node || !svgRef.current) return
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    node.fx = svgP.x
    node.fy = svgP.y
  }, [])

  const handleDragEnd = useCallback(() => {
    const node = dragNodeRef.current
    if (!node) return
    dragNodeRef.current = null
    node.fx = null
    node.fy = null
    simulationRef.current?.alphaTarget(0)
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#f8f9fc] rounded-lg border border-border overflow-hidden">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <p className="text-[8px] font-pixel uppercase tracking-widest text-muted-foreground mb-0.5">Sources</p>
        {Object.entries(SOURCE_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] font-pixel text-muted-foreground">{SOURCE_LABELS[key as MemorySource]}</span>
          </div>
        ))}
      </div>

      {/* Category labels */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
        <p className="text-[8px] font-pixel uppercase tracking-widest text-muted-foreground mb-0.5">Categories</p>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <span key={key} className="text-[9px] font-pixel text-muted-foreground">{label}</span>
        ))}
      </div>

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Source cluster labels */}
        {(() => {
          const sourceGroups: Record<string, { x: number; y: number; count: number }> = {}
          for (const n of nodes) {
            if (!n.x || !n.y) continue
            if (!sourceGroups[n.source]) sourceGroups[n.source] = { x: 0, y: 0, count: 0 }
            sourceGroups[n.source].x += n.x
            sourceGroups[n.source].y += n.y
            sourceGroups[n.source].count++
          }
          return Object.entries(sourceGroups).map(([src, g]) => (
            <text
              key={src}
              x={g.x / g.count}
              y={g.y / g.count - 35}
              textAnchor="middle"
              className="font-pixel fill-muted-foreground pointer-events-none select-none"
              fontSize={8}
              opacity={0.5}
            >
              {SOURCE_LABELS[src as MemorySource]}
            </text>
          ))
        })()}

        {/* Edges */}
        {links.map((link, i) => {
          const s = link.source as SimNode
          const t = link.target as SimNode
          if (!s.x || !s.y || !t.x || !t.y) return null
          return (
            <line
              key={i}
              x1={s.x} y1={s.y}
              x2={t.x} y2={t.y}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          if (!node.x || !node.y) return null
          const r = getNodeRadius(node.weight)
          const isHovered = hoveredId === node.id
          const isSelected = selectedId === node.id
          const color = SOURCE_COLORS[node.source]
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => { if (!dragNodeRef.current) setHoveredId(null) }}
              onMouseDown={e => handleDragStart(node, e)}
              onClick={() => { if (!dragNodeRef.current) onNodeClick?.(node) }}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* Glow on hover/select */}
              {(isHovered || isSelected) && (
                <circle r={r + 6} fill={color} opacity={0.15} />
              )}

              {/* Node circle */}
              <circle
                r={r}
                fill={color}
                opacity={isHovered || isSelected ? 1 : 0.7}
                stroke={isSelected ? "currentColor" : "none"}
                strokeWidth={isSelected ? 2 : 0}
                className={isSelected ? "text-foreground" : ""}
              />

              {/* Label */}
              <text
                y={r + 14}
                textAnchor="middle"
                className="font-pixel fill-foreground"
                fontSize={9}
                opacity={isHovered || isSelected ? 1 : 0.6}
              >
                {node.label.length > 24 ? node.label.slice(0, 22) + "..." : node.label}
              </text>

              {/* Hover tooltip */}
              {isHovered && (
                <foreignObject
                  x={-120}
                  y={-(r + 65)}
                  width={240}
                  height={55}
                >
                  <div className="bg-foreground text-background text-[10px] px-2.5 py-2 rounded-lg shadow-lg leading-relaxed">
                    <p className="font-medium mb-0.5">{node.label}</p>
                    <p className="opacity-70 text-[9px] font-pixel">{CATEGORY_LABELS[node.category]} · {SOURCE_LABELS[node.source]} · {node.createdAt}</p>
                  </div>
                </foreignObject>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Mock data ────────────────────────────────────────────────

export const MOCK_MEMORIES: MemoryNode[] = [
  { id: "h1", label: "Trade-offs > aesthetics", fullText: "Design is decision-making, not decoration. Candidates who can't articulate trade-offs are a red flag.", category: "hiring", source: "linkedin", sourceUrl: "https://linkedin.com/posts/sashank-gondala/trade-offs", weight: 5, createdAt: "3d ago" },
  { id: "h2", label: "Judge by questions asked", fullText: "Judges candidates by what they ask, not just what they answer. Curiosity is the strongest signal.", category: "hiring", source: "manual", weight: 4, createdAt: "1w ago" },
  { id: "h3", label: "Zoom in and zoom out", fullText: "Values people who can zoom in and zoom out — tactical and strategic. IC who thinks like a founder.", category: "hiring", source: "manual", weight: 3, createdAt: "2w ago" },
  { id: "h4", label: "Reject fast, shortlist slow", fullText: "Clear rejects should be instant. Shortlists deserve 10 minutes of thought — that's where mistakes happen.", category: "hiring", source: "interview", sourceUrl: "https://alt.inc/interviews/batch-22-debrief", weight: 4, createdAt: "1w ago" },
  { id: "h5", label: "Systems thinking > execution", fullText: "Execution-heavy candidates who can't frame trade-offs usually burn out in the first year. Bias toward people who think in systems.", category: "hiring", source: "manual", weight: 5, createdAt: "2w ago" },

  { id: "v1", label: "Ship imperfect > plan perfect", fullText: "Strong bias for action. Ship imperfect > plan perfect. The delta between 80% and 95% rarely justifies the wait.", category: "values", source: "slack", sourceUrl: "https://alt-inc.slack.com/archives/C0A5156HC67/p1712000000", weight: 4, createdAt: "1w ago" },
  { id: "v2", label: "Small high-trust teams", fullText: "Prefers working in small, high-trust teams over large orgs. Process should serve the team, not the other way around.", category: "values", source: "slack", sourceUrl: "https://alt-inc.slack.com/archives/C0A5156HC67/p1711500000", weight: 3, createdAt: "2w ago" },
  { id: "v3", label: "Craft matters at every stage", fullText: "Even at seed stage, craft matters. Sloppy work compounds. Set the bar early.", category: "values", source: "linkedin", sourceUrl: "https://linkedin.com/posts/sashank-gondala/craft-matters", weight: 3, createdAt: "3w ago" },

  { id: "c1", label: "Async over meetings", fullText: "Prefers async communication. Thinks most meetings should be docs. Exceptions: design crits and candidate debriefs.", category: "communication", source: "whatsapp", weight: 3, createdAt: "3d ago" },
  { id: "c2", label: "Direct but warm", fullText: "Uses casual language but doesn't dumb things down. Asks sharp follow-up questions. Never corporate or stiff.", category: "communication", source: "manual", weight: 4, createdAt: "1w ago" },
  { id: "c3", label: "No corporate speak", fullText: "Hates jargon. 'Synergy', 'leverage', 'circle back' are instant credibility hits in interviews.", category: "communication", source: "slack", sourceUrl: "https://alt-inc.slack.com/archives/C0ARDR3PKKK/p1710000000", weight: 2, createdAt: "3w ago" },

  { id: "co1", label: "12 people, seed stage", fullText: "We're 12 people at seed stage. Everyone wears multiple hats. Candidates need to be comfortable with ambiguity.", category: "company", source: "document", sourceUrl: "https://docs.google.com/document/d/alt-inc-handbook", weight: 2, createdAt: "1m ago" },
  { id: "co2", label: "Remote-first PT±4h", fullText: "Remote-first but timezone-bounded. PT ±4 hours for synchronous collaboration windows.", category: "company", source: "document", sourceUrl: "https://docs.google.com/document/d/alt-inc-handbook", weight: 2, createdAt: "1m ago" },
  { id: "co3", label: "Scaling founder taste", fullText: "The company mission: scale founder taste without scaling founder time. This is the lens for every product decision.", category: "company", source: "manual", weight: 3, createdAt: "2w ago" },

  { id: "r1", label: "Designer: B2B depth required", fullText: "For the product designer role specifically: B2B SaaS experience is a must-have, not nice-to-have. Consumer-only candidates don't translate.", category: "role-specific", source: "interview", sourceUrl: "https://alt.inc/interviews/designer-round-3", weight: 4, createdAt: "1w ago" },
  { id: "r2", label: "Engineer: ownership stories", fullText: "For engineering hires: ask for specific ownership stories. 'I built X' vs 'the team built X' is a critical distinction.", category: "role-specific", source: "interview", weight: 3, createdAt: "2w ago" },

  { id: "p1", label: "Overrode 4 of 6 shortlists", fullText: "In the last 2 weeks, overrode 4 of 6 Alt shortlist recommendations where systems-thinking scored below 7. This is 2x the quarterly rate.", category: "past-decisions", source: "interview", weight: 5, createdAt: "2d ago" },
  { id: "p2", label: "Priya = benchmark shortlist", fullText: "Priya Sharma (9/10) is the benchmark for a strong shortlist. Trade-off framing, concrete B2B examples, asks great questions.", category: "past-decisions", source: "interview", sourceUrl: "https://alt.inc/interviews/priya-sharma-sr-pd", weight: 4, createdAt: "2h ago" },
  { id: "p3", label: "Consumer designers rejected 3x", fullText: "Consumer-background designers have been rejected 3 times this quarter. Pattern is consistent enough to auto-reject below threshold.", category: "past-decisions", source: "interview", weight: 3, createdAt: "1w ago" },
]

export const MOCK_EDGES: MemoryEdge[] = [
  { source: "h1", target: "h5" },
  { source: "h2", target: "h3" },
  { source: "h4", target: "h5" },
  { source: "v1", target: "h4" },
  { source: "v2", target: "co1" },
  { source: "c2", target: "c3" },
  { source: "c1", target: "v2" },
  { source: "r1", target: "h1" },
  { source: "r2", target: "h3" },
  { source: "p1", target: "h5" },
  { source: "p2", target: "h1" },
  { source: "p3", target: "r1" },
  { source: "co3", target: "v1" },
  { source: "co1", target: "v2" },
]
