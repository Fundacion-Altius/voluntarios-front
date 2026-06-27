"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

export function LugarFilter({ selected, onChange }: LugarFilterProps) {
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

  function toggle(lugar: string) {
    const next = selected.includes(lugar)
      ? selected.filter((l) => l !== lugar)
      : [...selected, lugar]
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
          ? "Filtrar por lugar"
          : `${selected.length} lugar${selected.length > 1 ? "es" : ""} seleccionado${selected.length > 1 ? "s" : ""}`}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md">
          {LUGARES.map((lugar) => (
            <label
              key={lugar}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(lugar)}
                onCheckedChange={() => toggle(lugar)}
              />
              {lugar}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
