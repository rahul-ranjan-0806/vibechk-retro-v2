import type { ReactNode } from "react"

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral"

const variantClasses: Record<StatusVariant, { bg: string; fg: string; dot: string }> = {
  success: { bg: "bg-status-success", fg: "text-status-success-foreground", dot: "bg-status-success-dot" },
  warning: { bg: "bg-status-warning", fg: "text-status-warning-foreground", dot: "bg-status-warning-dot" },
  danger: { bg: "bg-status-danger", fg: "text-status-danger-foreground", dot: "bg-status-danger-dot" },
  info: { bg: "bg-accent-blue/15", fg: "text-status-info-foreground", dot: "bg-accent-blue" },
  neutral: { bg: "bg-muted", fg: "text-muted-foreground", dot: "bg-muted-foreground/50" },
}

interface Props {
  status: StatusVariant
  children: ReactNode
  showDot?: boolean
  className?: string
}

export function StatusPill({ status, children, showDot = false, className = "" }: Props) {
  const v = variantClasses[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-1.5 py-0.5 ${v.bg} ${v.fg} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />}
      {children}
    </span>
  )
}
