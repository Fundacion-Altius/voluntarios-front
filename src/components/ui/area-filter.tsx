"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const AREAS = [
  "Reparto de Alimentos",
  "Acompañamiento en la búsqueda de empleo",
  "Coaching",
  "Formación",
  "CEPI",
  "Nave",
  "Otra",
] as const

interface AreaFilterProps {
  selected: string[]
  onChange: (areas: string[]) => void
}

function describeSelection(count: number): string {
  if (count === 0) return ""
  const plural = count > 1
  return `${count} área${plural ? "s" : ""} seleccionada${plural ? "s" : ""}`
}

export function AreaFilter({ selected: initialSelected, onChange }: AreaFilterProps) {
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

  const triggerId = "area-filter-trigger"
  const listboxId = "area-filter-listbox"

  const isSelected = useCallback(
    (area: string) => internalSelected.includes(area),
    [internalSelected]
  )

  function toggle(area: string) {
    const next = isSelected(area)
      ? internalSelected.filter((a) => a !== area)
      : [...internalSelected, area]
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
      const len = AREAS.length

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
            toggle(AREAS[focusedIndex])
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
      const selectedIdx = AREAS.findIndex((a) => isSelected(a))
      const target = selectedIdx >= 0 ? selectedIdx : 0
      setFocusedIndex(target)
      optionRefs.current[target]?.focus()
    }
  }, [open])

  const triggerLabel = internalSelected.length === 0
    ? "Filtrar por área"
    : describeSelection(internalSelected.length)

  return (
    <div className="relative">
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
        {triggerLabel}
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
          aria-label="Áreas"
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md"
        >
          {AREAS.map((area, index) => (
            <div
              key={area}
              ref={(el) => {
                optionRefs.current[index] = el
              }}
              role="option"
              id={`area-option-${index}`}
              aria-selected={isSelected(area)}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => {
                toggle(area)
                optionRefs.current[index]?.focus()
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                "hover:bg-accent",
                "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                isSelected(area) ? "bg-accent" : ""
              )}
            >
              {area}
              {isSelected(area) && (
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
      >
        {triggerLabel}
      </div>
    </div>
  )
}
