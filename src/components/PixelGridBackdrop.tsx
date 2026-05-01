import { useEffect, useRef } from "react"

/**
 * Canvas-driven pixel grid for the Sabu overlay backdrop.
 *
 * Each cell is 6 px on screen but 1 internal canvas pixel — image-rendering:
 * pixelated upscales without smoothing. So a ~320×200 canvas covers a 1920px
 * viewport, which makes clearRect + fillRect trivial each frame.
 *
 * Twinkles are spawned at a fixed rate, each with a random cell, lifetime, and
 * peak opacity. They fade up then down via a triangle wave and self-prune.
 * Per-cell true randomness with bounded compositor + JS cost (≤ ~60 active
 * twinkles, ~30 fillRects per frame, single tiny clearRect).
 */

const CELL_SIZE = 32  // CSS pixels per cell

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

// Bigger cells (32px) are much more visible per twinkle, so spawn fewer of
// them at slightly lower peaks. Total visual density still feels ambient.
const NORMAL: Settings  = { spawnRate: 9,   durMin: 1600, durMax: 3800, opMin: 0.04, opMax: 0.10, budget: 32 }
const CALM:   Settings  = { spawnRate: 1.2, durMin: 5000, durMax: 11000, opMin: 0.02, opMax: 0.04, budget: 12 }

interface Props {
  open: boolean
  closing: boolean
  calm: boolean
}

export function PixelGridBackdrop({ open, closing, calm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const twinklesRef = useRef<Twinkle[]>([])
  const settingsRef = useRef<Settings>(NORMAL)

  // Update settings without tearing down the rAF loop
  useEffect(() => {
    settingsRef.current = calm ? CALM : NORMAL
  }, [calm])

  // Lifecycle: start/stop the loop on open/close
  useEffect(() => {
    if (!open || closing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let cellsW = 0
    let cellsH = 0

    const resize = () => {
      cellsW = Math.ceil(window.innerWidth / CELL_SIZE)
      cellsH = Math.ceil(window.innerHeight / CELL_SIZE)
      // Internal canvas size = one pixel per cell. CSS scales it up.
      canvas.width = cellsW
      canvas.height = cellsH
    }
    resize()
    window.addEventListener("resize", resize)

    let rafId = 0
    let lastSpawn = performance.now()
    let spawnAccumulator = 0

    const tick = (now: number) => {
      // Spawn — fractional accumulator so low rates still spawn over time
      const dt = (now - lastSpawn) / 1000
      lastSpawn = now
      spawnAccumulator += dt * settingsRef.current.spawnRate
      const toSpawn = Math.floor(spawnAccumulator)
      spawnAccumulator -= toSpawn
      const tw = twinklesRef.current
      const s = settingsRef.current
      for (let i = 0; i < toSpawn && tw.length < s.budget; i++) {
        tw.push({
          x: Math.floor(Math.random() * cellsW),
          y: Math.floor(Math.random() * cellsH),
          startTime: now,
          duration: s.durMin + Math.random() * (s.durMax - s.durMin),
          peak:     s.opMin + Math.random() * (s.opMax - s.opMin),
        })
      }

      // Clear (full canvas; tiny in cell coords) + draw active twinkles
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = tw.length - 1; i >= 0; i--) {
        const t = tw[i]
        const phase = (now - t.startTime) / t.duration
        if (phase >= 1) {
          tw.splice(i, 1)
          continue
        }
        // Triangle wave: 0 → peak at 0.5 → 0
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
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none alt-overlay-pixel-grid ${blurClass}`}
      aria-hidden
    />
  )
}
