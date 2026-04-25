import { useState, useEffect, useRef } from "react"

// ── Types ────────────────────────────────────────────────────

export interface PromptSegment {
  type: "text" | "input" | "dropdown" | "toggle"
  value: string
  options?: string[]
  placeholder?: string
  tooltip?: string
}

export interface PromptTemplateData {
  actionId: string
  segments: PromptSegment[]
  extraText?: string
}

// ── Template definitions ────────────────────────────────────

const TEMPLATES: Record<string, PromptSegment[]> = {
  "create a role": [
    { type: "text", value: "Create a " },
    { type: "input", value: "Senior Product Designer", placeholder: "role title", tooltip: "Role title" },
    { type: "text", value: " role in the " },
    { type: "dropdown", value: "Product", options: ["Product", "Engineering", "Marketing", "Design", "Operations"], tooltip: "Department" },
    { type: "text", value: " department, managed by " },
    { type: "dropdown", value: "Sashank G.", options: ["Sashank G.", "Kinnari G.", "Shreyas N.", "Neehar S.", "Abhishek M."], tooltip: "Hiring manager" },
    { type: "text", value: ", starting as " },
    { type: "dropdown", value: "Draft", options: ["Draft", "Live", "Paused"], tooltip: "Status" },
    { type: "text", value: ". Location: " },
    { type: "dropdown", value: "Remote", options: ["Remote", "Hybrid", "On-site — San Francisco", "On-site — New York", "On-site — Bangalore"], tooltip: "Location" },
    { type: "text", value: ", " },
    { type: "dropdown", value: "Full-time", options: ["Full-time", "Part-time", "Contract", "Intern"], tooltip: "Employment type" },
    { type: "text", value: ", " },
    { type: "dropdown", value: "Senior", options: ["Entry", "Mid", "Senior", "Lead", "Principal"], tooltip: "Experience level" },
    { type: "text", value: " level." },
  ],
  "shortlist": [
    { type: "text", value: "Shortlist " },
    { type: "input", value: "Priya Sharma", placeholder: "candidate name", tooltip: "Candidate" },
    { type: "text", value: " for " },
    { type: "input", value: "Senior Product Designer", placeholder: "role", tooltip: "Role" },
    { type: "text", value: ". Push to ATS: " },
    { type: "toggle", value: "yes", tooltip: "Push to ATS" },
    { type: "text", value: "." },
  ],
  "reject": [
    { type: "text", value: "Reject " },
    { type: "input", value: "", placeholder: "candidate name", tooltip: "Candidate" },
    { type: "text", value: " from " },
    { type: "input", value: "", placeholder: "role", tooltip: "Role" },
    { type: "text", value: ". Send rejection email: " },
    { type: "toggle", value: "yes", tooltip: "Send email" },
    { type: "text", value: "." },
  ],
  "pass on": [
    { type: "text", value: "Pass on " },
    { type: "input", value: "", placeholder: "candidate name", tooltip: "Candidate" },
    { type: "text", value: " from " },
    { type: "input", value: "", placeholder: "role", tooltip: "Role" },
    { type: "text", value: ". Reason: " },
    { type: "input", value: "", placeholder: "optional note", tooltip: "Reason" },
    { type: "text", value: "." },
  ],
  "set threshold": [
    { type: "text", value: "Set threshold to " },
    { type: "input", value: "8", placeholder: "score", tooltip: "Score threshold" },
    { type: "text", value: "/10 for " },
    { type: "dropdown", value: "all roles", options: ["all roles", "Sr. Product Designer", "Product Manager", "Sr. Software Engineer"], tooltip: "Apply to" },
    { type: "text", value: "." },
  ],
  "draft rejection": [
    { type: "text", value: "Draft a rejection email for " },
    { type: "input", value: "", placeholder: "candidate name", tooltip: "Candidate" },
    { type: "text", value: " from " },
    { type: "input", value: "", placeholder: "role", tooltip: "Role" },
    { type: "text", value: ". Tone: " },
    { type: "dropdown", value: "warm & specific", options: ["warm & specific", "brief & professional", "encouraging"], tooltip: "Email tone" },
    { type: "text", value: "." },
  ],
  "draft follow-up": [
    { type: "text", value: "Draft a follow-up email for " },
    { type: "input", value: "", placeholder: "candidate name", tooltip: "Candidate" },
    { type: "text", value: " about " },
    { type: "input", value: "", placeholder: "next steps", tooltip: "Subject" },
    { type: "text", value: ". Include timeline: " },
    { type: "toggle", value: "yes", tooltip: "Include timeline" },
    { type: "text", value: "." },
  ],
  "remember": [
    { type: "text", value: "Remember that " },
    { type: "input", value: "", placeholder: "what should your Alt know?", tooltip: "Memory content" },
    { type: "text", value: ". Category: " },
    { type: "dropdown", value: "Hiring", options: ["Hiring", "Values", "Communication", "Technical", "Culture"], tooltip: "Memory category" },
    { type: "text", value: "." },
  ],
  "show": [
    { type: "text", value: "Show me " },
    { type: "dropdown", value: "all candidates", options: ["all candidates", "shortlisted candidates", "pending review", "rejected candidates", "top scorers"], tooltip: "Filter" },
    { type: "text", value: " for " },
    { type: "dropdown", value: "all roles", options: ["all roles", "Sr. Product Designer", "Product Manager", "Sr. Software Engineer"], tooltip: "Role" },
    { type: "text", value: " from " },
    { type: "dropdown", value: "this week", options: ["today", "this week", "this month", "all time"], tooltip: "Time range" },
    { type: "text", value: "." },
  ],
  "compare": [
    { type: "text", value: "Compare " },
    { type: "input", value: "", placeholder: "first candidate", tooltip: "Candidate 1" },
    { type: "text", value: " and " },
    { type: "input", value: "", placeholder: "second candidate", tooltip: "Candidate 2" },
    { type: "text", value: " for " },
    { type: "input", value: "", placeholder: "role", tooltip: "Role" },
    { type: "text", value: "." },
  ],
  "pause role": [
    { type: "text", value: "Pause the " },
    { type: "dropdown", value: "Sr. Product Designer", options: ["Sr. Product Designer", "Product Manager", "Sr. Software Engineer"], tooltip: "Role to pause" },
    { type: "text", value: " role. Notify candidates: " },
    { type: "toggle", value: "no", tooltip: "Notify candidates" },
    { type: "text", value: "." },
  ],
  "export": [
    { type: "text", value: "Export " },
    { type: "dropdown", value: "candidate data", options: ["candidate data", "interview transcripts", "analytics report", "role summary"], tooltip: "Data type" },
    { type: "text", value: " for " },
    { type: "dropdown", value: "all roles", options: ["all roles", "Sr. Product Designer", "Product Manager", "Sr. Software Engineer"], tooltip: "Role" },
    { type: "text", value: " as " },
    { type: "dropdown", value: "CSV", options: ["CSV", "PDF", "JSON"], tooltip: "Format" },
    { type: "text", value: "." },
  ],
}

