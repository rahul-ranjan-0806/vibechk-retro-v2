import { useState, useEffect, useCallback } from "react"
import { Agentation } from "agentation"
import { GitGraphOverlay } from "./devtools/GitGraphOverlay"
import { RolesPage } from "./pages/RolesPage"
import { AltsPage } from "./pages/AltsPage"
import { HomePage } from "./pages/HomePage"
import { OrgPage } from "./pages/OrgPage"
import { CandidatesPage } from "./pages/CandidatesPage"
import { SettingsPage } from "./pages/SettingsPage"
import { ChatPage } from "./pages/ChatPage"
import { AltChatOverlay, type OverlayEntity } from "./components/AltChatOverlay"
import { PixelSprite } from "./components/PixelSprite"
import { PROACTIVE_NUDGES, ROLES, ALTS_MINI } from "./lib/mockData"

type Page = "home" | "roles" | "candidates" | "alts" | "chat" | "org" | "settings"

// Bridge between mockData role IDs (r1/r2/r3 — used by Home + Candidates) and
// RolesPage's role IDs (spd/swe/pmg). Two mock datasets, same domain.
const MOCK_ROLE_TO_ROLES_PAGE: Record<string, string> = {
  r1: "spd",
  r2: "swe",
  r3: "pmg",
}

