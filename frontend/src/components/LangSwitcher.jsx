import { useI18n } from "../i18n/index.jsx";
import { IDIOMAS } from "../i18n/dict.js";

/** Selector de idioma ES/EN/DE (banderas). compact = solo banderas pequeñas. */
export default function LangSwitcher({ className = "" }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-white/80 p-1 shadow-sm ${className}`}>
      {IDIOMAS.map((i) => (
        <button
          key={i.id}
          onClick={() => setLang(i.id)}
          aria-label={i.id}
          aria-pressed={lang === i.id}
          className={`grid h-7 w-7 place-items-center rounded-full text-base transition-colors ${
            lang === i.id ? "bg-taxi" : "opacity-50 hover:opacity-100"
          }`}
        >
          {i.flag}
        </button>
      ))}
    </div>
  );
}