export const TEMPLATE_ACTIONS = Object.keys(TEMPLATES)

export function getTemplateForAction(action: string): PromptTemplateData | null {
  const key = action.toLowerCase().trim()
  const segments = TEMPLATES[key]
  if (!segments) return null
  return {
    actionId: key,
    segments: segments.map(s => ({ ...s })),
  }
}

export function serializeTemplate(template: PromptTemplateData): string {
  const base = template.segments.map(s => {
    if (s.type === "toggle") return s.value === "yes" ? "yes" : "no"
    return s.value
  }).join("")
  const extra = template.extraText?.trim()
  return extra ? `${base} ${extra}` : base
}

// ── Gradient backgrounds per element type ───────────────────
// Animation is paused by default, played on hover via CSS class

const INPUT_GRADIENT = "linear-gradient(90deg, #3b5eff, #00c8ff, #8b5cf6, #3b5eff)"
const DROPDOWN_GRADIENT = "linear-gradient(90deg, #a855f7, #ec4899, #c084fc, #a855f7)"
const TOGGLE_YES_GRADIENT = "linear-gradient(90deg, #22c55e, #10b981, #34d399, #22c55e)"
const TOGGLE_NO_GRADIENT = "linear-gradient(90deg, #6b7280, #9ca3af, #6b7280, #9ca3af)"

// ── Tooltip wrapper ─────────────────────────────────────────

function Tip({ text, children }: { text?: string; children: React.ReactNode }) {
  if (!text) return <>{children}</>
  return (
    <span className="relative group/tip inline-flex">
      {children}
      <span className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[9px] font-pixel rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-[100] bottom-full mb-1.5">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-foreground" />
      </span>
    </span>
  )
}

// ── Component ───────────────────────────────────────────────

interface PromptTemplateProps {
  template: PromptTemplateData
  onChange: (template: PromptTemplateData) => void
  onSend: () => void
  onCancel: () => void
  onSwitchAction?: (action: string) => void
}

