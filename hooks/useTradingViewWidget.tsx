"use client";
import { useEffect, useRef } from "react";

interface TradingViewConfig {
  [key: string]: Record<string, unknown>;
}

interface CustomWindow extends Window {
  tradingViewConfigs?: TradingViewConfig;
}

declare const window: CustomWindow;

const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 600
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.dataset.loaded) return;

    // Initialize trading view configs if not exists
    if (!window.tradingViewConfigs) {
      window.tradingViewConfigs = {};
    }

    // Clear any existing content
    container.innerHTML = "";

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = `${height}px`;
    widgetContainer.style.width = "100%";
    container.appendChild(widgetContainer);

    // Generate unique widget ID and store config
    const widgetId = `tradingview_${Math.random().toString(36).substring(7)}`;
    window.tradingViewConfigs[widgetId] = config;

    // Create and inject the script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = scriptUrl;
    script.innerHTML = JSON.stringify(window.tradingViewConfigs[widgetId]);
    container.appendChild(script);
    container.dataset.loaded = "true";
    container.dataset.widgetId = widgetId;

    // Cleanup function
    return () => {
      const cleanupContainer = container;
      const cleanupWidgetId = widgetId;

      if (cleanupContainer) {
        const scripts = cleanupContainer.getElementsByTagName("script");
        Array.from(scripts).forEach((s) => s.remove());
        cleanupContainer.innerHTML = "";
        delete cleanupContainer.dataset.loaded;
        delete cleanupContainer.dataset.widgetId;

        if (window.tradingViewConfigs && cleanupWidgetId) {
          delete window.tradingViewConfigs[cleanupWidgetId];
        }
      }
    };
  }, [scriptUrl, config, height]);

  return containerRef;
};

export default useTradingViewWidget;
