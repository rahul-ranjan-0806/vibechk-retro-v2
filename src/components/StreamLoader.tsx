import { useEffect, useState } from "react"

/**
 * 5×5 dot-matrix loader for AI response generation.
 *
 * Columns light up in a ping-pong wave (col 0 → 4 → 0, ~1.4s cycle).
 * All five rows in a given column share timing — visually this reads
 * as a vertical "layer" being activated, sweeping forward then back
 * (hence "backprop"-style).
 *
 * Steps cycle in sync with the response delay so the user sees the
 * agent moving through real phases of work, not idling.
 */

const STEPS = ["Parsing", "Pulling context", "Composing"] as const
// Spread across the 60s response window — Parsing (10s, fast), Pulling
// context (20s, the heavy lift), Composing (30s, longest tail).
const STEP_AT = [0, 10000, 30000]

export function StreamLoader() {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const timers = STEP_AT.slice(1).map((t, i) =>
      setTimeout(() => setStepIdx(i + 1), t),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="stream-loader-root flex items-center gap-[10px] text-white italic">
      <div className="stream-loader-grid">
        {Array.from({ length: 25 }).map((_, i) => {
          const col = i % 5
          return <span key={i} className={`stream-loader-cell stream-loader-col-${col}`} />
        })}
      </div>
      <span className="text-sm tabular-nums stream-loader-label">{STEPS[stepIdx]}</span>
    </div>
  )
}
