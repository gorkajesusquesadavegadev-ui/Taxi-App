// Portada + login/registro — espejo del landing web (Auth.jsx) con flujo móvil:
// 1) Postal a pantalla completa con título y botón "Entrar o crear cuenta"
// 2) Al tocar, sube la tarjeta (animada) con ✕ para volver a la postal
import { useRef, useState } from "react";
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, Animated, Easing,
} from "react-native";
import { Linking } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import Scene from "../components/Scene";
import { Btn, Input, Card, SHADOW_FLOAT } from "../components/UI";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [abierto, setAbierto] = useState(false); // false = landing, true = formulario
  const [mode, setMode] = useState("login");
  const [rol, setRol] = useState("CLIENTE");
  // Consentimiento RGPD: obligatorio y nunca premarcado.
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", telefono: "",
    licencia: "", vehiculoModelo: "", vehiculoMatricula: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Animaciones: tarjeta sube/baja · título respira
  const anim = useRef(new Animated.Value(0)).current; // 0 landing · 1 formulario
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  function abrir() {
    setAbierto(true);
    Animated.timing(anim, {
      toValue: 1, duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true,
    }).start();
  }
  function cerrar() {
    Animated.timing(anim, {
      toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true,
    }).start(() => { setAbierto(false); setError(""); });
  }

  const cardTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [520, 0] });
  const heroOpacity = anim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" });
  const heroTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });

  async function enviar() {
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ email: form.email.trim(), password: form.password });
      } else {
        await register({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rol,
          telefono: form.telefono || null,
          licencia: rol === "TAXISTA" ? form.licencia : null,
          vehiculoModelo: rol === "TAXISTA" ? form.vehiculoModelo : null,
          vehiculoMatricula: rol === "TAXISTA" ? form.vehiculoMatricula : null,
          aceptaPrivacidad,
        });
      }
    } catch (err) {
      setError(err.message || t("auth.couldNotComplete"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-atlantic-dark">
      <Scene />

      {/* ── HERO landing (postal + título + CTA) ── */}
      <Animated.View
        className="absolute inset-x-0 top-0 px-5 pt-14"
        style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }}
        pointerEvents={abierto ? "none" : "box-none"}
      >
        <View className="flex-row items-start justify-between">
          <View className="self-start rounded-full bg-volcanic/85 px-3 py-1.5">
            <Text className="font-bodybold text-[9px] uppercase tracking-[1.5px] text-cream">
              {t("landing.badge")}
            </Text>
          </View>
          <LangSwitcher />
        </View>

        <Text className="mt-6 font-displayblack text-[44px] leading-[48px] tracking-tight text-volcanic">
          Canary{"\n"}<Text className="text-taxi-dark">Cab</Text>
        </Text>
        <Text className="mt-2 font-bodybold text-[17px] text-volcanic/85">{t("landing.subtitle")}</Text>
        <Text className="mt-1 font-bodysemi text-[13px] text-volcanic/60">{t("landing.tagline")}</Text>
      </Animated.View>

      {/* CTA grande abajo (encima del mar) */}
      {!abierto && (
        <View className="absolute inset-x-5" style={{ bottom: 118 }}>
          <Pressable
            onPress={abrir}
            className="items-center rounded-3xl bg-taxi py-4.5 active:scale-[0.98]"
            style={[SHADOW_FLOAT, { paddingVertical: 18 }]}
          >
            <Text className="font-display text-[16px] text-volcanic">
              🚕 {t("landing.enterOrSignup")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── FORMULARIO (tarjeta que sube, con ✕) ── */}
      {abierto && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View className="flex-1" style={{ transform: [{ translateY: cardTranslate }] }}>
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingTop: 54, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Card className="bg-white/95 p-5" style={SHADOW_FLOAT}>
                {/* cabecera: logo + ✕ */}
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="font-displayblack text-[20px] tracking-tight text-volcanic">
                    Canary<Text className="text-taxi-dark">Cab</Text>
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <LangSwitcher />
                    <Pressable
                      onPress={cerrar}
                      hitSlop={10}
                      className="h-9 w-9 items-center justify-center rounded-full bg-sand active:bg-sand-deep"
                    >
                      <Text className="font-bodybold text-[16px] text-volcanic">✕</Text>
                    </Pressable>
                  </View>
                </View>

                <View className="mb-3 flex-row gap-2">
                  <Btn title={t("auth.login")} kind={mode === "login" ? "primary" : "ghost"} onPress={() => setMode("login")} className="flex-1 py-3" />
                  <Btn title={t("auth.register")} kind={mode === "register" ? "primary" : "ghost"} onPress={() => setMode("register")} className="flex-1 py-3" />
                </View>

                <Text className="font-display text-[17px] text-volcanic">
                  {mode === "login" ? t("auth.welcomeBack") : t("auth.welcomeAboard")}
                </Text>
                <Text className="mb-3 mt-0.5 font-bodysemi text-[12.5px] text-volcanic/60">
                  {mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
                </Text>

                {mode === "register" && (
                  <>
                    <View className="mb-3 flex-row gap-2">
                      <Btn title={`🧍 ${t("auth.iRide")}`} kind={rol === "CLIENTE" ? "dark" : "ghost"} onPress={() => setRol("CLIENTE")} className="flex-1 py-3" />
                      <Btn title={`🚕 ${t("auth.iDrive")}`} kind={rol === "TAXISTA" ? "dark" : "ghost"} onPress={() => setRol("TAXISTA")} className="flex-1 py-3" />
                    </View>
                    <Input placeholder={t("auth.namePh")} value={form.nombre} onChangeText={set("nombre")} className="mb-2.5" />
                    <Input placeholder={t("auth.phoneWhatsapp")} value={form.telefono} onChangeText={set("telefono")} keyboardType="phone-pad" className="mb-2.5" />
                    {rol === "TAXISTA" && (
                      <>
                        <Input placeholder={t("auth.licenseNo")} value={form.licencia} onChangeText={set("licencia")} className="mb-2.5" />
                        <Input placeholder={t("auth.vehicleModel")} value={form.vehiculoModelo} onChangeText={set("vehiculoModelo")} className="mb-2.5" />
                        <Input placeholder={t("auth.plate")} value={form.vehiculoMatricula} onChangeText={set("vehiculoMatricula")} autoCapitalize="characters" className="mb-2.5" />
                      </>
                    )}
                  </>
                )}

                <Input placeholder={t("auth.email")} value={form.email} onChangeText={set("email")}
                  keyboardType="email-address" autoCapitalize="none" autoComplete="email" className="mb-2.5" />
                <Input placeholder={t("auth.password")} value={form.password} onChangeText={set("password")}
                  secureTextEntry className="mb-1" />

                {mode === "register" && (
                  <Pressable
                    className="mt-3 flex-row items-start gap-2.5 rounded-xl bg-sand/60 p-3"
                    onPress={() => setAceptaPrivacidad((v) => !v)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: aceptaPrivacidad }}
                  >
                    <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2 ${
                      aceptaPrivacidad ? "border-taxi bg-taxi" : "border-volcanic/30"
                    }`}>
                      {aceptaPrivacidad ? <Text className="font-bodybold text-[12px] text-volcanic">✓</Text> : null}
                    </View>
                    <Text className="flex-1 font-body text-[11px] leading-snug text-volcanic/70">
                      {t("auth.consentPre")}{" "}
                      <Text className="font-bodybold underline"
                        onPress={() => Linking.openURL("https://canarycab.com/privacidad")}>
                        {t("legal.privacy")}
                      </Text>{" "}
                      {t("auth.consentAnd")}{" "}
                      <Text className="font-bodybold underline"
                        onPress={() => Linking.openURL("https://canarycab.com/terminos")}>
                        {t("legal.terms")}
                      </Text>.
                    </Text>
                  </Pressable>
                )}

                {error ? (
                  <Text className="mt-2 rounded-xl bg-coral/10 p-2.5 font-bodybold text-[13px] text-coral">{error}</Text>
                ) : null}

                <Btn
                  title={mode === "login" ? `→ ${t("auth.login")}` : `🚀 ${t("auth.register")}`}
                  onPress={enviar}
                  busy={busy}
                  disabled={!form.email || !form.password
                    || (mode === "register" && (!form.nombre || !aceptaPrivacidad))}
                  className="mt-4"
                />
              </Card>

              {/* hueco para ver la postal debajo */}
              <View style={{ height: 240 }} pointerEvents="none" />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
