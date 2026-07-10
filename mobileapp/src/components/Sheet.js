// Bottom sheet plegable sobre el mapa — espejo de components/Sheet.jsx (web).
// Se agranda/encoge tirando del asa (o tocándola): 80% / 33% de pantalla.
import { useRef, useState } from "react";
import { View, Text, ScrollView, PanResponder, useWindowDimensions } from "react-native";
import { SHADOW_FLOAT } from "./UI";

export default function Sheet({ children }) {
  const { height: H } = useWindowDimensions();
  const [expandido, setExpandido] = useState(true);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -40) setExpandido(true);
        else if (g.dy > 40) setExpandido(false);
        else setExpandido((v) => !v);
      },
    })
  ).current;

  return (
    <View className="absolute inset-x-0 bottom-0 p-3">
      <View
        className="rounded-[26px] bg-cream/95"
        style={[SHADOW_FLOAT, { maxHeight: expandido ? H * 0.72 : H * 0.30, borderWidth: 1, borderColor: "#FFFFFF80" }]}
      >
        {/* asa: arrastrar o tocar para plegar/desplegar */}
        <View {...pan.panHandlers} className="w-full shrink-0 items-center gap-1 pb-1 pt-2.5">
          <View className="h-1.5 w-12 rounded-full bg-volcanic/25" />
          <Text className="font-bodybold text-[10px] uppercase tracking-wider text-volcanic/35">
            {expandido ? "▼ Ver mapa" : "▲ Más opciones"}
          </Text>
        </View>
        <ScrollView
          className="px-4 pb-4 pt-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
