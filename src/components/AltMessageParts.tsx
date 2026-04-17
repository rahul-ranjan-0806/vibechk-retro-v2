import { useMemo, useState } from "react"
import {
  CANDIDATES,
  roleTitle,
  type AltMsgPart,
  type CtaOption,
  type CtaSemantic,
} from "@/lib/mockData"

// ─── Semantic button styling ──────────────────────────────────

const CTA_BASE =
  "text-[11px] font-pixel px-3 py-1.5 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"

const CTA_VARIANTS: Record<CtaSemantic, string> = {
  primary: "bg-foreground text-background hover:opacity-90",
  neutral:
    "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
  success: "bg-[#3B6D11] text-white hover:opacity-90",
  destructive: "bg-[#A32D2D] text-white hover:opacity-90",
  warning: "bg-[#854F0B] text-white hover:opacity-90",
  info: "bg-[#4466ff] text-white hover:opacity-90",
}

const DONE_STYLE = "bg-muted text-muted-foreground cursor-default"
const DIMMED_STYLE = "bg-muted/40 text-muted-foreground cursor-default opacity-60"

// ─── Single CTA ───────────────────────────────────────────────

function CtaPart({ label, semantic = "primary", hint }: { label: string; semantic?: CtaSemantic; hint?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      disabled={done}
      onClick={() => setDone(true)}
      className={`${CTA_BASE} ${done ? DONE_STYLE : CTA_VARIANTS[semantic]}`}
    >
      {done ? <>✓ Done</> : (
        <>
          <span>{label}</span>
          {hint && <span className="text-[9px] opacity-70">· {hint}</span>}
        </>
      )}
    </button>
  )
}

// ─── CTA group (2+ options) ──────────────────────────────────

