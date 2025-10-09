"use server";

import {
  getDateRange,
  validateArticle,
  formatArticle,
  getTodayString,
} from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";

type RawArticle = {
  id?: number | string;
  headline?: string;
  summary?: string;
  url?: string;
  datetime?: number;
  image?: string;
  source?: string;
  category?: string;
  related?: string;
};

async function fetchJSON(url: string, revalidateSeconds?: number) {
  const init: RequestInit & { next?: { revalidate: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as RawArticle[];
}

export const getNews = async (symbols?: string[]) => {
  try {
    const maxArticles = 6;
    if (symbols && symbols.length > 0) {
      const clean = Array.from(
        new Set(symbols.map((s) => (s || "").toString().trim().toUpperCase()))
      ).slice(0, 12);

      const { from, to } = getDateRange(5);
      const collected: ReturnType<typeof formatArticle>[] = [];

      // Round-robin through symbols until we have up to maxArticles
      let round = 0;
      const maxRounds = 6;
      while (collected.length < maxArticles && round < maxRounds) {
        for (
          let i = 0;
          i < clean.length && collected.length < maxArticles;
          i++
        ) {
          const symbol = clean[i];
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
              symbol
            )}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
            const articles = await fetchJSON(url, 60 * 60); // cache 1 hour
            const normalized: RawNewsArticle[] = (articles || []).map(
              (a, idx) => ({
                id:
                  typeof a.id === "number"
                    ? a.id
                    : a.id
                    ? Number(a.id)
                    : Date.now() + idx,
                headline: a.headline || "",
                summary: a.summary || "",
                url: a.url || "",
                datetime: a.datetime || Date.now(),
                image: a.image || "",
                category: a.category || "general",
                related: a.related || "",
              })
            );

            const valid = normalized.find((a) => validateArticle(a));
            if (valid) {
              collected.push(
                formatArticle(valid, true, symbol, collected.length)
              );
            }
          } catch (e) {
            // don't fail whole loop on single symbol
            console.log("getNews symbol fetch error", symbol, e);
          }
          if (collected.length >= maxArticles) break;
        }
        round++;
      }

      return collected
        .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
        .slice(0, maxArticles);
    }

    // No symbols - fetch general market news
    const today = getTodayString();
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&from=${today}&to=${today}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const general = await fetchJSON(generalUrl, 60 * 60);

    const seen = new Set<string>();
    const formatted: ReturnType<typeof formatArticle>[] = [];
    for (let i = 0; i < general.length && formatted.length < maxArticles; i++) {
      const a = general[i];
      const art: RawNewsArticle = {
        id:
          typeof a.id === "number"
            ? a.id
            : a.id
            ? Number(a.id)
            : Date.now() + i,
        headline: a.headline || "",
        summary: a.summary || "",
        url: a.url || "",
        datetime: a.datetime || Date.now(),
        image: a.image || "",
        category: a.category || "general",
        related: a.related || "",
      };
      if (!validateArticle(art)) continue;
      const dedupeKey = (art.id || art.url || art.headline || "").toString();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      formatted.push(formatArticle(art, false, undefined, i));
    }

    return formatted.slice(0, maxArticles);
  } catch (error) {
    console.log("getNews error", error);
    throw new Error("Failed to fetch news");
  }
};
