// WebSocket con reconexión automática y backoff exponencial.
import { tokenStore } from "./client.js";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";
const MIN_DELAY = 800;
const MAX_DELAY = 10_000;

export function connectWs(onEvent, onStateChange) {
  let dead = false;
  let delay = MIN_DELAY;
  let retryTimer = null;
  let ws = null;

  function connect() {
    const token = tokenStore.get();
    if (!token || dead) return;

    ws = new WebSocket(`${WS_BASE}?token=${token}`);

    ws.onopen = () => {
      delay = MIN_DELAY; // reset backoff al conectar con éxito
      onStateChange?.("open");
    };

    ws.onclose = () => {
      onStateChange?.("closed");
      if (!dead) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          connect();
        }, delay);
        delay = Math.min(delay * 1.6, MAX_DELAY);
      }
    };

    ws.onerror = () => onStateChange?.("error");

    ws.onmessage = (m) => {
      try {
        const { event, data } = JSON.parse(m.data);
        onEvent?.(event, data);
      } catch (_) {}
    };
  }

  connect();

  return {
    send: (event, data) => {
      if (ws?.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ event, data: data ?? {} }));
    },
    close: () => {
      dead = true;
      clearTimeout(retryTimer);
      ws?.close();
    },
  };
}
