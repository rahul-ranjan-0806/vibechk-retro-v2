import { useEffect, useRef, useState } from "react"

/**
 * Canvas-driven pixel grid for the Sabu overlay backdrop.
 *
 * Each cell is one internal canvas pixel — image-rendering: pixelated
 * upscales without smoothing. So a ~60×38 canvas covers a 1920px viewport
 * at 32px cells, which makes clearRect + fillRect trivial each frame.
 *
 * Twinkles are spawned at a configurable rate, each with a random cell,
 * lifetime, and peak opacity. They fade up then down via a triangle wave
 * and self-prune. Per-cell true randomness (seeded mulberry32) with
 * bounded compositor + JS cost.
 *
 * Press H while Sabu is open to toggle a dev control panel for speed,
 * seed, and cell size.
 */

interface Twinkle {
  x: number          // canvas pixel coords (1px = 1 cell)
  y: number
  startTime: number  // ms (performance.now)
  duration: number   // ms
  peak: number       // 0..1
}

interface Settings {
  spawnRate: number       // twinkles spawned per second
  durMin: number          // ms
  durMax: number          // ms
  opMin: number           // peak opacity floor
  opMax: number           // peak opacity ceiling
  budget: number          // hard cap on concurrent twinkles
}

const NORMAL: Settings = { spawnRate: 9,   durMin: 1600, durMax: 3800,  opMin: 0.04, opMax: 0.10, budget: 32 }
const CALM:   Settings = { spawnRate: 1.2, durMin: 5000, durMax: 11000, opMin: 0.02, opMax: 0.04, budget: 12 }

// ── Persisted settings ──────────────────────────────────────────
const STORAGE_KEY = "vibechk:pixel-grid"

interface PersistedSettings {
  speed: number
  density: number
  seed: number
  cellSize: number
}

const DEFAULT_SETTINGS: PersistedSettings = {
  speed: 1,
  density: 1,
  seed: 20260502,
  cellSize: 32,
}

function loadSettings(): PersistedSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PersistedSettings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────
// Deterministic, fast, good enough distribution for visual randomness.
function makePrng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Props {
  open: boolean
  closing: boolean
  calm: boolean
}

