// Panel admin — espejo de admin/AdminPanel.jsx (métricas, verificar, bloquear).
import { useCallback, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { useI18n } from "../i18n";
import { Btn, Card } from "../components/UI";

function Metric({ label, value }) {
  return (
    <Card className="flex-1 items-center px-1 py-2.5">
      <Text className="font-display text-[15px] text-volcanic">{value ?? "—"}</Text>
      <Text className="mt-0.5 text-center font-bodybold text-[9px] uppercase text-volcanic/50">{label}</Text>
    </Card>
  );
}

export default function AdminScreen() {
  const { t } = useI18n();
  const [m, setM] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    setError("");
    try {
      const [met, pend, us] = await Promise.all([
        api.adminMetricas(), api.adminPendientes(), api.adminUsuarios(),
      ]);
      setM(met); setPendientes(pend || []); setUsuarios(us || []);
    } catch (e) {
      setError(e.message || t("adm.errLoad"));
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function verificar(id, valor) {
    try {
      await api.adminVerificar(id, valor);
      setOkMsg(valor ? t("adm.verifiedMsg") : t("adm.verifRemoved"));
      cargar();
    } catch (e) { setError(e.message); }
  }

  async function bloquear(id, valor) {
    try {
      await api.adminBloquear(id, valor);
      setOkMsg(valor ? t("adm.userBlocked") : t("adm.userUnblocked"));
      cargar();
    } catch (e) { setError(e.message); }
  }

  const Section = ({ children }) => (
    <Text className="mb-2 mt-4 font-display text-[13px] uppercase tracking-wide text-volcanic">{children}</Text>
  );

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ padding: 14, paddingTop: 56, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await cargar(); setRefreshing(false); }} />}
    >
      <Text className="font-display text-[19px] text-volcanic">🛡️ {t("adm.title")}</Text>

      {error ? <Text className="mt-2 font-bodybold text-[13px] text-coral">{error}</Text> : null}
      {okMsg ? <Text className="mt-2 font-bodybold text-[13px] text-atlantic">{okMsg}</Text> : null}

      <Section>{t("adm.summary")}</Section>
      <View className="mb-2 flex-row gap-2">
        <Metric label={t("adm.tUsers")} value={m?.totalUsuarios} />
        <Metric label={t("adm.tClients")} value={m?.totalClientes} />
        <Metric label={t("adm.tDrivers")} value={m?.totalTaxistas} />
      </View>
      <View className="mb-2 flex-row gap-2">
        <Metric label={t("adm.tOnline")} value={m?.taxistasOnline} />
        <Metric label={t("adm.tToday")} value={m?.viajesHoy} />
        <Metric label={t("adm.tCompleted")} value={m?.viajesCompletados} />
      </View>
      <View className="flex-row gap-2">
        <Metric label={t("adm.tPending")} value={m?.taxistasPendientes} />
        <Metric label={t("adm.tCancelled")} value={m?.viajesCancelados} />
        <Metric label={t("adm.tRevenue")} value={m ? `${Number(m.ingresosTotales ?? 0).toFixed(0)} €` : null} />
      </View>

      <Section>✅ {t("adm.verify")}</Section>
      {pendientes.length === 0 && (
        <Text className="font-bodysemi text-[13px] text-volcanic/50">{t("adm.noneToVerify")}</Text>
      )}
      {pendientes.map((u) => (
        <Card key={u.id} className="mb-2">
          <Text className="font-bodybold text-[14px] text-volcanic">🚕 {u.nombre}</Text>
          <Text className="mt-0.5 font-body text-[12px] text-volcanic/50">
            {u.email}{u.licencia ? ` · Lic. ${u.licencia}` : ""}{u.vehiculoMatricula ? ` · ${u.vehiculoMatricula}` : ""}
          </Text>
          <Btn title={`✅ ${t("adm.verifyBtn")}`} className="mt-2" onPress={() => verificar(u.id, true)} />
        </Card>
      ))}

      <Section>👥 {t("adm.users")} ({usuarios.length})</Section>
      {usuarios.map((u) => (
        <Card key={u.id} className="mb-2">
          <Text className="font-bodybold text-[14px] text-volcanic" numberOfLines={1}>
            {u.rol === "TAXISTA" ? "🚕" : u.rol === "ADMIN" ? "🛡️" : "🧍"} {u.nombre}
            {u.verificado ? " ✓" : ""}{u.bloqueado ? ` · ⛔ ${t("adm.blocked")}` : ""}
          </Text>
          <Text className="mt-0.5 font-body text-[12px] text-volcanic/50" numberOfLines={1}>
            {u.email}{u.ratingMedia ? ` · ⭐ ${Number(u.ratingMedia).toFixed(1)}` : ""}
          </Text>
          {u.rol !== "ADMIN" && (
            <View className="mt-2 flex-row gap-2">
              {u.rol === "TAXISTA" && (
                <Btn title={u.verificado ? "✓✗" : `✅ ${t("adm.verifyBtn")}`} kind="ghost" className="flex-1 py-2"
                  onPress={() => verificar(u.id, !u.verificado)} />
              )}
              <Btn title={u.bloqueado ? t("adm.unblock") : `⛔ ${t("adm.block")}`}
                kind={u.bloqueado ? "ghost" : "danger"} className="flex-1 py-2"
                onPress={() => bloquear(u.id, !u.bloqueado)} />
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}
