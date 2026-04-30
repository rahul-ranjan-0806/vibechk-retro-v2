import type { ReactNode } from "react"

interface Crumb {
  label: string
  onClick?: () => void
}

interface Props {
  breadcrumbs: Crumb[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({ breadcrumbs, actions, className = "" }: Props) {
  return (
    <div className={`h-11 border-b border-border/60 shrink-0 flex items-center px-4 gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0 flex-1">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {b.onClick ? (
              <button onClick={b.onClick} className="hover:text-foreground truncate">{b.label}</button>
            ) : (
              <span className={i === breadcrumbs.length - 1 ? "text-foreground truncate" : "truncate"}>{b.label}</span>
            )}
          </span>
        ))}
      </div>
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
    </div>
  )
}
