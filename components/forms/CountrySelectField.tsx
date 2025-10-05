"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import countryList from "react-select-country-list";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

type FieldError = { message?: string };

type Country = { value: string; label: string };

type Props = {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: FieldError | undefined;
  placeholder?: string;
};

const CountrySelectField = ({
  name = "country",
  value,
  onChange,
  error,
  placeholder = "Select your country",
}: Props) => {
  const countries: Country[] = useMemo(
    () => countryList().getData() as Country[],
    []
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = countries.find((c: Country) => c.value === value);

  // Keep a local editable query string. Always render the input from `query` so it's editable.
  // When the external `value` changes (for example defaultValues or selection), sync the
  // query to show the selected country's label.
  useEffect(() => {
    if (selected) setQuery(selected.label);
    else setQuery("");
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries.slice(0, 10);
    return countries
      .filter((c: Country) => c.label.toLowerCase().includes(q))
      .slice(0, 10);
  }, [countries, query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // keyboard navigation
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        const opt = filtered[activeIndex];
        onChange?.(opt.value);
        setQuery(opt.label);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label htmlFor={name} className="form-label">
        Country
      </Label>

      <Input
        id={name}
        placeholder={placeholder}
        // always use local query so user can type even when a selected value exists
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          // if there was a selected value, clear it when the user types to allow searching
          if (selected && onChange) onChange("");
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        className={cn("form-input")}
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-auto rounded-md border bg-gray-800 border-gray-600 text-white p-1 shadow-md">
          {filtered.map((opt: Country, idx: number) => (
            <li
              key={opt.value}
              className={cn(
                "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm",
                idx === activeIndex
                  ? "bg-gray-600 text-white"
                  : "hover:bg-gray-600 hover:text-white"
              )}
              onMouseDown={(e) => {
                // prevent blur before click
                e.preventDefault();
                onChange?.(opt.value);
                setQuery(opt.label);
                setOpen(false);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {opt.label}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-2 py-1 text-sm text-muted-foreground">
              No countries found
            </li>
          )}
        </ul>
      )}

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default CountrySelectField;
