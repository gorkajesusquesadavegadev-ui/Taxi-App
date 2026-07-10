// Postal animada de portada — versión nativa de la Scene web (Auth.jsx).
import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Pressable, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "../i18n";
import {
  TaxiSvg, FerrySvg, FarFerrySvg, PlaneSvg, Gull, WaveSvg,
  PalmSvg, TeideSvg, DunasSvg, RoqueSvg, FaroSvg, TimanfayaSvg,
} from "./SceneSvgs";

const AD_KEYS = ["ad.s1", "ad.s2", "ad.s3", "ad.s4", "ad.s5", "ad.s6", "ad.s7", "ad.s8", "ad.s9"];

function useLoop(durationMs) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: durationMs, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return v;
}

function useBob(durationMs = 3000, amp = 5) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: durationMs / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: durationMs / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return v.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] });
}

function Crossing({ children, duration, bottom, reverse = false, startOffset = 0 }) {
  const { width: W } = useWindowDimensions();
  const t = useLoop(duration);
  const from = reverse ? W + 60 : -220;
  const to = reverse ? -220 : W + 60;
  const tx = t.interpolate({
    inputRange: [0, 1],
    outputRange: [from + (to - from) * startOffset, to + (to - from) * startOffset],
  });
  return (
    <Animated.View style={{ position: "absolute", bottom, transform: [{ translateX: tx }] }}>
      {children}
    </Animated.View>
  );
}

function Cloud({ scale = 1 }) {
  return (
    <View className="flex-row items-end" style={{ transform: [{ scale }] }}>
      <View className="h-6 w-10 rounded-full bg-white/80" />
      <View className="-ml-4 mb-1 h-9 w-14 rounded-full bg-white/90" />
      <View className="-ml-5 h-6 w-12 rounded-full bg-white/75" />
    </View>
  );
}

function Wave({ bottom, height, fill, opacity, duration }) {
  const { width: W } = useWindowDimensions();
  const t = useLoop(duration);
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, -W * 2] });
  return (
    <Animated.View style={{ position: "absolute", bottom, left: 0, flexDirection: "row", transform: [{ translateX: tx }] }}>
      <WaveSvg width={W * 2} height={height} fill={fill} opacity={opacity} />
      <WaveSvg width={W * 2} height={height} fill={fill} opacity={opacity} />
    </Animated.View>
  );
}

function Billboard({ bg, color, label, t }) {
  return (
    <View className="items-center">
      <View
        className="h-[62px] w-32 items-center justify-center rounded-lg border-[3px] border-volcanic px-1.5"
        style={{ backgroundColor: bg }}
      >
        <Text className="font-bodybold text-[8px] uppercase tracking-[2px]" style={{ color }}>📢 {t("ad.space")}</Text>
        <Text className="mt-0.5 font-bodysemi text-[7px] opacity-70" style={{ color }}>{label}</Text>
      </View>
      <View className="flex-row gap-10">
        <View className="h-6 w-1.5 rounded-b bg-volcanic" />
        <View className="h-6 w-1.5 rounded-b bg-volcanic" />
      </View>
    </View>
  );
}

function Hito({ label, children }) {
  return (
    <View className="items-center gap-1">
      {children}
      <View className="rounded-full bg-cream/90 px-2 py-0.5">
        <Text className="font-bodybold text-[7px] uppercase tracking-[1.2px] text-volcanic/70">{label}</Text>
      </View>
    </View>
  );
}

function CostaSegment({ t }) {
  return (
    <View className="flex-row items-end gap-8 px-5">
      <Hito label="Dunas de Maspalomas"><DunasSvg /></Hito>
      <Billboard t={t} bg="#0B2E4F" color="#FFC400" label="contacto@canarycab.com" />
      <PalmSvg h={80} />
      <Hito label="Teide · Tenerife"><TeideSvg /></Hito>
      <Billboard t={t} bg="#1577C2" color="#ffffff" label="canarycab.com" />
      <Hito label="Faro de Maspalomas"><FaroSvg /></Hito>
      <PalmSvg h={66} />
      <Hito label="Roque Nublo"><RoqueSvg /></Hito>
      <Billboard t={t} bg="#FFC400" color="#0B2E4F" label="CanaryCab" />
      <Hito label="Timanfaya · Lanzarote"><TimanfayaSvg /></Hito>
      <PalmSvg h={80} />
    </View>
  );
}

function CostaLoop({ t }) {
  const [w, setW] = useState(0);
  const loop = useLoop(58_000);
  const tx = w ? loop.interpolate({ inputRange: [0, 1], outputRange: [0, -w / 2] }) : 0;
  return (
    <Animated.View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ position: "absolute", bottom: 86, flexDirection: "row", transform: [{ translateX: tx }] }}
    >
      <CostaSegment t={t} />
      <CostaSegment t={t} />
    </Animated.View>
  );
}

