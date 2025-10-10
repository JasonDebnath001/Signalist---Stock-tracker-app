"use client"

import * as React from "react"

function Command({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="command" className={className} {...props}>
      {children}
    </div>
  )
}

function CommandInput({ value, onValueChange, placeholder, className, ...props }: {
  value?: string
  onValueChange?: (v: string) => void
  placeholder?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      data-slot="command-input"
      className={className}
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  )
}

function CommandList({ children, className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul data-slot="command-list" className={className} {...props}>
      {children}
    </ul>
  )
}

function CommandEmpty({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="command-empty" className={className} {...props}>
      {children}
    </div>
  )
}

function CommandItem({ children, onSelect, className, ...props }: {
  onSelect?: () => void
  className?: string
} & React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      data-slot="command-item"
      className={className}
      onClick={() => onSelect && onSelect()}
      {...props}
    >
      {children}
    </li>
  )
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandItem }
