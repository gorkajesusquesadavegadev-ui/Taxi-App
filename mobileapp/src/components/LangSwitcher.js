// Selector de idioma — píldoras de texto (los emoji de bandera se renderizan
// mal o como letras en muchos Android; texto = perfecto en cualquier equipo).
import { View, Text, Pressable } from "react-native";
import { useI18n } from "../i18n";

const LANGS = ["es", "en", "de"];

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <View className="flex-row overflow-hidden rounded-full border border-volcanic/15 bg-white/90">
      {LANGS.map((l) => (
        <Pressable
          key={l}
          onPress={() => setLang(l)}
          accessibilityLabel={l}
          className={`px-2.5 py-1.5 ${lang === l ? "bg-volcanic" : ""}`}
        >
          <Text
            className={`font-bodybold text-[11px] uppercase tracking-wide ${
              lang === l ? "text-taxi" : "text-volcanic/55"
            }`}
          >
            {l}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