/** Avenida marítima: asfalto tinta + rayas amarillas en movimiento. */
function Road() {
  const { width: W } = useWindowDimensions();
  const t = useLoop(600);
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, -62] });
  const dashes = Math.ceil((W + 124) / 62);
  return (
    <View className="absolute inset-x-0 bottom-0 h-16 overflow-hidden bg-volcanic-800">
      <Animated.View className="absolute left-0 top-[46%] flex-row" style={{ transform: [{ translateX: tx }] }}>
        {Array.from({ length: dashes }).map((_, i) => (
          <View key={i} className="mr-8 h-[5px] w-[30px] bg-taxi opacity-90" />
        ))}
      </Animated.View>
    </View>
  );
}

function Sun() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  return (
    <Animated.View
      className="absolute right-[6%] top-5 h-[72px] w-[72px] items-center justify-center"
      style={{ transform: [{ scale }] }}
    >
      <View className="absolute h-[150px] w-[150px] rounded-full bg-taxi/15" />
      <View className="absolute h-[104px] w-[104px] rounded-full bg-taxi/25" />
      <View className="h-16 w-16 rounded-full bg-taxi" />
    </Animated.View>
  );
}

export default function Scene() {
  const { t } = useI18n();
  const [ad, setAd] = useState(0);
  const [honk, setHonk] = useState(false);
  const taxiBob = useBob(1600, 3);
  const planeBob = useBob(4200, 6);
  const ferryBob = useBob(5000, 5);

  useEffect(() => {
    const id = setInterval(() => setAd((a) => (a + 1) % AD_KEYS.length), 7000);
    return () => clearInterval(id);
  }, []);

  function doHonk() {
    setHonk(true);
    setTimeout(() => setHonk(false), 700);
  }

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {/* cielo — mismos stops que .auth-sky */}
      <LinearGradient
        colors={["#FFF8E3", "#FFE9A6", "#CDE7F7", "#4AA3DD", "#1577C2", "#0B5C9E"]}
        locations={[0, 0.16, 0.42, 0.66, 0.84, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Sun />

      <Crossing duration={120_000} bottom={470} startOffset={0.25}><Cloud /></Crossing>
      <Crossing duration={160_000} bottom={430} startOffset={0.7}><Cloud scale={0.7} /></Crossing>

      <Crossing duration={42_000} bottom={440} startOffset={0.3}>
        <Animated.View style={{ transform: [{ translateY: planeBob }] }}>
          <PlaneSvg width={100} />
        </Animated.View>
      </Crossing>

      {/* avioneta con pancarta rotativa */}
      <Crossing duration={70_000} bottom={385} startOffset={0.4}>
        <Animated.View className="flex-row items-center" style={{ transform: [{ translateY: planeBob }] }}>
          <View className="rounded-md border-2 border-volcanic bg-cream/95 px-2.5 py-1">
            <Text className="font-bodybold text-[10px] uppercase tracking-[1px] text-volcanic">{t(AD_KEYS[ad])}</Text>
          </View>
          <View className="h-0.5 w-6 bg-volcanic/70" />
          <PlaneSvg width={76} />
        </Animated.View>
      </Crossing>

      <Crossing duration={85_000} bottom={330} startOffset={0.6}>
        <View className="flex-row gap-6">
          <Gull /><View className="mt-2.5"><Gull /></View>
        </View>
      </Crossing>

      <Crossing duration={150_000} bottom={272} reverse startOffset={0.4}>
        <View className="opacity-80"><FarFerrySvg /></View>
      </Crossing>

      <Wave bottom={236} height={52} fill="#CDE7F7" opacity={0.5} duration={13_000} />
      <Wave bottom={226} height={52} fill="#4AA3DD" opacity={0.65} duration={9000} />

      <Crossing duration={90_000} bottom={216} startOffset={0.35}>
        <Animated.View style={{ transform: [{ translateY: ferryBob }] }}>
          <FerrySvg width={190} />
        </Animated.View>
      </Crossing>

      <Wave bottom={196} height={52} fill="#1577C2" opacity={0.9} duration={6500} />

      {/* arena del paseo */}
      <LinearGradient
        colors={["#FFE9A6", "#F2DFA0"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 64, height: 34 }}
      />

      <CostaLoop t={t} />
      <Road />

      {/* taxi con bocina */}
      <Animated.View className="absolute bottom-[26px] left-[8%]" style={{ transform: [{ translateY: taxiBob }] }}>
        <Pressable onPress={doHonk} hitSlop={12}>
          {honk && (
            <View className="absolute -top-8 self-center rounded-full bg-cream px-2.5 py-1" style={{ zIndex: 2, elevation: 4 }}>
              <Text className="font-bodybold text-[10px] text-volcanic">¡PII PIII!</Text>
            </View>
          )}
          <TaxiSvg width={104} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
