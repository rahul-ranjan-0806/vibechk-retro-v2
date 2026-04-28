import { useState, useRef, useEffect } from "react"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/combobox-primitives"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ComboboxProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  onFocus?: () => void
  className?: string
  style?: React.CSSProperties
  highlighted?: boolean
  highlightRing?: string
}

export function Combobox({
  value,
  options,
  onChange,
  onFocus,
  className,
  style,
  highlighted,
  highlightRing,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const handleSelect = (opt: string) => {
    onChange(opt)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => { setOpen(true); onFocus?.() }}
          className={cn(
            "tpl-element inline-flex items-center gap-1 rounded-md text-white font-medium outline-none px-2 py-0.5 mx-0.5 cursor-pointer transition-all focus:ring-2 focus:ring-white/30 text-sm",
            highlighted && highlightRing,
            className,
          )}
          style={{
            ...style,
            WebkitAppearance: "none",
          }}
        >
          <span className="truncate">{value}</span>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="shrink-0 ml-0.5 opacity-80">
            <path d="M1 1l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0 border-border shadow-lg"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Command shouldFilter={true}>
          <CommandInput
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Search..."
            className="text-sm"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
              No match
            </CommandEmpty>
            {options.map(opt => (
              <CommandItem
                key={opt}
                value={opt}
                onSelect={() => handleSelect(opt)}
                className={cn(
                  "text-sm cursor-pointer",
                  opt === value && "font-medium bg-accent",
                )}
              >
                {opt === value && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-foreground">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className={opt === value ? "" : "pl-[20px]"}>{opt}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
