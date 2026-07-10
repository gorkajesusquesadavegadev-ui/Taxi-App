import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import Scene from "../components/Scene";
import { Btn, Input, Card, SHADOW_FLOAT } from "../components/UI";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [rol, setRol] = useState("CLIENTE");
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", telefono: "",
    licencia: "", vehiculoModelo: "", vehiculoMatricula: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

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

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingTop: 56 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="font-displayblack text-[30px] tracking-tight text-volcanic">
                Canary<Text className="text-taxi-dark">Cab</Text>
              </Text>
              <Text className="mt-1 font-bodybold text-[13px] text-volcanic/70">{t("landing.subtitle")}</Text>
            </View>
            <LangSwitcher />
          </View>

          <Card className="mt-4 bg-white/95" style={SHADOW_FLOAT}>
            <View className="mb-3 flex-row gap-2">
              <Btn title={t("auth.login")} kind={mode === "login" ? "primary" : "ghost"} onPress={() => setMode("login")} className="flex-1 py-3" />
              <Btn title={t("auth.register")} kind={mode === "register" ? "primary" : "ghost"} onPress={() => setMode("register")} className="flex-1 py-3" />
            </View>

            <Text className="font-display text-[16px] text-volcanic">
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
              secureTextEntry className="mb-2.5" />

            {error ? (
              <Text className="mt-1 rounded-xl bg-coral/10 p-2.5 font-bodybold text-[13px] text-coral">{error}</Text>
            ) : null}

            <Btn
              title={mode === "login" ? `→ ${t("auth.login")}` : `🚀 ${t("auth.register")}`}
              onPress={enviar}
              busy={busy}
              disabled={!form.email || !form.password || (mode === "register" && !form.nombre)}
              className="mt-3.5"
            />
          </Card>

          {/* hueco para ver la postal (mar, costa, taxi) */}
          <View style={{ height: 330 }} pointerEvents="none" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
