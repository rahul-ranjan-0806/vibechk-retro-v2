import { useState } from "react"
import { Agentation } from "agentation"
import { GitGraphOverlay } from "./devtools/GitGraphOverlay"
import { RolesPage } from "./pages/RolesPage"
import { AltsPage } from "./pages/AltsPage"
import { HomePage } from "./pages/HomePage"
import { OrgPage } from "./pages/OrgPage"
import { CandidatesPage } from "./pages/CandidatesPage"
import { SettingsPage } from "./pages/SettingsPage"
import { ChatPage } from "./pages/ChatPage"

type Page = "home" | "roles" | "candidates" | "alts" | "chat" | "org" | "settings"

function NavTooltip({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="relative group/nav">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-foreground text-background text-[10px] font-pixel rounded-md whitespace-nowrap opacity-0 group-hover/nav:opacity-100 pointer-events-none z-50 transition-opacity delay-100">
        <p className="font-medium text-[11px]">{label}</p>
        <p className="text-background/60 text-[9px]">{description}</p>
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("chat")
  const [navCollapsed, setNavCollapsed] = useState(false)

  return (
    <>
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className={`${navCollapsed ? "w-14" : "w-48"} shrink-0 border-r border-border flex flex-col py-4 gap-0.5 bg-background transition-all duration-200 ${navCollapsed ? "overflow-visible" : "overflow-hidden"}`}>
        <div className={`${navCollapsed ? "px-0 flex justify-center" : "px-5 flex items-center justify-between"} mb-5`}>
          {navCollapsed
            ? <button onClick={() => setNavCollapsed(false)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5" title="Expand sidebar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9l3 3-3 3"/>
                </svg>
              </button>
            : <>
                <span className="font-pixel text-sm font-medium tracking-widest text-foreground">vibechk</span>
                <button onClick={() => setNavCollapsed(true)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5" title="Collapse sidebar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M16 15l-3-3 3-3"/>
                  </svg>
                </button>
              </>
          }
        </div>

        {!navCollapsed && <p className="text-[9px] font-pixel uppercase tracking-[0.15em] px-5 mb-1 text-muted-foreground">Manage</p>}

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
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center ${navCollapsed ? "justify-center px-0" : "gap-2.5 px-5"} py-2 text-sm transition-colors text-left font-pixel ${
                page === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}>
              <span className="shrink-0">{item.icon}</span>
              {!navCollapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
              {!navCollapsed && (item as any).badge && (
                <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded-sm ${page === item.id ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"}`}>
                  {(item as any).badge}
                </span>
              )}
            </button>
          )
          return navCollapsed
            ? <NavTooltip key={item.id} label={item.label} description={item.description}>{btn}</NavTooltip>
            : btn
        })}

        {!navCollapsed && <p className="text-[9px] font-pixel uppercase tracking-[0.15em] px-5 mb-1 mt-3 text-muted-foreground">Configure</p>}
        {(() => {
          const settingsBtn = (
            <button onClick={() => setPage("settings")}
              className={`w-full flex items-center ${navCollapsed ? "justify-center px-0 mt-2" : "gap-2.5 px-5"} py-2 text-sm transition-colors text-left font-pixel ${
                page === "settings" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              {!navCollapsed && <span className="flex-1 whitespace-nowrap">Settings</span>}
            </button>
          )
          return navCollapsed ? <NavTooltip label="Settings" description="Preferences and integrations">{settingsBtn}</NavTooltip> : settingsBtn
        })()}

        <div className="mt-auto flex flex-col gap-1">
          <div className="pt-2 border-t border-border">
            <div className={`flex items-center ${navCollapsed ? "justify-center px-0" : "gap-2 px-5"} py-1.5`}>
              <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[10px] font-pixel font-medium text-background shrink-0">SG</div>
              {!navCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-pixel truncate">Sashank G.</p>
                  <p className="text-[10px] font-pixel text-muted-foreground truncate">Alt Inc</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {page === "home" && <HomePage onNavigate={setPage} />}
        {page === "roles" && <RolesPage />}
        {page === "candidates" && <CandidatesPage />}
        {page === "alts" && <AltsPage />}
        {page === "chat" && <ChatPage />}
        {page === "org" && <OrgPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
    {import.meta.env.DEV && (
      <>
        <GitGraphOverlay />
        <Agentation
          endpoint="http://localhost:4747"
          onSessionCreated={(sessionId) => {
            console.log("Session started:", sessionId);
          }}
        />
      </>
    )}
    </>
  )
}
