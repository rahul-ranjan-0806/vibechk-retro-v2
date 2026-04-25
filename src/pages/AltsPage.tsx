import { useState, useRef, useEffect } from "react"
import { PixelSprite } from "../components/PixelSprite"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  MemoryMindMap,
  MOCK_MEMORIES,
  MOCK_EDGES,
  type MemoryNode,
  SOURCE_COLORS,
  SOURCE_LABELS,
  CATEGORY_LABELS,
} from "@/components/MemoryMindMap"

interface Memory { id: string; text: string; source: string|null; category: string; createdAt: string }
interface InterviewRecord { id: string; candidate: string; role: string; score: number; time: string; status: "needs_review"|"shortlisted"|"rejected" }
interface AssignedRole { id: string; title: string; department: string; status: "live"|"draft"|"paused"; candidates: number }

interface AltData {
  id: string; name: string; owner: string; initials: string
  memories: Memory[]; interviews: InterviewRecord[]; roles: AssignedRole[]
  tonality: string; completeness: number; status: "active"|"setup"
  pendingActions: string[]; totalInterviews: number; avgScore: number
}

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
    interviews: [
      { id: "i1", candidate: "Priya Sharma", role: "Sr. Product Designer", score: 9, time: "2h ago", status: "shortlisted" },
      { id: "i2", candidate: "Lena Fischer", role: "Sr. Product Designer", score: 9, time: "6h ago", status: "shortlisted" },
      { id: "i3", candidate: "Arjun Mehta", role: "Sr. Product Designer", score: 8, time: "5h ago", status: "needs_review" },
      { id: "i4", candidate: "Rohan Das", role: "Sr. Software Engineer", score: 7, time: "1d ago", status: "shortlisted" },
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
    memories: [], interviews: [], roles: [],
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

function AltDetail({ alt }: { alt: AltData }) {
  const [tab, setTab] = useState<"profile"|"chat"|"memories">("profile")
  const [chatInput, setChatInput] = useState("")
  const [chatMsgs, setChatMsgs] = useState<{ from: "alt"|"user"; text: string }[]>([
    { from: "alt", text: `Hey — I'm ${alt.name}. What do you want to know about how ${alt.owner.split(" ")[0]} thinks? I've got ${alt.memories.length} memories loaded.` }
  ])
  const [chatIdx, setChatIdx] = useState(0)
  const [memories, setMemories] = useState(alt.memories)
  const [addingMemory, setAddingMemory] = useState(false)
  const [newMemoryText, setNewMemoryText] = useState("")
  const [editingProfile, setEditingProfile] = useState(false)
  const [tonality, setTonality] = useState(alt.tonality)
  const [selectedBg, setSelectedBg] = useState("office")
  const [spriteLoaded, setSpriteLoaded] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const sendChat = () => {
    const msg = chatInput.trim(); if (!msg) return
    setChatMsgs(p => [...p, { from: "user", text: msg }]); setChatInput("")
    setTimeout(() => {
      setChatMsgs(p => [...p, { from: "alt", text: CHAT_RESPONSES[chatIdx % CHAT_RESPONSES.length] }])
      setChatIdx(i => i + 1)
    }, 900)
  }

  const addMemory = () => {
    if (!newMemoryText.trim()) return
    setMemories(p => [...p, { id: `m${Date.now()}`, text: newMemoryText.trim(), source: null, category: "Values", createdAt: "just now" }])
    setNewMemoryText(""); setAddingMemory(false)
  }

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chatMsgs])

  const categories = [...new Set(memories.map(m => m.category))]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header — prominent Alt identity */}
      <div className="shrink-0 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center gap-5 mb-5">
            {/* Larger sprite with breathing animation */}
            <div className="border-2 border-border p-3 bg-[#f8f9fc] rounded-lg shrink-0 relative">
              <PixelSprite size={56} active={alt.status === "active"} breathing={alt.status === "active"} />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${alt.status === "active" ? "bg-[#639922]" : "bg-muted-foreground/40"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-lg font-medium">{alt.name}</h2>
                <span className={`text-[10px] font-pixel px-1.5 py-0.5 rounded-sm ${alt.status === "active" ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-muted text-muted-foreground"}`}>
                  {alt.status === "active" ? "Active" : "Setup"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-pixel mb-1">{alt.owner}</p>

              {/* Sample opening line — personality at a glance */}
              {alt.status === "active" && (
                <p className="text-[11px] italic text-muted-foreground leading-relaxed mt-1.5 max-w-lg">
                  "Hey — I'm here to help you find people who think the way you do. Let's get started."
                </p>
              )}

              {/* Completeness bar */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px] font-pixel text-muted-foreground">Trained</span>
                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${alt.completeness}%` }} />
                </div>
                <span className="text-[10px] font-pixel text-muted-foreground tabular-nums">{alt.completeness}%</span>
              </div>
            </div>

            {/* Test my Alt CTA */}
            <div className="shrink-0 flex flex-col items-end gap-2">
              <a href={`https://alt.inc/interview/${alt.id}`} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-pixel px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Test my Alt
              </a>
              <span className="text-[9px] font-pixel text-muted-foreground">Opens interview in new tab</span>
            </div>
          </div>

          {alt.pendingActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alt.pendingActions.map(a => (
                <span key={a} className="text-[10px] font-pixel px-2 py-0.5 bg-[#FAEEDA] text-[#854F0B] border border-[#F0C070] rounded-sm">⚠ {a}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border shrink-0">
        <div className="max-w-5xl mx-auto px-8 flex">
          {(["profile","chat","memories"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-pixel px-4 py-2.5 border-b-2 capitalize transition-colors ${
                tab === t ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "chat" ? "Talk to Alt" : t === "memories" ? "Memories" : "Profile"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — all centered at max-w-5xl */}
      <div className="flex-1 overflow-hidden">

        {tab === "chat" && (
          <div className="h-full flex flex-col">
            <div ref={chatRef} className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-8 py-5 flex flex-col gap-3">
                {chatMsgs.map((m, i) => (
                  <Message key={i} from={m.from === "alt" ? "assistant" : "user"} className="max-w-[80%]">
                    {m.from === "alt" && (
                      <div className="shrink-0 border border-border p-1 bg-muted/30 w-fit">
                        <PixelSprite size={18} active={true} breathing={false} />
                      </div>
                    )}
                    <MessageContent className="text-xs leading-relaxed">{m.text}</MessageContent>
                  </Message>
                ))}
              </div>
            </div>
            <div className="shrink-0 border-t border-border">
              <div className="max-w-5xl mx-auto px-8 py-3 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask your Alt anything..."
                  className="flex-1 text-xs font-pixel border border-border px-2.5 py-2 bg-background outline-none placeholder:text-muted-foreground" />
                <button onClick={sendChat} className="text-xs font-pixel px-4 py-2 bg-foreground text-background hover:opacity-90 transition-opacity">→</button>
              </div>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto px-8 py-5 flex gap-8">

              {/* Left column — Full-body sprite display */}
              <div className="shrink-0 flex flex-col gap-4" style={{ width: 450 }}>
                {/* Sprite + background preview */}
                <div className="relative border border-border rounded-lg overflow-hidden bg-[#e8eaef]" style={{ height: 640 }}>
                  {/* Background label */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[9px] font-pixel uppercase tracking-widest px-2 py-1 bg-black/40 text-white rounded-sm">
                      {BACKGROUND_PRESETS.find(b => b.id === selectedBg)?.label || "Office"} backdrop
                    </span>
                  </div>

                  {/* Background scene (grey placeholder) */}
                  <div className="absolute inset-0 flex items-end justify-center" style={{ background: "linear-gradient(180deg, #d0d4dc 0%, #b8bcc8 60%, #a0a4b0 100%)" }}>
                    {/* Floor line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[120px]" style={{ background: "linear-gradient(180deg, #a0a4b0 0%, #909498 100%)" }} />
                  </div>

                  {/* Trainer sprite */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="/trainer-sprite.png"
                      alt={`${alt.name} full-body sprite`}
                      className={`h-[520px] object-contain ${spriteLoaded ? "" : "hidden"}`}
                      style={{ imageRendering: "pixelated" }}
                      onLoad={() => setSpriteLoaded(true)}
                      onError={() => setSpriteLoaded(false)}
                    />
                    {/* Fallback large overworld sprite if image not loaded */}
                    {!spriteLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col items-center gap-3">
                          <PixelSprite size={180} active={alt.status === "active"} breathing={alt.status === "active"} />
                          <span className="text-[10px] font-pixel text-muted-foreground/60">Upload a photo to generate sprite</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background presets */}
                <div>
                  <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Interview backdrop</p>
                  <div className="flex gap-2">
                    {BACKGROUND_PRESETS.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBg(bg.id)}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 border rounded-lg transition-colors ${
                          selectedBg === bg.id
                            ? "border-foreground bg-muted/40"
                            : "border-border hover:border-foreground/30 hover:bg-muted/20"
                        }`}
                      >
                        <div className={`w-full h-10 rounded-md ${selectedBg === bg.id ? "bg-foreground/20" : "bg-muted"}`} />
                        <span className={`text-[9px] font-pixel ${selectedBg === bg.id ? "text-foreground" : "text-muted-foreground"}`}>{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload new photo */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="text-[11px] font-pixel">Upload new photo to regenerate sprite</span>
                </button>
              </div>

              {/* Right column — Profile info */}
              <div className="flex-1 min-w-0 flex flex-col gap-6">

                {/* Tonality */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground">Tonality</p>
                    <button onClick={() => setEditingProfile(e => !e)}
                      className="text-[10px] font-pixel px-2 py-0.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                      {editingProfile ? "Done" : "Edit"}
                    </button>
                  </div>
                  {editingProfile ? (
                    <textarea value={tonality} onChange={e => setTonality(e.target.value)}
                      className="w-full text-xs border border-foreground/40 bg-background px-3 py-2.5 outline-none resize-none min-h-[80px] leading-relaxed ring-1 ring-foreground/10 rounded-lg" />
                  ) : (
                    <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs leading-relaxed">{tonality}</div>
                  )}
                </div>

                {/* Sources */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground">Sources</p>
                    <button className="flex items-center gap-1.5 text-[10px] font-pixel px-2.5 py-1 border border-border rounded-lg hover:bg-muted transition-colors">
                      + Connect source
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { key: "slack", label: "Slack", icon: "#", color: "#4A154B", status: "connected" as const, memories: 3, lastSync: "2h ago" },
                      { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", status: "connected" as const, memories: 2, lastSync: "1d ago" },
                      { key: "whatsapp", label: "WhatsApp", icon: "wa", color: "#25D366", status: "connected" as const, memories: 1, lastSync: "3d ago" },
                      { key: "google-docs", label: "Google Docs", icon: "G", color: "#4285F4", status: "not-connected" as const, memories: 0, lastSync: null },
                      { key: "notion", label: "Notion", icon: "N", color: "#000000", status: "not-connected" as const, memories: 0, lastSync: null },
                    ].map(s => (
                      <div key={s.key} className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-colors ${
                        s.status === "connected" ? "border-border bg-card" : "border-dashed border-border bg-muted/10"
                      }`}>
                        <div className="w-7 h-7 flex items-center justify-center text-[9px] font-pixel font-bold text-white rounded-md shrink-0" style={{ background: s.status === "connected" ? s.color : "#aaa" }}>
                          {s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{s.label}</p>
                          {s.status === "connected" ? (
                            <p className="text-[10px] font-pixel text-muted-foreground">{s.memories} memories · synced {s.lastSync}</p>
                          ) : (
                            <p className="text-[10px] font-pixel text-muted-foreground">Not connected</p>
                          )}
                        </div>
                        {s.status === "connected" ? (
                          <span className="text-[9px] font-pixel px-1.5 py-0.5 bg-[#EAF3DE] text-[#3B6D11] rounded-sm">Connected</span>
                        ) : (
                          <button className="text-[10px] font-pixel px-2.5 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned roles */}
                <div>
                  <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Assigned roles</p>
                  {alt.roles.length === 0 ? (
                    <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground font-pixel">Not assigned to any roles yet.</div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      {alt.roles.map((r, i) => (
                        <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{r.title}</p>
                            <p className="text-[10px] font-pixel text-muted-foreground">{r.department} · {r.candidates} candidates</p>
                          </div>
                          <span className={`text-[10px] font-pixel px-1.5 py-0.5 rounded-sm ${r.status === "live" ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-muted text-muted-foreground"}`}>
                            {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "memories" && (
          <MemoriesTab alt={alt} />
        )}

      </div>
    </div>
  )
}

// ── Memories Tab ─────────────────────────────────────────────

function MemoriesTab({ alt }: { alt: AltData }) {
  const [view, setView] = useState<"map" | "list">("map")
  const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null)
  const [addingMemory, setAddingMemory] = useState(false)
  const [newMemoryText, setNewMemoryText] = useState("")
  const [newMemoryCategory, setNewMemoryCategory] = useState<string>("values")

  const handleAddMemory = () => {
    if (!newMemoryText.trim()) return
    // In a real app this would persist — here we just close the form
    setNewMemoryText("")
    setNewMemoryCategory("values")
    setAddingMemory(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-border">
        <div className="max-w-5xl mx-auto px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-pixel text-muted-foreground">{MOCK_MEMORIES.length} memories</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[10px] font-pixel text-muted-foreground">{MOCK_EDGES.length} connections</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddingMemory(true)}
              className="text-[10px] font-pixel px-2.5 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              + Add memory
            </button>
            <button
              onClick={() => setView("map")}
              className={`text-[10px] font-pixel px-2.5 py-1 border rounded-md transition-colors ${view === "map" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`text-[10px] font-pixel px-2.5 py-1 border rounded-md transition-colors ${view === "list" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Add memory form */}
      {addingMemory && (
        <div className="shrink-0 border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-8 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <textarea
                  value={newMemoryText}
                  onChange={e => setNewMemoryText(e.target.value)}
                  placeholder="What should your Alt remember? e.g. 'I value candidates who can articulate trade-offs over those who just execute.'"
                  className="w-full text-xs border border-border rounded-lg bg-background px-3 py-2.5 outline-none placeholder:text-muted-foreground resize-none min-h-[60px] leading-relaxed focus:border-foreground/40"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newMemoryCategory}
                    onChange={e => setNewMemoryCategory(e.target.value)}
                    className="text-[10px] font-pixel border border-border rounded-md px-2 py-1.5 bg-background"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <span className="text-[10px] font-pixel text-muted-foreground">Source: Manual</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={handleAddMemory} disabled={!newMemoryText.trim()}
                  className="text-[10px] font-pixel px-3 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-30 transition-opacity">
                  Save
                </button>
                <button onClick={() => { setAddingMemory(false); setNewMemoryText("") }}
                  className="text-[10px] font-pixel px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "map" ? (
          <div className="h-full flex">
            <div className={`flex-1 min-w-0 p-4 transition-all ${selectedMemory ? "" : ""}`}>
              <MemoryMindMap
                memories={MOCK_MEMORIES}
                edges={MOCK_EDGES}
                onNodeClick={setSelectedMemory}
                selectedId={selectedMemory?.id}
              />
            </div>

            {/* Detail panel */}
            <div className={`shrink-0 border-l border-border overflow-hidden transition-all duration-200 ${selectedMemory ? "w-80" : "w-0"}`}>
              {selectedMemory && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <span className="text-xs font-pixel font-medium">Memory detail</span>
                    <button onClick={() => setSelectedMemory(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                    <div>
                      <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1">Memory</p>
                      <p className="text-sm leading-relaxed">{selectedMemory.fullText}</p>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      {[
                        { label: "Category", value: CATEGORY_LABELS[selectedMemory.category] },
                        { label: "Source", value: SOURCE_LABELS[selectedMemory.source] },
                        { label: "Usage weight", value: `${selectedMemory.weight}/5` },
                        { label: "Added", value: selectedMemory.createdAt },
                      ].map((row, i) => (
                        <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                          <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">{row.label}</span>
                          <span className="text-xs font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: SOURCE_COLORS[selectedMemory.source] }} />
                      <span className="text-[10px] font-pixel text-muted-foreground">{SOURCE_LABELS[selectedMemory.source]}</span>
                    </div>
                    {selectedMemory.sourceUrl && (
                      <a
                        href={selectedMemory.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-pixel text-[#4466ff] hover:underline pt-0.5"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        View original source
                      </a>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 text-[10px] font-pixel px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 text-[10px] font-pixel px-3 py-1.5 border border-[#C03030]/30 rounded-lg text-[#A32D2D] hover:bg-[#FCEBEB] transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List view */
          <div className="h-full flex">
            <div className="flex-1 min-w-0 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-8 py-5 flex flex-col gap-2">
                {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                  const catMemories = MOCK_MEMORIES.filter(m => m.category === catKey)
                  if (!catMemories.length) return null
                  return (
                    <div key={catKey} className="mb-4">
                      <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">{catLabel}</p>
                      <div className="flex flex-col gap-1.5">
                        {catMemories.map(m => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMemory(m)}
                            className={`flex items-start gap-3 px-3 py-2.5 border rounded-lg transition-colors text-left ${
                              selectedMemory?.id === m.id ? "border-foreground bg-muted/40" : "border-border bg-card hover:bg-muted/20"
                            }`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: SOURCE_COLORS[m.source] }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{m.label}</p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{m.fullText}</p>
                            </div>
                            <span className="text-[9px] font-pixel text-muted-foreground shrink-0">{m.createdAt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detail panel in list view */}
            <div className={`shrink-0 border-l border-border overflow-hidden transition-all duration-200 ${selectedMemory ? "w-80" : "w-0"}`}>
              {selectedMemory && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <span className="text-xs font-pixel font-medium">Memory detail</span>
                    <button onClick={() => setSelectedMemory(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                    <div>
                      <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1">Memory</p>
                      <p className="text-sm leading-relaxed">{selectedMemory.fullText}</p>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      {[
                        { label: "Category", value: CATEGORY_LABELS[selectedMemory.category] },
                        { label: "Source", value: SOURCE_LABELS[selectedMemory.source] },
                        { label: "Usage weight", value: `${selectedMemory.weight}/5` },
                        { label: "Added", value: selectedMemory.createdAt },
                      ].map((row, i) => (
                        <div key={row.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                          <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">{row.label}</span>
                          <span className="text-xs font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: SOURCE_COLORS[selectedMemory.source] }} />
                      <span className="text-[10px] font-pixel text-muted-foreground">{SOURCE_LABELS[selectedMemory.source]}</span>
                    </div>
                    {selectedMemory.sourceUrl && (
                      <a
                        href={selectedMemory.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-pixel text-[#4466ff] hover:underline pt-0.5"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        View original source
                      </a>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 text-[10px] font-pixel px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 text-[10px] font-pixel px-3 py-1.5 border border-[#C03030]/30 rounded-lg text-[#A32D2D] hover:bg-[#FCEBEB] transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AltsPage() {
  const [selectedId, setSelectedId] = useState(ALTS[0].id)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedAlt = ALTS.find(a => a.id === selectedId)!

  const handleSidebarEnter = () => {
    expandTimer.current = setTimeout(() => setSidebarExpanded(true), 100)
  }
  const handleSidebarLeave = () => {
    if (expandTimer.current) { clearTimeout(expandTimer.current); expandTimer.current = null }
    setSidebarExpanded(false)
  }

  useEffect(() => () => { if (expandTimer.current) clearTimeout(expandTimer.current) }, [])

  return (
    <div className="h-full flex overflow-hidden bg-background">
      <div
        className="shrink-0 border-r border-border flex flex-col py-3 bg-background transition-all duration-200 overflow-hidden"
        style={{ width: sidebarExpanded ? 188 : 60 }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <div className="px-3 mb-3 h-5">
          {sidebarExpanded && <span className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">Your Alts</span>}
        </div>
        {ALTS.map(alt => {
          const isSelected = selectedId === alt.id
          const dotColor = alt.status === "active" ? "bg-[#639922]" : "bg-muted-foreground/40"
          return (
            <button key={alt.id} onClick={() => setSelectedId(alt.id)}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors w-full border-l-2 ${
                isSelected ? "border-l-foreground bg-muted/50" : "border-l-transparent hover:bg-muted/30"
              }`}>
              <div className="relative shrink-0">
                <div className={`border p-1 ${isSelected ? "border-foreground/30 bg-muted/50" : "border-border bg-muted/20"}`}>
                  <PixelSprite size={28} active={alt.status === "active"} breathing={isSelected && alt.status === "active"} />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${dotColor}`} />
              </div>
              {sidebarExpanded && (
                <div className="text-left min-w-0 overflow-hidden">
                  <p className={`text-xs font-medium truncate ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{alt.name}</p>
                  <p className="text-[10px] font-pixel text-muted-foreground">{alt.completeness}% complete</p>
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <AltDetail key={selectedId} alt={selectedAlt} />
      </div>
    </div>
  )
}
