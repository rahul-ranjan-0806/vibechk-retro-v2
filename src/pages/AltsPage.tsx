import { useState, useRef, useEffect, useCallback } from "react"
import { PixelSprite } from "../components/PixelSprite"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  MemoryMindMap,
  MOCK_MEMORIES,
  MOCK_EDGES,
  type MemoryNode,
  type MemorySource,
  SOURCE_COLORS,
  SOURCE_LABELS,
  CATEGORY_LABELS,
  useSourceColors,
} from "@/components/MemoryMindMap"
import { MemoryMindMap as MemoryMindMap3D } from "@/components/MemoryMindMap3D"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

// ── Types ────────────────────────────────────────────────────

interface Memory { id: string; text: string; source: string | null; category: string; createdAt: string }
interface AssignedRole { id: string; title: string; department: string; status: "live" | "draft" | "paused"; candidates: number }

interface AltData {
  id: string; name: string; owner: string; initials: string
  memories: Memory[]; roles: AssignedRole[]
  tonality: string; completeness: number; status: "active" | "setup"
  pendingActions: string[]; totalInterviews: number; avgScore: number
}

// ── Data ─────────────────────────────────────────────────────

const ALTS: AltData[] = [
  {
    id: "sashank", name: "Sashank's Alt", owner: "Sashank Gondala", initials: "SG",
    completeness: 85, status: "active", pendingActions: [], totalInterviews: 36, avgScore: 74,
    tonality: "Friendly, direct, and intellectually curious. Uses casual language but doesn't dumb things down. Asks sharp follow-up questions. Occasionally uses humor. Never corporate or stiff.",
    memories: [
      { id: "m1", text: "Believes design is decision-making, not decoration.", source: "LinkedIn post", category: "Values", createdAt: "3d ago" },
      { id: "m2", text: "Prefers async communication. Thinks most meetings should be docs.", source: "WhatsApp", category: "Comms", createdAt: "3d ago" },
      { id: "m3", text: "Gets frustrated by candidates who can't articulate trade-offs.", source: null, category: "Hiring", createdAt: "2d ago" },
      { id: "m4", text: "Strong bias for action. Ship imperfect > plan perfect.", source: "Slack", category: "Values", createdAt: "1w ago" },
      { id: "m5", text: "Judges candidates by what they ask, not just what they answer.", source: "LinkedIn post", category: "Hiring", createdAt: "1w ago" },
      { id: "m6", text: "Values people who can zoom in and zoom out — tactical and strategic.", source: null, category: "Hiring", createdAt: "2w ago" },
      { id: "m7", text: "Prefers working in small, high-trust teams over large orgs.", source: "Slack", category: "Values", createdAt: "2w ago" },
    ],
    roles: [
      { id: "r1", title: "Senior Product Designer", department: "Product", status: "live", candidates: 12 },
      { id: "r2", title: "Product Manager", department: "Product", status: "draft", candidates: 0 },
    ],
  },
  {
    id: "kinnari", name: "Kinnari's Alt", owner: "Kinnari Gilganchi", initials: "KG",
    completeness: 40, status: "setup", pendingActions: ["Add tonality", "Connect LinkedIn"], totalInterviews: 0, avgScore: 0,
    tonality: "Not yet configured.",
    memories: [], roles: [],
  },
]

const CHAT_RESPONSES = [
  "Based on what I know, they'd start by asking what problem we're actually solving — not jumping to solutions.",
  "My read: they'd care deeply about the user's actual workflow before designing anything. They think in systems.",
  "They'd likely push back on that. Shipping fast matters to them, but not at the cost of getting the core interaction wrong.",
  "They'd want evidence, not intuition. They'd ask for user research before committing to a direction.",
]

const BACKGROUND_PRESETS = [
  { id: "office", label: "Office" },
  { id: "cafe", label: "Café" },
  { id: "library", label: "Library" },
  { id: "park", label: "Park" },
  { id: "minimal", label: "Minimal" },
]

// ── Chat Dialog ──────────────────────────────────────────────

