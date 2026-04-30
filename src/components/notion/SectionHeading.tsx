import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  cta?: ReactNode
  className?: string
}

export function SectionHeading({ children, cta, className = "" }: Props) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h3 className="text-base font-semibold text-foreground">{children}</h3>
      {cta}
    </div>
  )
}
