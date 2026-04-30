import type { ReactNode } from "react"

interface Props {
  icon?: ReactNode
  title: ReactNode
  body?: ReactNode
  cta?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, body, cta, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {icon && <div className="mb-3 text-muted-foreground/60">{icon}</div>}
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      {body && <p className="text-xs text-muted-foreground max-w-sm">{body}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}
