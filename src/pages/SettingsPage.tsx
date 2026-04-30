import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 border ${on ? "bg-foreground border-foreground" : "bg-transparent border-border"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${on ? "translate-x-4 bg-background" : "translate-x-0 bg-muted-foreground"}`} />
    </button>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-none">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-muted-foreground mb-3">{title}</p>
      <div className="border border-border rounded-lg px-5">{children}</div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const apply = (next: string) => {
    if (!document.startViewTransition) { setTheme(next); return }
    document.startViewTransition(() => setTheme(next))
  }

  const options = [
    { value: "light", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> },
    { value: "system", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { value: "dark", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> },
  ]

  return (
    <div className="flex border border-border rounded-lg overflow-hidden">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => apply(o.value)}
          className={`flex items-center justify-center px-3 py-2 transition-colors ${
            theme === o.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={o.value.charAt(0).toUpperCase() + o.value.slice(1)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const [autoShortlist, setAutoShortlist] = useState(true)
  const [autoReject, setAutoReject] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [slackNotifs, setSlackNotifs] = useState(false)
  const [slackExceptional, setSlackExceptional] = useState(false)

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-[840px] mx-auto px-12 pt-16 pb-24">
      <h1 className="text-[40px] font-bold tracking-[-0.02em] leading-[48px] mb-12">Settings</h1>

      <div className="max-w-xl flex flex-col gap-10">
        <Section title="Appearance">
          <SettingRow label="Theme" description="Choose between light, system, or dark mode.">
            <ThemeToggle />
          </SettingRow>
        </Section>

        <Section title="Candidates">
          <SettingRow
            label="Auto-shortlisting"
            description="Agent automatically shortlists candidates above the score threshold and pushes them to ATS. Turn off to review and shortlist manually."
          >
            <Toggle on={autoShortlist} onChange={setAutoShortlist} />
          </SettingRow>
          <SettingRow
            label="Auto-rejection"
            description="Agent automatically rejects candidates who score below the threshold without surfacing them for review."
          >
            <Toggle on={autoReject} onChange={setAutoReject} />
          </SettingRow>
        </Section>

        <Section title="Notifications">
          <SettingRow label="Email notifications" description="Get notified by email when candidates complete their interviews.">
            <Toggle on={emailNotifs} onChange={setEmailNotifs} />
          </SettingRow>
          <SettingRow label="Slack notifications" description="Receive candidate updates in your connected Slack workspace.">
            <div className="flex flex-col items-end gap-2">
              <Toggle on={slackNotifs} onChange={v => { setSlackNotifs(v); if (!v) setSlackExceptional(false) }} />
            </div>
          </SettingRow>
          {slackNotifs && (
            <SettingRow
              label="Notify about exceptional candidates in Slack"
              description="Get a Slack message when a candidate scores significantly above the shortlist threshold — so you can fast-track them."
            >
              <Toggle on={slackExceptional} onChange={setSlackExceptional} />
            </SettingRow>
          )}
        </Section>

        <Section title="ATS">
          <SettingRow label="Connected ATS" description="Dover — connected 2 weeks ago">
            <button className="text-xs border border-border rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors">Manage</button>
          </SettingRow>
        </Section>
      </div>
      </div>
    </div>
  )
}
