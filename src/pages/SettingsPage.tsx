import { useState } from "react"

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative w-9 h-5 transition-colors shrink-0 border ${on ? "bg-foreground border-foreground" : "bg-transparent border-border"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 transition-transform ${on ? "translate-x-4 bg-background" : "translate-x-0 bg-muted-foreground"}`} />
    </button>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-none">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-[11px] font-pixel text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">{title}</p>
      <div className="border border-border px-4">{children}</div>
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
    <div className="p-8 overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto">
      <h1 className="text-xl font-medium mb-6">Settings</h1>

      <div className="max-w-xl">
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
            <button className="text-[10px] font-pixel border border-border px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors">Manage</button>
          </SettingRow>
        </Section>
      </div>
      </div>{/* close max-w-5xl */}
    </div>
  )
}
