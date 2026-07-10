// Buscador de direcciones con punto de color — espejo de components/AddressSearch.jsx.
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { buscarDirecciones } from "../api/geo";

export default function AddressSearch({ placeholder, value, onSelect, dotClass = "bg-taxi" }) {
  const [query, setQuery] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (value || query.trim().length < 3) { setSugerencias([]); return; }
    const id = setTimeout(() => {
      buscarDirecciones(query).then(setSugerencias).catch(() => setSugerencias([]));
    }, 400);
    return () => clearTimeout(id);
  }, [query, value]);

  return (
    <View>
      <View
        className={`flex-row items-center rounded-2xl border-2 bg-cream px-3.5 ${
          focus ? "border-taxi bg-white" : "border-sand-deep"
        }`}
      >
        <View className={`mr-2.5 h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <TextInput
          className="flex-1 py-3 font-bodysemi text-[15px] text-volcanic"
          placeholder={placeholder}
          placeholderTextColor="#0B2E4F59"
          value={value ? value.label : query}
          onChangeText={(v) => { if (value) onSelect(null); setQuery(v); }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {(value || query) ? (
          <Pressable onPress={() => { onSelect(null); setQuery(""); }} hitSlop={8}>
            <Text className="font-bodybold text-[15px] text-volcanic/40">×</Text>
          </Pressable>
        ) : null}
      </View>
      {sugerencias.length > 0 && !value && (
        <View className="mt-1 overflow-hidden rounded-2xl border border-sand-deep bg-white">
          {sugerencias.slice(0, 5).map((item, i) => (
            <Pressable
              key={item.label + i}
              className={`px-3.5 py-2.5 active:bg-sand ${i > 0 ? "border-t border-sand" : ""}`}
              onPress={() => { onSelect(item); setQuery(""); setSugerencias([]); }}
            >
              <Text className="font-body text-[14px] text-volcanic" numberOfLines={1}>📍 {item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
