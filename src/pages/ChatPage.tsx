import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { PixelSprite } from "@/components/PixelSprite"
import { StreamLoader } from "@/components/StreamLoader"
import { AnimatedSelect } from "@/components/ui/animated-select"
import { HighlightedText } from "@/components/chat/KeywordHighlighter"
import { SlashCommandPalette, type SlashCommand } from "@/components/chat/SlashCommandPalette"
import { ActionDropdown, detectAction, getItemsForAction, type ActionTrigger, type DropdownItem } from "@/components/chat/ActionDropdown"
import { ActionAutocomplete, matchAutocomplete, type AutocompleteSuggestion } from "@/components/chat/ActionAutocomplete"
import { PromptTemplate, getTemplateForAction, serializeTemplate, type PromptTemplateData } from "@/components/chat/PromptTemplate"
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { CANDIDATES as SEED_CANDIDATES, ROLES as SEED_ROLES, roleTitle } from "@/lib/mockData"

// ── Types ────────────────────────────────────────────────────

interface ToolCall {
  name: string
  status: "running" | "complete"
  result?: string
  editableData?: Record<string, string>
}

interface ActionCTA {
  label: string
  semantic: "primary" | "secondary" | "destructive"
  action: string
}

interface ChatMsg {
  id: string
  from: "user" | "assistant"
  text: string
  toolCalls?: ToolCall[]
  actions?: ActionCTA[]
  editableData?: Record<string, string>
}

// ── Mock responses ───────────────────────────────────────────

interface MockResponse {
  text: string
  toolCalls?: ToolCall[]
  actions?: ActionCTA[]
  editableData?: Record<string, string>
  autoOpenSidebar?: boolean
}

