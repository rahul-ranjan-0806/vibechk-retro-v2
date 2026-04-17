import { useState, useRef, useEffect } from "react"
import { PixelSprite } from "../components/PixelSprite"

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

function StatCards({ alt }: { alt: AltData }) {
  const stats = [
    { icon: "▶", label: "INTERVIEWS", value: alt.totalInterviews, color: "text-[#2a7d9c]" },
    { icon: "✦", label: "MEMORIES", value: alt.memories.length, color: "text-[#8a6c1a]" },
    { icon: "◎", label: "AVG SCORE", value: alt.avgScore || "—", color: "text-[#2d7a3a]" },
    { icon: "◆", label: "ROLES", value: alt.roles.length, color: "text-[#6b3fa0]" },
  ]
  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {stats.map(s => (
        <div key={s.label} className="p-4 bg-muted/30 border border-border flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{s.icon}</span>
            <span className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground">{s.label}</span>
          </div>
          <p className={`text-3xl font-medium tabular-nums leading-none ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

function AltDetail({ alt }: { alt: AltData }) {
  const [tab, setTab] = useState<"profile"|"chat">("profile")
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

      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="border border-border p-2 bg-muted/30 shrink-0">
              <PixelSprite size={40} active={alt.status === "active"} breathing={alt.status === "active"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-base font-medium">{alt.name}</h2>
                <span className={`text-[10px] font-pixel px-1.5 py-0.5 ${alt.status === "active" ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-muted text-muted-foreground"}`}>
                  {alt.status === "active" ? "Active" : "Setup"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-pixel mb-2.5">{alt.owner}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-pixel text-muted-foreground">Completed</span>
                <div className="w-28 h-1.5 bg-muted overflow-hidden">
                  <div className="h-full bg-foreground transition-all" style={{ width: `${alt.completeness}%` }} />
                </div>
                <span className="text-[10px] font-pixel text-muted-foreground tabular-nums">{alt.completeness}%</span>
              </div>
            </div>
          </div>
          <StatCards alt={alt} />
          {alt.pendingActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alt.pendingActions.map(a => (
                <span key={a} className="text-[10px] font-pixel px-2 py-0.5 bg-[#FAEEDA] text-[#854F0B] border border-[#F0C070]">⚠ {a}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border shrink-0">
        <div className="max-w-5xl mx-auto px-8 flex">
          {(["profile","chat"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-pixel px-4 py-2.5 border-b-2 capitalize transition-colors ${
                tab === t ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "chat" ? "Talk to Alt" : "Profile"}
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
                  <div key={i} className={`flex gap-2.5 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
                    {m.from === "alt" && (
                      <div className="shrink-0 mt-0.5 border border-border p-1 bg-muted/30">
                        <PixelSprite size={18} active={true} breathing={false} />
                      </div>
                    )}
                    <div className={`text-xs leading-relaxed px-3 py-2 max-w-[78%] border ${
                      m.from === "alt" ? "bg-muted/40 border-border" : "bg-foreground text-background border-transparent self-end"
                    }`}>
                      {m.text}
                    </div>
                  </div>
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
            <div className="max-w-5xl mx-auto px-8 py-5 flex flex-col gap-6">
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
                    className="w-full text-xs border border-foreground/40 bg-background px-3 py-2.5 outline-none resize-none min-h-[80px] leading-relaxed ring-1 ring-foreground/10" />
                ) : (
                  <div className="p-3 bg-muted/30 border border-border text-xs leading-relaxed">{tonality}</div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground">{memories.length} memories</p>
                  <button onClick={() => setAddingMemory(true)}
                    className="flex items-center gap-1.5 text-[10px] font-pixel px-2.5 py-1 border border-border hover:bg-muted transition-colors">
                    + Add memory
                  </button>
                </div>
                {addingMemory && (
                  <div className="mb-3 p-3 border border-border bg-muted/30">
                    <textarea value={newMemoryText} onChange={e => setNewMemoryText(e.target.value)}
                      placeholder="What should your Alt remember about you?"
                      className="w-full text-xs font-pixel border border-border bg-background px-2.5 py-2 outline-none placeholder:text-muted-foreground resize-none min-h-[60px] leading-relaxed mb-2" />
                    <div className="flex gap-2">
                      <button onClick={addMemory} className="text-[10px] font-pixel px-2.5 py-1 bg-foreground text-background hover:opacity-90">Save</button>
                      <button onClick={() => { setAddingMemory(false); setNewMemoryText("") }} className="text-[10px] font-pixel px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                  </div>
                )}
                {memories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-pixel text-center">No memories yet.<br/>Add memories to help your Alt understand how you think.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {categories.map(cat => (
                      <div key={cat}>
                        <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1.5">{cat}</p>
                        <div className="flex flex-col gap-1">
                          {memories.filter(m => m.category === cat).map(m => (
                            <div key={m.id} className="flex items-start gap-2.5 px-3 py-2.5 bg-muted/30 border border-border">
                              <span className="text-muted-foreground text-[10px] font-pixel mt-0.5 shrink-0">▸</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-relaxed">{m.text}</p>
                                {m.source && <p className="text-[10px] font-pixel text-muted-foreground mt-0.5">from {m.source}</p>}
                              </div>
                              <span className="text-[10px] font-pixel text-muted-foreground shrink-0">{m.createdAt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Assigned roles</p>
                {alt.roles.length === 0 ? (
                  <div className="p-3 bg-muted/30 border border-border text-xs text-muted-foreground font-pixel">Not assigned to any roles yet.</div>
                ) : (
                  <div className="border border-border overflow-hidden">
                    {alt.roles.map((r, i) => (
                      <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-[10px] font-pixel text-muted-foreground">{r.department} · {r.candidates} candidates</p>
                        </div>
                        <span className={`text-[10px] font-pixel px-1.5 py-0.5 ${r.status === "live" ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-muted text-muted-foreground"}`}>
                          {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
