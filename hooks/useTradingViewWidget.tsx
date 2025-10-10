"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget?: (cfg: Record<string, unknown>) => void;
    };
  }
}

const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 600
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const configStr = JSON.stringify(config);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing content
    container.innerHTML = "";

    // Create a unique div to host the widget
    const widgetId = `tradingview_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const widgetDiv = document.createElement("div");
    widgetDiv.id = widgetId;
    widgetDiv.style.width = "100%";
    widgetDiv.style.height = `${height}px`;
    container.appendChild(widgetDiv);

    const createWidget = () => {
      if (
        !window.TradingView ||
        typeof window.TradingView.widget === "undefined"
      )
        return;
      try {
        const parsed = JSON.parse(configStr) as Record<string, unknown>;
        const cfg = { ...parsed, container_id: widgetId } as Record<
          string,
          unknown
        >;
        // Try constructor form first (some builds require `new TradingView.widget(cfg)`)
        try {
          // try constructor form: treat widget as a constructor
          const WidgetConstructor = window.TradingView.widget as unknown as {
            new (c: Record<string, unknown>): unknown;
          };
          new WidgetConstructor(cfg);
        } catch (ctorErr) {
          // Fallback to function call form
          try {
            (window.TradingView.widget as (c: Record<string, unknown>) => void)(
              cfg
            );
          } catch (callErr) {
            console.error(
              "TradingView widget instantiation failed (both constructor and call)",
              callErr,
              ctorErr
            );
          }
        }
      } catch (err) {
        console.error("TradingView widget instantiation failed", err);
      }
    };

    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement | null;

    if (window.TradingView) {
      createWidget();
    } else if (existingScript) {
      // script exists but may not yet be loaded
      const ds = existingScript.dataset;
      if (ds && ds.loaded === "true") {
        createWidget();
      } else {
        existingScript.addEventListener("load", createWidget);
      }
    } else {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        createWidget();
      };
      script.onerror = (e) =>
        console.error("Failed to load TradingView script", e);
      document.head.appendChild(script);
    }

    return () => {
      // remove widget div on cleanup
      if (container.contains(widgetDiv)) {
        container.removeChild(widgetDiv);
      }
    };
    // stringify config so effect re-runs when config changes
  }, [scriptUrl, configStr, height]);

  return containerRef;
};

export default useTradingViewWidget;
