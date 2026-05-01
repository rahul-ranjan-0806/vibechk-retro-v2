import { useRef, useState, useCallback, useEffect, useMemo, createContext, useContext, memo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Html, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

// ── Types ────────────────────────────────────────────────────

export type MemorySource = "slack" | "linkedin" | "manual" | "interview" | "document" | "whatsapp"
export type MemoryCategory = "hiring" | "values" | "communication" | "company" | "role-specific" | "past-decisions"

export interface MemoryNode {
  id: string
  label: string
  fullText: string
  category: MemoryCategory
  source: MemorySource
  sourceUrl?: string // link to the original source (Slack thread, LinkedIn post, etc.)
  weight: number
  createdAt: string
}

export interface MemoryEdge {
  source: string
  target: string
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

// ── 3D Layout ────────────────────────────────────────────────

interface NodePosition {
  node: MemoryNode
  position: THREE.Vector3
}

/** Default base sphere size — all orbs scale relative to this. */
const DEFAULT_BASE_SIZE = 0.18
const DEFAULT_CLUSTER_RADIUS = 4
const DEFAULT_NODE_SPREAD = 1.6
const DEFAULT_FOG_NEAR = 4
const DEFAULT_FOG_FAR = 18

function nodeRadius(weight: number, baseSize: number) {
  return baseSize + weight * (baseSize * 0.33)
}

interface SizeConfig {
  baseSize: number
  clusterRadius: number
  nodeSpread: number
  fogNear: number
  fogFar: number
}

function computeClusteredPositions(memories: MemoryNode[], config: SizeConfig): NodePosition[] {
  const sources = [...new Set(memories.map(m => m.source))]
  const { clusterRadius, nodeSpread, baseSize } = config

  const clusterCenters: Record<string, THREE.Vector3> = {}
  sources.forEach((src, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / sources.length)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    clusterCenters[src] = new THREE.Vector3(
      clusterRadius * Math.sin(phi) * Math.cos(theta),
      clusterRadius * Math.sin(phi) * Math.sin(theta),
      clusterRadius * Math.cos(phi),
    )
  })

  let seed = 42
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

  const results: NodePosition[] = memories.map(m => {
    const center = clusterCenters[m.source]
    const offset = new THREE.Vector3(
      (rand() - 0.5) * nodeSpread,
      (rand() - 0.5) * nodeSpread,
      (rand() - 0.5) * nodeSpread,
    )
    return { node: m, position: center.clone().add(offset) }
  })

  // Repulsion — push overlapping nodes apart
  const padding = baseSize * 1.4
  for (let iter = 0; iter < 30; iter++) {
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i], b = results[j]
        const minDist = nodeRadius(a.node.weight, baseSize) + nodeRadius(b.node.weight, baseSize) + padding
        const diff = a.position.clone().sub(b.position)
        const dist = diff.length()
        if (dist < minDist && dist > 0.001) {
          const push = diff.normalize().multiplyScalar((minDist - dist) * 0.5)
          a.position.add(push)
          b.position.sub(push)
        }
      }
    }
  }

  return results
}

// ── Shared context (stable identity, no re-renders on slider) ─

interface SceneContextValue {
  groupRef: React.RefObject<THREE.Group | null>
  baseSizeRef: React.RefObject<number>
  onHover: (index: number) => void
  onUnhover: () => void
}

const SceneContext = createContext<SceneContextValue>({
  groupRef: { current: null },
  baseSizeRef: { current: DEFAULT_BASE_SIZE },
  onHover: () => {},
  onUnhover: () => {},
})

// ── Precomputed color objects per source ──────────────────────

const sourceColorObjects: Record<string, THREE.Color> = {}
for (const [key, hex] of Object.entries(SOURCE_COLORS)) {
  sourceColorObjects[key] = new THREE.Color(hex)
}

// ── Hoisted styles (allocated once, never recreated) ─────────

const labelCardBaseStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 4,
  whiteSpace: "nowrap",
  maxWidth: 140,
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
}

