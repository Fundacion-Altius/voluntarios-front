"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

export function AreaFilter({ selected, onChange }: AreaFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function toggle(area: string) {
    const next = selected.includes(area)
      ? selected.filter((a) => a !== area)
      : [...selected, area]
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="justify-between gap-2"
      >
        {selected.length === 0
          ? "Filtrar por área"
          : `${selected.length} área${selected.length > 1 ? "s" : ""} seleccionada${selected.length > 1 ? "s" : ""}`}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md">
          {AREAS.map((area) => (
            <label
              key={area}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(area)}
                onCheckedChange={() => toggle(area)}
              />
              {area}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
