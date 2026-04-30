import { useState, useEffect, useRef, useMemo } from "react"

export interface AutocompleteSuggestion {
  id: string
  full: string
  description: string
}

const AUTOCOMPLETE_ACTIONS: AutocompleteSuggestion[] = [
  { id: "create_role", full: "create a role", description: "Create a new hiring role" },
  { id: "shortlist", full: "shortlist", description: "Push a candidate to ATS" },
  { id: "reject", full: "reject", description: "Reject a candidate" },
  { id: "pass_on", full: "pass on", description: "Pass on a candidate" },
  { id: "set_threshold", full: "set threshold", description: "Adjust auto-decision threshold" },
  { id: "draft_rejection", full: "draft rejection", description: "Draft a rejection email" },
  { id: "draft_followup", full: "draft follow-up", description: "Draft a follow-up email" },
  { id: "remember", full: "remember", description: "Teach your Alt something new" },
  { id: "show", full: "show", description: "Query candidates, roles, or stats" },
  { id: "compare", full: "compare", description: "Compare two candidates" },
  { id: "pause_role", full: "pause role", description: "Pause a live role" },
  { id: "export", full: "export", description: "Download data or reports" },
]

export function matchAutocomplete(input: string): AutocompleteSuggestion[] {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed || trimmed.startsWith("/")) return []

  return AUTOCOMPLETE_ACTIONS.filter(a => {
    // Only match if the user has typed a prefix of the action (not the full thing)
    const full = a.full.toLowerCase()
    return full.startsWith(trimmed) && full !== trimmed && trimmed.length >= 2
  })
}

interface ActionAutocompleteProps {
  input: string
  onAccept: (suggestion: AutocompleteSuggestion) => void
  onDismiss: () => void
  visible: boolean
}

export function ActionAutocomplete({ input, onAccept, onDismiss, visible }: ActionAutocompleteProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeRef = useRef<HTMLButtonElement>(null)

  const suggestions = useMemo(() => matchAutocomplete(input), [input])

  useEffect(() => setActiveIndex(0), [suggestions])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  useEffect(() => {
    if (!visible || suggestions.length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex(i => i >= suggestions.length - 1 ? 0 : i + 1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex(i => i <= 0 ? suggestions.length - 1 : i - 1)
      } else if (e.key === "Tab" && suggestions[activeIndex]) {
        e.preventDefault()
        onAccept(suggestions[activeIndex])
      } else if (e.key === "Escape") {
        e.preventDefault()
        onDismiss()
      }
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [visible, suggestions, activeIndex, onAccept, onDismiss])

  if (!visible || suggestions.length === 0) return null

  const typed = input.trim()

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
      <div className="max-h-48 overflow-y-auto">
        {suggestions.map((s, i) => {
          // Split the suggestion into typed (dimmed) and remaining (highlighted) parts
          const matchLen = typed.length
          const typedPart = s.full.slice(0, matchLen)
          const remainingPart = s.full.slice(matchLen)

          return (
            <button
              key={s.id}
              ref={i === activeIndex ? activeRef : undefined}
              onClick={() => onAccept(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                i === activeIndex ? "bg-muted/60" : "hover:bg-muted/30"
              } ${i > 0 ? "border-t border-border/50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="text-muted-foreground">{typedPart}</span>
                  <span className="font-semibold text-foreground">{remainingPart}</span>
                </p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              {i === activeIndex && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 border border-border rounded">tab</span>
                  <span className="text-[11px] text-muted-foreground/50">·</span>
                  <span className="text-[11px] text-muted-foreground/60 px-1.5 py-0.5 border border-border/50 rounded">tab tab</span>
                  <span className="text-[11px] text-muted-foreground/50">fill details</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
