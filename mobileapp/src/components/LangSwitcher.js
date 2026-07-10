import { View, Text, Pressable } from "react-native";
import { useI18n } from "../i18n";

const LANGS = [
  { id: "es", flag: "🇪🇸" },
  { id: "en", flag: "🇬🇧" },
  { id: "de", flag: "🇩🇪" },
];

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <View className="flex-row gap-1.5">
      {LANGS.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => setLang(l.id)}
          accessibilityLabel={l.id}
          className={`rounded-full border px-2 py-1 ${
            lang === l.id ? "border-taxi bg-sand opacity-100" : "border-transparent opacity-50"
          }`}
        >
          <Text className="text-[17px]">{l.flag}</Text>
        </Pressable>
      ))}
    </View>
  );
}