const labelTextStyle: React.CSSProperties = {
  fontSize: 9,
  fontFamily: "'Press Start 2P', monospace",
  display: "block",
  lineHeight: 1.3,
  color: "#fff",
}

const tooltipCardStyle: React.CSSProperties = {
  background: "rgba(26,26,46,0.95)",
  WebkitBackdropFilter: "blur(8px)",
  backdropFilter: "blur(8px)",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: 6,
  whiteSpace: "nowrap",
  maxWidth: 220,
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
}

const tooltipTitleStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, marginBottom: 3, fontFamily: "Inter, system-ui, sans-serif",
}

const tooltipMetaStyle: React.CSSProperties = {
  fontSize: 8, opacity: 0.7, fontFamily: "'Press Start 2P', monospace", lineHeight: 1.5,
}

const noPointerEvents: React.CSSProperties = { pointerEvents: "none" }

// ── Sphere node (imperative updates, no re-render per frame) ─

const sphereGeo = new THREE.SphereGeometry(1, 12, 12)

interface MemorySphereProps {
  node: MemoryNode
  position: THREE.Vector3
  index: number
  isFocused: boolean
  isSelected: boolean
  onClick: (node: MemoryNode) => void
}

const MemorySphere = memo(function MemorySphere({ node, position, index, isFocused, isSelected, onClick }: MemorySphereProps) {
  const ctx = useContext(SceneContext)
  const baseSize = ctx.baseSizeRef.current
  const radius = nodeRadius(node.weight, baseSize)

  return (
    <group position={position}>
      {/* Focus ring — always mounted, visibility toggled */}
      <mesh geometry={sphereGeo} scale={radius * 1.6} visible={isFocused || isSelected}>
        <meshBasicMaterial color={sourceColorObjects[node.source]} transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* Sphere — fog handles depth tinting on the GPU, no per-frame JS needed */}
      <mesh
        geometry={sphereGeo}
        scale={radius}
        onClick={e => { e.stopPropagation(); onClick(node) }}
        onPointerEnter={e => { e.stopPropagation(); ctx.onHover(index); document.body.style.cursor = "pointer" }}
        onPointerLeave={() => { ctx.onUnhover(); document.body.style.cursor = "" }}
      >
        <meshBasicMaterial color={sourceColorObjects[node.source]} fog />
      </mesh>

      {/* Billboard label — source-colored background, white text */}
      <Html position={[0, -(radius + baseSize), 0]} center style={noPointerEvents}>
        <div style={{
          ...labelCardBaseStyle,
          background: SOURCE_COLORS[node.source],
          border: isFocused || isSelected ? "2px solid #fff" : "none",
        }}>
          <span style={labelTextStyle}>
            {node.label.length > 20 ? node.label.slice(0, 18) + "..." : node.label}
          </span>
        </div>
      </Html>
    </group>
  )
})

interface PerfMetrics {
  fps: number
  frameTime: number
  worstFrame: number
  drawCalls: number
  triangles: number
  heapMB: number
  status: "good" | "ok" | "poor"
}

interface PerfOverlayProps {
  metricsRef: React.RefObject<PerfMetrics>
  visible: boolean
  sizeConfig: SizeConfig
  onSizeChange: (config: SizeConfig) => void
}

const STATUS_COLORS = { good: "#3B6D11", ok: "#854F0B", poor: "#A32D2D" } as const
const STATUS_BGS = { good: "#EAF3DE", ok: "#FAEEDA", poor: "#FCEBEB" } as const
const STATUS_LABELS = { good: "Good", ok: "OK", poor: "Poor" } as const

