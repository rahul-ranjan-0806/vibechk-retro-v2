import { useState, useEffect, useRef, useCallback } from "react"
import { PixelSprite } from "@/components/PixelSprite"
import { PixelGridBackdrop } from "@/components/PixelGridBackdrop"
import { AltMessagePart } from "@/components/AltMessageParts"
import { StreamLoader } from "@/components/StreamLoader"
import { matchAltResponse, type AltMsgPart } from "@/lib/mockData"

// ── Types ────────────────────────────────────────────────────

type Page = "home" | "roles" | "candidates" | "alts" | "chat" | "org" | "settings"

export interface OverlayEntity {
  type: "role" | "candidate" | "alt"
  name: string
  meta?: Record<string, string>
}

export interface OverlayContext {
  page: Page
  entity?: OverlayEntity
}

type ChatMsg =
  | { from: "user"; text: string }
  | { from: "alt"; text: string; parts?: AltMsgPart[] }

// ── Slash command sources ────────────────────────────────────

interface SlashSource {
  key: string; label: string; icon: string; color: string; desc: string
  items: { id: string; label: string; detail: string }[]
}

const CONNECTOR_SOURCES: SlashSource[] = [
  { key: "slack", label: "Slack", icon: "#", color: "#4A154B", desc: "Search Slack conversations", items: [
    { id: "slack-hiring", label: "#prescreening-experience", detail: "142 messages this week" },
    { id: "slack-design", label: "#vibechk-design", detail: "38 messages this week" },
    { id: "slack-general", label: "#general", detail: "67 messages this week" },
    { id: "slack-dm-kinnari", label: "DM with Kinnari", detail: "12 messages today" },
  ]},
  { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", desc: "Search LinkedIn activity", items: [
    { id: "li-posts", label: "Recent posts", detail: "Last 10 posts by Sashank" },
    { id: "li-profile", label: "Profile summary", detail: "Bio, headline, experience" },
  ]},
  { key: "gdocs", label: "Google Docs", icon: "G", color: "#4285F4", desc: "Search connected documents", items: [
    { id: "gdocs-handbook", label: "Alt Inc Handbook", detail: "Company culture & processes" },
    { id: "gdocs-rubric", label: "Interview Rubric v3", detail: "Eval criteria & scoring guide" },
  ]},
  { key: "notion", label: "Notion", icon: "N", color: "#000000", desc: "Search Notion workspace", items: [
    { id: "notion-wiki", label: "Company Wiki", detail: "Internal knowledge base" },
    { id: "notion-hiring", label: "Hiring Playbook", detail: "Process & best practices" },
  ]},
]

interface SlashCommand {
  key: string; label: string; desc: string; icon: string
}

function getSlashCommands(ctx: OverlayContext): SlashCommand[] {
  const base: SlashCommand[] = [
    { key: "sources", label: "Sources", desc: "Fetch context from connected tools", icon: "🔗" },
    { key: "export", label: "Export", desc: "Export decisions or reports", icon: "📤" },
  ]
  switch (ctx.page) {
    case "home":
      return [
        { key: "triage", label: "Triage", desc: "Review the candidate queue", icon: "📋" },
        ...base,
      ]
    case "roles":
      return [
        { key: "threshold", label: "Threshold", desc: "Adjust shortlisting threshold", icon: "⚙" },
        { key: "criteria", label: "Criteria", desc: "Review eval criteria", icon: "📊" },
        ...base,
      ]
    case "candidates":
      return [
        { key: "compare", label: "Compare", desc: "Compare candidates side by side", icon: "⚖" },
        { key: "draft", label: "Draft", desc: "Draft a message to a candidate", icon: "✉" },
        ...base,
      ]
    case "alts":
      return [
        { key: "memory", label: "Memory", desc: "Add or search memories", icon: "🧠" },
        { key: "calibrate", label: "Calibrate", desc: "Check Alt calibration", icon: "🎯" },
        ...base,
      ]
    default:
      return base
  }
}

// ── Prompt suggestions per page + entity ─────────────────────