export function PromptTemplate({ template, onChange, onSend, onCancel, onSwitchAction }: PromptTemplateProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [showActionDropdown, setShowActionDropdown] = useState(false)
  const [extraText, setExtraText] = useState(template.extraText || "")
  const [highlighted, setHighlighted] = useState<number | null>(null)

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [])

  const updateSegment = (index: number, value: string) => {
    setHighlighted(null)
    const updated = {
      ...template,
      segments: template.segments.map((s, i) => i === index ? { ...s, value } : s),
    }
    onChange(updated)
  }

  // Find the last interactive segment index
  const lastInteractiveIdx = (() => {
    for (let j = template.segments.length - 1; j >= 0; j--) {
      if (template.segments[j].type !== "text") return j
    }
    return -1
  })()

  // Find the previous interactive segment before a given index
  const prevInteractiveIdx = (fromIdx: number) => {
    for (let j = fromIdx - 1; j >= 0; j--) {
      if (template.segments[j].type !== "text") return j
    }
    return -1
  }

  // Remove a segment and its preceding text connector
  const removeSegment = (index: number) => {
    const segs = [...template.segments]
    // Remove the interactive segment
    segs.splice(index, 1)
    // If the previous segment is text (connector), remove it too
    if (index > 0 && segs[index - 1]?.type === "text" && index - 1 > 0) {
      segs.splice(index - 1, 1)
    }
    setHighlighted(null)
    onChange({ ...template, segments: segs })
  }

  // Delete the last character from the last text segment, or
  // remove it entirely if it's the last char, then highlight
  // the interactive element before it.
  const deleteTrailingTextChar = (): boolean => {
    const segs = template.segments
    const lastIdx = segs.length - 1
    if (lastIdx < 0) return false
    const last = segs[lastIdx]

    if (last.type === "text") {
      if (last.value.length > 1) {
        // Chip away one character
        const updated = { ...template, segments: segs.map((s, j) => j === lastIdx ? { ...s, value: s.value.slice(0, -1) } : s) }
        onChange(updated)
      } else {
        // Last char — remove the text segment entirely
        const next = [...segs]
        next.splice(lastIdx, 1)
        onChange({ ...template, segments: next })
        // Highlight the new last segment if it's interactive
        const newLast = next[next.length - 1]
        if (newLast && newLast.type !== "text") {
          setHighlighted(next.length - 1)
        }
      }
      return true
    }
    return false
  }

  // Delete the last char of the text segment immediately before segIndex
  const deletePrecedingTextChar = (segIndex: number): boolean => {
    const prevIdx = segIndex - 1
    if (prevIdx < 0) return false
    const prev = template.segments[prevIdx]
    if (prev.type !== "text") return false

    if (prev.value.length > 1) {
      const updated = { ...template, segments: template.segments.map((s, j) => j === prevIdx ? { ...s, value: s.value.slice(0, -1) } : s) }
      onChange(updated)
    } else {
      // Remove the empty text segment
      const next = [...template.segments]
      next.splice(prevIdx, 1)
      onChange({ ...template, segments: next })
      // The input shifted — highlight it at new index
      setHighlighted(segIndex - 1)
    }
    return true
  }

  // Handle backspace on an input when it's empty
  const handleInputBackspace = (e: React.KeyboardEvent, segIndex: number) => {
    if (e.key === "Backspace") {
      const seg = template.segments[segIndex]
      if (seg.type === "input" && seg.value === "") {
        e.preventDefault()
        if (highlighted === segIndex) {
          removeSegment(segIndex)
        } else {
          // Try deleting preceding text chars first
          if (!deletePrecedingTextChar(segIndex)) {
            setHighlighted(segIndex)
          }
        }
      }
    }
  }

  // Handle backspace on the trailing input
  const handleTrailingBackspace = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && extraText === "") {
      e.preventDefault()
      if (highlighted !== null) {
        removeSegment(highlighted)
      } else {
        // Try deleting trailing text chars first
        if (!deleteTrailingTextChar()) {
          // No text left — highlight last interactive element
          if (lastInteractiveIdx >= 0) {
            setHighlighted(lastInteractiveIdx)
          }
        }
      }
    } else if (e.key !== "Backspace") {
      setHighlighted(null)
    }
  }

  // Handle backspace on a highlighted dropdown/toggle
  useEffect(() => {
    if (highlighted === null) return
    const seg = template.segments[highlighted]
    if (!seg || seg.type === "input") return // inputs handle their own backspace

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        e.preventDefault()
        removeSegment(highlighted)
      } else if (e.key !== "Shift" && e.key !== "Meta" && e.key !== "Alt" && e.key !== "Control") {
        setHighlighted(null)
      }
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [highlighted, template.segments])

  const highlightRing = "ring-2 ring-red-400 ring-offset-1 ring-offset-background"

  let firstInputAssigned = false

  // Find the action verb in the first text segment to render as switchable
  const firstTextSeg = template.segments[0]
  const actionVerb = firstTextSeg?.type === "text" ? firstTextSeg.value.trim() : ""

  return (
    <div className="flex flex-wrap items-center gap-y-1.5 text-sm leading-loose py-1">
      {template.segments.map((seg, i) => {
        const isHighlighted = highlighted === i

        if (seg.type === "text") {
          if (i === 0 && onSwitchAction && actionVerb) {
            return (
              <span key={i} className="relative">
                <button
                  onClick={() => setShowActionDropdown(p => !p)}
                  className="text-foreground hover:text-foreground/70 transition-colors"
                >
                  {seg.value}
                </button>
                {showActionDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[200px]">
                      {TEMPLATE_ACTIONS.map(action => (
                        <button
                          key={action}
                          onClick={() => { onSwitchAction(action); setShowActionDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors capitalize ${
                            action === template.actionId ? "bg-muted/40 font-medium" : ""
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </span>
            )
          }
          return <span key={i} className="text-foreground">{seg.value}</span>
        }

        if (seg.type === "input") {
          const needsRef = !firstInputAssigned && !seg.value
          if (needsRef) firstInputAssigned = true
          return (
            <Tip key={i} text={seg.tooltip}>
              <input
                ref={needsRef ? firstInputRef : undefined}
                value={seg.value}
                onChange={e => updateSegment(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); onSend() }
                  if (e.key === "Escape") onCancel()
                  handleInputBackspace(e, i)
                }}
                onFocus={() => { if (highlighted !== i) setHighlighted(null) }}
                placeholder={seg.placeholder}
                size={Math.max(seg.value.length, seg.placeholder?.length || 4) + 1}
                className={`tpl-element inline-block rounded-md text-white font-medium outline-none px-2 py-0.5 mx-0.5 placeholder:text-white/50 placeholder:font-normal transition-all focus:ring-2 focus:ring-white/30 ${isHighlighted ? highlightRing : ""}`}
                style={{ backgroundImage: INPUT_GRADIENT, backgroundSize: "200% 100%", color: "#fff" }}
              />
            </Tip>
          )
        }

        if (seg.type === "dropdown") {
          return (
            <Tip key={i} text={seg.tooltip}>
              <select
                value={seg.value}
                onChange={e => updateSegment(i, e.target.value)}
                onFocus={() => setHighlighted(null)}
                className={`tpl-element inline-block rounded-md text-white font-medium outline-none pl-2 pr-5 py-0.5 mx-0.5 cursor-pointer transition-all focus:ring-2 focus:ring-white/30 ${isHighlighted ? highlightRing : ""}`}
                style={{
                  backgroundImage: `${DROPDOWN_GRADIENT}, url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundSize: "200% 100%, 8px 5px",
                  backgroundPosition: "0% 50%, calc(100% - 4px) center",
                  backgroundRepeat: "no-repeat",
                  color: "#fff",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  width: `${seg.value.length + 4}ch`,
                }}
              >
                {seg.options?.map(o => <option key={o} value={o} className="text-foreground bg-background">{o}</option>)}
              </select>
            </Tip>
          )
        }

        if (seg.type === "toggle") {
          const isYes = seg.value === "yes"
          return (
            <Tip key={i} text={seg.tooltip}>
              <button
                type="button"
                onClick={() => updateSegment(i, isYes ? "no" : "yes")}
                className={`tpl-element inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-xs font-pixel font-medium text-white transition-all ${isHighlighted ? highlightRing : ""}`}
                style={{ backgroundImage: isYes ? TOGGLE_YES_GRADIENT : TOGGLE_NO_GRADIENT, backgroundSize: "200% 100%", color: "#fff" }}
              >
                <div className={`w-2.5 h-2.5 rounded-full border-[1.5px] transition-colors ${isYes ? "bg-white border-white" : "bg-transparent border-white/50"}`} />
                {isYes ? "yes" : "no"}
              </button>
            </Tip>
          )
        }

        return null
      })}

      {/* Trailing input for additional context */}
      <input
        value={extraText}
        onChange={e => { setExtraText(e.target.value); onChange({ ...template, extraText: e.target.value }) }}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); onSend() }
          if (e.key === "Escape") onCancel()
          handleTrailingBackspace(e)
        }}
        placeholder="Add more details..."
        className="flex-1 min-w-[140px] text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 ml-0.5"
      />

      <span className="text-[9px] font-pixel text-muted-foreground/40 self-center whitespace-nowrap ml-1">enter to send</span>
    </div>
  )
}
