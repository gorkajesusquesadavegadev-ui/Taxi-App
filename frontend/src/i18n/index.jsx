import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DICT } from "./dict.js";

const LangContext = createContext(null);

function detectar() {
  try {
    const guardado = localStorage.getItem("taya:lang");
    if (guardado && DICT[guardado]) return guardado;
    const nav = (navigator.language || "es").slice(0, 2);
    return DICT[nav] ? nav : "es";
  } catch {
    return "es";
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectar);

  useEffect(() => {
    try { localStorage.setItem("taya:lang", lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const t = (clave, vars) => {
      let s = DICT[lang]?.[clave] ?? DICT.es[clave] ?? clave;
      if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
      return s;
    };
    return { lang, setLang: setLangState, t };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) return { lang: "es", setLang: () => {}, t: (k) => DICT.es[k] ?? k };
  return ctx;
}