function getPromptSuggestions(ctx: OverlayContext): string[] {
  const { page, entity } = ctx
  const name = entity?.name ?? ""

  switch (page) {
    case "home":
      return [
        "What should I prioritize today?",
        "Am I being too strict on systems thinking?",
        "Export this week's decisions",
      ]
    case "roles":
      if (entity?.type === "role") return [
        `How is ${name} performing?`,
        `Should I adjust the threshold for ${name}?`,
        `Pause ${name} intake`,
      ]
      return ["Which role needs attention?", "Compare pass rates across roles"]
    case "candidates":
      if (entity?.type === "candidate") return [
        `Why did you flag ${name}?`,
        `Should I shortlist ${name}?`,
        `Compare ${name} to past shortlists`,
        `Draft a rejection for ${name}`,
      ]
      return ["Who needs my call today?", "Show me edge cases", "Which role has the weakest pipeline?"]
    case "alts":
      if (entity?.type === "alt") return [
        `How would ${name} handle a conflict question?`,
        `What memories drive ${name}'s strictest scores?`,
        `Is ${name} calibrated on B2B?`,
      ]
      return ["Which Alt needs more training?", "Compare my Alts"]
    case "org":
      return ["Summarize our hiring velocity", "Which roles are stalling?"]
    case "settings":
      return ["What happens if I turn on auto-rejection?", "How does the threshold affect my queue?"]
    default:
      return ["What should I prioritize today?"]
  }
}

// ── Component ────────────────────────────────────────────────

interface AltChatOverlayProps {
  open: boolean
  onClose: () => void
  context: OverlayContext
  nudgeMessage?: string | null
  prefillInput?: string | null
}

