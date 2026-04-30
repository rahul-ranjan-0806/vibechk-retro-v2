import type { ReactNode } from "react"

interface Props {
  icon?: ReactNode
  label: ReactNode
  children: ReactNode
  className?: string
}

export function PropertyRow({ icon, label, children, className = "" }: Props) {
  return (
    <div className={`flex items-start gap-3 py-1.5 ${className}`}>
      <div className="flex items-center gap-2 min-w-[140px] text-sm text-muted-foreground shrink-0">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="flex-1 min-w-0 text-sm text-foreground">{children}</div>
    </div>
  )
}