export function PixelGridBackdrop({ open, closing, calm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const twinklesRef = useRef<Twinkle[]>([])
  const settingsRef = useRef<Settings>(NORMAL)

  // ── Dev controls (persisted across opens via localStorage) ───
  const [controlsOpen, setControlsOpen] = useState(false)
  const [speed, setSpeed]       = useState<number>(() => loadSettings().speed)     // 0.1× – 12×
  const [density, setDensity]   = useState<number>(() => loadSettings().density)   // 0.25× – 20× (scales spawnRate + budget)
  const [seed, setSeed]         = useState<number>(() => loadSettings().seed)
  const [cellSize, setCellSize] = useState<number>(() => loadSettings().cellSize)  // 8 – 64 px

  // Persist settings whenever any control changes
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ speed, density, seed, cellSize } satisfies PersistedSettings),
      )
    } catch {
      // Quota / private mode — silently ignore
    }
  }, [speed, density, seed, cellSize])

  // Keep refs in sync so the rAF loop reads latest values without restarting
  const speedRef = useRef(speed)
  const densityRef = useRef(density)
  const cellSizeRef = useRef(cellSize)
  const rngRef = useRef(makePrng(seed))
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { densityRef.current = density }, [density])
  useEffect(() => { cellSizeRef.current = cellSize }, [cellSize])
  useEffect(() => {
    rngRef.current = makePrng(seed)
    twinklesRef.current = []  // clear so the new seed re-rolls cleanly
  }, [seed])
  useEffect(() => {
    settingsRef.current = calm ? CALM : NORMAL
  }, [calm])

  // ── Hotkey Cmd+/ / Ctrl+/ — toggle controls (only when Sabu is open) ──
  useEffect(() => {
    if (!open || closing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/" || !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      setControlsOpen(c => !c)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, closing])

  // ── rAF loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open || closing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let cellsW = 0
    let cellsH = 0

    const resize = () => {
      const cs = cellSizeRef.current
      cellsW = Math.ceil(window.innerWidth / cs)
      cellsH = Math.ceil(window.innerHeight / cs)
      canvas.width = cellsW
      canvas.height = cellsH
    }
    resize()
    window.addEventListener("resize", resize)

    let rafId = 0
    let lastSpawn = performance.now()
    let spawnAccumulator = 0
    let lastCellSize = cellSizeRef.current

    const tick = (now: number) => {
      // Resize if the user changed cell size via the control panel
      if (cellSizeRef.current !== lastCellSize) {
        lastCellSize = cellSizeRef.current
        twinklesRef.current = []  // old cell coords no longer map cleanly
        resize()
      }

      const dt = (now - lastSpawn) / 1000
      lastSpawn = now
      const s = settingsRef.current
      const sp = speedRef.current
      const dn = densityRef.current
      const rng = rngRef.current
      // Density scales BOTH spawn rate (more cells lit per second) and
      // budget (more cells lit at once). The combination = brighter grid.
      spawnAccumulator += dt * s.spawnRate * sp * dn
      const toSpawn = Math.floor(spawnAccumulator)
      spawnAccumulator -= toSpawn
      const budget = Math.round(s.budget * dn)
      const tw = twinklesRef.current
      for (let i = 0; i < toSpawn && tw.length < budget; i++) {
        tw.push({
          x: Math.floor(rng() * cellsW),
          y: Math.floor(rng() * cellsH),
          startTime: now,
          duration: (s.durMin + rng() * (s.durMax - s.durMin)) / sp,
          peak:     s.opMin + rng() * (s.opMax - s.opMin),
        })
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = tw.length - 1; i >= 0; i--) {
        const t = tw[i]
        const phase = (now - t.startTime) / t.duration
        if (phase >= 1) {
          tw.splice(i, 1)
          continue
        }
        const wave = phase < 0.5 ? phase * 2 : (1 - phase) * 2
        const op = wave * t.peak
        ctx.fillStyle = `rgba(255, 255, 255, ${op.toFixed(3)})`
        ctx.fillRect(t.x, t.y, 1, 1)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
      twinklesRef.current = []
    }
  }, [open, closing])

  const blurClass = closing ? "alt-overlay-blur-exit" : "alt-overlay-blur-enter"

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none alt-overlay-pixel-grid ${blurClass}`}
        aria-hidden
      />

      {/* Noise dither overlay — kills mask gradient banding without runtime cost */}
      <div
        className={`absolute inset-0 alt-overlay-pixel-grid-dither ${blurClass}`}
        aria-hidden
      />

      {open && !closing && controlsOpen && (
        <div className="absolute top-4 right-4 z-[70] w-[260px] bg-popover/95 backdrop-blur-md border border-border rounded-md shadow-modal text-foreground">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 h-9 border-b border-border">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground">PIXEL GRID</p>
            <div className="flex items-center gap-1">
              <kbd className="font-sans text-[10px] px-1.5 py-0.5 rounded-sm border border-border bg-muted/60 text-muted-foreground leading-none">⌘ /</kbd>
              <button
                onClick={() => setControlsOpen(false)}
                className="w-5 h-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Close"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-3.5 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Speed</span>
                <span className="tabular-nums text-foreground">{speed.toFixed(2)}×</span>
              </div>
              <input
                type="range" min={0.1} max={12} step={0.1}
                value={speed} onChange={e => setSpeed(Number(e.target.value))}
                className="w-full h-1 accent-foreground"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Density</span>
                <span className="tabular-nums text-foreground">{density.toFixed(2)}×</span>
              </div>
              <input
                type="range" min={0.25} max={20} step={0.25}
                value={density} onChange={e => setDensity(Number(e.target.value))}
                className="w-full h-1 accent-foreground"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cell size</span>
                <span className="tabular-nums text-foreground">{cellSize}px</span>
              </div>
              <input
                type="range" min={8} max={64} step={1}
                value={cellSize} onChange={e => setCellSize(Number(e.target.value))}
                className="w-full h-1 accent-foreground"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Seed</span>
                <span className="tabular-nums text-muted-foreground">{seed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={seed}
                  onChange={e => setSeed(Number(e.target.value) | 0)}
                  className="flex-1 min-w-0 text-xs bg-background border border-border rounded-sm px-2 py-1 outline-none focus:border-foreground/40 tabular-nums"
                />
                <button
                  onClick={() => setSeed((Math.random() * 0xFFFFFFFF) >>> 0)}
                  className="shrink-0 text-xs rounded-sm border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  title="Re-roll seed"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
