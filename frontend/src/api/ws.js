// Thin WebSocket helper for live trip events.
import { tokenStore } from "./client.js";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

export function connectWs(onEvent, onStateChange) {
  const token = tokenStore.get();
  const ws = new WebSocket(`${WS_BASE}?token=${token}`);
  ws.onopen = () => onStateChange?.("open");
  ws.onclose = () => onStateChange?.("closed");
  ws.onerror = () => onStateChange?.("error");
  ws.onmessage = (m) => {
    try {
      const { event, data } = JSON.parse(m.data);
      onEvent?.(event, data);
    } catch (_) {
      /* ignore malformed frames */
    }
  };
  return {
    raw: ws,
    send: (event, data) => {
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ event, data: data || {} }));
    },
    close: () => ws.close(),
  };
}
