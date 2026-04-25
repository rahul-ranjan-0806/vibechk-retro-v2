import { useState, useRef, useEffect, useCallback } from "react"

interface AgenticSearchProps {
  onSearch: (query: string) => void
  onClear: () => void
  onSearchingChange?: (searching: boolean) => void
  resultCount?: number
  totalCount?: number
  placeholder?: string
  compact?: boolean
}

const MOCK_SUMMARIES: Record<string, string> = {
  "b2b": "Filtered for candidates with B2B SaaS experience — prioritized enterprise product work and platform design.",
  "systems": "Filtered for systems thinking — candidates who frame trade-offs, consider downstream effects, and think beyond the immediate ask.",
  "fintech": "Filtered for fintech experience — candidates with payments, compliance, or financial product design backgrounds.",
  "senior": "Filtered for senior-level signals — ownership, cross-functional influence, and shipped portfolio work.",
  "startup": "Filtered for startup experience — candidates who've built 0→1, worn multiple hats, or operated at early-stage companies.",
  "design system": "Filtered for design systems experience — candidates who've built or maintained component libraries and token systems.",
}

function getMockSummary(query: string): string {
  const q = query.toLowerCase()
  for (const [key, summary] of Object.entries(MOCK_SUMMARIES)) {
    if (q.includes(key)) return summary
  }
  return `Filtered candidates matching "${query}" — scored by relevance to your search criteria and past hiring patterns.`
}

export function AgenticSearch({ onSearch, onClear, onSearchingChange, resultCount, totalCount, placeholder, compact }: AgenticSearchProps) {
  const [input, setInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback((query: string) => {
    if (!query.trim()) {
      onClear()
      setSummary(null)
      return
    }
    setIsSearching(true)
    onSearchingChange?.(true)
    setSummary(null)
    timerRef.current = setTimeout(() => {
      setIsSearching(false)
      onSearchingChange?.(false)
      setSummary(getMockSummary(query))
      onSearch(query.trim())
    }, 2500)
  }, [onSearch, onClear])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      doSearch(input)
    }
  }

  const handleClear = () => {
    setInput("")
    setIsSearching(false)
    setSummary(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    onClear()
    inputRef.current?.focus()
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div className={`flex items-center gap-2 border border-border bg-background rounded-lg transition-colors focus-within:border-foreground/40 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}>
        {/* AI sparkle icon */}
        <div className="shrink-0 flex items-center gap-1">
          <svg width={compact ? "12" : "14"} height={compact ? "12" : "14"} viewBox="0 0 24 24" fill="none" className="text-[#4466ff]">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
          </svg>
          <span className={`font-pixel text-[#4466ff] font-medium ${compact ? "text-[8px]" : "text-[9px]"}`}>AI</span>
        </div>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Find candidates who..."}
          className={`flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${compact ? "text-[11px] font-pixel" : "text-xs"}`}
        />

        {input && !isSearching && (
          <button onClick={handleClear} className="text-muted-foreground hover:text-foreground text-xs leading-none px-1">
            ✕
          </button>
        )}

        {isSearching ? (
          <div className={`shrink-0 flex items-center gap-1.5 ${compact ? "text-[9px]" : "text-[10px]"} font-pixel text-[#4466ff]`}>
            <div className="w-3 h-3 border-2 border-[#4466ff]/30 border-t-[#4466ff] rounded-full animate-spin" />
            Searching...
          </div>
        ) : (
          <button
            onClick={() => doSearch(input)}
            disabled={!input.trim()}
            className={`shrink-0 font-pixel bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity rounded-md ${compact ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"}`}
          >
            Search
          </button>
        )}
      </div>

      {/* Summary card */}
      {summary && !isSearching && (
        <div className="flex items-start gap-2 px-3 py-2 bg-[#4466ff]/[0.04] border border-[#4466ff]/20 rounded-lg">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#4466ff] shrink-0 mt-0.5">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className={`leading-relaxed text-foreground ${compact ? "text-[10px]" : "text-[11px]"}`}>{summary}</p>
            {resultCount !== undefined && totalCount !== undefined && (
              <p className={`font-pixel text-muted-foreground mt-0.5 ${compact ? "text-[8px]" : "text-[9px]"}`}>
                {resultCount} of {totalCount} candidates match
              </p>
            )}
          </div>
          <button onClick={handleClear} className="text-[10px] font-pixel text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