function NavTooltip({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="relative group/nav">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-foreground text-background text-xs rounded-md whitespace-nowrap opacity-0 group-hover/nav:opacity-100 pointer-events-none z-50 transition-opacity delay-100">
        <p className="font-medium text-[11px]">{label}</p>
        <p className="text-background/60 text-[11px]">{description}</p>
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("chat")
  const [navCollapsed, setNavCollapsed] = useState(false)

  // Selected entity IDs for sidebar drill-down
  const [selectedRoleId, setSelectedRoleId] = useState<string>(ROLES[0].id)
  const [selectedAltId, setSelectedAltId] = useState<string>(ALTS_MINI[0].id)
  const [pendingCandidateName, setPendingCandidateName] = useState<string | null>(null)

  const navigateToCandidate = useCallback((candidateName: string, mockRoleId: string) => {
    const rolesPageRoleId = MOCK_ROLE_TO_ROLES_PAGE[mockRoleId] ?? "spd"
    setSelectedRoleId(rolesPageRoleId)
    setPendingCandidateName(candidateName)
    setPage("roles")
  }, [])

  const navigateToRole = useCallback((mockRoleId: string) => {
    const rolesPageRoleId = MOCK_ROLE_TO_ROLES_PAGE[mockRoleId] ?? "spd"
    setSelectedRoleId(rolesPageRoleId)
    setPage("roles")
  }, [])

  // Alt overlay state
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [entityContext, setEntityContext] = useState<OverlayEntity | undefined>(undefined)
  const [nudgeBadge, setNudgeBadge] = useState(false)
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null)
  const [prefillInput, setPrefillInput] = useState<string | null>(null)

  const openOverlay = useCallback((prefill?: string) => {
    setPrefillInput(prefill ?? null)
    setOverlayOpen(true)
    setNudgeBadge(false)
  }, [])

  // Cmd+K — global shortcut (skip on Chat page, it has its own)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (page === "chat") return
        e.preventDefault()
        if (overlayOpen) { setOverlayOpen(false) } else { openOverlay() }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [page, overlayOpen, openOverlay])

  // Reset entity context when page changes
  useEffect(() => { setEntityContext(undefined) }, [page])

  // Proactive nudge — check for matching nudge after page/entity change
  useEffect(() => {
    const timer = setTimeout(() => {
      const match = PROACTIVE_NUDGES.find(n => {
        if (n.page !== page) return false
        if (n.entityId && entityContext?.meta?.id !== n.entityId) return false
        return true
      })
      if (match) {
        setNudgeBadge(true)
        setNudgeMessage(match.message)
      } else {
        setNudgeBadge(false)
        setNudgeMessage(null)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [page, entityContext])

  return (
    <>
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className={`${navCollapsed ? "w-14" : "w-60"} shrink-0 flex flex-col py-3 gap-0.5 bg-muted/60 transition-all duration-200 ${navCollapsed ? "overflow-visible" : "overflow-hidden"}`}>
        <div className={`${navCollapsed ? "px-0 flex justify-center" : "px-5 flex items-center justify-between"} mb-5`}>
          {navCollapsed
            ? <button onClick={() => setNavCollapsed(false)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5" title="Expand sidebar">
                <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-pixel text-xs font-bold tracking-tight">vc</div>
              </button>
            : <>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-pixel text-xs font-bold tracking-tight shrink-0">vc</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold tracking-tight text-foreground leading-tight">Sashank's vibechk</span>
                    <span className="text-[11px] text-muted-foreground leading-tight truncate">Alt Inc · Free</span>
                  </div>
                </div>
                <button onClick={() => setNavCollapsed(true)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 shrink-0" title="Collapse sidebar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M16 15l-3-3 3-3"/>
                  </svg>
                </button>
              </>
          }
        </div>

        {!navCollapsed && <p className="text-xs px-5 mb-1 mt-2 text-muted-foreground/80">Manage</p>}

        {[
          { id: "chat" as Page, label: "Chat", description: "Talk to your Alt",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { id: "home" as Page, label: "Home", description: "Overview and daily triage",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: "roles" as Page, label: "Roles", description: "Manage your hiring roles", badge: 3,
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
          { id: "candidates" as Page, label: "Candidates", description: "Browse all candidates",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: "alts" as Page, label: "Alts", description: "Configure your AI alts",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
          { id: "org" as Page, label: "Org", description: "Company info and memory",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h0M9 12h0M9 15h0M9 18h0"/></svg> },
        ].map(item => {
          const btn = (
            <button onClick={() => setPage(item.id)}
              className={`w-full flex items-center ${navCollapsed ? "justify-center px-0" : "gap-2 px-3"} h-8 text-[14px] transition-colors text-left rounded-sm ${
                page === item.id ? "bg-foreground/10 text-foreground font-medium" : "text-foreground/75 hover:bg-foreground/5"
              }`}>
              <span className="shrink-0 opacity-70">{item.icon}</span>
              {!navCollapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
              {!navCollapsed && (item as any).badge && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-xs bg-muted text-muted-foreground tabular-nums">
                  {(item as any).badge}
                </span>
              )}
            </button>
          )
          const wrapped = navCollapsed
            ? <NavTooltip label={item.label} description={item.description}>{btn}</NavTooltip>
            : btn

          // Sub-list for Roles when active and expanded
          const showRoleList = item.id === "roles" && page === "roles" && !navCollapsed
          // Sub-list for Alts when active and expanded
          const showAltList = item.id === "alts" && page === "alts" && !navCollapsed

          return (
            <div key={item.id} className={`flex flex-col ${navCollapsed ? "" : "px-2"}`}>
              {wrapped}
              {showRoleList && (
                <div className="flex flex-col gap-0 mt-0.5 mb-1 ml-6">
                  {ROLES.map(r => (
                    <button key={r.id} onClick={() => setSelectedRoleId(r.id)}
                      className={`w-full text-left text-[13px] py-1 px-2 rounded-sm transition-colors truncate flex items-center gap-1.5 ${
                        selectedRoleId === r.id
                          ? "bg-foreground/10 text-foreground font-medium"
                          : "text-foreground/65 hover:bg-foreground/5"
                      }`}>
                      <span className="text-foreground/40">📋</span>
                      <span className="truncate">{r.title}</span>
                    </button>
                  ))}
                  <button className="w-full text-left text-[13px] py-1 px-2 rounded-sm text-foreground/45 hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-1.5">
                    <span>+</span>
                    <span>Add a role</span>
                  </button>
                </div>
              )}
              {showAltList && (
                <div className="flex flex-col gap-0 mt-0.5 mb-1 ml-6">
                  {ALTS_MINI.map(a => {
                    const isSelected = selectedAltId === a.id
                    return (
                      <button key={a.id} onClick={() => setSelectedAltId(a.id)}
                        className={`w-full text-left text-[13px] py-1 px-2 rounded-sm transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-foreground/10 text-foreground font-medium"
                            : "text-foreground/65 hover:bg-foreground/5"
                        }`}>
                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[11px] font-medium shrink-0 ${
                          isSelected ? "bg-foreground text-background" : "bg-foreground/10 text-foreground/60"
                        }`}>{a.initials}</div>
                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                          <span className="truncate">{a.name}</span>
                          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{a.completeness}%</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {!navCollapsed && <p className="text-xs uppercase tracking-wider font-medium px-5 mb-1 mt-3 text-muted-foreground">Configure</p>}
        {(() => {
          const settingsBtn = (
            <button onClick={() => setPage("settings")}
              className={`w-full flex items-center ${navCollapsed ? "justify-center px-0 mt-2" : "gap-2 px-3"} h-8 text-[14px] transition-colors text-left rounded-sm ${
                page === "settings" ? "bg-foreground/10 text-foreground font-medium" : "text-foreground/75 hover:bg-foreground/5"
              }`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              {!navCollapsed && <span className="flex-1 whitespace-nowrap">Settings</span>}
            </button>
          )
          return navCollapsed ? <NavTooltip label="Settings" description="Preferences and integrations">{settingsBtn}</NavTooltip> : settingsBtn
        })()}

        <div className="mt-auto flex flex-col gap-0.5">
          <button className={`w-full flex items-center ${navCollapsed ? "justify-center px-0" : "gap-2 px-3"} h-8 rounded-sm text-[13px] text-foreground/65 hover:bg-foreground/5 transition-colors`}>
            <span className="opacity-70">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6M19 8v6"/></svg>
            </span>
            {!navCollapsed && <span>Invite members</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {page === "home" && <HomePage onNavigate={setPage} onOpenOverlay={openOverlay} onNavigateToCandidate={navigateToCandidate} onNavigateToRole={navigateToRole} />}
        {page === "roles" && <RolesPage onEntityChange={setEntityContext} selectedRoleId={selectedRoleId} onSelectRole={setSelectedRoleId} initialCandidateName={pendingCandidateName} onCandidateConsumed={() => setPendingCandidateName(null)} />}
        {page === "candidates" && <CandidatesPage onEntityChange={setEntityContext} onNavigateToCandidate={navigateToCandidate} />}
        {page === "alts" && <AltsPage onEntityChange={setEntityContext} selectedAltId={selectedAltId} onSelectAlt={setSelectedAltId} />}
        {page === "chat" && <ChatPage />}
        {page === "org" && <OrgPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>

    {/* Alt overlay trigger — hidden on Chat page */}
    {page !== "chat" && !overlayOpen && (
      <button
        onClick={openOverlay}
        className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        title="Ask Sabu (⌘K)"
      >
        <PixelSprite size={20} />
        {nudgeBadge && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-blue animate-pulse" />
        )}
      </button>
    )}

    {/* Global Alt chat overlay */}
    <AltChatOverlay
      open={overlayOpen}
      onClose={() => { setOverlayOpen(false); setPrefillInput(null) }}
      context={{ page, entity: entityContext }}
      nudgeMessage={nudgeBadge ? nudgeMessage : null}
      prefillInput={prefillInput}
    />

    {import.meta.env.DEV && (
      <>
        <GitGraphOverlay />
        <Agentation
          endpoint="http://localhost:4747"
          onSessionCreated={() => {}}
        />
      </>
    )}
    </>
  )
}
