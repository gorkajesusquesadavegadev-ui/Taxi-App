// Ajustes: perfil, contraseña, idioma, legal, cuenta — espejo de Ajustes.jsx.
import { useState } from "react";
import { View, Text, ScrollView, Switch, Linking } from "react-native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import { Btn, Input, Card } from "../components/UI";

export default function AjustesScreen() {
  const { user, setUser, logout } = useAuth();
  const { t } = useI18n();
  const esTaxista = user?.rol === "TAXISTA";

  const [nombre, setNombre] = useState(user?.nombre || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [modelo, setModelo] = useState(user?.vehiculoModelo || "");
  const [matricula, setMatricula] = useState(user?.vehiculoMatricula || "");
  const [accesible, setAccesible] = useState(!!user?.vehiculoAccesible);
  const [msgPerfil, setMsgPerfil] = useState(null);
  const [busyPerfil, setBusyPerfil] = useState(false);

  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [msgPwd, setMsgPwd] = useState(null);
  const [busyPwd, setBusyPwd] = useState(false);

  async function guardarPerfil() {
    setBusyPerfil(true); setMsgPerfil(null);
    try {
      const me = await api.actualizarMe({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        vehiculoModelo: esTaxista ? modelo.trim() : null,
        vehiculoMatricula: esTaxista ? matricula.trim() : null,
        vehiculoAccesible: esTaxista ? accesible : null,
      });
      if (me) setUser(me);
      setMsgPerfil({ ok: true, text: t("set.saved") });
    } catch (e) {
      setMsgPerfil({ ok: false, text: e.message || t("set.couldNotSave") });
    } finally {
      setBusyPerfil(false);
    }
  }

  async function cambiarPwd() {
    if (pwdNueva.length < 6) { setMsgPwd({ ok: false, text: t("set.min6") }); return; }
    setBusyPwd(true); setMsgPwd(null);
    try {
      await api.cambiarPassword({ actual: pwdActual, nueva: pwdNueva });
      setMsgPwd({ ok: true, text: t("set.pwdUpdated") });
      setPwdActual(""); setPwdNueva("");
    } catch (e) {
      setMsgPwd({ ok: false, text: e.message || t("set.couldNotChange") });
    } finally {
      setBusyPwd(false);
    }
  }

  const Label = ({ children }) => (
    <Text className="mb-1.5 mt-2.5 font-bodybold text-[11px] uppercase tracking-wider text-volcanic/50">{children}</Text>
  );

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}>
      <Text className="mb-3 font-display text-[19px] text-volcanic">⚙️ {t("nav.settings")}</Text>

      <Card className="mb-3.5">
        <Text className="mb-2 font-display text-[14px] text-volcanic">{t("set.account")}</Text>
        <Text className="font-bodysemi text-[13px] text-volcanic/60">
          {esTaxista ? "🚕" : "🧍"} {user?.email} · {esTaxista ? t("set.driver") : t("set.client")}
          {user?.ratingMedia ? ` · ⭐ ${Number(user.ratingMedia).toFixed(1)}` : ""}
        </Text>
        <View className="mt-2.5"><LangSwitcher /></View>
      </Card>

      <Card className="mb-3.5">
        <Text className="mb-1 font-display text-[14px] text-volcanic">{t("set.profile")}</Text>
        <Label>{t("set.yourName")}</Label>
        <Input value={nombre} onChangeText={setNombre} />
        <Label>{t("auth.phoneWhatsapp")}</Label>
        <Input value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
        {esTaxista && (
          <>
            <Label>{t("auth.vehicleModel")}</Label>
            <Input value={modelo} onChangeText={setModelo} />
            <Label>{t("auth.plate")}</Label>
            <Input value={matricula} onChangeText={setMatricula} autoCapitalize="characters" />
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-bodybold text-[13px] text-volcanic">♿ {t("set.accessibleVehicle")}</Text>
              <Switch value={accesible} onValueChange={setAccesible}
                trackColor={{ false: "#CFE0EE", true: "#FFC400" }} thumbColor="#fff" />
            </View>
          </>
        )}
        {msgPerfil && (
          <Text className={`mt-2.5 font-bodybold text-[13px] ${msgPerfil.ok ? "text-atlantic" : "text-coral"}`}>
            {msgPerfil.text}
          </Text>
        )}
        <Btn title={t("common.save")} onPress={guardarPerfil} busy={busyPerfil} className="mt-3" />
      </Card>

      <Card className="mb-3.5">
        <Text className="mb-1 font-display text-[14px] text-volcanic">{t("set.security")}</Text>
        <Text className="font-body text-[12px] text-volcanic/50">{t("set.changePwdIntro")}</Text>
        <Label>{t("set.currentPwd")}</Label>
        <Input value={pwdActual} onChangeText={setPwdActual} secureTextEntry placeholder={t("set.currentPwdPh")} />
        <Label>{t("set.newPwd")}</Label>
        <Input value={pwdNueva} onChangeText={setPwdNueva} secureTextEntry />
        {msgPwd && (
          <Text className={`mt-2.5 font-bodybold text-[13px] ${msgPwd.ok ? "text-atlantic" : "text-coral"}`}>
            {msgPwd.text}
          </Text>
        )}
        <Btn title={t("set.changePwd")} kind="dark" onPress={cambiarPwd} busy={busyPwd}
          disabled={!pwdActual || !pwdNueva} className="mt-3" />
      </Card>

      <Card className="mb-3.5">
        <Text className="mb-1 font-display text-[14px] text-volcanic">⚖️ Legal</Text>
        <Text className="py-1.5 font-bodybold text-[14px] text-atlantic-dark" onPress={() => Linking.openURL("https://canarycab.com/privacidad")}>🔒 {t("legal.privacy")}</Text>
        <Text className="py-1.5 font-bodybold text-[14px] text-atlantic-dark" onPress={() => Linking.openURL("https://canarycab.com/terminos")}>📋 {t("legal.terms")}</Text>
        <Text className="py-1.5 font-bodybold text-[14px] text-atlantic-dark" onPress={() => Linking.openURL("https://canarycab.com/cookies")}>🍪 {t("legal.cookies")}</Text>
      </Card>

      <Btn title={t("nav.logout")} kind="danger" onPress={logout} className="mt-1" />
    </ScrollView>
  );
}
