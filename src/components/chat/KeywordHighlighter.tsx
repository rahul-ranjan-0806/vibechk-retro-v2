import { useMemo } from "react"

export type TokenType = "action" | "entity" | "value" | "plain"

export interface Token {
  text: string
  type: TokenType
  tooltip?: string
}

const ACTION_PATTERNS: [RegExp, string][] = [
  [/\b(create a role|create role|new role)\b/gi, "Action: Create role"],
  [/\b(shortlist|push to ats)\b/gi, "Action: Shortlist candidate"],
  [/\b(reject|pass on|filter out)\b/gi, "Action: Reject candidate"],
  [/\b(set threshold|change threshold|adjust threshold|set leniency)\b/gi, "Action: Set threshold"],
  [/\b(draft rejection|draft follow-?up|draft email)\b/gi, "Action: Draft message"],
  [/\b(pause role|unpause|resume role)\b/gi, "Action: Toggle role status"],
  [/\b(export|download)\b/gi, "Action: Export data"],
  [/\b(compare)\b/gi, "Action: Compare candidates"],
  [/\b(show|list|find|search|filter)\b/gi, "Action: Query"],
]

const ENTITY_PATTERNS: [RegExp, string][] = [
  [/\b(senior product designer|sr\.? product designer|product designer)\b/gi, "Role: Product Designer"],
  [/\b(senior software engineer|sr\.? software engineer|founding engineer|software engineer)\b/gi, "Role: Software Engineer"],
  [/\b(product manager|pm)\b/gi, "Role: Product Manager"],
  [/\b(product marketing lead|pmm)\b/gi, "Role: Product Marketing"],
  [/\b(priya\s*sharma?|lena\s*fischer?|daniel\s*okafor?|tom\s*walsh?|jamie\s*park?|marcus\s*chen?|arjun\s*mehta?)\b/gi, "Candidate name"],
  [/\b(b2b\s*saas?|fintech|consumer|enterprise)\b/gi, "Domain"],
  [/\b(systems thinking|trade-?offs?|cross-?functional)\b/gi, "Skill"],
]

const VALUE_PATTERNS: [RegExp, string][] = [
  [/\b(\d+)\s*(days?|weeks?|months?|hours?)\b/gi, "Duration"],
  [/\b(live|draft|paused)\b/gi, "Status"],
  [/\b(\d+)\s*\/\s*10\b/g, "Score"],
  [/\b(threshold|leniency)\s*(?:to|at|=)?\s*(\d+)\b/gi, "Threshold value"],
  [/\b(\d+)\+?\s*(?:years?|yrs?)\b/gi, "Experience"],
  [/\b(strict|cautious|balanced|trusting|full trust)\b/gi, "Leniency level"],
]

export function tokenize(text: string): Token[] {
  if (!text) return []

  // Build a list of all matches with their positions
  interface Match { start: number; end: number; type: TokenType; tooltip: string }
  const matches: Match[] = []

  const addMatches = (patterns: [RegExp, string][], type: TokenType) => {
    for (const [regex, tooltip] of patterns) {
      const re = new RegExp(regex.source, regex.flags)
      let m
      while ((m = re.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, type, tooltip })
      }
    }
  }

  addMatches(ACTION_PATTERNS, "action")
  addMatches(ENTITY_PATTERNS, "entity")
  addMatches(VALUE_PATTERNS, "value")

  // Sort by start position, longer matches first for ties
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))

  // Remove overlapping matches (keep first/longest)
  const filtered: Match[] = []
  let lastEnd = 0
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m)
      lastEnd = m.end
    }
  }

  // Build token list
  const tokens: Token[] = []
  let pos = 0
  for (const m of filtered) {
    if (m.start > pos) {
      tokens.push({ text: text.slice(pos, m.start), type: "plain" })
    }
    tokens.push({ text: text.slice(m.start, m.end), type: m.type, tooltip: m.tooltip })
    pos = m.end
  }
  if (pos < text.length) {
    tokens.push({ text: text.slice(pos), type: "plain" })
  }

  return tokens
}

const GRADIENT_STYLES: Record<TokenType, React.CSSProperties | null> = {
  action: {
    backgroundImage: "linear-gradient(90deg, #3b5eff, #00c8ff, #8b5cf6, #3b5eff)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "keyword-shimmer 3s ease-in-out infinite",
    fontWeight: 600,
  },
  entity: {
    backgroundImage: "linear-gradient(90deg, #a855f7, #ec4899, #c084fc, #a855f7)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "keyword-shimmer 3s ease-in-out infinite 0.5s",
    fontWeight: 600,
  },
  value: {
    backgroundImage: "linear-gradient(90deg, #f59e0b, #ef4444, #f97316, #f59e0b)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "keyword-shimmer 3s ease-in-out infinite 1s",
    fontWeight: 600,
  },
  plain: null,
}

export function HighlightedText({ text }: { text: string }) {
  const tokens = useMemo(() => tokenize(text), [text])

  return (
    <span>
      {tokens.map((t, i) => {
        if (t.type === "plain") return <span key={i}>{t.text}</span>
        const style = GRADIENT_STYLES[t.type]
        return (
          <span key={i} className="relative group/token inline">
            <span style={style || undefined}>
              {t.text}
            </span>
            {t.tooltip && (
              <span className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[9px] font-pixel rounded-md whitespace-nowrap opacity-0 group-hover/token:opacity-100 transition-opacity pointer-events-none z-[100] bottom-full mb-1.5">
                {t.tooltip}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-foreground" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

export function useTokens(text: string) {
  return useMemo(() => tokenize(text), [text])
}
