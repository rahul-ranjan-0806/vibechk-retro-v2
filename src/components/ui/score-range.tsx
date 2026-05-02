import { useEffect, useRef, useState } from "react"

interface DualRangeProps {
  min: number
  max: number
  lower: number
  upper: number
  onChange: (lower: number, upper: number) => void
  trackClassName?: string
}

function DualRange({ min, max, lower, upper, onChange, trackClassName = "w-24" }: DualRangeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<"lower" | "upper" | null>(null)
  // Stash latest bounds so the pointermove handler reads fresh values
  // without being torn down/rebuilt on every value change.
  const stateRef = useRef({ lower, upper })
  stateRef.current = { lower, upper }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current || !trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const val = Math.round(min + pct * (max - min))
      const { lower: lo, upper: up } = stateRef.current
      if (dragRef.current === "lower") onChange(Math.min(val, up), up)
      else onChange(lo, Math.max(val, lo))
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [min, max, onChange])

  const range = max - min || 1
  const lowerPct = ((lower - min) / range) * 100
  const upperPct = ((upper - min) / range) * 100

  return (
    <div
      ref={trackRef}
      className={`relative h-1 ${trackClassName} bg-foreground/15 rounded-full select-none`}
    >
      <div
        className="absolute h-full bg-foreground rounded-full"
        style={{ left: `${lowerPct}%`, right: `${100 - upperPct}%` }}
      />
      <button
        type="button"
        aria-label="Lower bound"
        onPointerDown={(e) => { e.preventDefault(); dragRef.current = "lower" }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border border-background shadow-sm cursor-grab active:cursor-grabbing"
        style={{ left: `${lowerPct}%` }}
      />
      <button
        type="button"
        aria-label="Upper bound"
        onPointerDown={(e) => { e.preventDefault(); dragRef.current = "upper" }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border border-background shadow-sm cursor-grab active:cursor-grabbing"
        style={{ left: `${upperPct}%` }}
      />
    </div>
  )
}

interface EditableNumberProps {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function EditableNumber({ value, min, max, onChange }: EditableNumberProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select() } }, [editing])
  useEffect(() => { setDraft(String(value)) }, [value])

  const commit = () => {
    const n = Number(draft)
    if (Number.isFinite(n)) {
      const clamped = Math.max(min, Math.min(max, Math.round(n)))
      onChange(clamped)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit() }
          if (e.key === "Escape") { setDraft(String(value)); setEditing(false) }
        }}
        className="w-7 h-5 text-xs text-center tabular-nums bg-background border border-foreground/60 rounded-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="tabular-nums text-xs w-5 h-5 text-center rounded-sm hover:bg-muted/60 transition-colors"
      aria-label="Edit value"
    >
      {value}
    </button>
  )
}

interface ScoreRangeFilterProps {
  /** Inclusive lower bound of the data domain. */
  min: number
  /** Inclusive upper bound of the data domain. */
  max: number
  lower: number
  upper: number
  onChange: (lower: number, upper: number) => void
  label?: string
  trackClassName?: string
}

/**
 * Score range filter — dual-handle slider + click-to-edit numeric stops.
 * The handles can't cross; the editable inputs are clamped to the
 * opposite bound so typing past it just snaps to the limit.
 */
export function ScoreRangeFilter({
  min,
  max,
  lower,
  upper,
  onChange,
  label = "Score",
  trackClassName,
}: ScoreRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <EditableNumber value={lower} min={min} max={upper} onChange={(v) => onChange(v, upper)} />
      <DualRange
        min={min}
        max={max}
        lower={lower}
        upper={upper}
        onChange={onChange}
        trackClassName={trackClassName}
      />
      <EditableNumber value={upper} min={lower} max={max} onChange={(v) => onChange(lower, v)} />
    </div>
  )
}
