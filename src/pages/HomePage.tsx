import { useEffect, useRef, useState } from "react"
import { PixelSprite } from "@/components/PixelSprite"
import { AltMessagePart } from "@/components/AltMessageParts"
import {
  CANDIDATES as SEED_CANDIDATES,
  matchAltResponse,
  roleTitle,
  type AltMsgPart,
  type CandidateMini,
} from "@/lib/mockData"

type Page = "home" | "roles" | "candidates" | "alts" | "org" | "settings"

interface SetupItem {
  id: string; title: string; description: string
  status: "done" | "pending" | "warning"; cta: string; ctaTarget: Page | null
}

const SETUP_ITEMS: SetupItem[] = [
  { id: "alt", title: "Create your Alt", description: "Your Alt interviews candidates on your behalf. Train it with your voice and values.", status: "done", cta: "View Alt →", ctaTarget: "alts" },
  { id: "role", title: "Set up a role", description: "Create a job posting and configure eval criteria for the role.", status: "done", cta: "View roles →", ctaTarget: "roles" },
  { id: "ats", title: "Connect your ATS", description: "Sync shortlisted candidates to Dover automatically after interviews.", status: "done", cta: "Manage →", ctaTarget: "settings" },
  { id: "threshold", title: "Set shortlist threshold", description: "Define the score above which your Alt auto-shortlists candidates.", status: "warning", cta: "Set threshold →", ctaTarget: "roles" },
  { id: "slack", title: "Enable Slack notifications", description: "Get notified in Slack when exceptional candidates complete interviews.", status: "pending", cta: "Set up →", ctaTarget: "settings" },
]

const ACTIVITY = [
  { id: 1, candidate: "Arjun Mehta", role: "Sr. Product Designer", score: 8, scoreColor: "text-[#3B6D11]", scoreBg: "bg-[#EAF3DE]", time: "5h ago", decision: "shortlisted" },
  { id: 2, candidate: "Sarah Kim", role: "Sr. Product Designer", score: 8, scoreColor: "text-[#3B6D11]", scoreBg: "bg-[#EAF3DE]", time: "1d ago", decision: "shortlisted" },
  { id: 3, candidate: "Ilya Rosen", role: "Founding Engineer", score: 7, scoreColor: "text-[#3B6D11]", scoreBg: "bg-[#EAF3DE]", time: "2d ago", decision: "shortlisted" },
  { id: 4, candidate: "Nikhil Raj", role: "Product Marketing Lead", score: 5, scoreColor: "text-[#854F0B]", scoreBg: "bg-[#FAEEDA]", time: "3d ago", decision: "rejected" },
  { id: 5, candidate: "Hannah Luo", role: "Founding Engineer", score: 4, scoreColor: "text-[#854F0B]", scoreBg: "bg-[#FAEEDA]", time: "4d ago", decision: "rejected" },
]

// ── Setup card ───────────────────────────────────────────────

