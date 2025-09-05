"use client"
import * as React from "react"

type Option = {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  defaultValue?: string[]
  onChange?: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  defaultValue = [],
  onChange,
  placeholder = "Select options",
  className = "",
}: MultiSelectProps) {
  const [selected, setSelected] = React.useState<string[]>(defaultValue)

  // sync with defaultValue changes from outside (optional)
  React.useEffect(() => {
    setSelected(defaultValue)
  }, [defaultValue.join(",")])

  React.useEffect(() => {
    onChange?.(selected)
  }, [selected])

  function toggle(val: string) {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  return (
    <div className={"flex flex-wrap gap-2 " + className}>
      {options.length === 0 ? (
        <span className="text-muted-foreground">{placeholder}</span>
      ) : (
        options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded px-4 py-1 border transition-all ${
              selected.includes(opt.value)
                ? "bg-primary text-white border-primary"
                : "bg-card text-foreground border-border"
            }`}
          >
            {opt.label}
          </button>
        ))
      )}
    </div>
  )
}
