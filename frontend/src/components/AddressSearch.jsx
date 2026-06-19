import { useEffect, useRef, useState } from "react";
import { buscarDirecciones } from "../api/geo.js";
import Spinner from "./Spinner.jsx";

// Web Speech API (Chrome/Edge); hide the mic where unsupported.
const SR =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M6 6 18 18 M18 6 6 18" />
  </svg>
);
const IconPinSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/**
 * Address autocomplete with voice input.
 * value: {lat, lng, label} | null — set from outside too (map click).
 * onSelect(point|null)
 */
export default function AddressSearch({ placeholder, value, onSelect, dotClass = "bg-taxi" }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [editing, setEditing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [listening, setListening] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const recRef = useRef(null);
  const listId = useRef(`addr-${Math.random().toString(36).slice(2)}`).current;

  // reflect outside changes (map click reverse-geocode, reset)
  useEffect(() => {
    setQ(value?.label ?? "");
  }, [value?.label, value === null]);

  // debounced autocomplete while typing
  useEffect(() => {
    if (!editing) return;
    const text = q.trim();
    if (text.length < 3) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await buscarDirecciones(text));
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(id);
  }, [q, editing]);

  function choose(r) {
    onSelect(r);
    setQ(r.label);
    setEditing(false);
    setResults([]);
    setActiveIdx(-1);
  }

  function clear() {
    onSelect(null);
    setQ("");
    setResults([]);
    setActiveIdx(-1);
  }

  function handleKeyDown(e) {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      choose(results[activeIdx]);
    } else if (e.key === "Escape") {
      setEditing(false);
      setResults([]);
      setActiveIdx(-1);
    }
  }

  function toggleMic() {
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQ(text);
      setEditing(true);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-2xl border-2 border-sand-deep bg-cream px-3 py-2 transition-colors focus-within:border-taxi focus-within:bg-white">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
        <input
          value={q}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={editing && results.length > 0}
          aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
          role="combobox"
          onChange={(e) => {
            setQ(e.target.value);
            setEditing(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setEditing(true)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-volcanic/40"
        />
        {searching && <Spinner className="h-3.5 w-3.5 shrink-0" />}
        {q && (
          <button
            type="button"
            onClick={clear}
            aria-label="Borrar"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-volcanic/40 hover:bg-sand hover:text-volcanic"
          >
            <IconX />
          </button>
        )}
        {SR && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label="Dictar dirección"
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${
              listening
                ? "animate-pulse bg-volcanic text-taxi"
                : "bg-sand text-volcanic/60 hover:bg-taxi hover:text-volcanic"
            }`}
          >
            <IconMic />
          </button>
        )}
      </div>

      {/* inline result list (no overlay: safe inside the bottom sheet) */}
      {editing && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`Resultados para ${placeholder}`}
          className="mt-1.5 max-h-44 overflow-y-auto rounded-2xl border border-sand-deep bg-white py-1 shadow-card slim-scroll"
        >
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng}`} role="option" aria-selected={i === activeIdx} id={`${listId}-opt-${i}`}>
              <button
                type="button"
                onClick={() => choose(r)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${i === activeIdx ? "bg-sand" : "hover:bg-sand"}`}
              >
                <span className="shrink-0 text-atlantic"><IconPinSmall /></span>
                <span className="truncate font-medium">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && !searching && q.trim().length >= 3 && results.length === 0 && (
        <p className="mt-1.5 px-2 text-xs text-volcanic/45">Sin resultados en la isla…</p>
      )}
    </div>
  );
}
