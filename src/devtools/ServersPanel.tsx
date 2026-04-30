import { useCallback, useEffect, useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { branchColor } from "./branchColor"

interface ServerInfo {
  port: number
  command: string
  pid: number
  cwd: string
  branch: string | null
}

const POLL_MS = 3000

export function ServersPanel() {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch("/__git/servers", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setServers(json.servers ?? [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    }
  }, [])

  useEffect(() => {
    fetchServers()
    const id = window.setInterval(fetchServers, POLL_MS)
    return () => window.clearInterval(id)
  }, [fetchServers])

  return (
    <div
      className="absolute bottom-3 right-3 w-72 bg-card border border-border rounded-md shadow-lg overflow-hidden z-10"
      onWheel={e => e.stopPropagation()}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full px-3 py-2 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors border-b border-border"
      >
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-mono font-medium text-foreground">SERVERS</span>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {servers.length}
          </span>
        </div>
        {collapsed
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className={cn("max-h-72 overflow-y-auto")}>
          {error && (
            <div className="px-3 py-2 text-xs font-mono text-destructive">{error}</div>
          )}
          {!error && servers.length === 0 && (
            <div className="px-3 py-3 text-xs font-mono text-muted-foreground">
              no project servers running
            </div>
          )}
          {servers.map(s => (
            <a
              key={`${s.port}:${s.pid}`}
              href={`http://localhost:${s.port}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group px-3 py-1.5 flex items-center gap-2 border-b border-border/60 last:border-b-0 hover:bg-accent transition-colors"
            >
              <span className="text-[11px] font-mono font-semibold text-foreground tabular-nums w-12 shrink-0">
                {s.port}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {s.branch && (
                    <span
                      className="inline-flex items-center text-[11px] font-mono px-1 py-px rounded-sm text-white truncate max-w-[140px]"
                      style={{ backgroundColor: branchColor(s.branch) }}
                      title={s.branch}
                    >
                      {s.branch}
                    </span>
                  )}
                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {s.command}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground/70 tabular-nums truncate">
                  pid {s.pid}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
