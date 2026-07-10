// WebSocket con reconexión automática y backoff exponencial (igual que la web).
import { tokenStore, WS_BASE } from "./client";

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
      delay = MIN_DELAY;
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
      if (ws && ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ event, data: data ?? {} }));
    },
    close: () => {
      dead = true;
      clearTimeout(retryTimer);
      if (ws) ws.close();
    },
  };
}