export function AltChatOverlay({ open, onClose, context, nudgeMessage, prefillInput }: AltChatOverlayProps) {
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [closing, setClosing] = useState(false)
  const [connectorPills, setConnectorPills] = useState<{ id: string; label: string; sourceLabel: string; color: string; parsing: boolean }[]>([])
  const [highlightedPill, setHighlightedPill] = useState<number | null>(null)

  // Slash state
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState("")
  const [slashSource, setSlashSource] = useState<string | null>(null)
  const [slashIndex, setSlashIndex] = useState(0)
  const [sendKey, setSendKey] = useState(0)  // increments each send → remounts shimmer
  const [isWaiting, setIsWaiting] = useState(false)
  // Track Sabu's response timeout so the user can interrupt with the stop button.
  const replyTimeoutRef = useRef<number | null>(null)
  const stopWaiting = () => {
    if (replyTimeoutRef.current !== null) {
      clearTimeout(replyTimeoutRef.current)
      replyTimeoutRef.current = null
    }
    setIsWaiting(false)
  }

  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs])

  // Focus input on open
  useEffect(() => {
    if (open && !closing) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [open, closing])

  // Seed nudge message on open
  useEffect(() => {
    if (open && nudgeMessage && msgs.length === 0) {
      setMsgs([{ from: "alt", text: nudgeMessage }])
    }
  }, [open, nudgeMessage])

  // Seed prefill input on open
  useEffect(() => {
    if (open && prefillInput) {
      setInput(prefillInput)
    }
  }, [open, prefillInput])

  // Escape to close (only when slash isn't open)
  useEffect(() => {
    if (!open || closing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (slashOpen) { setSlashOpen(false); setSlashSource(null); setSlashFilter("") }
        else handleClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, closing, slashOpen])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setMsgs([])
      setInput("")
      setConnectorPills([])
      setHighlightedPill(null)
      setSlashOpen(false)
      setSlashSource(null)
      setSlashFilter("")
      setSendKey(0)
      onClose()
    }, 420)
  }, [onClose])

  // Slash command logic
  const slashCommands = getSlashCommands(context)
  const activeConnector = CONNECTOR_SOURCES.find(s => s.key === slashSource)

  const filteredSlashItems = (() => {
    if (slashSource) {
      // Showing connector sub-items
      return null // handled separately
    }
    // Top-level: commands + connector sources
    const f = slashFilter.toLowerCase()
    return slashCommands.filter(c => !f || c.label.toLowerCase().includes(f) || c.key.includes(f))
  })()

  const filteredConnectorSources = (() => {
    const f = slashFilter.toLowerCase()
    return CONNECTOR_SOURCES.filter(s => !f || s.label.toLowerCase().includes(f) || s.key.includes(f))
  })()

  const handleSlashSelectCommand = (cmd: SlashCommand) => {
    setInput(prev => prev.replace(/\/\S*$/, ""))
    setSlashOpen(false)
    setSlashFilter("")
    if (cmd.key === "sources") {
      // Drill into sources
      setSlashOpen(true)
      setSlashSource("__sources__")
      setSlashIndex(0)
      return
    }
    // For other commands, prefill the input
    const prefills: Record<string, string> = {
      triage: "Show me the triage queue",
      threshold: `What if I adjust the threshold for ${context.entity?.name ?? "this role"}?`,
      criteria: `Review eval criteria for ${context.entity?.name ?? "this role"}`,
      compare: `Compare ${context.entity?.name ?? "candidates"} to similar profiles`,
      draft: `Draft a rejection for ${context.entity?.name ?? "this candidate"}`,
      memory: "What memories are driving your decisions?",
      calibrate: `Is ${context.entity?.name ?? "this Alt"} calibrated correctly?`,
      export: "Export this week's decisions",
    }
    const prefill = prefills[cmd.key] ?? cmd.label
    setInput(prefill)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelectConnectorSource = (source: SlashSource) => {
    setSlashSource(source.key)
    setSlashFilter("")
    setSlashIndex(0)
  }

  const handleSelectConnectorItem = (source: SlashSource, item: { id: string; label: string }) => {
    setSlashOpen(false)
    setSlashSource(null)
    setSlashFilter("")
    setInput(prev => prev.replace(/\/\S*$/, ""))
    const pill = { id: item.id, label: item.label, sourceLabel: source.label, color: source.color, parsing: true }
    setConnectorPills(prev => [...prev, pill])
    setTimeout(() => {
      setConnectorPills(prev => prev.map(p => p.id === item.id ? { ...p, parsing: false } : p))
    }, 8000)
    inputRef.current?.focus()
  }

  const handleInputChange = (text: string) => {
    setInput(text)
    // Detect /command (only after space or at start)
    const slashMatch = text.match(/(?:^|\s)\/(\S*)$/)
    if (slashMatch) {
      setSlashOpen(true)
      setSlashFilter(slashMatch[1])
      setSlashIndex(0)
      if (!slashSource) setSlashSource(null)
    } else if (!slashSource) {
      setSlashOpen(false)
      setSlashFilter("")
    }
  }

  const send = (override?: string) => {
    const msg = (override ?? input).trim()
    if (!msg && !connectorPills.length) return
    const fullMsg = connectorPills.length
      ? `${msg}${msg ? " " : ""}[with context from: ${connectorPills.map(p => p.sourceLabel + "/" + p.label).join(", ")}]`
      : msg
    setSendKey(k => k + 1)  // remount shimmer for sweep animation
    setMsgs(p => [...p, { from: "user", text: msg || "Fetch context from attached sources" }])
    setInput("")
    setConnectorPills([])
    setHighlightedPill(null)
    setIsWaiting(true)
    replyTimeoutRef.current = window.setTimeout(() => {
      const reply = matchAltResponse(fullMsg)
      const isComplex = /create|configure|set up|build/i.test(fullMsg)
      const parts = [...(reply.parts || [])]
      if (isComplex) {
        parts.push({ kind: "cta", label: "Continue in full chat →", semantic: "info" })
      }
      setMsgs(p => [...p, { from: "alt", text: reply.text, parts: parts.length ? parts : undefined }])
      setIsWaiting(false)
      replyTimeoutRef.current = null
    }, 60000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Slash navigation
    if (slashOpen) {
      const items = slashSource === "__sources__"
        ? filteredConnectorSources
        : activeConnector
          ? activeConnector.items
          : [...(filteredSlashItems || []), ...filteredConnectorSources]
      const count = items.length

      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex(i => (i + 1) % count) }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex(i => (i - 1 + count) % count) }
      else if (e.key === "Enter") {
        e.preventDefault()
        if (activeConnector) {
          const item = activeConnector.items[slashIndex]
          if (item) handleSelectConnectorItem(activeConnector, item)
        } else if (slashSource === "__sources__") {
          const src = filteredConnectorSources[slashIndex]
          if (src) handleSelectConnectorSource(src)
        } else {
          const commandCount = filteredSlashItems?.length ?? 0
          if (slashIndex < commandCount) {
            const cmd = filteredSlashItems![slashIndex]
            if (cmd) handleSlashSelectCommand(cmd)
          } else {
            const src = filteredConnectorSources[slashIndex - commandCount]
            if (src) handleSelectConnectorSource(src)
          }
        }
      }
      else if (e.key === "Escape") { e.preventDefault(); setSlashOpen(false); setSlashSource(null); setSlashFilter("") }
      else if (e.key === "Backspace" && (activeConnector || slashSource === "__sources__") && slashFilter === "") {
        e.preventDefault(); setSlashSource(null); setSlashIndex(0)
      }
      return
    }

    // Backspace pill deletion
    if (e.key === "Backspace" && input === "" && connectorPills.length > 0) {
      e.preventDefault()
      if (highlightedPill !== null) {
        setConnectorPills(prev => prev.filter((_, j) => j !== highlightedPill))
        setHighlightedPill(connectorPills.length - 1 > 0 ? Math.min(highlightedPill, connectorPills.length - 2) : null)
      } else {
        setHighlightedPill(connectorPills.length - 1)
      }
      return
    }
    if (e.key !== "Backspace" && highlightedPill !== null) setHighlightedPill(null)

    if (e.key === "Enter") { e.preventDefault(); send() }
  }

  if (!open && !closing) return null

  const prompts = getPromptSuggestions(context)
  const animClass = closing ? "alt-overlay-exit" : "alt-overlay-enter"
  const blurClass = closing ? "alt-overlay-blur-exit" : "alt-overlay-blur-enter"

  // Build the slash dropdown items
  const showSourcesList = slashSource === "__sources__"
  const showConnectorItems = activeConnector != null

  return (
    <div className="fixed inset-0 z-[60]" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      {/* Backdrop — gradient mask on open; switches to full-viewport blur on send.
          On close, .blurred is dropped so the CSS transition ramps blur back to 0. */}
      <div
        className={`absolute inset-0 pointer-events-none alt-overlay-backdrop ${msgs.length > 0 && !closing ? "blurred" : ""} ${blurClass}`}
      />

      {/* Subtle blinking pixel grid — Canvas-driven per-cell twinkles, gradient-masked.
          Slows to "calm" once chat is in flow. */}
      <PixelGridBackdrop open={open} closing={closing} calm={msgs.length > 0 && !closing} />

      {/* White shimmer sweep — fires once per send (key remount restarts animation) */}
      {sendKey > 0 && !closing && <div key={sendKey} className="alt-overlay-shimmer" />}

      {/* Messages — anchored to TOP, fade in after the shimmer/blur transition;
          fade-down with a soft blur on close */}
      {msgs.length > 0 && (
        <div className={`absolute top-0 left-0 right-0 bottom-[180px] overflow-y-auto pt-16 pb-6 pointer-events-none ${closing ? "alt-overlay-msg-exit" : ""}`}>
          <div ref={bodyRef} className="max-w-2xl mx-auto px-4 flex flex-col gap-2.5 pointer-events-auto">
            {msgs.map((m, i) => {
              if (m.from === "user") {
                return (
                  <div key={i} className="alt-overlay-msg text-sm leading-relaxed rounded-lg px-3.5 py-2.5 max-w-[85%] bg-foreground text-background self-end">
                    {m.text}
                  </div>
                )
              }
              return (
                <div key={i} className="alt-overlay-msg flex flex-col gap-2 max-w-[85%] self-start w-full">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 mt-0.5"><PixelSprite size={18} /></div>
                    <div className="text-sm leading-relaxed rounded-lg px-3.5 py-2.5 bg-card border border-border shadow-sm">
                      {m.text}
                    </div>
                  </div>
                  {m.parts && m.parts.length > 0 && (
                    <div className="flex flex-col gap-2 ml-7">
                      {m.parts.map((part, pi) => (
                        <AltMessagePart key={pi} part={part} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Inline thinking indicator — bare, no surrounding bubble. */}
            {isWaiting && (
              <div className="alt-overlay-msg self-start">
                <StreamLoader />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input region — anchored to bottom (always) */}
      <div className={`absolute bottom-0 left-0 right-0 flex flex-col items-center pb-8 px-4 ${animClass}`}>
        <div className="w-full max-w-2xl flex flex-col gap-3">

          {/* Prompt suggestions — shown when empty */}
          {msgs.length === 0 && !nudgeMessage && (
            <div className="flex flex-wrap gap-1.5 justify-center px-1">
              {prompts.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-[11px] rounded-lg px-3 py-1.5 border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shadow-sm">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Slash command dropdown — above input */}
          {slashOpen && (
            <div className="w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto">
              {!showSourcesList && !showConnectorItems ? (
                <>
                  {/* Top-level: page commands + connector sources */}
                  {(filteredSlashItems?.length ?? 0) > 0 && (
                    <>
                      <div className="px-3 py-1.5 border-b border-border">
                        <p className="text-xs text-muted-foreground">Commands</p>
                      </div>
                      {filteredSlashItems!.map((cmd, idx) => (
                        <button key={cmd.key} onClick={() => handleSlashSelectCommand(cmd)}
                          onMouseEnter={() => setSlashIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${idx === slashIndex ? "bg-accent" : "hover:bg-muted/50"}`}>
                          <span className="text-sm shrink-0">{cmd.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">/{cmd.label.toLowerCase()}</p>
                            <p className="text-xs text-muted-foreground">{cmd.desc}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {filteredConnectorSources.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 border-b border-border">
                        <p className="text-xs text-muted-foreground">Sources</p>
                      </div>
                      {filteredConnectorSources.map((s, idx) => {
                        const adjustedIdx = (filteredSlashItems?.length ?? 0) + idx
                        return (
                          <button key={s.key} onClick={() => handleSelectConnectorSource(s)}
                            onMouseEnter={() => setSlashIndex(adjustedIdx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${adjustedIdx === slashIndex ? "bg-accent" : "hover:bg-muted/50"}`}>
                            <div className="w-6 h-6 flex items-center justify-center text-[11px] font-bold text-white rounded-md shrink-0" style={{ background: s.color }}>{s.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{s.label}</p>
                              <p className="text-xs text-muted-foreground">{s.desc}</p>
                            </div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                        )
                      })}
                    </>
                  )}
                </>
              ) : showSourcesList ? (
                <>
                  <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
                    <button onClick={() => { setSlashSource(null); setSlashIndex(0) }} className="text-muted-foreground hover:text-foreground">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <p className="text-xs font-medium">Connected sources</p>
                  </div>
                  {filteredConnectorSources.map((s, idx) => (
                    <button key={s.key} onClick={() => handleSelectConnectorSource(s)}
                      onMouseEnter={() => setSlashIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${idx === slashIndex ? "bg-accent" : "hover:bg-muted/50"}`}>
                      <div className="w-6 h-6 flex items-center justify-center text-[11px] font-bold text-white rounded-md shrink-0" style={{ background: s.color }}>{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
                    <button onClick={() => { setSlashSource("__sources__"); setSlashIndex(0) }} className="text-muted-foreground hover:text-foreground">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <div className="w-5 h-5 flex items-center justify-center text-[11px] font-bold text-white rounded-md" style={{ background: activeConnector!.color }}>{activeConnector!.icon}</div>
                    <p className="text-xs font-medium">{activeConnector!.label}</p>
                  </div>
                  {activeConnector!.items.map((item, idx) => (
                    <button key={item.id} onClick={() => handleSelectConnectorItem(activeConnector!, item)}
                      onMouseEnter={() => setSlashIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${idx === slashIndex ? "bg-accent" : "hover:bg-muted/50"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Input bar with inline connector pills */}
          <div
            className="flex flex-wrap items-center gap-1.5 border border-border rounded-lg bg-card shadow-lg px-4 py-3 min-h-[52px] cursor-text focus-within:border-foreground/40 transition-colors"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Connector pills */}
            {connectorPills.map((pill, i) => {
              const isHl = highlightedPill === i
              return (
                <span key={pill.id}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md text-white shrink-0 transition-all ${pill.parsing ? "link-shimmer" : ""} ${isHl ? "ring-2 ring-destructive ring-offset-1 ring-offset-background" : ""}`}
                  style={{ background: pill.color }}>
                  {pill.label}
                  <button onClick={e => { e.stopPropagation(); setConnectorPills(prev => prev.filter((_, j) => j !== i)); setHighlightedPill(null) }}
                    className="opacity-70 hover:opacity-100 text-[11px] leading-none">✕</button>
                </span>
              )
            })}

            <input
              ref={inputRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connectorPills.length ? "Ask with this context..." : "Ask Sabu anything... (/ for commands)"}
              className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />

            <button
              onClick={isWaiting ? stopWaiting : () => send()}
              disabled={!isWaiting && !input.trim() && !connectorPills.length}
              aria-label={isWaiting ? "Stop generating" : "Send"}
              title={isWaiting ? "Stop" : "Send"}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              {isWaiting ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              )}
            </button>
          </div>

          {/* Helper text */}
          <p className="text-center text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
            Press
            <kbd className="font-sans text-[11px] px-1.5 py-0.5 rounded-sm border border-border bg-muted/60 text-foreground/80 leading-none">Esc</kbd>
            to escape chat
          </p>
        </div>
      </div>
    </div>
  )
}