function getMockResponse(input: string): MockResponse {
  const q = input.toLowerCase()

  if (q.includes("create") && (q.includes("role") || q.includes("position"))) {
    const roleMatch = input.match(/(?:for|called)\s+['"]?([^'"]+?)['"]?\s*(?:live|draft|$)/i)
    const title = roleMatch?.[1]?.trim() || "Senior Product Designer"
    return {
      text: `Created role **"${title}"** in draft mode. I've generated the job description from your past roles and team context, set 4 eval criteria, and configured a ~22 min interview flow.`,
      toolCalls: [
        { name: "generate_job_description", status: "complete", result: "JD drafted from 3 sources: Slack hiring channel, LinkedIn posting template, existing Product Designer role" },
        { name: "generate_eval_criteria", status: "complete", result: "4 criteria generated from JD: Product thinking, Ambiguity balance, Cross-functional, B2B intuition",
          editableData: { "Criterion 1": "Product thinking depth", "Criterion 2": "Ambiguity & speed balance", "Criterion 3": "Cross-functional collaboration", "Criterion 4": "B2B SaaS product intuition" } },
        { name: "configure_interview_flow", status: "complete", result: "5-step flow configured: Intro (3m) → Experience (5m) → Deep dive (7m) → Scenario (5m) → Q&A (2m)",
          editableData: { "Step 1": "Intro & warm-up (3 min)", "Step 2": "Role & experience walkthrough (5 min)", "Step 3": "Deep dive — product thinking (7 min)", "Step 4": "Cross-functional scenario (5 min)", "Step 5": "Candidate Q&A (2 min)" } },
      ],
      actions: [
        { label: "Push live", semantic: "primary", action: "push_live" },
        { label: "Discard", semantic: "destructive", action: "discard" },
      ],
      autoOpenSidebar: true,
      editableData: {
        "Title": title,
        "Department": "Product",
        "Hiring manager": "Sashank G.",
        "Status": "Draft",
        "Location": "Remote",
        "Employment type": "Full-time",
        "Experience level": "Senior",
        "Job description": `We're looking for a ${title} to join our product team. You'll own the end-to-end design process — from early problem framing through shipped pixels.\n\nYou should be comfortable navigating ambiguity, making trade-offs between speed and polish, and working closely with engineering and product. B2B SaaS experience is a strong plus.\n\nWhat you'll do:\n• Lead design for core product workflows\n• Run discovery research and translate insights into design decisions\n• Partner with PMs and engineers to ship iteratively\n• Contribute to and evolve our design system`,
        "Interview duration": "~22 min",
        "Eval criteria": "4 (generated from JD)",
      },
    }
  }

  if (q.includes("shortlist") || q.includes("push")) {
    const nameMatch = input.match(/(?:shortlist|push)\s+(\w+(?:\s+\w+)?)/i)
    const name = nameMatch?.[1] || "the candidate"
    return {
      text: `Ready to push **${name}** to the ATS. They scored 9/10 with strong trade-off framing and B2B depth. This matches your past shortlist pattern.`,
      toolCalls: [
        { name: "lookup_candidate", status: "complete", result: `Found ${name} — Sr. Product Designer, interviewed 2h ago, score 9/10`,
          editableData: { "Candidate": name, "Role": "Sr. Product Designer", "Score": "9/10", "Interviewed": "2h ago" } },
        { name: "check_ats_connection", status: "complete", result: "Dover ATS connected, sync active" },
      ],
      actions: [
        { label: "Push to ATS", semantic: "primary", action: "push_ats" },
        { label: "Review first", semantic: "secondary", action: "review" },
        { label: "Cancel", semantic: "destructive", action: "cancel" },
      ],
    }
  }

  if (q.includes("reject") || q.includes("pass on")) {
    const nameMatch = input.match(/(?:reject|pass on)\s+(\w+(?:\s+\w+)?)/i)
    const name = nameMatch?.[1] || "the candidate"
    return {
      text: `Marking **${name}** as rejected. I'll draft a personalized rejection email referencing their interview — not a template.`,
      toolCalls: [
        { name: "draft_rejection", status: "complete", result: "Personalized draft ready — references their Stripe story and the ICP question",
          editableData: { "Subject": `Following up on your interview — ${name}`, "Tone": "Warm, specific, not templated", "Key reference": "Stripe Checkout story + ICP question" } },
      ],
      actions: [
        { label: "Reject & send email", semantic: "primary", action: "reject_send" },
        { label: "Reject silently", semantic: "secondary", action: "reject_silent" },
        { label: "Cancel", semantic: "destructive", action: "cancel" },
      ],
    }
  }

  if (q.includes("threshold") || q.includes("leniency")) {
    const numMatch = input.match(/(\d+)/g)
    const val = numMatch?.[0] || "7"
    return {
      text: `Updating the push-to-ATS threshold to **${val}/10**. With this threshold, ${parseInt(val) >= 8 ? "fewer" : "more"} candidates will be auto-shortlisted. Here's the impact:`,
      toolCalls: [
        { name: "simulate_threshold", status: "complete", result: `At ${val}/10: ~${parseInt(val) >= 8 ? "3" : "7"} of last 12 candidates would have been auto-pushed`,
          editableData: { "Threshold": `${val}/10`, "Auto-pushed": `~${parseInt(val) >= 8 ? "3" : "7"} of 12`, "Auto-rejected": `~${parseInt(val) >= 8 ? "5" : "2"} of 12`, "Your call": `~${parseInt(val) >= 8 ? "4" : "3"} of 12` } },
      ],
      actions: [
        { label: "Apply threshold", semantic: "primary", action: "apply" },
        { label: "Try different value", semantic: "secondary", action: "retry" },
      ],
    }
  }

  if (q.includes("/slack")) {
    return {
      text: "What should I send to Slack? I can notify a channel about a candidate, share a weekly digest, or alert the team about a role going live.",
      actions: [
        { label: "Notify about candidate", semantic: "secondary", action: "slack_candidate" },
        { label: "Share weekly digest", semantic: "secondary", action: "slack_digest" },
      ],
    }
  }

  if (q.includes("/analytics")) {
    return {
      text: "Here's your hiring snapshot for the last 7 days:\n\n- **14 interviews** completed across 3 roles\n- **11 shortlisted** (79% pass rate)\n- **2 pending** your review\n- **1 rejected** by you (override)\n- Average score: **7.4/10**",
      toolCalls: [
        { name: "fetch_analytics", status: "complete", result: "7-day window: 14 interviews, 79% pass rate, 7.4 avg score" },
      ],
    }
  }

  return {
    text: "I can help with that. I can reason across your past decisions, active candidates, and memories. What specifically would you like me to do?",
  }
}

// ── Suggestion chips ─────────────────────────────────────────

// Builds prompt suggestions from the admin's actual current state so the
// chips read as live affordances rather than canned demo copy. Falls back
// to a generic prompt if a slot can't be filled (e.g. no pending dilemmas).
function buildSuggestions(): string[] {
  const out: string[] = []

  const dilemmas = SEED_CANDIDATES.filter(c => c.status === "pending")
  const stellar = dilemmas.find(c => c.score >= 9)
  const weakest = dilemmas.length
    ? dilemmas.reduce((min, c) => (c.score < min.score ? c : min), dilemmas[0])
    : null

  if (stellar) {
    out.push(`Why is ${stellar.name.split(" ")[0]} a ${stellar.score}?`)
  } else if (dilemmas[0]) {
    out.push(`Walk me through ${dilemmas[0].name.split(" ")[0]}'s interview`)
  }

  if (weakest && weakest !== stellar) {
    out.push(`Draft a rejection for ${weakest.name.split(" ")[0]}`)
  }

  // Compare candidates within the same role when there are at least two
  // active candidates for one — the most common admin task.
  const byRole = new Map<string, number>()
  SEED_CANDIDATES.forEach(c => byRole.set(c.roleId, (byRole.get(c.roleId) ?? 0) + 1))
  const busiestRole = [...byRole.entries()].sort((a, b) => b[1] - a[1])[0]
  if (busiestRole && busiestRole[1] >= 2) {
    out.push(`Compare top candidates for ${roleTitle(busiestRole[0])}`)
  }

  // Only suggest creating a role when there's headroom — the original
  // hardcoded "Create a role for 'Senior Product Designer'" fired even when
  // that role already existed.
  if (SEED_ROLES.length < 5) {
    out.push("Create a new role")
  }

  out.push("Show me this week's analytics")

  return out.slice(0, 5)
}