function ChatDialog({ alt, open, onOpenChange, msgs, setMsgs }: {
  alt: AltData; open: boolean; onOpenChange: (v: boolean) => void
  msgs: { from: "alt" | "user"; text: string }[]
  setMsgs: React.Dispatch<React.SetStateAction<{ from: "alt" | "user"; text: string }[]>>
}) {
  const [input, setInput] = useState("")
  const [idx, setIdx] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [msgs])

  const send = () => {
    const msg = input.trim()
    if (!msg) return
    setMsgs(p => [...p, { from: "user", text: msg }])
    setInput("")
    setTimeout(() => {
      setMsgs(p => [...p, { from: "alt", text: CHAT_RESPONSES[idx % CHAT_RESPONSES.length] }])
      setIdx(i => i + 1)
    }, 900)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 text-base">
            <div className="border border-border rounded-md p-1 bg-muted/30">
              <PixelSprite size={20} active={true} breathing={false} />
            </div>
            {alt.name}
          </DialogTitle>
          <DialogDescription>Ask your Alt anything about how {alt.owner.split(" ")[0]} thinks.</DialogDescription>
        </DialogHeader>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {msgs.map((m, i) => (
            <Message key={i} from={m.from === "alt" ? "assistant" : "user"} className="max-w-[80%]">
              {m.from === "alt" && (
                <div className="shrink-0 border border-border p-1 bg-muted/30 w-fit rounded-md">
                  <PixelSprite size={18} active={true} breathing={false} />
                </div>
              )}
              <MessageContent className="text-xs leading-relaxed">{m.text}</MessageContent>
            </Message>
          ))}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask your Alt anything..."
            className="flex-1 text-xs border border-border rounded-md px-3 py-2 bg-background outline-none placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button onClick={send} disabled={!input.trim()}
            className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity">
            Send
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Test Alt Modal ───────────────────────────────────────────

const INTERVIEW_STEPS = [
  { id: 1, label: "Intro & warm-up", duration: "3 min", description: "Greet candidate, set the tone, explain the format." },
  { id: 2, label: "Experience walkthrough", duration: "5 min", description: "Walk through recent roles, key projects, and what they owned." },
  { id: 3, label: "Deep dive — product thinking", duration: "7 min", description: "Probe for systems thinking, trade-off framing, and downstream effects." },
  { id: 4, label: "Cross-functional scenario", duration: "5 min", description: "Present a scenario involving eng + PM collaboration under ambiguity." },
  { id: 5, label: "Candidate Q&A", duration: "2 min", description: "Open floor for candidate questions about the role and team." },
]

const INTERVIEW_RESPONSES = [
  "Hey! Thanks for joining. I'm Sashank's Alt — I'll be running this pre-screen today. It's about 20 minutes, pretty conversational. I'll ask about your experience and how you think about product design. Sound good?",
  "Great. Let's start with what you've been working on recently. Walk me through a project where you had to make a hard design trade-off.",
  "Interesting. When you say you prioritized speed over polish there — what did that actually look like in the deliverables? What pushed back?",
  "That makes sense. Let me shift gears. Imagine you're working on a B2B dashboard and your PM wants to add a feature that 80% of users won't use but the top 3 enterprise accounts are asking for. How do you think about that?",
  "Good framing. Last question from me — any questions about Alt Inc or the role?",
]

function TestAltModal({ alt, open, onOpenChange }: {
  alt: AltData; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<{ from: "alt" | "user"; text: string }[]>([])
  const [step, setStep] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && msgs.length === 0) {
      setTimeout(() => {
        setMsgs([{ from: "alt", text: INTERVIEW_RESPONSES[0] }])
        setStep(1)
      }, 800)
    }
  }, [open])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [msgs])

  const send = () => {
    const msg = input.trim()
    if (!msg) return
    setMsgs(p => [...p, { from: "user", text: msg }])
    setInput("")
    const nextStep = Math.min(step + 1, INTERVIEW_STEPS.length)
    setTimeout(() => {
      setMsgs(p => [...p, { from: "alt", text: INTERVIEW_RESPONSES[nextStep % INTERVIEW_RESPONSES.length] }])
      setStep(nextStep)
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 text-base">
            <div className="border border-border rounded-md p-1 bg-muted/30">
              <PixelSprite size={20} active={true} breathing={true} />
            </div>
            Interview Preview
          </DialogTitle>
          <DialogDescription>Test how {alt.name} conducts interviews. This is a dry run — no candidate data is recorded.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Interview flow steps */}
          <div className="w-56 shrink-0 border-r border-border overflow-y-auto py-4 px-4">
            <p className="text-[13px] font-semibold text-foreground mb-3">Interview flow</p>
            <div className="flex flex-col gap-1">
              {INTERVIEW_STEPS.map((s, i) => (
                <div key={s.id} className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${i < step ? "bg-status-success/30" : i === step ? "bg-accent" : ""}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${
                    i < step ? "bg-status-success-dot text-white" : i === step ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? "✓" : s.id}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">~22 min total</p>
              <p className="text-xs text-muted-foreground mt-1">Step {Math.min(step, INTERVIEW_STEPS.length)} of {INTERVIEW_STEPS.length}</p>
            </div>
          </div>

          {/* Right: Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {msgs.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Starting interview...</p>
                </div>
              )}
              {msgs.map((m, i) => (
                <Message key={i} from={m.from === "alt" ? "assistant" : "user"} className="max-w-[85%]">
                  {m.from === "alt" && (
                    <div className="shrink-0 border border-border p-1 bg-muted/30 w-fit rounded-md">
                      <PixelSprite size={18} active={true} breathing={false} />
                    </div>
                  )}
                  <MessageContent className="text-sm leading-relaxed">{m.text}</MessageContent>
                </Message>
              ))}
            </div>

            <div className="shrink-0 border-t border-border px-6 py-3 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Respond as a candidate..."
                className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
              <button onClick={send} disabled={!input.trim()}
                className="text-sm px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity">
                Send
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Configure Sheet ──────────────────────────────────────────

function ConfigureSheet({ alt, open, onOpenChange }: {
  alt: AltData; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [tonality, setTonality] = useState(alt.tonality)

  const SOURCES = [
    { key: "slack", label: "Slack", icon: "#", color: "#4A154B", status: "connected" as const, memories: 3, lastSync: "2h ago" },
    { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", status: "connected" as const, memories: 2, lastSync: "1d ago" },
    { key: "whatsapp", label: "WhatsApp", icon: "wa", color: "#25D366", status: "connected" as const, memories: 1, lastSync: "3d ago" },
    { key: "google-docs", label: "Google Docs", icon: "G", color: "#4285F4", status: "not-connected" as const, memories: 0, lastSync: null },
    { key: "notion", label: "Notion", icon: "N", color: "#000000", status: "not-connected" as const, memories: 0, lastSync: null },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure {alt.name}</SheetTitle>
          <SheetDescription>Tonality, connected sources, and role assignments.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 mt-6">
          {/* Tonality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-semibold text-foreground">Tonality</p>
              <button onClick={() => setEditing(e => !e)}
                className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                {editing ? "Done" : "Edit"}
              </button>
            </div>
            {editing ? (
              <textarea value={tonality} onChange={e => setTonality(e.target.value)}
                className="w-full text-xs border border-foreground/40 bg-background px-3 py-2.5 outline-none resize-none min-h-[80px] leading-relaxed ring-1 ring-foreground/10 rounded-lg" />
            ) : (
              <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs leading-relaxed">{tonality}</div>
            )}
          </div>

          {/* Sources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-semibold text-foreground">Sources</p>
              <button className="flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border rounded-lg hover:bg-muted transition-colors">
                + Connect source
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {SOURCES.map(s => (
                <div key={s.key} className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-colors ${
                  s.status === "connected" ? "border-border bg-card" : "border-dashed border-border bg-muted/10"
                }`}>
                  <div className="w-7 h-7 flex items-center justify-center text-[11px] font-bold text-white rounded-md shrink-0"
                    style={{ background: s.status === "connected" ? s.color : "#aaa" }}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.status === "connected" ? `${s.memories} memories · synced ${s.lastSync}` : "Not connected"}
                    </p>
                  </div>
                  {s.status === "connected" ? (
                    <span className="text-[11px] rounded-md px-1.5 py-0.5 bg-status-success text-status-success-foreground">Connected</span>
                  ) : (
                    <button className="text-xs px-2.5 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Roles */}
          <div>
            <p className="text-[13px] font-semibold text-foreground mb-2">Assigned roles</p>
            {alt.roles.length === 0 ? (
              <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">Not assigned to any roles yet.</div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                {alt.roles.map((r, i) => (
                  <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.department} · {r.candidates} candidates</p>
                    </div>
                    <span className={`text-xs rounded-md px-1.5 py-0.5 ${r.status === "live" ? "bg-status-success text-status-success-foreground" : "bg-muted text-muted-foreground"}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Memory Modal ─────────────────────────────────────────────

type LoadingMemory = { id: string; label: string; source: string; color: string }

function MemoryModal({ open, onClose, initialView, initialMemoryId, loadingMemories, setLoadingMemories, autoAdd }: {
  open: boolean; onClose: () => void
  initialView: "map" | "list"; initialMemoryId?: string | null
  loadingMemories: LoadingMemory[]; setLoadingMemories: React.Dispatch<React.SetStateAction<LoadingMemory[]>>
  autoAdd?: boolean
}) {
  const sourceColors = useSourceColors()
  const [view, setView] = useState<"map" | "list">(initialView)
  const [mapMode, setMapMode] = useState<"2d" | "3d">("2d")
  const [showHUD, setShowHUD] = useState(true)
  const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(initialMemoryId ?? null)
  const [addingMemory, setAddingMemory] = useState(false)
  const [closingInput, setClosingInput] = useState(false)
  const [newMemoryText, setNewMemoryText] = useState("")
  const [newMemoryCategory, setNewMemoryCategory] = useState("values")
  const [attachedLinks, setAttachedLinks] = useState<{ url: string; source: string; label: string; color: string; parsing: boolean }[]>([])
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string }[]>([])
  const [highlightedPill, setHighlightedPill] = useState<number | null>(null)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState("")
  const [slashSource, setSlashSource] = useState<string | null>(null)
  const [slashIndex, setSlashIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLInputElement>(null)

  const FETCH_SOURCES: { key: string; label: string; icon: string; color: string; desc: string; items: { id: string; label: string; detail: string }[] }[] = [
    { key: "slack", label: "Slack", icon: "#", color: "#4A154B", desc: "Fetch from connected Slack channels", items: [
      { id: "slack-hiring", label: "#prescreening-experience", detail: "142 messages this week" },
      { id: "slack-design", label: "#vibechk-design", detail: "38 messages this week" },
      { id: "slack-general", label: "#general", detail: "67 messages this week" },
      { id: "slack-dm-kinnari", label: "DM with Kinnari", detail: "12 messages today" },
    ]},
    { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", desc: "Fetch from LinkedIn posts & profile", items: [
      { id: "li-posts", label: "Recent posts", detail: "Last 10 posts by Sashank" },
      { id: "li-profile", label: "Profile summary", detail: "Bio, headline, experience" },
      { id: "li-comments", label: "Comments & replies", detail: "Last 20 comment threads" },
    ]},
    { key: "whatsapp", label: "WhatsApp", icon: "wa", color: "#25D366", desc: "Fetch from WhatsApp conversations", items: [
      { id: "wa-hiring", label: "Hiring group", detail: "Team hiring discussions" },
      { id: "wa-founders", label: "Founders chat", detail: "Abhishek, Shreyas, Neehar" },
    ]},
    { key: "gdocs", label: "Google Docs", icon: "G", color: "#4285F4", desc: "Fetch from connected documents", items: [
      { id: "gdocs-handbook", label: "Alt Inc Handbook", detail: "Company culture & processes" },
      { id: "gdocs-rubric", label: "Interview Rubric v3", detail: "Eval criteria & scoring guide" },
      { id: "gdocs-jd-template", label: "JD Template", detail: "Standard job description format" },
    ]},
    { key: "notion", label: "Notion", icon: "N", color: "#000000", desc: "Fetch from Notion workspace", items: [
      { id: "notion-wiki", label: "Company Wiki", detail: "Internal knowledge base" },
      { id: "notion-hiring", label: "Hiring Playbook", detail: "Process & best practices" },
    ]},
    { key: "web", label: "Web search", icon: "🌐", color: "hsl(var(--foreground))", desc: "Search the web for context", items: [
      { id: "web-search", label: "Search query", detail: "Search for anything on the web" },
    ]},
  ]

  const activeSource = FETCH_SOURCES.find(s => s.key === slashSource)

  const filteredSources = FETCH_SOURCES.filter(s =>
    slashFilter === "" || s.label.toLowerCase().includes(slashFilter.toLowerCase()) || s.key.includes(slashFilter.toLowerCase())
  )

  const [fetchPills, setFetchPills] = useState<{ id: string; label: string; sourceLabel: string; color: string; parsing: boolean }[]>([])

  const handleSlashSelectSource = (source: typeof FETCH_SOURCES[0]) => {
    // Strip only the /command, keep all surrounding text intact
    setNewMemoryText(prev => prev.replace(/\/\S*$/, ""))
    setSlashSource(source.key)
    setSlashFilter("")
    setSlashIndex(0)
  }

  const handleSlashSelectItem = (source: typeof FETCH_SOURCES[0], item: { id: string; label: string }) => {
    setSlashOpen(false)
    setSlashSource(null)
    setSlashFilter("")
    // Don't touch the text — pill is added as separate state
    const pill = { id: item.id, label: item.label, sourceLabel: source.label, color: source.color, parsing: true }
    setFetchPills(prev => [...prev, pill])
    setTimeout(() => {
      setFetchPills(prev => prev.map(p => p.id === item.id ? { ...p, parsing: false } : p))
    }, 10000)
    textareaRef.current?.focus()
  }
  const [sourceFilters, setSourceFilters] = useState<Set<string>>(new Set())
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"recent" | "weight">("recent")
  const memoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const toggleFilter = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setFn(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const filteredMemories = MOCK_MEMORIES
    .filter(m => sourceFilters.size === 0 || sourceFilters.has(m.source))
    .filter(m => categoryFilters.size === 0 || categoryFilters.has(m.category))
    .sort((a, b) => sortBy === "weight" ? b.weight - a.weight : 0)

  const closeAddMemory = useCallback(() => {
    setClosingInput(true)
    setTimeout(() => {
      setClosingInput(false)
      setAddingMemory(false)
      setNewMemoryText("")
      setAttachedLinks([])
      setAttachedFiles([])
      setFetchPills([])
    }, 150)
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setView(initialView)
      setSelectedMemory(null)
      setExpandedId(initialMemoryId ?? null)
      setAddingMemory(false)
      if (initialMemoryId) {
        setView("list")
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = memoryRefs.current.get(initialMemoryId)
            el?.scrollIntoView({ behavior: "smooth", block: "center" })
          })
        })
      }
      if (autoAdd) {
        const t = setTimeout(() => setAddingMemory(true), 250)
        return () => clearTimeout(t)
      }
    }
  }, [open, initialView, initialMemoryId, autoAdd])

  // H key toggles HUD (2D/3D switcher + perf overlay in 3D mode)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setShowHUD(p => !p)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const handleMapNodeClick = useCallback((memory: MemoryNode) => {
    setSelectedMemory(memory)
  }, [])

  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 200)
  }, [onClose])

  const detectLinkSource = (url: string): { source: string; label: string; color: string } => {
    const u = url.toLowerCase()
    if (u.includes("linkedin.com")) return { source: "linkedin", label: "LinkedIn", color: "#0A66C2" }
    if (u.includes("slack.com") || u.includes("slack.")) return { source: "slack", label: "Slack", color: "#4A154B" }
    if (u.includes("notion.so") || u.includes("notion.")) return { source: "notion", label: "Notion", color: "#000000" }
    if (u.includes("docs.google") || u.includes("drive.google")) return { source: "gdocs", label: "Google Docs", color: "#4285F4" }
    if (u.includes("github.com")) return { source: "github", label: "GitHub", color: "#24292e" }
    if (u.includes("figma.com")) return { source: "figma", label: "Figma", color: "#A259FF" }
    if (u.includes("twitter.com") || u.includes("x.com")) return { source: "twitter", label: "X / Twitter", color: "#1DA1F2" }
    return { source: "web", label: new URL(url).hostname.replace("www.", ""), color: "hsl(var(--foreground))" }
  }

  const handleTextChange = (text: string) => {
    // Detect / command
    // Only trigger slash command at start of input or after a space
    const slashMatch = text.match(/(?:^|\s)\/(\S*)$/)
    if (slashMatch) {
      setSlashOpen(true)
      setSlashFilter(slashMatch[1])
      setSlashIndex(0)
    } else {
      setSlashOpen(false)
      setSlashFilter("")
      setSlashSource(null)
    }

    // Detect pasted URLs
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = text.match(urlRegex) || []
    const newLinks = urls
      .filter(url => !attachedLinks.some(l => l.url === url))
      .map(url => {
        const info = detectLinkSource(url)
        return { url, source: info.source, label: info.label, color: info.color, parsing: true }
      })
    if (newLinks.length) {
      let cleaned = text
      newLinks.forEach(link => { cleaned = cleaned.replace(link.url, "") })
      setNewMemoryText(cleaned)
      setAttachedLinks(prev => [...prev, ...newLinks])
      newLinks.forEach(link => {
        setTimeout(() => {
          setAttachedLinks(prev => prev.map(l => l.url === link.url ? { ...l, parsing: false } : l))
        }, 10000)
      })
    } else {
      setNewMemoryText(text)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setAttachedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, type: f.type }))])
    // Prefill prompt when first file is attached
    if (attachedFiles.length === 0 && !newMemoryText.trim()) {
      setNewMemoryText("Extract and save relevant memories from this source")
    }
    e.target.value = ""
    setTimeout(() => textareaRef.current?.select(), 50)
  }

  const handleAddMemory = () => {
    if (!newMemoryText.trim() && !attachedLinks.length && !attachedFiles.length && !fetchPills.length) return
    // Add loading entries for links still parsing
    const stillParsingLinks = attachedLinks.filter(l => l.parsing)
    const stillParsingFetch = fetchPills.filter(p => p.parsing)
    const entries = [
      ...stillParsingLinks.map(l => ({ id: l.url, label: l.label, source: l.source, color: l.color })),
      ...stillParsingFetch.map(p => ({ id: p.id, label: p.sourceLabel, source: p.sourceLabel, color: p.color })),
    ]
    if (entries.length) {
      setLoadingMemories(prev => [...prev, ...entries])
      entries.forEach(entry => {
        setTimeout(() => {
          setLoadingMemories(prev => prev.filter(m => m.id !== entry.id))
        }, 10000)
      })
    }
    setNewMemoryText("")
    setNewMemoryCategory("values")
    setAttachedLinks([])
    setAttachedFiles([])
    setFetchPills([])
    setClosingInput(true)
    setTimeout(() => { setClosingInput(false); setAddingMemory(false) }, 150)
  }

  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => { if (open && !hasOpened) setHasOpened(true) }, [open, hasOpened])

  // Before first open, render nothing (no simulation cost)
  if (!hasOpened) return null

  const visible = open || closing

  return (
    <div className={visible ? "" : "hidden"}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 ${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className={`pointer-events-auto bg-background border-4 border-border rounded-lg shadow-2xl flex flex-col overflow-hidden ${closing ? "modal-pop-exit" : open ? "modal-pop-enter" : ""}`}
          style={{ width: "95vw", height: "95vh" }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">Memories</h2>
              <span className="text-xs text-muted-foreground">{MOCK_MEMORIES.length} memories · {MOCK_EDGES.length} connections</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddingMemory(true)}
                className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                + Add memory
              </button>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground text-base leading-none px-1.5 py-0.5" aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv" className="hidden" onChange={handleFileSelect} />

          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Map view — always mounted, toggled via hidden */}
            <div className={`h-full flex ${view !== "map" ? "hidden" : ""}`}>
              <div className={`flex-1 min-w-0 p-4 transition-all relative`}>
                {/* 2D/3D toggle — bottom-right, toggled with H */}
                {showHUD && (
                  <div className="absolute bottom-5 right-5 z-10 flex items-center gap-1 bg-muted/80 backdrop-blur-sm rounded-md p-0.5 border border-border">
                    <button
                      onClick={() => setMapMode("2d")}
                      className={`text-xs font-medium px-2 py-1 rounded transition-colors ${mapMode === "2d" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >2D</button>
                    <button
                      onClick={() => setMapMode("3d")}
                      className={`text-xs font-medium px-2 py-1 rounded transition-colors ${mapMode === "3d" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >3D</button>
                  </div>
                )}
                {mapMode === "2d" ? (
                  <MemoryMindMap
                    memories={MOCK_MEMORIES}
                    edges={MOCK_EDGES}
                    onNodeClick={handleMapNodeClick}
                    selectedId={selectedMemory?.id}
                  />
                ) : (
                  <MemoryMindMap3D
                    memories={MOCK_MEMORIES}
                    edges={MOCK_EDGES}
                    onNodeClick={handleMapNodeClick}
                    selectedId={selectedMemory?.id}
                    className="h-full w-full"
                  />
                )}
              </div>

              {/* Side panel within modal */}
              <div className={`shrink-0 border-l border-border overflow-hidden transition-all duration-200 ${selectedMemory ? "w-80" : "w-0"}`}>
                {selectedMemory && (
                  <div className="h-full flex flex-col w-80">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                      <span className="text-xs font-medium">Memory detail</span>
                      <button onClick={() => setSelectedMemory(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                      <p className="text-sm leading-relaxed">{selectedMemory.fullText}</p>
                      <div className="border border-border rounded-lg overflow-hidden">
                        {[
                          { label: "Category", value: CATEGORY_LABELS[selectedMemory.category] },
                          { label: "Source", value: SOURCE_LABELS[selectedMemory.source] },
                          { label: "Weight", value: `${selectedMemory.weight}/5` },
                          { label: "Added", value: selectedMemory.createdAt },
                        ].map((row, i) => (
                          <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                            <span className="text-xs text-muted-foreground">{row.label}</span>
                            <span className="text-xs font-medium">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: sourceColors[selectedMemory.source] }} />
                        <span className="text-xs text-muted-foreground">{SOURCE_LABELS[selectedMemory.source]}</span>
                      </div>
                      {selectedMemory.sourceUrl && (
                        <a href={selectedMemory.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-link hover:underline">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                          View original source
                        </a>
                      )}
                      <div className="flex gap-2 mt-1">
                        <button className="flex-1 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">Edit</button>
                        <button className="flex-1 text-xs px-3 py-1.5 border border-destructive/30 rounded-lg text-status-danger-foreground hover:bg-status-danger transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List view — flat with filter chips + sidebar */}
            <div className={`h-full ${view !== "list" ? "hidden" : ""}`}>
              <div className="h-full flex">
                {/* List column */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Filter chips + sort */}
                  <div className="shrink-0 px-6 pt-4 pb-3 flex flex-col gap-2">
                    {/* Source chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Source</span>
                      {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => toggleFilter(sourceFilters, setSourceFilters, key)}
                          className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                            sourceFilters.has(key)
                              ? "bg-foreground text-background"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sourceFilters.has(key) ? "currentColor" : sourceColors[key as MemorySource] }} />
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Category chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Topic</span>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => toggleFilter(categoryFilters, setCategoryFilters, key)}
                          className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                            categoryFilters.has(key)
                              ? "bg-foreground text-background"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Sort + count */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{filteredMemories.length} memories</span>
                      <div className="flex items-center border border-border rounded-full overflow-hidden">
                        <button onClick={() => setSortBy("recent")}
                          className={`text-xs px-3 py-1 transition-colors ${sortBy === "recent" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                          Recent
                        </button>
                        <button onClick={() => setSortBy("weight")}
                          className={`text-xs px-3 py-1 transition-colors ${sortBy === "weight" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                          Weight
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Flat memory list */}
                  <div className="flex-1 overflow-y-auto px-6 pb-4">
                    <div className="flex flex-col">
                      {/* Loading memories — still parsing sources */}
                      {loadingMemories.map(lm => (
                        <div key={lm.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 link-shimmer opacity-50">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: lm.color }} />
                          <span className="text-sm text-muted-foreground italic">Loading memory from {lm.label}...</span>
                        </div>
                      ))}
                      {filteredMemories.map(m => {
                        const isSelected = selectedMemory?.id === m.id
                        return (
                          <div
                            key={m.id}
                            ref={el => { if (el) memoryRefs.current.set(m.id, el); else memoryRefs.current.delete(m.id) }}
                          >
                            <button
                              onClick={() => setSelectedMemory(isSelected ? null : m)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/50 ${
                                isSelected ? "bg-muted/40 border-l-2 border-l-foreground" : "hover:bg-muted/20"
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sourceColors[m.source] }} />
                              <span className="text-sm font-medium flex-1 min-w-0 truncate">{m.label}</span>
                              {sortBy === "weight" && (
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{m.weight}/5</span>
                              )}
                              <span className="text-[11px] text-muted-foreground shrink-0">{m.createdAt}</span>
                            </button>
                          </div>
                        )
                      })}
                      {filteredMemories.length === 0 && (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                          No memories match the selected filters.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side panel — shared with map view */}
                <div className={`shrink-0 border-l border-border overflow-hidden transition-all duration-200 ${selectedMemory ? "w-80" : "w-0"}`}>
                  {selectedMemory && (
                    <div className="h-full flex flex-col w-80">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                        <span className="text-xs font-medium">Memory detail</span>
                        <button onClick={() => setSelectedMemory(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                        <p className="text-sm leading-relaxed">{selectedMemory.fullText}</p>
                        <div className="border border-border rounded-lg overflow-hidden">
                          {[
                            { label: "Category", value: CATEGORY_LABELS[selectedMemory.category] },
                            { label: "Source", value: SOURCE_LABELS[selectedMemory.source] },
                            { label: "Weight", value: `${selectedMemory.weight}/5` },
                            { label: "Added", value: selectedMemory.createdAt },
                          ].map((row, i) => (
                            <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                              <span className="text-xs text-muted-foreground">{row.label}</span>
                              <span className="text-xs font-medium">{row.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ background: sourceColors[selectedMemory.source] }} />
                          <span className="text-xs text-muted-foreground">{SOURCE_LABELS[selectedMemory.source]}</span>
                        </div>
                        {selectedMemory.sourceUrl && (
                          <a href={selectedMemory.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-link hover:underline">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            View original source
                          </a>
                        )}
                        <div className="flex gap-2 mt-1">
                          <button className="flex-1 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">Edit</button>
                          <button className="flex-1 text-xs px-3 py-1.5 border border-destructive/30 rounded-lg text-status-danger-foreground hover:bg-status-danger transition-colors">Remove</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Centered add memory overlay */}
          {addingMemory && (
            <div className={`absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm ${closingInput ? "memory-input-backdrop-exit" : "memory-input-backdrop-enter"}`}
              onClick={e => { if (e.target === e.currentTarget) closeAddMemory() }}>
              <div className={`w-full max-w-xl relative ${closingInput ? "memory-input-exit" : "memory-input-enter"}`}>
                {/* Slash command dropdown */}
                {slashOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-30">
                    {!activeSource ? (
                      <>
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-xs text-muted-foreground">Fetch from source</p>
                        </div>
                        {filteredSources.map((s, idx) => (
                          <button key={s.key} onClick={() => handleSlashSelectSource(s)}
                            onMouseEnter={() => setSlashIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${idx === slashIndex ? "bg-accent" : "hover:bg-muted/50"}`}>
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
                        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                          <button onClick={() => setSlashSource(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                          </button>
                          <div className="w-5 h-5 flex items-center justify-center text-[11px] font-bold text-white rounded-md" style={{ background: activeSource.color }}>{activeSource.icon}</div>
                          <p className="text-xs font-medium">{activeSource.label}</p>
                        </div>
                        {activeSource.items.map((item, idx) => (
                          <button key={item.id} onClick={() => handleSlashSelectItem(activeSource, item)}
                            onMouseEnter={() => setSlashIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${idx === slashIndex ? "bg-accent" : "hover:bg-muted/50"}`}>
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

                {/* Attached sources — above the input */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">Sources</span>
                    {attachedFiles.map((file, i) => {
                      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE"
                      const typeLabel = file.type.startsWith("image/") ? "IMG" : ext
                      const typeColor = file.type.includes("pdf") ? "#E53935"
                        : file.type.includes("doc") ? "#1565C0"
                        : file.type.startsWith("image/") ? "#7B1FA2"
                        : file.type.includes("csv") ? "#2E7D32"
                        : "hsl(var(--foreground))"
                      return (
                        <span key={`file-${i}`} className="inline-flex items-center rounded-md overflow-hidden text-xs shrink-0 border border-border">
                          <span className="px-1.5 py-0.5 text-white font-medium" style={{ background: typeColor }}>{typeLabel}</span>
                          <span className="px-2 py-0.5 text-foreground bg-card">
                            {file.name.length > 24 ? file.name.slice(0, 22) + "…" : file.name}
                          </span>
                          <button onClick={() => {
                            setAttachedFiles(prev => prev.filter((_, j) => j !== i))
                            if (attachedFiles.length === 1 && newMemoryText === "Extract and save relevant memories from this source") {
                              setNewMemoryText("")
                            }
                          }}
                            className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground bg-card text-[11px] leading-none border-l border-border">✕</button>
                        </span>
                      )
                    })}
                    <button onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ add</button>
                  </div>
                )}

                {/* Input with inline pills + send button */}
                <div
                  className="flex flex-wrap items-center gap-1.5 border border-border rounded-lg bg-card shadow-lg px-4 py-3 min-h-[52px] cursor-text focus-within:border-foreground/40 transition-colors"
                  onClick={() => textareaRef.current?.focus()}
                >
                  {/* Link pills */}
                  {attachedLinks.map((link, i) => {
                    const pillIdx = i
                    const isHl = highlightedPill === pillIdx
                    const truncatedUrl = link.url.replace(/^https?:\/\//, "").slice(0, 28) + (link.url.length > 35 ? "…" : "")
                    return (
                      <span key={`link-${i}`} className={`inline-flex items-center rounded-md overflow-hidden text-xs shrink-0 transition-all ${isHl ? "ring-2 ring-destructive ring-offset-1 ring-offset-background" : ""}`}>
                        <span className="px-1.5 py-0.5 text-white font-medium" style={{ background: link.color }}>{link.label}</span>
                        <span className={`px-1.5 py-0.5 text-muted-foreground bg-muted/40 ${link.parsing ? "link-shimmer" : ""}`}>{truncatedUrl}</span>
                        <button onClick={e => { e.stopPropagation(); setAttachedLinks(prev => prev.filter((_, j) => j !== i)); setHighlightedPill(null) }}
                          className="px-1 py-0.5 text-muted-foreground hover:text-foreground bg-muted/40 text-[11px] leading-none">✕</button>
                      </span>
                    )
                  })}

                  {/* Fetch connector pills */}
                  {fetchPills.map((pill, i) => {
                    const pillIdx = attachedLinks.length + i
                    const isHl = highlightedPill === pillIdx
                    return (
                      <span key={pill.id}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md text-white shrink-0 transition-all ${pill.parsing ? "link-shimmer" : ""} ${isHl ? "ring-2 ring-destructive ring-offset-1 ring-offset-background" : ""}`}
                        style={{ background: pill.color }}>
                        {pill.label}
                        <button onClick={e => { e.stopPropagation(); setFetchPills(prev => prev.filter((_, j) => j !== i)); setHighlightedPill(null) }}
                          className="opacity-70 hover:opacity-100 text-[11px] leading-none">✕</button>
                      </span>
                    )
                  })}

                  {/* Text input */}
                  <input
                    ref={textareaRef}
                    type="text"
                    value={newMemoryText}
                    onChange={e => handleTextChange(e.target.value)}
                    onKeyDown={e => {
                      if (slashOpen) {
                        const items = !activeSource ? filteredSources : activeSource.items
                        if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex(i => (i + 1) % items.length) }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex(i => (i - 1 + items.length) % items.length) }
                        else if (e.key === "Enter") {
                          e.preventDefault()
                          if (!activeSource) {
                            const s = filteredSources[slashIndex]
                            if (s) handleSlashSelectSource(s)
                          } else {
                            const item = activeSource.items[slashIndex]
                            if (item) handleSlashSelectItem(activeSource, item)
                          }
                        }
                        else if (e.key === "Escape") { setSlashOpen(false); setSlashSource(null); setSlashFilter(""); e.preventDefault() }
                        else if (e.key === "Backspace" && activeSource && slashFilter === "") { setSlashSource(null); setSlashIndex(0); e.preventDefault() }
                        return
                      }
                      if (e.key === "Backspace" && newMemoryText === "") {
                        const totalPills = attachedLinks.length + fetchPills.length
                        if (totalPills === 0) return
                        e.preventDefault()
                        if (highlightedPill !== null) {
                          // Delete the highlighted pill
                          let idx = highlightedPill
                          if (idx < attachedLinks.length) {
                            setAttachedLinks(prev => prev.filter((_, j) => j !== idx))
                          } else {
                            setFetchPills(prev => prev.filter((_, j) => j !== idx - attachedLinks.length))
                          }
                          // Highlight the new last pill, or clear
                          const newTotal = totalPills - 1
                          setHighlightedPill(newTotal > 0 ? Math.min(highlightedPill, newTotal - 1) : null)
                        } else {
                          // Highlight the last pill
                          setHighlightedPill(totalPills - 1)
                        }
                        return
                      }
                      if (e.key !== "Backspace" && highlightedPill !== null) {
                        setHighlightedPill(null)
                      }
                      if (e.key === "Enter") { e.preventDefault(); handleAddMemory() }
                      if (e.key === "Escape") { closeAddMemory() }
                    }}
                    placeholder={attachedLinks.length || fetchPills.length ? "Add context..." : attachedFiles.length ? "Tell your Alt what to extract..." : "Teach your Alt something new..."}
                    className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground py-0.5"
                    autoFocus
                  />

                  {/* Attach button */}
                  <button onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Attach file">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  {/* Send button */}
                  <button onClick={handleAddMemory}
                    disabled={!newMemoryText.trim() && !attachedLinks.length && !attachedFiles.length && !fetchPills.length}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>

                <p className="text-center text-xs text-muted-foreground/50 mt-2">Enter to save · Esc to cancel · / to fetch · 📎 to attach</p>
              </div>
            </div>
          )}

          {/* Floating view toggle */}
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex border border-border rounded-full bg-card shadow-lg overflow-hidden transition-all duration-200`}>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs transition-colors ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3" /></svg>
              Map
            </button>
            <button
              onClick={() => { setView("list"); setSelectedMemory(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs transition-colors ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              List
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Alt Detail ───────────────────────────────────────────────

function AltDetail({ alt }: { alt: AltData }) {
  const sourceColors = useSourceColors()
  const [chatOpen, setChatOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [configureOpen, setConfigureOpen] = useState(false)
  const [memoryModalOpen, setMemoryModalOpen] = useState(false)
  const [memoryModalView, setMemoryModalView] = useState<"map" | "list">("map")
  const [memoryModalFocusId, setMemoryModalFocusId] = useState<string | null>(null)
  const [loadingMemories, setLoadingMemories] = useState<LoadingMemory[]>([])
  const [selectedBg, setSelectedBg] = useState("office")
  const [spriteLoaded, setSpriteLoaded] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<{ from: "alt" | "user"; text: string }[]>([
    { from: "alt", text: `Hey — I'm ${alt.name}. What do you want to know about how ${alt.owner.split(" ")[0]} thinks? I've got ${alt.memories.length} memories loaded.` }
  ])

  const [autoAddMemory, setAutoAddMemory] = useState(false)

  // Source management
  const [enabledSources, setEnabledSources] = useState<Set<string>>(new Set(["slack", "linkedin", "manual", "interview", "document", "whatsapp"]))
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  const [disconnectSource, setDisconnectSource] = useState<string | null>(null)

  const SOURCE_META: Record<string, { description: string; keywords: string[]; connectable: boolean }> = {
    slack: { description: "Pulls hiring philosophy, team preferences, and decision rationale from Slack conversations.", keywords: ["async culture", "trade-off framing", "hiring bar"], connectable: true },
    linkedin: { description: "Extracts values, public positions, and professional signals from LinkedIn activity.", keywords: ["craft matters", "systems thinking", "B2B depth"], connectable: true },
    manual: { description: "Memories added directly by the admin — core beliefs and principles.", keywords: ["ship imperfect", "zoom in/out", "high-trust teams"], connectable: false },
    interview: { description: "Patterns and signals extracted from past candidate interviews and debriefs.", keywords: ["reject fast", "ownership stories", "benchmark candidates"], connectable: false },
    document: { description: "Context pulled from uploaded docs — handbooks, rubrics, and templates.", keywords: ["remote-first", "PT±4h", "seed stage"], connectable: true },
    whatsapp: { description: "Informal signals from WhatsApp — communication style and quick takes.", keywords: ["async over meetings", "direct but warm"], connectable: true },
  }

  const openMapModal = () => { setAutoAddMemory(false); setMemoryModalView("map"); setMemoryModalFocusId(null); setMemoryModalOpen(true) }

  const openAddMemory = () => { setAutoAddMemory(true); setMemoryModalView("list"); setMemoryModalFocusId(null); setMemoryModalOpen(true) }

  const openMemoryAt = (memoryId: string) => { setAutoAddMemory(false); setMemoryModalView("list"); setMemoryModalFocusId(memoryId); setMemoryModalOpen(true) }

  const topMemories = [...MOCK_MEMORIES].sort((a, b) => b.weight - a.weight).slice(0, 4)



  const testSubtitle = alt.completeness < 50
    ? "Set up your Alt first"
    : alt.status === "active"
    ? "Verify your latest memory works"
    : "Opens interview in new tab"

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* LEFT COLUMN: Sprite card */}
      <div className="shrink-0 overflow-y-auto border-r border-border/40" style={{ width: 420 }}>
        <div className="px-10 pt-12 pb-16 flex flex-col gap-7">
          {/* Big sprite */}
          <div className="relative border border-border rounded-lg overflow-hidden bg-[#e8eaef]" style={{ height: 500 }}>
            <div className="absolute top-3 left-3 z-10">
              <span className="text-xs px-2 py-1 bg-black/40 text-white rounded-md">
                {BACKGROUND_PRESETS.find(b => b.id === selectedBg)?.label || "Office"} backdrop
              </span>
            </div>
            <div className="absolute inset-0 flex items-end justify-center" style={{ background: "linear-gradient(180deg, #d0d4dc 0%, #b8bcc8 60%, #a0a4b0 100%)" }}>
              <div className="absolute bottom-0 left-0 right-0 h-[100px]" style={{ background: "linear-gradient(180deg, #a0a4b0 0%, #909498 100%)" }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/trainer-sprite.png" alt={`${alt.name} full-body sprite`}
                className={`h-[420px] object-contain ${spriteLoaded ? "" : "hidden"}`}
                style={{ imageRendering: "pixelated" }}
                onLoad={() => setSpriteLoaded(true)} onError={() => setSpriteLoaded(false)} />
              {!spriteLoaded && (
                <div className="flex flex-col items-center gap-3">
                  <PixelSprite size={160} active={alt.status === "active"} breathing={alt.status === "active"} />
                  <span className="text-xs text-muted-foreground/60">Upload a photo to generate sprite</span>
                </div>
              )}
            </div>
          </div>

          {/* Alt identity */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">{alt.name}</h2>
              <span className={`text-xs rounded-md px-1.5 py-0.5 ${alt.status === "active" ? "bg-status-success text-status-success-foreground" : "bg-muted text-muted-foreground"}`}>
                {alt.status === "active" ? "Active" : "Setup"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{alt.owner}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Trained</span>
              <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${alt.completeness}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{alt.completeness}%</span>
            </div>
          </div>

          {/* Background presets */}
          <div>
            <p className="text-[13px] font-semibold text-foreground mb-2">Interview backdrop</p>
            <div className="flex gap-2">
              {BACKGROUND_PRESETS.map(bg => (
                <button key={bg.id} onClick={() => setSelectedBg(bg.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-2 border rounded-lg transition-colors ${
                    selectedBg === bg.id ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/30 hover:bg-muted/20"
                  }`}>
                  <div className={`w-full h-8 rounded-md ${selectedBg === bg.id ? "bg-foreground/20" : "bg-muted"}`} />
                  <span className={`text-[11px] ${selectedBg === bg.id ? "text-foreground" : "text-muted-foreground"}`}>{bg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <span className="text-[11px]">Upload new photo to regenerate sprite</span>
          </button>

          {/* Pending actions */}
          {alt.pendingActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alt.pendingActions.map(a => (
                <span key={a} className="text-xs rounded-md px-2 py-0.5 bg-status-warning text-status-warning-foreground border border-status-warning-dot">⚠ {a}</span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button onClick={() => setTestOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              <div className="flex flex-col items-center">
                <span className="text-sm">Test my Alt</span>
                <span className="text-[11px] text-background/60">{testSubtitle}</span>
              </div>
            </button>
            <button onClick={() => setConfigureOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              <span className="text-sm">Configure</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Memories & Sources */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Explore memories button */}
        <div className="shrink-0 px-10 pt-12 pb-6">
          <button
            onClick={openMapModal}
            className="w-full group relative overflow-hidden rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            style={{ height: 160 }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground group-hover:text-foreground transition-colors">
                <circle cx="12" cy="12" r="2" /><circle cx="5" cy="8" r="1.5" /><circle cx="19" cy="8" r="1.5" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" />
                <path d="M7 9.5l3.5 1.5M14.5 11l3-2M8 16.5l2.5-3.5M15 13.5l1 3" strokeOpacity="0.4" />
              </svg>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Explore memories</span>
              <span className="text-xs text-muted-foreground">{MOCK_MEMORIES.length} memories mapped</span>
            </div>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-10 pb-16">
          {/* Top memories */}
          {topMemories.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-foreground">Top memories</p>
                <button onClick={openMapModal}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {topMemories.map(m => (
                  <button key={m.id} onClick={() => openMemoryAt(m.id)}
                    className="text-left rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors px-3 py-2.5 group">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: sourceColors[m.source] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug text-foreground line-clamp-2">{m.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{m.source}</span>
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">weight {m.weight}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connected sources */}
          <p className="text-[13px] font-semibold text-foreground mb-3">Connected sources</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(SOURCE_LABELS).map(([key, label]) => {
              const count = MOCK_MEMORIES.filter(m => m.source === key).length
              if (count === 0) return null
              const enabled = enabledSources.has(key)
              const isExpanded = expandedSource === key
              const meta = SOURCE_META[key]
              return (
                <div key={key} className={`border rounded-lg transition-colors ${enabled ? "border-border bg-card" : "border-border bg-muted/20 opacity-60"}`}>
                  {/* Header row — always visible */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      onClick={() => setExpandedSource(isExpanded ? null : key)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sourceColors[key as MemorySource] }} />
                      <span className={`text-sm flex-1 ${enabled ? "" : "text-muted-foreground"}`}>{label}</span>
                      <span className="text-[11px] text-muted-foreground">{count}</span>
                    </button>
                    {/* Toggle */}
                    <button
                      onClick={() => {
                        if (enabled) {
                          setDisconnectSource(key)
                        } else {
                          setEnabledSources(prev => { const next = new Set(prev); next.add(key); return next })
                        }
                      }}
                      className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 border ${enabled ? "bg-foreground border-foreground" : "bg-transparent border-border"}`}
                    >
                      <span className={`absolute top-[2px] left-[2px] w-3 h-3 rounded-full transition-transform ${enabled ? "translate-x-3.5 bg-background" : "translate-x-0 bg-muted-foreground"}`} />
                    </button>
                  </div>

                  {/* Expandable detail */}
                  {isExpanded && meta && (
                    <div className="px-3 pb-3 pt-0 ml-[42px] border-t border-border mt-0">
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-2.5 mb-2">{meta.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {meta.keywords.map(kw => (
                          <span key={kw} className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{kw}</span>
                        ))}
                      </div>
                      {meta.connectable && (
                        <button className="text-xs text-accent-blue hover:underline transition-colors">
                          Learn about {label} access →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {/* Loading memories from sources */}
            {loadingMemories.map(lm => (
              <div key={lm.id} className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-lg bg-card link-shimmer opacity-50">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: lm.color }} />
                <span className="text-sm text-muted-foreground italic">Loading from {lm.label}...</span>
              </div>
            ))}
          </div>

          {/* Memories CTA with count */}
          <button
            onClick={openAddMemory}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <span className="text-[11px]">+ Add memory</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{MOCK_MEMORIES.length}</span>
          </button>
        </div>

        {/* Disconnect confirmation dialog */}
        {disconnectSource && (() => {
          const srcLabel = SOURCE_LABELS[disconnectSource as keyof typeof SOURCE_LABELS] || disconnectSource
          const srcCount = MOCK_MEMORIES.filter(m => m.source === disconnectSource).length
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setDisconnectSource(null)}>
              <div className="bg-card border border-border rounded-lg shadow-xl p-5 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-semibold mb-2">Disconnect {srcLabel}?</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                  Your Alt will stop pulling new memories from {srcLabel}. The {srcCount} existing memories from this source will be kept but won't update.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setDisconnectSource(null)}
                    className="text-[11px] px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => {
                    setEnabledSources(prev => { const next = new Set(prev); next.delete(disconnectSource); return next })
                    setDisconnectSource(null)
                  }}
                    className="text-[11px] px-3 py-1.5 rounded-md bg-status-danger text-status-danger-foreground hover:opacity-90 transition-opacity">
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Modals & Sheets */}
      <ChatDialog alt={alt} open={chatOpen} onOpenChange={setChatOpen} msgs={chatMsgs} setMsgs={setChatMsgs} />
      <TestAltModal alt={alt} open={testOpen} onOpenChange={setTestOpen} />
      <ConfigureSheet alt={alt} open={configureOpen} onOpenChange={setConfigureOpen} />
      <MemoryModal
        open={memoryModalOpen}
        onClose={() => { setMemoryModalOpen(false); setAutoAddMemory(false) }}
        initialView={memoryModalView}
        initialMemoryId={memoryModalFocusId}
        loadingMemories={loadingMemories}
        setLoadingMemories={setLoadingMemories}
        autoAdd={autoAddMemory}
      />
    </div>
  )
}

// ── Alts Page ────────────────────────────────────────────────

export function AltsPage({ onEntityChange, selectedAltId }: { onEntityChange?: (e: { type: "role"|"candidate"|"alt"; name: string; meta?: Record<string,string> } | undefined) => void; selectedAltId?: string; onSelectAlt?: (id: string) => void } = {}) {
  const selectedId = selectedAltId ?? ALTS[0].id
  const selectedAlt = ALTS.find(a => a.id === selectedId) ?? ALTS[0]

  useEffect(() => {
    onEntityChange?.({ type: "alt", name: selectedAlt.name, meta: { id: selectedAlt.id, status: selectedAlt.status, completeness: String(selectedAlt.completeness) } })
  }, [selectedId])

  return (
    <div className="h-full flex overflow-hidden bg-background">
      <div className="flex-1 overflow-hidden flex flex-col">
        <AltDetail key={selectedId} alt={selectedAlt} />
      </div>
    </div>
  )
}
