// i18n ES/EN/DE — espejo de frontend/src/i18n/index.jsx con AsyncStorage.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DICT } from "./dict";

const LANG_KEY = "taya:lang";
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("es");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((v) => { if (v && DICT[v]) setLangState(v); })
      .catch(() => {});
  }, []);

  const value = useMemo(() => {
    const t = (clave, vars) => {
      let s = DICT[lang]?.[clave] ?? DICT.es[clave] ?? clave;
      if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, vars[k]);
      return s;
    };
    const setLang = (l) => {
      setLangState(l);
      AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
    };
    return { lang, setLang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: "es", setLang: () => {}, t: (k) => DICT.es[k] ?? k };
  return ctx;
}

/** Traduce cadenas de zona del backend ("Tarifa 1 · Zona urbana" etc.) */
export function zonaTraducida(t, raw) {
  if (!raw) return raw;
  const map = {
    "Tarifa 1 · Zona urbana": "zone.urban",
    "Tarifa 3 · Zona periférica": "zone.peripheral",
    "Interinsular · Fuera del municipio": "zone.interisland",
  };
  return map[raw] ? t(map[raw]) : raw;
}
