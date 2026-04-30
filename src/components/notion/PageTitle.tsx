import type { ReactNode } from "react"

interface Props {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}

export function PageTitle({ icon, title, subtitle, className = "" }: Props) {
  return (
    <div className={className}>
      {icon && <div className="flex items-center gap-3 mb-1">{icon}</div>}
      <h1 className="text-display mb-2">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
