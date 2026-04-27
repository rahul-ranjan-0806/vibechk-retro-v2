import { execFileSync } from "node:child_process"
import type { Plugin } from "vite"

const SEP = "\x1f"
const REC = "\x1e"

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }).trim()
}

interface ServerInfo {
  port: number
  command: string
  pid: number
  cwd: string
  branch: string | null
}

function isInsideRoot(path: string, root: string): boolean {
  if (path === root) return true
  const normalized = root.endsWith("/") ? root : root + "/"
  return path.startsWith(normalized)
}

function getCwds(pids: number[]): Map<number, string> {
  const result = new Map<number, string>()
  if (!pids.length) return result
  let out = ""
  try {
    out = execFileSync("lsof", ["-a", "-p", pids.join(","), "-d", "cwd", "-F", "pn"], {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
  } catch {
    return result
  }
  let currentPid: number | null = null
  for (const line of out.split("\n")) {
    if (!line) continue
    if (line[0] === "p") {
      currentPid = parseInt(line.slice(1), 10) || null
    } else if (line[0] === "n" && currentPid !== null) {
      const path = line.slice(1)
      if (path && path !== "cwd") result.set(currentPid, path)
    }
  }
  return result
}

function getBranchFor(cwd: string): string | null {
  try {
    const out = execFileSync("git", ["-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    return out || null
  } catch {
    return null
  }
}

function listServers(projectRoot: string): ServerInfo[] {
  let out = ""
  try {
    out = execFileSync("lsof", ["-iTCP", "-sTCP:LISTEN", "-P", "-n"], {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
    })
  } catch {
    return []
  }

  const seen = new Map<string, { port: number; command: string; pid: number }>()
  const lines = out.split("\n").slice(1)

  for (const line of lines) {
    if (!line.trim()) continue
    const cols = line.split(/\s+/)
    if (cols.length < 9) continue
    const command = cols[0]
    const pid = parseInt(cols[1], 10)
    const name = cols.slice(8).join(" ")
    const colonIdx = name.lastIndexOf(":")
    if (colonIdx === -1) continue
    const portStr = name.slice(colonIdx + 1).split(" ")[0]
    const port = parseInt(portStr, 10)
    if (!port || port < 3000 || port > 9999) continue

    const key = `${port}:${pid}`
    if (!seen.has(key)) seen.set(key, { port, command, pid })
  }

  const candidates = Array.from(seen.values())
  if (!candidates.length) return []

  const uniquePids = Array.from(new Set(candidates.map(c => c.pid)))
  const cwdMap = getCwds(uniquePids)
  const branchCache = new Map<string, string | null>()

  const enriched: ServerInfo[] = []
  for (const c of candidates) {
    const cwd = cwdMap.get(c.pid)
    if (!cwd || !isInsideRoot(cwd, projectRoot)) continue
    let branch = branchCache.get(cwd)
    if (branch === undefined) {
      branch = getBranchFor(cwd)
      branchCache.set(cwd, branch)
    }
    enriched.push({ ...c, cwd, branch })
  }

  return enriched.sort((a, b) => a.port - b.port)
}

export function gitGraphPlugin(): Plugin {
  return {
    name: "vite-plugin-git-graph",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__git/servers", (_req, res) => {
        try {
          const servers = listServers(process.cwd())
          res.setHeader("Content-Type", "application/json")
          res.setHeader("Cache-Control", "no-store")
          res.end(JSON.stringify({ servers }))
        } catch (e: any) {
          res.statusCode = 500
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ error: e?.message ?? String(e) }))
        }
      })

      server.middlewares.use("/__git/graph", (_req, res) => {
        try {
          const current = git(["rev-parse", "--abbrev-ref", "HEAD"])
          const branchNames = git(["for-each-ref", "--format=%(refname:short)", "refs/heads/"])
            .split("\n")
            .map(s => s.trim())
            .filter(Boolean)

          const branches = branchNames.map(name => {
            const raw = git([
              "log",
              `--pretty=format:%H${SEP}%h${SEP}%s${SEP}%an${SEP}%ar${SEP}%at${SEP}%P${REC}`,
              "-n", "30",
              name,
            ])
            const commits = raw
              .split(REC)
              .map(s => s.trim())
              .filter(Boolean)
              .map(line => {
                const [sha, shortSha, subject, author, date, timestamp, parents] = line.split(SEP)
                return {
                  sha,
                  shortSha,
                  subject,
                  author,
                  date,
                  timestamp: parseInt(timestamp, 10) || 0,
                  parents: (parents || "").split(" ").filter(Boolean),
                }
              })
            return { name, commits, tip: commits[0]?.sha ?? null }
          })

          res.setHeader("Content-Type", "application/json")
          res.setHeader("Cache-Control", "no-store")
          res.end(JSON.stringify({ current, branches, generatedAt: Date.now() }))
        } catch (e: any) {
          res.statusCode = 500
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ error: e?.message ?? String(e) }))
        }
      })
    },
  }
}