/** Called from Scene's useFrame — no separate rAF loop needed */
function updatePerfDOM(
  m: PerfMetrics,
  refs: { dot: HTMLSpanElement | null; label: HTMLSpanElement | null; fps: HTMLSpanElement | null; details: HTMLDivElement | null },
  prevStatus: { current: string },
) {
  if (m.status !== prevStatus.current) {
    prevStatus.current = m.status
    const c = STATUS_COLORS[m.status]
    const bg = STATUS_BGS[m.status]
    if (refs.dot) refs.dot.style.background = c
    if (refs.label) {
      refs.label.textContent = STATUS_LABELS[m.status]
      refs.label.style.color = c
      refs.label.style.background = bg
    }
  }
  if (refs.fps) refs.fps.textContent = `${m.fps} FPS`
  if (refs.details) {
    refs.details.textContent = `Frame: ${m.frameTime}ms · Worst: ${m.worstFrame}ms | Draws: ${m.drawCalls} · Tris: ${m.triangles}${m.heapMB >= 0 ? ` | Heap: ${m.heapMB}MB` : ""}`
  }
}

/** Stable ref bag passed from PerfOverlay to Scene so Scene's useFrame can update perf DOM */
interface PerfDOMRefs {
  dot: HTMLSpanElement | null
  label: HTMLSpanElement | null
  fps: HTMLSpanElement | null
  details: HTMLDivElement | null
  prevStatus: { current: string }
  visible: boolean
}

function PerfOverlay({ metricsRef, visible, sizeConfig, onSizeChange, perfDOMRefs }: PerfOverlayProps & { perfDOMRefs: React.RefObject<PerfDOMRefs> }) {
  const statusDotRef = useRef<HTMLSpanElement>(null)
  const statusLabelRef = useRef<HTMLSpanElement>(null)
  const fpsRef = useRef<HTMLSpanElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)

  // Sync DOM refs into the shared bag so Scene's useFrame can update them
  useEffect(() => {
    if (perfDOMRefs.current) {
      perfDOMRefs.current.dot = statusDotRef.current
      perfDOMRefs.current.label = statusLabelRef.current
      perfDOMRefs.current.fps = fpsRef.current
      perfDOMRefs.current.details = detailsRef.current
      perfDOMRefs.current.visible = visible
    }
  })

  if (!visible) return null

  return (
    <div className="absolute bottom-3 right-3 z-50">
      {/* Forced light surface — sits on a permanently dark 3D scene, so we
          don't follow theme tokens here (avoids dark-on-dark in light mode). */}
      <div className="w-[240px] rounded-md border border-black/10 shadow-modal text-neutral-900"
        style={{
          background: "rgba(255,255,255,0.94)",
          WebkitBackdropFilter: "blur(8px)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 h-9 border-b border-black/10">
          <p className="text-[11px] font-semibold tracking-wider text-neutral-500">3D MAP</p>
          <div className="flex items-center gap-1.5">
            <span ref={statusDotRef} className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#3B6D11" }} />
            <span ref={statusLabelRef} className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm" style={{ color: "#3B6D11", background: "#EAF3DE" }}>Good</span>
            <span ref={fpsRef} className="text-[11px] font-semibold tabular-nums">0 FPS</span>
          </div>
        </div>

        {/* Live details */}
        <div ref={detailsRef} className="px-3.5 py-2 text-[10px] leading-relaxed text-neutral-500 border-b border-black/10" />

        {/* Sliders */}
        <div className="p-3.5 flex flex-col gap-3">
          <PerfSlider label="Orb size"      value={sizeConfig.baseSize}      min={0.06} max={0.5} step={0.01} format={v => v.toFixed(2)} onChange={v => onSizeChange({ ...sizeConfig, baseSize: v })} />
          <PerfSlider label="Cluster spread" value={sizeConfig.clusterRadius} min={1.5}  max={8}   step={0.1}  format={v => v.toFixed(1)} onChange={v => onSizeChange({ ...sizeConfig, clusterRadius: v })} />
          <PerfSlider label="Node scatter"   value={sizeConfig.nodeSpread}    min={0.4}  max={4}   step={0.1}  format={v => v.toFixed(1)} onChange={v => onSizeChange({ ...sizeConfig, nodeSpread: v })} />
          <PerfSlider label="Fog near"       value={sizeConfig.fogNear}       min={1}    max={12}  step={0.5}  format={v => v.toFixed(0)} onChange={v => onSizeChange({ ...sizeConfig, fogNear: v })} />
          <PerfSlider label="Fog far"        value={sizeConfig.fogFar}        min={8}    max={30}  step={0.5}  format={v => v.toFixed(0)} onChange={v => onSizeChange({ ...sizeConfig, fogFar: v })} />
        </div>
      </div>
    </div>
  )
}

function PerfSlider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500">{label}</span>
        <span className="tabular-nums text-neutral-900">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full h-1"
        style={{ accentColor: "#1a1a2e" }}
      />
    </label>
  )
}

