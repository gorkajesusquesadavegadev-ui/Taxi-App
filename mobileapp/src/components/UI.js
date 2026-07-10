// Kit UI — mismas clases Tailwind que la web (NativeWind).
import { Text, Pressable, TextInput, ActivityIndicator, View } from "react-native";

// Sombra "card" de la web: 0 6px 24px -8px rgba(11,46,79,0.18)
export const SHADOW_CARD = {
  shadowColor: "#0B2E4F",
  shadowOpacity: 0.18,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};
export const SHADOW_FLOAT = {
  shadowColor: "#0B2E4F",
  shadowOpacity: 0.35,
  shadowRadius: 25,
  shadowOffset: { width: 0, height: 18 },
  elevation: 12,
};

const KINDS = {
  primary: { box: "bg-taxi", txt: "text-volcanic" },
  dark: { box: "bg-volcanic", txt: "text-white" },
  danger: { box: "bg-coral", txt: "text-white" },
  ghost: { box: "bg-white border-2 border-sand-deep", txt: "text-volcanic" },
  outline: { box: "bg-transparent border-2 border-volcanic/15", txt: "text-volcanic" },
  sea: { box: "bg-atlantic", txt: "text-white" },
};

export function Btn({ title, onPress, kind = "primary", disabled, busy, className = "" }) {
  const k = KINDS[kind] || KINDS.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      className={`items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${k.box} ${disabled ? "opacity-40" : ""} ${className}`}
    >
      {busy ? (
        <ActivityIndicator color={kind === "primary" || kind === "ghost" ? "#0B2E4F" : "#fff"} />
      ) : (
        <Text className={`font-bodybold text-[15px] ${k.txt}`}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <TextInput
      placeholderTextColor="#0B2E4F66"
      {...props}
      className={`rounded-2xl border-2 border-sand-deep bg-white px-4 py-3 font-bodysemi text-[15px] text-volcanic ${className}`}
    />
  );
}

export function Card({ children, className = "", style }) {
  return (
    <View className={`rounded-xl2 bg-white p-4 ${className}`} style={[SHADOW_CARD, style]}>
      {children}
    </View>
  );
}

/** Chip/badge de estado */
export function Badge({ children, className = "" }) {
  return (
    <View className={`rounded-full bg-sand px-2.5 py-1 ${className}`}>
      <Text className="font-bodybold text-[11px] text-volcanic">{children}</Text>
    </View>
  );
}