// ── Chat page ────────────────────────────────────────────────

// Module-level flag — flips to true after the empty-state stagger animation
// plays once. Persists across tab switches within a session so re-mounts of
// ChatPage skip the entry animation. A hard refresh resets it.
let chatEntryAnimationPlayed = false

export function ChatPage() {
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [isTyping, setIsTyping] = useState(false)
  // Track every setTimeout fired during a response so the user can interrupt
  // with the stop button.
  const typingTimeouts = useRef<number[]>([])
  const trackTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      typingTimeouts.current = typingTimeouts.current.filter(x => x !== id)
      fn()
    }, ms)
    typingTimeouts.current.push(id)
    return id
  }
  const stopTyping = () => {
    typingTimeouts.current.forEach(id => clearTimeout(id))
    typingTimeouts.current = []
    setIsTyping(false)
  }
  const [showSlash, setShowSlash] = useState(false)
  const [slashQuery, setSlashQuery] = useState("")
  const [actionDropdown, setActionDropdown] = useState<{ trigger: ActionTrigger; filter: string } | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [editSidebar, setEditSidebar] = useState<ChatMsg | null>(null)
  const [sidebarTab, setSidebarTab] = useState<"role" | "interview">("role")
  const [roleStatus, setRoleStatus] = useState("Draft")
  const [actedMsgIds, setActedMsgIds] = useState<Set<string>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{ msg: ChatMsg; action: ActionCTA } | null>(null)
  const [readyToExpand, setReadyToExpand] = useState<string | null>(null)
  const [promptTemplate, setPromptTemplate] = useState<PromptTemplateData | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const msgIdRef = useRef(0)

  const hasMessages = msgs.length > 0

  // Only the first mount of ChatPage in this session gets the entry stagger.
  // Subsequent mounts (tab switches) skip straight to the resting state.
  const playEntryAnimation = useRef(!chatEntryAnimationPlayed).current
  useEffect(() => { chatEntryAnimationPlayed = true }, [])

  useEffect(() => { inputRef.current?.focus() }, [])

  // Press "/" anywhere on the page to focus the input and start a slash command
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if already typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === "/") {
        e.preventDefault()
        setInput("/")
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [input])

  const handleInputChange = (val: string) => {
    setInput(val)

    // Clear ready-to-expand if input diverged
    if (readyToExpand && val.trim().toLowerCase() !== readyToExpand.toLowerCase()) {
      setReadyToExpand(null)
    }

    // Slash command detection — highest priority
    const slashMatch = val.match(/^\/(\S*)$/)
    if (slashMatch) {
      setShowSlash(true)
      setSlashQuery(slashMatch[1])
      setActionDropdown(null)
      setShowAutocomplete(false)
      return
    }
    setShowSlash(false)
    setSlashQuery("")

    // Skip dropdown if ready to expand (waiting for second Tab)
    if (readyToExpand && val.trim().toLowerCase() === readyToExpand.toLowerCase()) {
      setActionDropdown(null)
      setShowAutocomplete(false)
      return
    }

    // Action dropdown detection — triggers when action keyword + space is typed
    const action = detectAction(val)
    if (action) {
      const afterAction = val.slice(action.matchEnd).trim()
      setActionDropdown({ trigger: action.trigger, filter: afterAction })
      setShowAutocomplete(false)
      return
    }
    setActionDropdown(null)

    // Autocomplete detection — show when typing partial action keywords
    const suggestions = matchAutocomplete(val)
    setShowAutocomplete(suggestions.length > 0)
  }

  const handleActionSelect = (item: DropdownItem) => {
    // Insert the selected item label into the input after the action text
    const action = detectAction(input)
    if (action) {
      const prefix = input.slice(0, action.matchEnd)
      if (item.id === "custom") {
        // Custom — just leave cursor after action for free typing
        setInput(prefix)
      } else {
        setInput(prefix + item.label + " ")
      }
    }
    setActionDropdown(null)
    inputRef.current?.focus()
  }

  const send = useCallback((override?: string) => {
    const text = (override ?? input).trim()
    if (!text) return

    const userMsg: ChatMsg = { id: `m${++msgIdRef.current}`, from: "user", text }
    setMsgs(p => [...p, userMsg])
    setInput("")
    setShowSlash(false)
    setIsTyping(true)

    // Simulate tool calls appearing one by one, then final response
    const response = getMockResponse(text)

    if (response.toolCalls?.length) {
      // Show tool calls streaming in
      const toolMsgId = `m${++msgIdRef.current}`
      let toolIdx = 0

      const showNextTool = () => {
        if (toolIdx < response.toolCalls!.length) {
          const currentTools = response.toolCalls!.slice(0, toolIdx + 1)
          const partialMsg: ChatMsg = {
            id: toolMsgId,
            from: "assistant",
            text: "",
            toolCalls: currentTools.map((t, i) => ({
              ...t,
              status: i < toolIdx ? "complete" : "running",
            })),
          }
          setMsgs(p => {
            const existing = p.findIndex(m => m.id === toolMsgId)
            if (existing >= 0) return [...p.slice(0, existing), partialMsg, ...p.slice(existing + 1)]
            return [...p, partialMsg]
          })
          toolIdx++
          trackTimeout(showNextTool, 800)
        } else {
          // All tools done, show final response
          trackTimeout(() => {
            const finalMsg: ChatMsg = {
              id: toolMsgId,
              from: "assistant",
              text: response.text,
              toolCalls: response.toolCalls!.map(t => ({ ...t, status: "complete" })),
              actions: response.actions,
              editableData: response.editableData,
            }
            setMsgs(p => {
              const existing = p.findIndex(m => m.id === toolMsgId)
              if (existing >= 0) return [...p.slice(0, existing), finalMsg, ...p.slice(existing + 1)]
              return [...p, finalMsg]
            })
            setIsTyping(false)
            // Auto-open sidebar for role creation etc.
            if (response.autoOpenSidebar && response.editableData) {
              setSidebarTab("role")
              setRoleStatus(response.editableData["Status"] || "Draft")
              setEditSidebar(finalMsg)
            }
          }, 500)
        }
      }
      trackTimeout(showNextTool, 600)
    } else {
      // No tool calls — direct response
      trackTimeout(() => {
        const assistantMsg: ChatMsg = {
          id: `m${++msgIdRef.current}`,
          from: "assistant",
          text: response.text,
          actions: response.actions,
          editableData: response.editableData,
        }
        setMsgs(p => [...p, assistantMsg])
        setIsTyping(false)
      }, 60000)
    }
  }, [input])

  const handleSlashSelect = (cmd: SlashCommand) => {
    setInput(cmd.command + " ")
    setShowSlash(false)
    inputRef.current?.focus()
  }

  const handleAutocompleteAccept = (suggestion: AutocompleteSuggestion) => {
    setInput(suggestion.full + " ")
    setShowAutocomplete(false)
    setReadyToExpand(suggestion.full)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlash || actionDropdown || showAutocomplete) return // let dropdowns handle keys
    if (e.key === "Tab" && readyToExpand) {
      e.preventDefault()
      const tpl = getTemplateForAction(readyToExpand)
      if (tpl) {
        setPromptTemplate(tpl)
        setReadyToExpand(null)
        setInput("")
      }
      return
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleAction = (msg: ChatMsg, action: ActionCTA) => {
    if (action.action === "edit" && msg.editableData) {
      // Toggle sidebar — don't disable CTAs
      setEditSidebar(prev => prev?.id === msg.id ? null : msg)
      return
    }

    if (action.semantic === "primary") {
      // Don't disable yet — wait for confirmation
      setConfirmAction({ msg, action })
      return
    }
    // Destructive/secondary — acknowledge and disable immediately
    setActedMsgIds(prev => new Set(prev).add(msg.id))
    setMsgs(p => [...p, {
      id: `m${++msgIdRef.current}`,
      from: "assistant",
      text: action.semantic === "destructive" ? "Got it — cancelled." : `Noted. I'll help you ${action.label.toLowerCase()}.`,
    }])
  }

  const confirmAndClose = () => {
    if (!confirmAction) return
    // Now disable CTAs — action was confirmed
    setActedMsgIds(prev => new Set(prev).add(confirmAction.msg.id))
    setConfirmAction(null)
    setMsgs(p => [...p, {
      id: `m${++msgIdRef.current}`,
      from: "assistant",
      text: `Done — **${confirmAction.action.label}**.`,
    }])
  }

  const cancelConfirm = () => {
    // CTAs were never disabled for primary actions, so just close
    setConfirmAction(null)
  }

  const handleTemplateSend = () => {
    if (!promptTemplate) return
    const text = serializeTemplate(promptTemplate)
    setPromptTemplate(null)
    send(text)
  }

  const handleTemplateCancel = () => {
    setPromptTemplate(null)
    inputRef.current?.focus()
  }

  const handleSwitchAction = (action: string) => {
    const tpl = getTemplateForAction(action)
    if (tpl) setPromptTemplate(tpl)
  }

  const handleSaveRole = () => {
    if (!editSidebar) return
    const status = roleStatus
    // Disable CTAs on the originating message
    setActedMsgIds(prev => new Set(prev).add(editSidebar.id))
    // Collapse sidebar
    setEditSidebar(null)
    // Show finishing message based on status
    const statusMessages: Record<string, string> = {
      "Draft": `Role saved to drafts. Your Alt is calibrating eval criteria and interview flow — this usually takes **~2 minutes**. You can push it live once you're ready.`,
      "Live": `Role is going live. Your Alt is calibrating eval criteria and interview flow — this usually takes **~2 minutes**. Candidates will be able to start interviews once calibration completes.`,
      "Paused": `Role saved as paused. Your Alt has the configuration ready — when you unpause, interviews can start immediately.`,
    }
    setMsgs(p => [...p, {
      id: `m${++msgIdRef.current}`,
      from: "assistant",
      text: statusMessages[status] || statusMessages["Draft"],
    }])
  }

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            /* ── Empty state: centered ── */
            <motion.div
              key="empty"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              <motion.div
                className="w-full max-w-2xl flex flex-col items-center gap-10"
                initial={playEntryAnimation ? "hidden" : "show"}
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
                }}
              >
                <motion.div
                  className="flex items-center gap-3"
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] } },
                  }}
                >
                  <div className="border border-border p-2 bg-muted/30 rounded-lg">
                    <PixelSprite size={36} />
                  </div>
                  <div>
                    <h1 className="text-h3">What can I help with?</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Sashank's Alt · trained on your decisions</p>
                  </div>
                </motion.div>

                {/* Input */}
                <motion.div
                  className="w-full relative"
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] } },
                  }}
                >
                  <SlashCommandPalette
                    query={slashQuery}
                    onSelect={handleSlashSelect}
                    onClose={() => setShowSlash(false)}
                    visible={showSlash}
                  />
                  {actionDropdown && (
                    <ActionDropdown
                      items={getItemsForAction(actionDropdown.trigger)}
                      onSelect={handleActionSelect}
                      onClose={() => setActionDropdown(null)}
                      visible={true}
                      filter={actionDropdown.filter}
                    />
                  )}
                  <ActionAutocomplete
                    input={input}
                    onAccept={handleAutocompleteAccept}
                    onDismiss={() => setShowAutocomplete(false)}
                    visible={showAutocomplete && !showSlash && !actionDropdown}
                  />
                  <div className="border border-border rounded-lg bg-card focus-within:border-foreground/40 transition-colors shadow-sm">
                    <div className="px-4 pt-3 pb-1 relative">
                      {promptTemplate ? (
                        <PromptTemplate
                          template={promptTemplate}
                          onChange={setPromptTemplate}
                          onSend={handleTemplateSend}
                          onCancel={handleTemplateCancel}
                          onSwitchAction={handleSwitchAction}
                        />
                      ) : (
                        <>
                          {input && (
                            <div className="absolute inset-0 px-4 pt-3 pb-1 text-sm leading-relaxed pointer-events-none select-none whitespace-pre-wrap break-words" aria-hidden>
                              <HighlightedText text={input} />
                            </div>
                          )}
                          <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Sashank's Alt anything… (type / for commands)"
                            rows={1}
                            className={`w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground resize-none leading-relaxed relative z-10 ${input ? "text-transparent caret-foreground" : ""}`}
                          />
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {readyToExpand ? (
                          <span className="px-1.5 py-0.5 border border-foreground/30 rounded-sm text-foreground/70 animate-pulse">tab again to fill details</span>
                        ) : (
                          <span className="px-1.5 py-0.5 border border-border rounded-sm">/ commands</span>
                        )}
                      </div>
                      <button
                        onClick={isTyping ? stopTyping : (promptTemplate ? handleTemplateSend : () => send())}
                        disabled={!isTyping && (promptTemplate ? false : !input.trim())}
                        aria-label={isTyping ? "Stop generating" : "Send"}
                        title={isTyping ? "Stop" : "Send"}
                        className="text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-30 transition-opacity inline-flex items-center gap-1.5"
                      >
                        {isTyping ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
                        ) : (
                          <>Send</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Suggestions */}
                <motion.div
                  className="flex flex-wrap gap-2 justify-center"
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] } },
                  }}
                >
                  {buildSuggestions().map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-[11px] px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                      {s}
                    </button>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            /* ── Conversation state ── */
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Conversation className="flex-1 overflow-hidden">
                <ConversationContent className="max-w-conversation mx-auto px-12 py-10 gap-7">
                  {msgs.map((m, i) => (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {m.from === "user" ? (
                        <Message from="user">
                          <MessageContent className="text-sm">
                            <HighlightedText text={m.text} />
                          </MessageContent>
                        </Message>
                      ) : (
                        <Message from="assistant">
                          {/* Tool calls */}
                          {m.toolCalls && m.toolCalls.length > 0 && (
                            <div className="flex flex-col gap-1.5 mb-2">
                              {m.toolCalls.map((tc, ti) => (
                                <div key={ti} className="bg-muted/30 border border-border rounded-lg text-[11px] overflow-hidden">
                                  <div className="flex items-start gap-2 px-3 py-2">
                                    <span className={`shrink-0 mt-0.5 ${tc.status === "running" ? "animate-spin" : ""}`}>
                                      {tc.status === "running" ? (
                                        <span className="inline-block w-3 h-3 border-2 border-accent-blue/30 border-t-accent-blue rounded-full" />
                                      ) : (
                                        <span className="text-status-success-foreground">✓</span>
                                      )}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium">{tc.name}</span>
                                      {tc.status === "complete" && tc.result && (
                                        <p className="text-muted-foreground mt-0.5">{tc.result}</p>
                                      )}
                                    </div>
                                  </div>
                                  {tc.status === "complete" && tc.editableData && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-border/50 bg-muted/20">
                                      <button
                                        onClick={() => setEditSidebar(prev =>
                                          prev?.id === `${m.id}-tool-${ti}`
                                            ? null
                                            : { id: `${m.id}-tool-${ti}`, from: "assistant", text: tc.name, editableData: tc.editableData }
                                        )}
                                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                                          editSidebar?.id === `${m.id}-tool-${ti}`
                                            ? "bg-foreground text-background"
                                            : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                                        }`}
                                      >
                                        {editSidebar?.id === `${m.id}-tool-${ti}` ? "Close" : "View & edit"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Message text */}
                          {m.text && (
                            <MessageContent className="text-sm leading-relaxed">
                              <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                            </MessageContent>
                          )}

                          {/* Action CTAs */}
                          {m.actions && m.actions.length > 0 && (() => {
                            const isActed = actedMsgIds.has(m.id)
                            return (
                              <div className="flex items-center gap-2 mt-2">
                                {m.actions.map((a, ai) => (
                                  <button key={ai}
                                    onClick={() => handleAction(m, a)}
                                    disabled={isActed}
                                    className={`text-[11px] px-3 py-1.5 rounded-lg transition-all ${
                                      isActed
                                        ? "opacity-40 cursor-not-allowed border border-border text-muted-foreground"
                                        : a.semantic === "primary"
                                        ? "bg-foreground text-background hover:opacity-90"
                                        : a.semantic === "destructive"
                                        ? "border border-destructive/30 text-status-danger-foreground hover:bg-status-danger"
                                        : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                                    }`}
                                  >
                                    {a.label}
                                  </button>
                                ))}
                              </div>
                            )
                          })()}
                        </Message>
                      )}
                    </motion.div>
                  ))}

                  {/* Stream loader — dot-matrix sweep + stepped phase labels */}
                  {isTyping && !msgs.some(m => m.from === "assistant" && m.toolCalls?.some(t => t.status === "running")) && (
                    <StreamLoader />
                  )}
                </ConversationContent>
                <ConversationScrollButton className="rounded-lg" />
              </Conversation>

              {/* Bottom input */}
              <div className="shrink-0 border-t border-border bg-card">
                <div className="max-w-conversation mx-auto px-12 py-5 relative">
                  <SlashCommandPalette
                    query={slashQuery}
                    onSelect={handleSlashSelect}
                    onClose={() => setShowSlash(false)}
                    visible={showSlash}
                  />
                  {actionDropdown && (
                    <ActionDropdown
                      items={getItemsForAction(actionDropdown.trigger)}
                      onSelect={handleActionSelect}
                      onClose={() => setActionDropdown(null)}
                      visible={true}
                      filter={actionDropdown.filter}
                    />
                  )}
                  <ActionAutocomplete
                    input={input}
                    onAccept={handleAutocompleteAccept}
                    onDismiss={() => setShowAutocomplete(false)}
                    visible={showAutocomplete && !showSlash && !actionDropdown}
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1 border border-border rounded-lg focus-within:border-foreground/40 transition-colors bg-background">
                      <div className="px-3 pt-2 pb-1 relative">
                        {promptTemplate ? (
                          <PromptTemplate
                            template={promptTemplate}
                            onChange={setPromptTemplate}
                            onSend={handleTemplateSend}
                            onCancel={handleTemplateCancel}
                          />
                        ) : (
                          <>
                            {input && (
                              <div className="absolute inset-0 px-3 pt-2 pb-1 text-sm leading-relaxed pointer-events-none select-none whitespace-pre-wrap break-words" aria-hidden>
                                <HighlightedText text={input} />
                              </div>
                            )}
                            <textarea
                              ref={inputRef}
                              value={input}
                              onChange={e => handleInputChange(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Message Sashank's Alt…"
                              rows={1}
                              className={`w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground resize-none leading-relaxed relative z-10 ${input ? "text-transparent caret-foreground" : ""}`}
                            />
                          </>
                        )}
                      </div>
                      {readyToExpand && !promptTemplate && (
                        <div className="px-3 pb-1.5">
                          <span className="text-[11px] text-foreground/50 animate-pulse">tab again to fill details</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={isTyping ? stopTyping : (promptTemplate ? handleTemplateSend : () => send())}
                      disabled={!isTyping && (promptTemplate ? false : !input.trim())}
                      aria-label={isTyping ? "Stop generating" : "Send"}
                      title={isTyping ? "Stop" : "Send"}
                      className="text-sm px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0 inline-flex items-center justify-center"
                    >
                      {isTyping ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
                      ) : (
                        <>↑</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit sidebar */}
      <AnimatePresence>
        {editSidebar && editSidebar.editableData && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50vw", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-l border-border overflow-hidden"
          >
            <div className="w-[50vw] h-full flex flex-col">
              {(() => {
                const data = editSidebar.editableData!
                const isRoleCreation = Object.keys(data).some(k => k.toLowerCase().includes("job description"))

                // Helper: render a form field by key
                const dropdownOptions: Record<string, string[]> = {
                  "department": ["Product", "Engineering", "Marketing", "Design", "Operations"],
                  "hiring manager": ["Sashank G.", "Kinnari G.", "Shreyas N.", "Neehar S.", "Abhishek M."],
                  "status": ["Draft", "Live", "Paused"],
                  "location": ["Remote", "Hybrid", "On-site — San Francisco", "On-site — New York", "On-site — Bangalore"],
                  "employment type": ["Full-time", "Part-time", "Contract", "Intern"],
                  "experience level": ["Entry", "Mid", "Senior", "Lead", "Principal"],
                }

                const renderField = (key: string, val: string) => {
                  const keyLower = key.toLowerCase()
                  const matchedDropdown = Object.entries(dropdownOptions).find(([k]) => keyLower.includes(k))
                  const isTextarea = keyLower.includes("job description") || keyLower.includes("description") || keyLower.includes("notes")

                  if (matchedDropdown) {
                    const isStatus = keyLower === "status"
                    return (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground mb-1 block">{key}</label>
                        <select
                          value={isStatus ? roleStatus : undefined}
                          defaultValue={isStatus ? undefined : val}
                          onChange={isStatus ? (e) => setRoleStatus(e.target.value) : undefined}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-foreground/40"
                        >
                          {matchedDropdown[1].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    )
                  }

                  if (isTextarea) {
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-muted-foreground">{key}</label>
                          <span className="text-[11px] text-muted-foreground/60">with sources</span>
                        </div>
                        <textarea defaultValue={val} rows={12}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background outline-none focus:border-foreground/40 resize-none leading-relaxed" />
                        <div className="mt-2 flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground">Sources used</p>
                          {[
                            { label: "Slack #hiring-product", icon: "#", color: "#4A154B" },
                            { label: "LinkedIn job template", icon: "in", color: "#0A66C2" },
                            { label: "Existing: Product Designer role", icon: "◎", color: "#666" },
                          ].map(src => (
                            <div key={src.label} className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 border border-border rounded-md">
                              <div className="w-4 h-4 flex items-center justify-center text-[11px] font-bold text-white rounded shrink-0" style={{ background: src.color }}>
                                {src.icon}
                              </div>
                              <span className="text-xs text-muted-foreground">{src.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground mb-1 block">{key}</label>
                      <input defaultValue={val} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-foreground/40" />
                    </div>
                  )
                }

                if (!isRoleCreation) {
                  // Non-role sidebar — flat field list (tool call edits, etc.)
                  return (
                    <>
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
                        <span className="text-xs font-medium">Edit details</span>
                        <button onClick={() => setEditSidebar(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                        {Object.entries(data).map(([k, v]) => renderField(k, v))}
                      </div>
                      <div className="shrink-0 border-t border-border px-5 py-3 flex gap-2">
                        <button className="flex-1 text-[11px] px-3 py-2 bg-foreground text-background rounded-lg hover:opacity-90">Save changes</button>
                        <button onClick={() => setEditSidebar(null)} className="text-[11px] px-3 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    </>
                  )
                }

                // ── Role creation: tabbed sidebar ──
                const roleFields = ["Title", "Department", "Hiring manager", "Status", "Location", "Employment type", "Experience level", "Job description"]
                const evalCriteria = editSidebar.toolCalls?.find(tc => tc.name === "generate_eval_criteria")?.editableData
                const interviewFlow = editSidebar.toolCalls?.find(tc => tc.name === "configure_interview_flow")?.editableData

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
                      <span className="text-xs font-medium">{data["Title"] || "New role"}</span>
                      <button onClick={() => setEditSidebar(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-border shrink-0 px-5 flex">
                      {(["role", "interview"] as const).map(t => (
                        <button key={t} onClick={() => setSidebarTab(t)}
                          className={`text-xs px-4 py-2.5 border-b-2 capitalize transition-colors ${
                            sidebarTab === t ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}>
                          {t === "interview" ? "Interview Config" : "Role"}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                      {sidebarTab === "role" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            {roleFields.filter(f => !["Job description"].includes(f)).map(fieldKey => {
                              const val = data[fieldKey]
                              if (val === undefined) return null
                              return renderField(fieldKey, val)
                            })}
                          </div>
                          {data["Job description"] && renderField("Job description", data["Job description"])}
                        </>
                      )}

                      {sidebarTab === "interview" && (
                        <>
                          {/* Alt assignment */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Assigned Alt</p>
                            <div className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-lg bg-card">
                              <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-xs font-medium text-background">SG</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Sashank's Alt</p>
                                <p className="text-xs text-muted-foreground">Active · 85% trained</p>
                              </div>
                              <AnimatedSelect
                                size="sm"
                                defaultValue="sashank"
                                options={[
                                  { value: "sashank", label: "Sashank's Alt" },
                                  { value: "kinnari", label: "Kinnari's Alt" },
                                ]}
                              />
                            </div>
                          </div>

                          {/* Interview duration */}
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Interview duration</label>
                            <div className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-muted/20 text-muted-foreground">{data["Interview duration"] || "~22 min"}</div>
                          </div>

                          {/* Interview flow */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Interview flow</p>
                            <div className="flex flex-col gap-1.5">
                              {interviewFlow ? (
                                Object.entries(interviewFlow).map(([step, desc], i) => (
                                  <div key={step} className="flex items-center gap-2.5 group">
                                    <div className="flex flex-col items-center shrink-0">
                                      <div className="w-6 h-6 rounded-full border-2 border-foreground/20 bg-background flex items-center justify-center text-[11px] font-medium text-muted-foreground">{i + 1}</div>
                                      {i < Object.keys(interviewFlow).length - 1 && <div className="w-px h-3 bg-border" />}
                                    </div>
                                    <input defaultValue={desc} className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-foreground/40" />
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground px-3 py-2 border border-border rounded-lg bg-muted/20">No flow yet — Alt will use the default 5-step interview until you set one up.</div>
                              )}
                            </div>
                          </div>

                          {/* Eval criteria */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground">Eval criteria</p>
                              <span className="text-[11px] text-muted-foreground/60">{evalCriteria ? Object.keys(evalCriteria).length : 0} criteria</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {evalCriteria ? (
                                Object.entries(evalCriteria).map(([key, val]) => (
                                  <div key={key} className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg bg-card group">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40 shrink-0 cursor-grab"><path d="M8 6h.01M8 12h.01M8 18h.01M12 6h.01M12 12h.01M12 18h.01"/></svg>
                                    <input defaultValue={val} className="flex-1 text-sm bg-transparent outline-none" />
                                    <AnimatedSelect
                                      size="sm"
                                      defaultValue="must"
                                      options={[
                                        { value: "must", label: "Must-have" },
                                        { value: "good", label: "Good-to-have" },
                                        { value: "nice", label: "Nice-to-have" },
                                      ]}
                                    />
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground px-3 py-2 border border-border rounded-lg bg-muted/20">No eval criteria generated</div>
                              )}
                            </div>
                          </div>

                          {/* Leniency */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs text-muted-foreground">How strict should the Alt be?</p>
                              <span className="text-[11px] text-muted-foreground">Balanced</span>
                            </div>
                            <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-foreground" />
                            <div className="flex justify-between mt-1">
                              <span className="text-[11px] text-muted-foreground">Strict</span>
                              <span className="text-[11px] text-muted-foreground">Full trust</span>
                            </div>
                          </div>
                        </>
                      )}

                    </div>

                    {/* Footer */}
                    <div className="shrink-0 border-t border-border px-5 py-3 flex gap-2">
                      <button onClick={handleSaveRole} className="flex-1 text-[11px] px-3 py-2 bg-foreground text-background rounded-lg hover:opacity-90">
                        {roleStatus === "Live" ? "Make this role live" : roleStatus === "Paused" ? "Keep paused for now" : "Save and review later"}
                      </button>
                      <button onClick={() => setEditSidebar(null)} className="text-[11px] px-3 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                  </>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20"
            onClick={cancelConfirm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background border border-border rounded-lg shadow-modal p-6 max-w-sm w-full mx-4"
            >
              <h3 className="text-base font-semibold mb-2">{confirmAction.action.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                This will take effect immediately. You can undo from the Activity log within 30 days.
              </p>
              <div className="flex gap-2">
                <button onClick={confirmAndClose}
                  className="flex-1 text-[11px] px-3 py-2 bg-foreground text-background rounded-lg hover:opacity-90">
                  Confirm
                </button>
                <button onClick={cancelConfirm}
                  className="flex-1 text-[11px] px-3 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