// ── Critically damped spring ─────────────────────────────────

function springLerp(
  current: THREE.Vector3,
  target: THREE.Vector3,
  velocity: THREE.Vector3,
  delta: number,
  stiffness = 8,
  damping = 2 * Math.sqrt(stiffness),
) {
  velocity.x += (-stiffness * (current.x - target.x) - damping * velocity.x) * delta
  velocity.y += (-stiffness * (current.y - target.y) - damping * velocity.y) * delta
  velocity.z += (-stiffness * (current.z - target.z) - damping * velocity.z) * delta
  current.x += velocity.x * delta
  current.y += velocity.y * delta
  current.z += velocity.z * delta
}

// ── Scene ────────────────────────────────────────────────────

interface SceneProps {
  nodePositions: NodePosition[]
  focusedIndex: number
  selectedId: string | null
  onNodeClick: (node: MemoryNode) => void
  sizeConfig: SizeConfig
  metricsRef: React.RefObject<PerfMetrics>
  perfDOMRefs: React.RefObject<PerfDOMRefs>
}

function Scene({ nodePositions, focusedIndex, selectedId, onNodeClick, sizeConfig, metricsRef, perfDOMRefs }: SceneProps) {
  const { baseSize, fogNear, fogFar } = sizeConfig
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<any>(null)
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const lookAtVelocity = useRef(new THREE.Vector3(0, 0, 0))
  const isUserDragging = useRef(false)

  const _worldPos = useMemo(() => new THREE.Vector3(), [])

  // Perf timing
  const frameTimesRef = useRef<number[]>([])
  const lastFrameTime = useRef(performance.now())
  const { gl, scene } = useThree()

  // Set up fog — GPU handles depth tinting, no per-frame JS computation
  useEffect(() => {
    scene.fog = new THREE.Fog("#f8f9fc", fogNear, fogFar)
    return () => { scene.fog = null }
  }, [scene, fogNear, fogFar])

  // Shared tooltip
  const [hoveredNode, setHoveredNode] = useState<{ node: MemoryNode; index: number } | null>(null)

  const onHover = useCallback((index: number) => {
    setHoveredNode({ node: nodePositions[index].node, index })
  }, [nodePositions])

  const onUnhover = useCallback(() => {
    setHoveredNode(null)
  }, [])

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < nodePositions.length) {
      const target = nodePositions[focusedIndex].position.clone()
      if (groupRef.current) target.applyMatrix4(groupRef.current.matrixWorld)
      targetLookAt.current.copy(target)
      lookAtVelocity.current.set(0, 0, 0)
    } else {
      targetLookAt.current.set(0, 0, 0)
    }
  }, [focusedIndex, nodePositions])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return
    const dragging = isUserDragging.current

    if (!dragging) {
      group.rotation.y += delta * 0.08
    }

    if (!dragging) {
      if (focusedIndex >= 0 && focusedIndex < nodePositions.length) {
        _worldPos.copy(nodePositions[focusedIndex].position)
        _worldPos.applyMatrix4(group.matrixWorld)
        targetLookAt.current.copy(_worldPos)
      }
      if (controlsRef.current) {
        springLerp(currentLookAt.current, targetLookAt.current, lookAtVelocity.current, delta)
        controlsRef.current.target.copy(currentLookAt.current)
      }
    } else {
      if (controlsRef.current) {
        currentLookAt.current.copy(controlsRef.current.target)
        targetLookAt.current.copy(controlsRef.current.target)
        lookAtVelocity.current.set(0, 0, 0)
      }
    }

    // Perf metrics
    const now = performance.now()
    const dt = now - lastFrameTime.current
    lastFrameTime.current = now
    const times = frameTimesRef.current
    times.push(dt)
    if (times.length > 60) times.shift()
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const fps = 1000 / avg
    const info = gl.info
    const mem = (performance as any).memory
    const m = metricsRef.current
    if (m) {
      m.fps = Math.round(fps)
      m.frameTime = +avg.toFixed(1)
      m.worstFrame = +Math.max(...times).toFixed(1)
      m.drawCalls = info.render?.calls ?? 0
      m.triangles = info.render?.triangles ?? 0
      m.heapMB = mem ? Math.round(mem.usedJSHeapSize / 1048576) : -1
      m.status = fps >= 55 ? "good" : fps >= 30 ? "ok" : "poor"
      const p = perfDOMRefs.current
      if (p && p.visible) {
        updatePerfDOM(m, { dot: p.dot, label: p.label, fps: p.fps, details: p.details }, p.prevStatus)
      }
    }
  })

  const baseSizeRef = useRef(baseSize)
  baseSizeRef.current = baseSize
  const ctxValue = useMemo<SceneContextValue>(() => ({
    groupRef, baseSizeRef, onHover, onUnhover,
  }), [onHover, onUnhover])

  // Tooltip position — computed from hovered node's world position
  const tooltipPos = useMemo(() => {
    if (!hoveredNode) return new THREE.Vector3(0, 0, 0)
    const np = nodePositions[hoveredNode.index]
    if (!np) return new THREE.Vector3(0, 0, 0)
    const r = nodeRadius(np.node.weight, baseSize)
    return np.position.clone().add(new THREE.Vector3(0, r + baseSize * 0.5, 0))
  }, [hoveredNode, nodePositions, baseSize])

  return (
    <SceneContext.Provider value={ctxValue}>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        minDistance={3}
        maxDistance={16}
        onStart={() => { isUserDragging.current = true }}
        onEnd={() => { isUserDragging.current = false }}
      />

      <group ref={groupRef}>
        {nodePositions.map((np, i) => (
          <MemorySphere
            key={np.node.id}
            node={np.node}
            position={np.position}
            index={i}
            isFocused={i === focusedIndex}
            isSelected={selectedId === np.node.id}
            onClick={onNodeClick}
          />
        ))}

        {/* Single shared tooltip — 1 Html instead of 20 */}
        {hoveredNode && (
          <Html position={tooltipPos} center style={noPointerEvents}>
            <div style={tooltipCardStyle}>
              <p style={tooltipTitleStyle}>{hoveredNode.node.label}</p>
              <p style={tooltipMetaStyle}>
                {CATEGORY_LABELS[hoveredNode.node.category]} · {SOURCE_LABELS[hoveredNode.node.source]} · {hoveredNode.node.createdAt}
              </p>
            </div>
          </Html>
        )}
      </group>
    </SceneContext.Provider>
  )
}

