"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "./ui/command";
import { useRouter } from "next/navigation";

export default function SearchCommand({
  renderAs = "button",
  label = "Add Stock",
}: {
  renderAs?: "button" | "text";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    {
      symbol: string;
      description: string;
      displaySymbol?: string;
      type: string;
    }[]
  >([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMac =
        typeof navigator !== "undefined" &&
        /mac|iphone|ipad|ipod/i.test(navigator.platform);
      if (
        (isMac && e.metaKey && key === "k") ||
        (!isMac && e.ctrlKey && key === "k")
      ) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelectStock = (symbol: string) => {
    setOpen(false);
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  };

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const key = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";
    let mounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(
          searchTerm
        )}&token=${encodeURIComponent(key)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("search fetch failed");
        const dataUnknown = (await res.json()) as unknown;
        if (!mounted) return;
        const items: {
          symbol: string;
          description: string;
          displaySymbol?: string;
          type: string;
        }[] = [];
        if (
          dataUnknown &&
          typeof dataUnknown === "object" &&
          dataUnknown !== null
        ) {
          const d = dataUnknown as { [k: string]: unknown };
          const arr = Array.isArray(d.result)
            ? d.result
            : (d.result as unknown[] | undefined);
          if (Array.isArray(arr)) {
            for (const el of arr) {
              if (el && typeof el === "object") {
                const obj = el as { [k: string]: unknown };
                const symbol =
                  typeof obj.symbol === "string" ? obj.symbol : undefined;
                const description =
                  typeof obj.description === "string" ? obj.description : "";
                const displaySymbol =
                  typeof obj.displaySymbol === "string"
                    ? obj.displaySymbol
                    : undefined;
                const type = typeof obj.type === "string" ? obj.type : "";
                if (symbol)
                  items.push({ symbol, description, displaySymbol, type });
              }
            }
          }
        }
        setResults(items);
      } catch (e) {
        const err = e as unknown;
        if (
          err &&
          typeof err === "object" &&
          (err as { name?: string }).name === "AbortError"
        )
          return;
        console.error("Search error", err);
        setResults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 250);

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchTerm]);

  return (
    <div>
      {renderAs === "text" ? (
        <span className="search-text" onClick={() => setOpen(true)}>
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-xl rounded-lg border bg-white dark:bg-black p-2 shadow-lg">
            <Command>
              <CommandInput
                className="w-full rounded px-3 py-2 border"
                placeholder={loading ? "Loading..." : "Search stocks..."}
                value={searchTerm}
                onValueChange={(val: string) => setSearchTerm(val)}
              />
              <CommandList className="mt-2 max-h-60 overflow-auto">
                {searchTerm === "" ? (
                  <CommandEmpty className="p-2 text-sm text-muted-foreground">
                    Start typing to search
                  </CommandEmpty>
                ) : loading ? (
                  <CommandEmpty className="p-2 text-sm text-muted-foreground">
                    Loading...
                  </CommandEmpty>
                ) : results.length === 0 ? (
                  <CommandEmpty className="p-2 text-sm text-muted-foreground">
                    No results
                  </CommandEmpty>
                ) : (
                  <>
                    {results.map((r) => (
                      <CommandItem
                        key={r.symbol}
                        className="p-2 cursor-pointer hover:bg-slate-100"
                        onSelect={() => handleSelectStock(r.symbol)}
                      >
                        <div className="text-sm font-medium">{r.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.description}
                        </div>
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      )}
    </div>
  );
}
