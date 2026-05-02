import { useState, useMemo, useEffect, useRef } from "react"

export interface SlashCommand {
  id: string
  command: string
  label: string
  description: string
  icon: string
  category: "manage" | "communicate" | "analyze"
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Manage
  { id: "roles", command: "/roles", label: "Roles", description: "Create, edit, or manage roles", icon: "◆", category: "manage" },
  { id: "candidates", command: "/candidates", label: "Candidates", description: "Search and filter candidates across roles", icon: "◎", category: "manage" },
  { id: "threshold", command: "/threshold", label: "Threshold", description: "Adjust leniency and auto-decision thresholds", icon: "▦", category: "manage" },
  { id: "memory", command: "/memory", label: "Memory", description: "Teach your Alt something new", icon: "✦", category: "manage" },

  // Communicate
  { id: "slack", command: "/slack", label: "Slack", description: "Send a notification or message via Slack", icon: "#", category: "communicate" },
  { id: "draft", command: "/draft", label: "Draft", description: "Draft a rejection, follow-up, or outreach email", icon: "✉", category: "communicate" },

  // Analyze
  { id: "analytics", command: "/analytics", label: "Analytics", description: "Show hiring metrics, pass rates, and trends", icon: "▶", category: "analyze" },
  { id: "compare", command: "/compare", label: "Compare", description: "Compare two candidates side-by-side", icon: "⇌", category: "analyze" },
  { id: "export", command: "/export", label: "Export", description: "Download decisions, transcripts, or reports", icon: "↓", category: "analyze" },
]

const CATEGORY_LABELS: Record<string, string> = {
  manage: "Manage",
  communicate: "Communicate",
  analyze: "Analyze",
}

interface SlashCommandPaletteProps {
  query: string // the text after "/"
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  visible: boolean
}

export function SlashCommandPalette({ query, onSelect, onClose, visible }: SlashCommandPaletteProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return SLASH_COMMANDS
    const q = query.toLowerCase()
    return SLASH_COMMANDS.filter(c =>
      c.command.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  }, [query])

  // Reset active index when filter changes
  useEffect(() => setActiveIndex(0), [filtered])

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
        onSelect(filtered[activeIndex])
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [visible, filtered, activeIndex, onSelect, onClose])

  if (!visible || filtered.length === 0) return null

  // Group by category
  const grouped = filtered.reduce<Record<string, SlashCommand[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  let globalIdx = -1

  return (
    <div ref={listRef}
      className="absolute bottom-full left-0 right-0 mb-2 border border-border rounded-md shadow-lg overflow-hidden z-50 max-h-72 overflow-y-auto bg-gradient-to-b from-background via-background to-muted dark:from-popover dark:via-popover dark:to-muted"
    >
      <div className="p-1">
      {Object.entries(grouped).map(([cat, commands]) => (
        <div key={cat}>
          <div className="px-2 pt-1.5 pb-1">
            <span className="text-[11px] text-muted-foreground tracking-wider">
              {CATEGORY_LABELS[cat] || cat}
            </span>
          </div>
          {commands.map(cmd => {
            globalIdx++
            const isActive = globalIdx === activeIndex
            const idx = globalIdx
            return (
              <button
                key={cmd.id}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors ${
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/40"
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                  {cmd.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{cmd.command}</span>
                    <span className="text-xs text-muted-foreground">{cmd.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      ))}
      </div>
    </div>
  )
}
