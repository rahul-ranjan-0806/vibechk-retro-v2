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

export function OrgPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-8 flex flex-col gap-8">

        {/* Hero */}
        <section className="flex items-start gap-5">
          <div className="w-14 h-14 shrink-0 bg-foreground flex items-center justify-center text-background font-pixel text-lg font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-pixel uppercase tracking-[0.15em] text-muted-foreground">Careers</span>
              <span className="text-[10px] font-pixel text-muted-foreground">· alt.inc/careers</span>
              <button className="ml-auto text-[10px] font-pixel px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                Preview page ↗
              </button>
            </div>
            <h1 className="text-2xl font-medium mb-2">Alt Inc.</h1>
            <p className="text-sm leading-relaxed text-foreground max-w-2xl">
              We're building AI avatars that scale founder taste. Our Alts conduct pre-screening conversations
              so small teams can hire like they have a recruiting org behind them — without losing the signal
              that makes their bar special.
            </p>
          </div>
        </section>

        {/* Quick facts */}
        <section>
          <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">About</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Team size", value: "12" },
              { label: "Headquarters", value: "San Francisco" },
              { label: "Founded", value: "2024" },
              { label: "Stage", value: "Seed" },
            ].map(s => (
              <div key={s.label} className="p-3.5 bg-muted/40 border border-border">
                <p className="text-[9px] font-pixel uppercase tracking-widest text-muted-foreground mb-1.5">{s.label}</p>
                <p className="text-base font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section>
          <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Mission</p>
          <div className="p-4 bg-muted/30 border border-border">
            <p className="text-sm leading-relaxed">
              Hiring today scales linearly with founder time, and founders don't scale. Alt Inc. gives every
              founder a thinking partner trained on their voice, values, and past decisions — so the bar stays
              consistent as the team grows.
            </p>
          </div>
        </section>

        {/* Perks */}
        <section>
          <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground mb-2">Perks & benefits</p>
          <div className="grid grid-cols-2 gap-2">
            {PERKS.map(p => (
              <div key={p.label} className="flex items-start gap-2.5 p-3 border border-border bg-card">
                <span className="text-[#4466ff] text-[10px] mt-1 shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-0.5">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open roles */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-pixel uppercase tracking-[0.15em] text-muted-foreground">Open roles</p>
            <span className="text-[10px] font-pixel text-muted-foreground">{OPEN_ROLES.length} open</span>
          </div>
          <div className="border border-border overflow-hidden">
            {OPEN_ROLES.map((r, i) => (
              <div key={r.title} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[11px] font-pixel text-muted-foreground">{r.dept} · {r.location} · {r.type}</p>
                </div>
                <button className="text-[10px] font-pixel px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors shrink-0">
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
