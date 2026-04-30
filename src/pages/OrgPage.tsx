const OPEN_ROLES = [
  { title: "Senior Product Designer", dept: "Product", location: "Remote / SF", type: "Full-time" },
  { title: "Senior Software Engineer", dept: "Engineering", location: "SF", type: "Full-time" },
  { title: "Product Manager", dept: "Product", location: "Remote / NYC", type: "Full-time" },
]

const PERKS = [
  { icon: "●", label: "Remote-first", detail: "Work from anywhere in compatible timezones (PT ±4h)." },
  { icon: "●", label: "Equity", detail: "Early-team equity grants. Standard 4-year vest, 1-year cliff." },
  { icon: "●", label: "Health", detail: "100% covered medical, dental, and vision for you + dependents." },
  { icon: "●", label: "Gear", detail: "$2,500 home office budget in your first 60 days." },
]

const ORG_ALTS = [
  { name: "Sashank's Alt", owner: "Sashank Gondala", role: "Co-founder", status: "active" as const, completeness: 85, interviews: 36, memories: 20 },
  { name: "Kinnari's Alt", owner: "Kinnari Gilganchi", role: "Product Lead", status: "setup" as const, completeness: 40, interviews: 0, memories: 3 },
  { name: "Abhishek's Alt", owner: "Abhishek Madan", role: "Co-founder", status: "setup" as const, completeness: 15, interviews: 0, memories: 1 },
]

const OFFICES = [
  { city: "San Francisco", type: "HQ", address: "548 Market St, Suite 300", timezone: "PT (UTC-8)", hiringHere: true },
  { city: "New York", type: "Office", address: "28 Liberty St, Floor 6", timezone: "ET (UTC-5)", hiringHere: true },
  { city: "Bangalore", type: "Remote hub", address: "WeWork Embassy Golf Links", timezone: "IST (UTC+5:30)", hiringHere: false },
]

const HIRING_LOCATIONS = [
  { region: "United States", locations: ["San Francisco, CA", "New York, NY", "Remote (PT ±4h)"], activeRoles: 3 },
  { region: "Europe", locations: ["London, UK", "Berlin, DE", "Remote (CET ±2h)"], activeRoles: 0 },
  { region: "India", locations: ["Bangalore", "Remote"], activeRoles: 1 },
]

export function OrgPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[840px] mx-auto px-12 pt-16 pb-24 flex flex-col gap-12">

        {/* Hero */}
        <section className="flex items-start gap-5">
          <div className="w-14 h-14 shrink-0 rounded-md bg-foreground flex items-center justify-center text-background text-lg font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[13px] font-semibold text-foreground">Careers</span>
              <span className="text-xs text-muted-foreground">· alt.inc/careers</span>
              <button className="ml-auto text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                Preview page ↗
              </button>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Alt Inc.</h1>
            <p className="text-sm leading-relaxed text-foreground max-w-2xl">
              We're building AI avatars that scale founder taste. Our Alts conduct pre-screening conversations
              so small teams can hire like they have a recruiting org behind them — without losing the signal
              that makes their bar special.
            </p>
          </div>
        </section>

        {/* Quick facts */}
        <section>
          <p className="text-[13px] font-semibold text-foreground mb-2">About</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Team size", value: "12" },
              { label: "Headquarters", value: "San Francisco" },
              { label: "Founded", value: "2024" },
              { label: "Stage", value: "Seed" },
            ].map(s => (
              <div key={s.label} className="p-3.5 rounded-lg bg-muted/40 border border-border">
                <p className="text-[13px] font-semibold text-foreground mb-1.5">{s.label}</p>
                <p className="text-base font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section>
          <p className="text-[13px] font-semibold text-foreground mb-2">Mission</p>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm leading-relaxed">
              Hiring today scales linearly with founder time, and founders don't scale. Alt Inc. gives every
              founder a thinking partner trained on their voice, values, and past decisions — so the bar stays
              consistent as the team grows.
            </p>
          </div>
        </section>

        {/* Perks */}
        <section>
          <p className="text-[13px] font-semibold text-foreground mb-2">Perks & benefits</p>
          <div className="grid grid-cols-2 gap-2">
            {PERKS.map(p => (
              <div key={p.label} className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-card">
                <span className="text-accent-blue text-xs mt-1 shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-0.5">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Organisation Alts */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-foreground">Alts</p>
            <span className="text-xs text-muted-foreground">{ORG_ALTS.filter(a => a.status === "active").length} active · {ORG_ALTS.length} total</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            {ORG_ALTS.map((alt, i) => (
              <div key={alt.name} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center text-xs font-medium text-background">
                    {alt.owner.split(" ").map(p => p[0]).join("")}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${alt.status === "active" ? "bg-status-success-dot" : "bg-muted-foreground/40"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{alt.name}</p>
                    <span className={`text-xs rounded-md px-1.5 py-0.5 ${alt.status === "active" ? "bg-status-success text-status-success-foreground" : "bg-muted text-muted-foreground"}`}>
                      {alt.status === "active" ? "Active" : "Setup"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{alt.owner} · {alt.role}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-medium tabular-nums">{alt.interviews}</p>
                    <p className="text-xs text-muted-foreground">interviews</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium tabular-nums">{alt.memories}</p>
                    <p className="text-xs text-muted-foreground">memories</p>
                  </div>
                  <div className="w-16">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${alt.completeness}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{alt.completeness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offices & locations */}
        <section>
          <p className="text-[13px] font-semibold text-foreground mb-2">Offices</p>
          <div className="grid grid-cols-3 gap-3">
            {OFFICES.map(o => (
              <div key={o.city} className="p-3.5 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium">{o.city}</p>
                  <span className="text-xs rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground">{o.type}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">{o.address}</p>
                <p className="text-xs text-muted-foreground">{o.timezone}</p>
                {o.hiringHere && (
                  <span className="inline-block mt-2 text-xs rounded-md px-1.5 py-0.5 bg-status-success text-status-success-foreground">Hiring here</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Hiring locations */}
        <section>
          <p className="text-[13px] font-semibold text-foreground mb-2">Hiring locations</p>
          <div className="border border-border rounded-lg overflow-hidden">
            {HIRING_LOCATIONS.map((h, i) => (
              <div key={h.region} className={`flex items-start gap-4 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{h.region}</p>
                  <p className="text-[11px] text-muted-foreground">{h.locations.join(" · ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  {h.activeRoles > 0 ? (
                    <span className="text-xs rounded-md px-1.5 py-0.5 bg-status-success text-status-success-foreground">{h.activeRoles} active role{h.activeRoles !== 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No open roles</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open roles */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-foreground">Open roles</p>
            <span className="text-xs text-muted-foreground">{OPEN_ROLES.length} open</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            {OPEN_ROLES.map((r, i) => (
              <div key={r.title} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">{r.dept} · {r.location} · {r.type}</p>
                </div>
                <button className="text-xs rounded-md px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors shrink-0">
                  Edit posting →
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
