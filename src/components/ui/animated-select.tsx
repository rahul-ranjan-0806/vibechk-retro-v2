import { useState } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface AnimatedSelectOption<T extends string = string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface AnimatedSelectProps<T extends string = string> {
  /** Controlled value. If omitted, the component manages its own state seeded by `defaultValue`. */
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  options: AnimatedSelectOption<T>[]
  className?: string
  contentClassName?: string
  align?: "start" | "center" | "end"
  size?: "sm" | "md"
  ariaLabel?: string
}

/**
 * Drop-in replacement for native <select>. When a non-default value is
 * active the trigger transforms into a filter chip — gradient-mask
 * reveal of a foreground-toned background, X clear button replaces the
 * chevron. Clicking the chip (not the X) opens the dropdown; X clears.
 */
export function AnimatedSelect<T extends string = string>({
  value,
  defaultValue,
  onChange,
  options,
  className,
  contentClassName,
  align = "start",
  size = "md",
  ariaLabel,
}: AnimatedSelectProps<T>) {
  const baseDefault = (defaultValue ?? options[0]?.value) as T
  const [internal, setInternal] = useState<T>(baseDefault)
  const isControlled = value !== undefined
  const current = isControlled ? (value as T) : internal
  const handleChange = (next: T) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }
  const selected = options.find(o => o.value === current) ?? options[0]
  const sizeCls = size === "sm" ? "h-7 text-[11px] px-2" : "h-8 text-xs px-2.5"
  const isFiltered = current !== baseDefault

  const clearFilter = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleChange(baseDefault)
  }

  return (
    <div className="relative inline-flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={ariaLabel}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 tabular-nums overflow-hidden",
              "transition-[background-color,color,border-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              sizeCls,
              "pr-8",
              isFiltered
                ? "border border-transparent bg-foreground text-background"
                : "border border-border bg-background hover:bg-muted/60 text-foreground",
              className,
            )}
          >
            {/* Animated label — same transformation as before */}
            <span className="relative z-10 flex items-center gap-1.5 min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={selected.value}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-1.5 min-w-0"
                >
                  {selected.icon && <span className="shrink-0">{selected.icon}</span>}
                  <span className="truncate">{selected.label}</span>
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className={cn(
            "min-w-[10rem] border-border",
            "bg-gradient-to-b from-background via-background to-muted",
            "dark:from-popover dark:via-popover dark:to-muted",
            contentClassName,
          )}
        >
          {options.map(opt => (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => handleChange(opt.value)}
              className="flex items-center justify-between gap-2 cursor-pointer text-xs"
            >
              <span className="flex items-center gap-2 min-w-0">
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="truncate">{opt.label}</span>
              </span>
              {current === opt.value && (
                <Check className="w-3.5 h-3.5 text-accent-blue shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Trailing icon — chevron when default, X when filtered.
          Wrapper is pointer-events-none so the trigger button beneath catches the click;
          the X re-enables pointer-events on itself to intercept and clear. */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isFiltered ? (
            <motion.button
              key="x"
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={clearFilter}
              aria-label="Clear filter"
              className="pointer-events-auto w-4 h-4 flex items-center justify-center rounded-sm text-background hover:bg-background/20 transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </motion.button>
          ) : (
            <motion.span
              key="chev"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center justify-center"
            >
              <ChevronDown className="w-3 h-3 opacity-50" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