function CtaGroupPart({ options }: { options: CtaOption[] }) {
  const [chosen, setChosen] = useState<number | null>(null)
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o, i) => {
        const isChosen = chosen === i
        const isDimmed = chosen !== null && !isChosen
        return (
          <button
            key={i}
            disabled={chosen !== null}
            onClick={() => setChosen(i)}
            className={`${CTA_BASE} ${
              isChosen
                ? DONE_STYLE
                : isDimmed
                ? DIMMED_STYLE
                : CTA_VARIANTS[o.semantic ?? "neutral"]
            }`}
          >
            {isChosen ? <>✓ {o.label}</> : (
              <>
                <span>{o.label}</span>
                {o.hint && <span className="text-[9px] opacity-70">· {o.hint}</span>}
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────

function TogglePart({ label, description, defaultOn = false }: { label: string; description?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5 border border-border bg-background">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-pixel font-medium">{label}</p>
        {description && <p className="text-[10px] font-pixel text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => setOn(v => !v)}
        role="switch"
        aria-checked={on}
        className={`relative shrink-0 w-9 h-4 border border-border transition-colors ${on ? "bg-[#4466ff]" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0 bottom-0 w-[14px] transition-all ${
            on ? "right-0 bg-white" : "left-0 bg-foreground"
          }`}
        />
      </button>
    </div>
  )
}

// ─── Document download ──────────────────────────────────────

function fileTypeTint(t: string) {
  const l = t.toLowerCase()
  if (l.includes("pdf")) return "bg-[#FCEBEB] text-[#A32D2D]"
  if (l.includes("csv") || l.includes("xls")) return "bg-[#EAF3DE] text-[#3B6D11]"
  if (l.includes("md") || l.includes("markdown")) return "bg-[#FAEEDA] text-[#854F0B]"
  return "bg-muted text-muted-foreground"
}

function DocumentPart({ title, filetype, size, note }: { title: string; filetype: string; size: string; note?: string }) {
  const [downloaded, setDownloaded] = useState(false)
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 border border-border bg-background">
      <div className={`w-10 h-12 flex items-center justify-center text-[9px] font-pixel font-bold shrink-0 ${fileTypeTint(filetype)}`}>
        {filetype.slice(0, 4).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-pixel font-medium truncate">{title}</p>
        <p className="text-[10px] font-pixel text-muted-foreground">{filetype} · {size}</p>
        {note && <p className="text-[10px] font-pixel text-muted-foreground mt-1 leading-relaxed">{note}</p>}
      </div>
      <button
        disabled={downloaded}
        onClick={() => setDownloaded(true)}
        className={`${CTA_BASE} shrink-0 self-center ${downloaded ? DONE_STYLE : CTA_VARIANTS.neutral}`}
      >
        {downloaded ? <>✓ Saved</> : <>↓ Download</>}
      </button>
    </div>
  )
}

// ─── Report ─────────────────────────────────────────────────

function ReportPart({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle?: string
  rows: { label: string; value: string; emphasis?: "positive" | "negative" | "neutral" }[]
}) {
  const emphasisColor = (e?: "positive" | "negative" | "neutral") => {
    if (e === "positive") return "text-[#3B6D11]"
    if (e === "negative") return "text-[#A32D2D]"
    return "text-foreground"
  }
  return (
    <div className="border border-border bg-background">
      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <p className="text-[10px] font-pixel uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
        {subtitle && <p className="text-[10px] font-pixel text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div>
        {rows.map((r, i) => (
          <div key={i} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
            <span className="text-[11px] font-pixel text-muted-foreground">{r.label}</span>
            <span className={`text-[11px] font-pixel tabular-nums ${emphasisColor(r.emphasis)}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Candidate ref ──────────────────────────────────────────

function CandidateRefPart({ candidateId, note }: { candidateId: string; note?: string }) {
  const c = useMemo(() => CANDIDATES.find(x => x.id === candidateId), [candidateId])
  if (!c) return null
  const scoreBg =
    c.altRec === "shortlist" ? "bg-[#EAF3DE] text-[#3B6D11]" :
    c.altRec === "reject" ? "bg-[#FCEBEB] text-[#A32D2D]" :
    "bg-[#FAEEDA] text-[#854F0B]"
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 border border-border bg-background">
      <div className={`w-9 h-9 flex items-center justify-center text-sm font-medium shrink-0 ${scoreBg}`}>
        {c.score}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[11px] font-pixel font-medium">{c.name}</p>
          <span className="text-[10px] font-pixel text-muted-foreground">{roleTitle(c.roleId)}</span>
          <span className="text-[10px] font-pixel text-muted-foreground">· {c.completedAt}</span>
        </div>
        {note && <p className="text-[10px] font-pixel text-muted-foreground mt-1">{note}</p>}
      </div>
    </div>
  )
}

// ─── Evidence quote ─────────────────────────────────────────

function EvidencePart({ quote, source, date }: { quote: string; source: string; date?: string }) {
  return (
    <div className="border-l-2 border-[#4466ff] bg-[#4466ff]/[0.04] pl-3 pr-3 py-2">
      <p className="text-[11px] leading-relaxed italic text-foreground">"{quote}"</p>
      <p className="text-[10px] font-pixel text-muted-foreground mt-1.5">
        — {source}{date && <span> · {date}</span>}
      </p>
    </div>
  )
}

// ─── Checklist ──────────────────────────────────────────────

function ChecklistPart({
  title,
  items,
  submitLabel = "Apply",
}: {
  title?: string
  items: { id: string; label: string; description?: string; defaultChecked?: boolean }[]
  submitLabel?: string
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map(i => [i.id, i.defaultChecked ?? false]))
  )
  const [applied, setApplied] = useState(false)
  const selectedCount = Object.values(checked).filter(Boolean).length

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="border border-border bg-background">
      {title && (
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-[10px] font-pixel uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
        </div>
      )}
      <div>
        {items.map((item, i) => {
          const on = checked[item.id]
          return (
            <button
              key={item.id}
              onClick={() => !applied && toggle(item.id)}
              disabled={applied}
              className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${i > 0 ? "border-t border-border" : ""} ${applied ? "cursor-default" : "hover:bg-muted/30"}`}
            >
              <span className={`text-[11px] font-pixel mt-0.5 shrink-0 w-4 h-4 border border-foreground flex items-center justify-center ${on ? "bg-foreground text-background" : "bg-background"}`}>
                {on ? "✓" : ""}
              </span>
              <span className="flex-1 min-w-0">
                <p className={`text-[11px] font-pixel ${on ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</p>
                {item.description && (
                  <p className="text-[10px] font-pixel text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <div className="px-3 py-2 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
        <span className="text-[10px] font-pixel text-muted-foreground">
          {applied
            ? `Applied ${selectedCount} · undo within 5s`
            : `${selectedCount} of ${items.length} selected`}
        </span>
        <button
          disabled={applied || selectedCount === 0}
          onClick={() => setApplied(true)}
          className={`${CTA_BASE} ${
            applied ? DONE_STYLE : selectedCount === 0 ? DIMMED_STYLE : CTA_VARIANTS.primary
          }`}
        >
          {applied ? <>✓ Applied</> : submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Dispatcher ────────────────────────────────────────────

export function AltMessagePart({ part }: { part: AltMsgPart }) {
  switch (part.kind) {
    case "cta":
      return <CtaPart label={part.label} semantic={part.semantic} hint={part.hint} />
    case "cta-group":
      return <CtaGroupPart options={part.options} />
    case "toggle":
      return <TogglePart label={part.label} description={part.description} defaultOn={part.defaultOn} />
    case "document":
      return <DocumentPart title={part.title} filetype={part.filetype} size={part.size} note={part.note} />
    case "report":
      return <ReportPart title={part.title} subtitle={part.subtitle} rows={part.rows} />
    case "candidate-ref":
      return <CandidateRefPart candidateId={part.candidateId} note={part.note} />
    case "evidence":
      return <EvidencePart quote={part.quote} source={part.source} date={part.date} />
    case "checklist":
      return <ChecklistPart title={part.title} items={part.items} submitLabel={part.submitLabel} />
  }
}