// ── Main component ───────────────────────────────────────────

interface MemoryMindMapProps {
  memories: MemoryNode[]
  edges: MemoryEdge[]
  onNodeClick?: (memory: MemoryNode) => void
  selectedId?: string | null
  className?: string
  showHUD?: boolean
}

export function MemoryMindMap({ memories, edges: _edges, onNodeClick, selectedId, className, showHUD = true }: MemoryMindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const showPerf = showHUD
  const [webglSupported, setWebglSupported] = useState(true)
  const [sizeConfig, setSizeConfig] = useState<SizeConfig>({
    baseSize: DEFAULT_BASE_SIZE,
    clusterRadius: DEFAULT_CLUSTER_RADIUS,
    nodeSpread: DEFAULT_NODE_SPREAD,
    fogNear: DEFAULT_FOG_NEAR,
    fogFar: DEFAULT_FOG_FAR,
  })
  const metricsRef = useRef<PerfMetrics>({
    fps: 0, frameTime: 0, worstFrame: 0, drawCalls: 0, triangles: 0, heapMB: -1, status: "good",
  })
  const perfDOMRefs = useRef<PerfDOMRefs>({
    dot: null, label: null, fps: null, details: null,
    prevStatus: { current: "" }, visible: true,
  })

  const nodePositions = useMemo(() => computeClusteredPositions(memories, sizeConfig), [memories, sizeConfig])

  // WebGL detection
  useEffect(() => {
    try {
      const c = document.createElement("canvas")
      const gl = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl")
      if (!gl) setWebglSupported(false)
    } catch { setWebglSupported(false) }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Skip when typing in inputs
    const tag = (e.target as HTMLElement).tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

    if (e.key === "Tab") {
      e.preventDefault()
      setFocusedIndex(prev => {
        const next = e.shiftKey
          ? (prev <= 0 ? nodePositions.length - 1 : prev - 1)
          : (prev >= nodePositions.length - 1 ? 0 : prev + 1)
        if (onNodeClick) onNodeClick(nodePositions[next].node)
        return next
      })
    } else if (e.key === "Escape") {
      setFocusedIndex(-1)
    }
  }, [nodePositions, onNodeClick])

  useEffect(() => {
    if (selectedId) {
      const idx = nodePositions.findIndex(np => np.node.id === selectedId)
      if (idx >= 0) setFocusedIndex(idx)
    } else {
      setFocusedIndex(-1)
    }
  }, [selectedId, nodePositions])

  // WebGL not supported fallback
  if (!webglSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f8f9fc] rounded-lg border border-border">
        <div className="text-center px-6">
          <p className="text-sm font-medium mb-1">3D view unavailable</p>
          <p className="text-xs font-pixel text-muted-foreground">Your browser doesn't support WebGL. Try Chrome, Firefox, Safari, or Edge.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative bg-[#0f1117] rounded-lg border border-border overflow-hidden ${className ?? ""}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: "none" }}
    >
      {/* Legend */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 pointer-events-none">
        <p className="text-[11px] font-pixel uppercase tracking-widest text-white/40 mb-0.5">Sources</p>
        {Object.entries(SOURCE_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] font-pixel text-white/50">{SOURCE_LABELS[key as MemorySource]}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 z-30 pointer-events-none">
        <p className="text-[11px] font-pixel text-white/30">
          Drag to orbit · Scroll to zoom · Tab to focus · H to toggle HUD
        </p>
      </div>

      {focusedIndex >= 0 && focusedIndex < nodePositions.length && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <div style={{ background: "rgba(255,255,255,0.9)", WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)" }}
            className="border border-border rounded-md px-2.5 py-1.5 shadow-sm">
            <p className="text-[11px] font-pixel text-muted-foreground">
              {focusedIndex + 1} / {nodePositions.length}
            </p>
            <p className="text-xs font-pixel font-medium text-foreground truncate max-w-[140px]">
              {nodePositions[focusedIndex].node.label}
            </p>
          </div>
        </div>
      )}

      {/* Perf overlay with size controls (DOM, outside Canvas) */}
      <PerfOverlay metricsRef={metricsRef} visible={showPerf} sizeConfig={sizeConfig} onSizeChange={setSizeConfig} perfDOMRefs={perfDOMRefs} />

      <Canvas
        camera={{ position: [0, 2, 10], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", position: "relative", zIndex: 0 }}
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs font-pixel text-muted-foreground">Loading 3D view...</p>
          </div>
        }
      >
        <Scene
          nodePositions={nodePositions}
          focusedIndex={focusedIndex}
          selectedId={selectedId ?? null}
          onNodeClick={node => onNodeClick?.(node)}
          sizeConfig={sizeConfig}
          metricsRef={metricsRef}
          perfDOMRefs={perfDOMRefs}
        />
      </Canvas>
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
