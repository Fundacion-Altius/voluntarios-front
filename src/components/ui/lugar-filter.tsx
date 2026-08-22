"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LUGARES = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
] as const

interface LugarFilterProps {
  selected: string[]
  onChange: (lugares: string[]) => void
}

function describeSelection(count: number): string {
  if (count === 0) return ""
  const plural = count > 1
  return `${count} lugar${plural ? "es" : ""} seleccionado${plural ? "s" : ""}`
}

export function LugarFilter({ selected: initialSelected, onChange }: LugarFilterProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [internalSelected, setInternalSelected] = useState<string[]>(initialSelected)

  // Sync when parent changes selected prop
  useEffect(() => {
    setInternalSelected(initialSelected)
  }, [initialSelected])

  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])

  const triggerId = "lugar-filter-trigger"
  const listboxId = "lugar-filter-listbox"

  const isSelected = (lugar: string) => internalSelected.includes(lugar)

  function toggle(lugar: string) {
    const next = isSelected(lugar)
      ? internalSelected.filter((l) => l !== lugar)
      : [...internalSelected, lugar]
    setInternalSelected(next)
    onChange(next)
  }

  // Click-outside-to-close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const container = listboxRef.current?.closest?.(".relative") ?? null
      if (container && !container.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard handling
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      const len = LUGARES.length

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, len - 1)
            optionRefs.current[next]?.focus()
            return next
          })
          break
        }
        case "ArrowUp": {
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0)
            optionRefs.current[next]?.focus()
            return next
          })
          break
        }
        case "Home": {
          e.preventDefault()
          setFocusedIndex(0)
          optionRefs.current[0]?.focus()
          break
        }
        case "End": {
          e.preventDefault()
          setFocusedIndex(len - 1)
          optionRefs.current[len - 1]?.focus()
          break
        }
        case "Enter":
        case " ": {
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < len) {
            toggle(LUGARES[focusedIndex])
          }
          break
        }
        case "Tab": {
          e.preventDefault()
          if (e.shiftKey) {
            setFocusedIndex((prev) => {
              const next = prev <= 0 ? len - 1 : prev - 1
              optionRefs.current[next]?.focus()
              return next
            })
          } else {
            setFocusedIndex((prev) => {
              const next = prev >= len - 1 ? 0 : prev + 1
              optionRefs.current[next]?.focus()
              return next
            })
          }
          break
        }
        case "Escape": {
          e.preventDefault()
          setOpen(false)
          triggerRef.current?.focus()
          break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, focusedIndex])

  // Focus first / selected option on open
  useEffect(() => {
    if (open) {
      const selectedIdx = LUGARES.findIndex((l) => isSelected(l))
      const target = selectedIdx >= 0 ? selectedIdx : 0
      setFocusedIndex(target)
      optionRefs.current[target]?.focus()
    }
  }, [open])

  return (
    <div className="relative">
      {/* Visually-hidden label for aria-labelledby resolution */}
      <span id={triggerId} className="sr-only">
        Lugares
      </span>

      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        id={triggerId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setOpen(!open)}
        className="justify-between gap-2"
      >
        {internalSelected.length === 0
          ? "Filtrar por lugar"
          : describeSelection(internalSelected.length)}
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>

      {open && (
        <div
          ref={listboxRef}
          role="listbox"
          id={listboxId}
          aria-label="Lugares"
          aria-multiselectable="true"
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md"
        >
          {LUGARES.map((lugar, index) => (
            <div
              key={lugar}
              ref={(el) => {
                optionRefs.current[index] = el
              }}
              role="option"
              id={`lugar-option-${index}`}
              aria-selected={isSelected(lugar)}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => {
                toggle(lugar)
                optionRefs.current[index]?.focus()
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                "hover:bg-accent",
                "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                isSelected(lugar) ? "bg-accent" : ""
              )}
            >
              {lugar}
              {isSelected(lugar) && (
                <Check
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Visually-hidden live region for selection announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
      >
        {describeSelection(internalSelected.length)}
      </div>
    </div>
  )
}
