import React from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Params = {
  params: Promise<{
    symbol: string;
  }>;
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";

async function fetchProfile(symbol: string) {
  const url = `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(
    symbol
  )}&token=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return (await res.json()) as Record<string, unknown>;
}

async function fetchQuote(symbol: string) {
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(
    symbol
  )}&token=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch quote");
  return (await res.json()) as Record<string, unknown>;
}

export default async function StockPage({ params }: Params) {
  const resolved = await params;
  const symbol = resolved.symbol?.toUpperCase();
  let profile: Record<string, unknown> | null = null;
  let quote: Record<string, unknown> | null = null;

  try {
    [profile, quote] = await Promise.all([
      fetchProfile(symbol),
      fetchQuote(symbol),
    ]);
  } catch (e) {
    console.error("Stock fetch error", e);
  }

  const getProfileStr = (key: string) => {
    if (!profile || typeof profile !== "object") return "—";
    const v = profile[key];
    return typeof v === "string" && v ? v : "—";
  };

  const getQuoteNum = (key: string) => {
    if (!quote || typeof quote !== "object") return "—";
    const v = quote[key];
    return typeof v === "number"
      ? v
      : typeof v === "string" && v
      ? Number(v)
      : "—";
  };

  const current = getQuoteNum("c");
  const prevClose = getQuoteNum("pc");

  const change =
    typeof current === "number" && typeof prevClose === "number" && prevClose
      ? current - prevClose
      : null;
  const changePct =
    typeof change === "number" && typeof prevClose === "number" && prevClose
      ? (change / prevClose) * 100
      : null;

  const priceBadgeClass =
    change && change > 0
      ? "text-emerald-400"
      : change && change < 0
      ? "text-rose-400"
      : "text-gray-300";

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{symbol}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {getProfileStr("name") !== "—"
                ? getProfileStr("name")
                : "Company details not found"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`text-2xl font-semibold ${priceBadgeClass}`}>
                {typeof current === "number" ? `$${current.toFixed(2)}` : "—"}
              </div>
              <div className="text-sm text-gray-400">
                {typeof change === "number" && typeof changePct === "number"
                  ? `${change >= 0 ? "+" : ""}${change.toFixed(2)} (${
                      changePct >= 0 ? "+" : ""
                    }${changePct.toFixed(2)}%)`
                  : "—"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Avatar className="h-12 w-12">
                  {getProfileStr("logo") !== "—" ? (
                    <AvatarImage
                      src={String(getProfileStr("logo"))}
                      alt={`${symbol} logo`}
                    />
                  ) : null}
                  <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                    {symbol ? String(symbol).slice(0, 3) : "—"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            {/* TradingView chart (client) */}
            <TradingViewWidget
              title={symbol}
              scriptUrl={"https://s3.tradingview.com/tv.js"}
              config={{
                symbol: `${symbol}`,
                interval: "60",
                timezone: "Etc/UTC",
                theme: "dark",
                style: "1",
                locale: "en",
              }}
              height={480}
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Price Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-xs text-gray-400">Open</div>
                <div className="font-medium">
                  {typeof getQuoteNum("o") === "number"
                    ? `$${(getQuoteNum("o") as number).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-xs text-gray-400">High</div>
                <div className="font-medium">
                  {typeof getQuoteNum("h") === "number"
                    ? `$${(getQuoteNum("h") as number).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-xs text-gray-400">Low</div>
                <div className="font-medium">
                  {typeof getQuoteNum("l") === "number"
                    ? `$${(getQuoteNum("l") as number).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-xs text-gray-400">Prev Close</div>
                <div className="font-medium">
                  {typeof prevClose === "number"
                    ? `$${prevClose.toFixed(2)}`
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold">Profile</h3>
            <dl className="mt-3 text-sm space-y-2">
              <div>
                <dt className="text-xs text-gray-400">Ticker</dt>
                <dd className="font-medium">{getProfileStr("ticker")}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Exchange</dt>
                <dd className="font-medium">{getProfileStr("exchange")}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Industry</dt>
                <dd className="font-medium">
                  {getProfileStr("finnhubIndustry")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">IPO</dt>
                <dd className="font-medium">{getProfileStr("ipo")}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Market Cap</dt>
                <dd className="font-medium">
                  {getProfileStr("marketCapitalization") !== "—"
                    ? `$${getProfileStr("marketCapitalization")}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Website</dt>
                <dd className="font-medium text-blue-400 break-words">
                  {getProfileStr("weburl")}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold">About</h3>
            <p className="mt-2 text-sm text-gray-400">
              {getProfileStr("name") !== "—"
                ? getProfileStr("name") +
                  " is listed on " +
                  getProfileStr("exchange")
                : "No company description available."}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
