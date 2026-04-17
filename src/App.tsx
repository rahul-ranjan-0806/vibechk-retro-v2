import { useState } from "react"
import { Agentation } from "agentation"
import { RolesPage } from "./pages/RolesPage"
import { AltsPage } from "./pages/AltsPage"
import { HomePage } from "./pages/HomePage"
import { OrgPage } from "./pages/OrgPage"
import { CandidatesPage } from "./pages/CandidatesPage"
import { SettingsPage } from "./pages/SettingsPage"

type Page = "home" | "roles" | "candidates" | "alts" | "org" | "settings"

export default function App() {
  const [page, setPage] = useState<Page>("home")

  return (
    <>
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-48 shrink-0 border-r border-border flex flex-col py-4 px-2 gap-0.5 bg-background">
        <div className="px-3 mb-5">
          <span className="font-pixel text-sm font-medium tracking-widest text-foreground">vibechk</span>
        </div>

        <p className="text-[9px] font-pixel uppercase tracking-[0.15em] px-3 mb-1 text-muted-foreground">Manage</p>

        {[
          { id: "home" as Page, label: "Home",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: "roles" as Page, label: "Roles", badge: 3,
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
          { id: "candidates" as Page, label: "Candidates",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: "alts" as Page, label: "Alts",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
          { id: "org" as Page, label: "Org",
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h0M9 12h0M9 15h0M9 18h0"/></svg> },
        ].map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left font-pixel ${
              page === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}>
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {(item as any).badge && (
              <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded-sm ${page === item.id ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"}`}>
                {(item as any).badge}
              </span>
            )}
          </button>
        ))}

        <p className="text-[9px] font-pixel uppercase tracking-[0.15em] px-3 mb-1 mt-3 text-muted-foreground">Configure</p>
        <button onClick={() => setPage("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left font-pixel ${
            page === "settings" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          <span className="flex-1">Settings</span>
        </button>

        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[10px] font-pixel font-medium text-background">SG</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-pixel truncate">Sashank G.</p>
              <p className="text-[10px] font-pixel text-muted-foreground truncate">Alt Inc</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {page === "home" && <HomePage onNavigate={setPage} />}
        {page === "roles" && <RolesPage />}
        {page === "candidates" && <CandidatesPage />}
        {page === "alts" && <AltsPage />}
        {page === "org" && <OrgPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
    {import.meta.env.DEV && (
      <Agentation
        endpoint="http://localhost:4747"
        onSessionCreated={(sessionId) => {
          console.log("Session started:", sessionId);
        }}
      />
    )}
    </>
  )
}
