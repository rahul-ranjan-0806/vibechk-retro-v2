import { useState, useEffect, useRef, useMemo } from "react"

// ── Dropdown item types ──────────────────────────────────────

export interface DropdownItem {
  id: string
  label: string
  detail?: string
  icon?: string
}

export type ActionTrigger = "create_role" | "shortlist" | "reject" | "threshold" | "draft" | "memory"

// ── Context-aware items per action ───────────────────────────

const ROLE_ITEMS: DropdownItem[] = [
  { id: "spd", label: "Sr. Product Designer", detail: "Product", icon: "◆" },
  { id: "swe", label: "Sr. Software Engineer", detail: "Engineering", icon: "◆" },
  { id: "pm", label: "Product Manager", detail: "Product", icon: "◆" },
  { id: "pml", label: "Product Marketing Lead", detail: "Marketing", icon: "◆" },
  { id: "fe", label: "Founding Engineer", detail: "Engineering", icon: "◆" },
  { id: "custom", label: "Custom role...", detail: "Type your own", icon: "+" },
]

const CANDIDATE_ITEMS: DropdownItem[] = [
  { id: "c1", label: "Priya Sharma", detail: "9/10 · Sr. Product Designer", icon: "●" },
  { id: "c2", label: "Lena Fischer", detail: "9/10 · Sr. Product Designer", icon: "●" },
  { id: "c3", label: "Daniel Okafor", detail: "8/10 · Founding Engineer", icon: "●" },
  { id: "c4", label: "Arjun Mehta", detail: "8/10 · Sr. Product Designer", icon: "●" },
  { id: "c5", label: "Marcus Chen", detail: "6/10 · Sr. Product Designer", icon: "○" },
  { id: "c6", label: "Tom Walsh", detail: "5/10 · Sr. Product Designer", icon: "○" },
  { id: "c7", label: "Jamie Park", detail: "4/10 · Product Marketing Lead", icon: "○" },
]

const THRESHOLD_ITEMS: DropdownItem[] = [
  { id: "t5", label: "5/10", detail: "Very lenient — most candidates pass", icon: "▦" },
  { id: "t6", label: "6/10", detail: "Lenient — some filtering", icon: "▦" },
  { id: "t7", label: "7/10", detail: "Balanced — current default", icon: "▦" },
  { id: "t8", label: "8/10", detail: "Strict — strong candidates only", icon: "▦" },
  { id: "t9", label: "9/10", detail: "Very strict — exceptional only", icon: "▦" },
]

const DRAFT_ITEMS: DropdownItem[] = [
  { id: "d1", label: "Rejection email", detail: "Personalized candidate rejection", icon: "✉" },
  { id: "d2", label: "Follow-up email", detail: "Check in with shortlisted candidate", icon: "✉" },
  { id: "d3", label: "Outreach message", detail: "Reach out to a passive candidate", icon: "✉" },
]

const MEMORY_ITEMS: DropdownItem[] = [
  { id: "m1", label: "Hiring philosophy", detail: "How you evaluate candidates", icon: "✦" },
  { id: "m2", label: "Values & principles", detail: "What matters to you", icon: "✦" },
  { id: "m3", label: "Communication style", detail: "How you communicate", icon: "✦" },
  { id: "m4", label: "Company context", detail: "Facts about your company", icon: "✦" },
]

export function getItemsForAction(trigger: ActionTrigger): DropdownItem[] {
  switch (trigger) {
    case "create_role": return ROLE_ITEMS
    case "shortlist": return CANDIDATE_ITEMS
    case "reject": return CANDIDATE_ITEMS
    case "threshold": return THRESHOLD_ITEMS
    case "draft": return DRAFT_ITEMS
    case "memory": return MEMORY_ITEMS
  }
}

// ── Action detection ─────────────────────────────────────────

const ACTION_TRIGGERS: { pattern: RegExp; trigger: ActionTrigger; insertPrefix: string }[] = [
  { pattern: /(?:create a role|create role|new role)\s$/i, trigger: "create_role", insertPrefix: "" },
  { pattern: /(?:shortlist|push)\s$/i, trigger: "shortlist", insertPrefix: "" },
  { pattern: /(?:reject|pass on)\s$/i, trigger: "reject", insertPrefix: "" },
  { pattern: /(?:set threshold|threshold|leniency)\s(?:to\s)?$/i, trigger: "threshold", insertPrefix: "" },
  { pattern: /(?:draft|write)\s$/i, trigger: "draft", insertPrefix: "" },
  { pattern: /(?:remember|memory|teach)\s$/i, trigger: "memory", insertPrefix: "" },
]

export function detectAction(text: string): { trigger: ActionTrigger; matchEnd: number } | null {
  for (const at of ACTION_TRIGGERS) {
    const match = text.match(at.pattern)
    if (match) {
      return { trigger: match[0].trim() as ActionTrigger === match[0].trim() as ActionTrigger ? at.trigger : at.trigger, matchEnd: text.length }
    }
  }
  return null
}

// ── Component ────────────────────────────────────────────────

interface ActionDropdownProps {
  items: DropdownItem[]
  onSelect: (item: DropdownItem) => void
  onClose: () => void
  visible: boolean
  filter?: string
}

export function ActionDropdown({ items, onSelect, onClose, visible, filter }: ActionDropdownProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  const filtered = useMemo(() => {
    if (!filter) return items
    const q = filter.toLowerCase()
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.detail?.toLowerCase().includes(q))
    )
  }, [items, filter])

  useEffect(() => setActiveIndex(0), [filtered])

  // Scroll active item into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex(i => i >= filtered.length - 1 ? 0 : i + 1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex(i => i <= 0 ? filtered.length - 1 : i - 1)
      } else if (e.key === "Enter" && filtered[activeIndex]) {
        e.preventDefault()
        e.stopPropagation()
        onSelect(filtered[activeIndex])
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "Tab") {
        e.preventDefault()
        if (filtered[activeIndex]) onSelect(filtered[activeIndex])
      }
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [visible, filtered, activeIndex, onSelect, onClose])

  if (!visible || filtered.length === 0) return null

  return (
    <div ref={listRef}
      className="absolute bottom-full left-0 right-0 mb-2 border border-border rounded-md shadow-lg overflow-hidden z-50 bg-gradient-to-b from-background via-background to-muted dark:from-popover dark:via-popover dark:to-muted"
    >
      <div className="max-h-56 overflow-y-auto p-1">
        {filtered.map((item, i) => (
          <button
            key={item.id}
            ref={i === activeIndex ? activeRef : undefined}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setActiveIndex(i)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors ${
              i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/40"
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground shrink-0">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.label}</p>
              {item.detail && (
                <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
              )}
            </div>
            {i === activeIndex && (
              <span className="text-[11px] text-muted-foreground shrink-0">↵</span>
            )}
          </button>
        ))}
      </div>
      <div className="px-2.5 py-1.5 border-t border-border bg-muted/20 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span>esc dismiss</span>
      </div>
    </div>
  )
}