function SetupCard({ item, onNavigate }: { item: SetupItem; onNavigate: (p: Page) => void }) {
  const dotColor = item.status === "done" ? "bg-[#639922]" : item.status === "warning" ? "bg-[#BA7517]" : "bg-border"
  const statusLabel = item.status === "done" ? "Done" : item.status === "warning" ? "Needs attention" : "Not started"
  const statusColor = item.status === "done" ? "text-[#3B6D11]" : item.status === "warning" ? "text-[#854F0B]" : "text-muted-foreground"
  const cardBg = item.status === "warning" ? "border-[#F0C070] bg-[#FFFBF2]" : "border-border bg-card hover:bg-muted/20"

  return (
    <div className={`group p-3.5 border transition-all duration-150 ${cardBg}`}>
      <div className={`flex justify-between gap-3 ${item.status === "done" ? "items-center" : "items-start"}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${dotColor}`} />
            <p className="text-sm font-medium">{item.title}</p>
          </div>
          {item.status !== "done" && (
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-3.5 pr-16">{item.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[10px] font-pixel ${statusColor} ${item.status === "done" && item.ctaTarget ? "group-hover:hidden" : ""}`}>{statusLabel}</span>
          {item.ctaTarget && (
            <button onClick={() => onNavigate(item.ctaTarget!)}
              className={`text-[10px] font-pixel px-2.5 py-1 bg-foreground text-background transition-opacity hover:opacity-90 ${
                item.status === "done"
                  ? "hidden group-hover:block focus:block"
                  : "opacity-0 group-hover:opacity-100 focus:opacity-100"
              }`}>
              {item.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DecisionBadge({ d }: { d: string }) {
  const s: Record<string, string> = { shortlisted: "bg-[#EAF3DE] text-[#3B6D11]", rejected: "bg-[#FCEBEB] text-[#A32D2D]", pending: "bg-[#FAEEDA] text-[#854F0B]" }
  const l: Record<string, string> = { shortlisted: "Pushed to ATS", rejected: "Rejected", pending: "Your call" }
  return <span className={`text-[10px] font-pixel px-1.5 py-0.5 ${s[d]||s.pending}`}>{l[d]||"Your call"}</span>
}

// ── Alt triage card ──────────────────────────────────────────

function AltRecPill({ rec, confidence }: { rec: CandidateMini["altRec"]; confidence: CandidateMini["confidence"] }) {
  const base = "text-[10px] font-pixel px-1.5 py-0.5"
  if (rec === "shortlist") return <span className={`${base} bg-[#EAF3DE] text-[#3B6D11]`}>Alt: Shortlist ↑</span>
  if (rec === "reject") return <span className={`${base} bg-[#FCEBEB] text-[#A32D2D]`}>Alt: Pass ↓</span>
  return <span className={`${base} bg-[#FAEEDA] text-[#854F0B]`}>{confidence === "low" ? "Alt: Your call" : "Alt: Review"}</span>
}

function AltTriageCard({ onNavigate, onOpenChat }: { onNavigate: (p: Page) => void; onOpenChat: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const pushed = SEED_CANDIDATES.filter(c => c.status === "shortlisted").length
  const rejected = SEED_CANDIDATES.filter(c => c.status === "rejected").length
  const dilemmas = SEED_CANDIDATES.filter(c => c.status === "pending")

  const summary = (() => {
    const autoParts: string[] = []
    if (pushed) autoParts.push(`pushed ${pushed} to the ATS`)
    if (rejected) autoParts.push(`filtered ${rejected} out`)
    const autoSentence = autoParts.length ? `I've ${autoParts.join(" and ")} since yesterday.` : ""
    if (dilemmas.length === 0) {
      return `${autoSentence} You're caught up — no dilemmas for you to weigh in on.`.trim()
    }
    const names = dilemmas.map(c => c.name).slice(0, 2).join(" and ")
    const suffix = dilemmas.length === 1
      ? `${names} is the one I couldn't decide on — want to take a look?`
      : `${dilemmas.length} candidates — ${names}${dilemmas.length > 2 ? " and others" : ""} — are split calls I'd want your read on.`
    return `${autoSentence} ${suffix}`.trim()
  })()

  return (
    <div className="relative border-2 border-dashed border-[#4466ff] bg-[#4466ff]/[0.035] p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="pt-0.5 shrink-0"><PixelSprite size={28} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-pixel uppercase tracking-[0.12em] text-[#4466ff]">Alt update</span>
            <span className="text-[10px] font-pixel text-muted-foreground">· Sashank's Alt · just now</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{summary}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {dilemmas.length > 0 && (
              <button onClick={() => setExpanded(!expanded)}
                className="text-[11px] font-pixel px-3 py-1.5 bg-[#4466ff] text-white hover:opacity-90 transition-opacity">
                {expanded ? "Hide dilemmas" : `Review ${dilemmas.length} dilemma${dilemmas.length !== 1 ? "s" : ""}`}
              </button>
            )}
            <button onClick={() => onNavigate("candidates")}
              className="text-[11px] font-pixel px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              All candidates →
            </button>
            <button onClick={() => onNavigate("roles")}
              className="text-[11px] font-pixel px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              Tune thresholds
            </button>
            <button onClick={() => onNavigate("alts")}
              className="text-[11px] font-pixel px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              Teach Alt a memory
            </button>
            <button onClick={onOpenChat}
              className="text-[11px] font-pixel px-3 py-1.5 bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-1.5 ml-auto">
              <span>Chat with Alt</span>
              <span className="text-[9px] opacity-70">⌘K</span>
            </button>
          </div>

          {expanded && dilemmas.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5">
              {dilemmas.map(c => (
                <div key={c.id}
                  className="flex items-start gap-3 px-3 py-2.5 border border-border bg-background">
                  <div className="w-8 h-8 flex items-center justify-center text-sm font-medium shrink-0 bg-[#FAEEDA] text-[#854F0B]">
                    {c.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium">{c.name}</p>
                      <span className="text-[10px] font-pixel text-muted-foreground">{roleTitle(c.roleId)}</span>
                      <AltRecPill rec={c.altRec} confidence={c.confidence} />
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{c.reasoning}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    <button onClick={onOpenChat}
                      className="text-[10px] font-pixel px-2.5 py-1 bg-[#4466ff] text-white hover:opacity-90 transition-opacity">
                      Discuss with Alt
                    </button>
                    <button onClick={() => onNavigate("candidates")}
                      className="text-[10px] font-pixel px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                      Open →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Chat with Alt — right-side drawer ────────────────────────

type ChatMsg =
  | { from: "user"; text: string }
  | { from: "alt"; text: string; parts?: AltMsgPart[] }

function AltChatDrawer({ open, instant, onClose }: { open: boolean; instant: boolean; onClose: () => void }) {
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  const send = (override?: string) => {
    const msg = (override ?? input).trim()
    if (!msg) return
    setMsgs(p => [...p, { from: "user", text: msg }])
    setInput("")
    setTimeout(() => {
      const reply = matchAltResponse(msg)
      setMsgs(p => [...p, { from: "alt", text: reply.text, parts: reply.parts }])
    }, 600)
  }

  const prompts = [
    "What should I prioritize today?",
    "Why is Marcus flagged?",
    "Should I shortlist Priya?",
    "Am I being too strict on systems thinking?",
    "Draft a rejection for Tom",
    "Export this week's decisions",
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/20 ${instant ? "" : "transition-opacity duration-200"} ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 bg-background border-l border-border shadow-xl flex flex-col ${instant ? "" : "transition-transform duration-200 ease-out"} ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "50vw" }}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <PixelSprite size={22} />
            <div>
              <p className="text-xs font-pixel font-medium">Sashank's Alt</p>
              <p className="text-[10px] font-pixel text-muted-foreground">Thinking partner · trained on your decisions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-pixel text-muted-foreground hidden sm:inline">Esc to close</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-base leading-none px-1" aria-label="Close chat">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 min-h-0">
          {msgs.length === 0 ? (
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-pixel leading-relaxed bg-muted/60 border border-border px-3 py-2.5">
                Morning, Sashank. I've read the queue and can reason across your past decisions, the active candidates, and the memories you've taught me. What's on your mind?
              </div>
              <p className="text-[10px] font-pixel uppercase tracking-[0.12em] text-muted-foreground mt-2 mb-0.5">Try asking</p>
              {prompts.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-left text-[11px] font-pixel px-3 py-2 border border-border bg-muted/30 hover:bg-muted/60 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          ) : (
            msgs.map((m, i) => {
              if (m.from === "user") {
                return (
                  <div key={i} className="text-[11px] font-pixel leading-relaxed px-3 py-2.5 max-w-[92%] bg-foreground text-background self-end">
                    {m.text}
                  </div>
                )
              }
              return (
                <div key={i} className="flex flex-col gap-2 max-w-[92%] self-start w-full">
                  <div className="text-[11px] font-pixel leading-relaxed px-3 py-2.5 bg-muted/60 border border-border">
                    {m.text}
                  </div>
                  {m.parts && m.parts.length > 0 && (
                    <div className="flex flex-col gap-2 pl-1">
                      {m.parts.map((part, pi) => (
                        <AltMessagePart key={pi} part={part} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex gap-2 shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send() }}
            placeholder="Ask your Alt anything..."
            className="flex-1 text-[11px] font-pixel bg-muted/40 border border-border px-3 py-2 outline-none placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button onClick={() => send()} disabled={!input.trim()}
            className="text-[11px] font-pixel px-3 py-2 bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity">
            Send
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────

export function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const h = new Date().getHours()
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
  const doneCount = SETUP_ITEMS.filter(i => i.status === "done").length
  const hasWarning = SETUP_ITEMS.some(i => i.status === "warning")
  const [chatOpen, setChatOpen] = useState(false)
  // true when opened via cmd+k — drawer skips the slide transition for instant feel
  const [instantOpen, setInstantOpen] = useState(false)

  const openChatSlide = () => { setInstantOpen(false); setChatOpen(true) }
  const openChatInstant = () => { setInstantOpen(true); setChatOpen(o => !o) }
  const closeChat = () => { setChatOpen(false); setInstantOpen(false) }

  // Cmd/Ctrl+K toggles the Alt chat drawer instantly (no slide)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        openChatInstant()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-medium mb-0.5">{greeting}, Sashank</h1>
              <p className="text-sm text-muted-foreground">
                {hasWarning ? "A few things need your attention." : "6 new interviews since yesterday."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] font-pixel text-muted-foreground uppercase tracking-wider">Setup complete</p>
                <p className="text-xs font-pixel text-foreground tabular-nums">{doneCount}/{SETUP_ITEMS.length}</p>
              </div>
              <div className="w-20 h-1.5 bg-muted overflow-hidden">
                <div className="h-full bg-foreground transition-all" style={{ width: `${(doneCount/SETUP_ITEMS.length)*100}%` }} />
              </div>
            </div>
          </div>

          {/* Alt triage card — morning brief */}
          <AltTriageCard onNavigate={onNavigate} onOpenChat={openChatSlide} />

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Active roles", value: "3", color: "text-foreground" },
              { label: "Interviews today", value: "14", color: "text-[#185FA5]" },
              { label: "Pending review", value: "6", color: "text-[#854F0B]" },
              { label: "Shortlisted this week", value: "11", color: "text-[#3B6D11]" },
            ].map(s => (
              <div key={s.label} className="p-3.5 bg-muted/40 border border-border">
                <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1.5">{s.label}</p>
                <p className={`text-2xl font-medium tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-[1fr_380px] gap-5">
            {/* Candidate activity */}
            <div>
              <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Candidate activity</p>
              <div className="border border-border overflow-hidden">
                {ACTIVITY.map((a, i) => (
                  <div key={a.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium shrink-0 ${a.scoreBg} ${a.scoreColor}`}>
                      {a.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.candidate}</p>
                      <p className="text-[11px] font-pixel text-muted-foreground truncate">{a.role} · completed interview</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DecisionBadge d={a.decision} />
                      <span className="text-[10px] font-pixel text-muted-foreground">{a.time}</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 border-t border-border">
                  <button onClick={() => onNavigate("roles")} className="text-[11px] font-pixel text-muted-foreground hover:text-foreground transition-colors">
                    View all candidates →
                  </button>
                </div>
              </div>
            </div>

            {/* Setup & config — surface pending items first, done items at the bottom */}
            <div>
              <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Setup & config</p>
              <div className="flex flex-col gap-2">
                {[...SETUP_ITEMS]
                  .sort((a, b) => {
                    const rank = (s: SetupItem["status"]) => s === "warning" ? 0 : s === "pending" ? 1 : 2
                    return rank(a.status) - rank(b.status)
                  })
                  .map(item => (
                    <SetupCard key={item.id} item={item} onNavigate={onNavigate} />
                  ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Chat with Alt — right drawer (slide on button click, instant on ⌘K) */}
      <AltChatDrawer open={chatOpen} instant={instantOpen} onClose={closeChat} />
    </div>
  )
}
