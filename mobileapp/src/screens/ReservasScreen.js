// Reservas — cliente: mías; taxista: disponibles + aceptadas. Espejo de Reservas.jsx.
import { useCallback, useState } from "react";
import { View, Text, FlatList, Linking, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { Btn, Card, Badge } from "../components/UI";
import { rangoEur } from "../utils/precio";

const TIPO_ICON = { EXCURSION: "🌋", TRANSFER: "✈️", NORMAL: "📍" };
const ESTADO_KEY = {
  PENDIENTE: "res.pending", ACEPTADA: "res.accepted",
  CANCELADA: "res.cancelledSt", COMPLETADA: "res.completedSt",
};

function fmtFecha(iso, lang) {
  try {
    return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "es-ES",
      { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export default function ReservasScreen() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const esTaxista = user?.rol === "TAXISTA";
  const [tab, setTab] = useState("disponibles");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    setError("");
    try {
      let data;
      if (!esTaxista) data = await api.reservasMias();
      else data = tab === "disponibles" ? await api.reservasDisponibles() : await api.reservasTaxista();
      setItems(data || []);
    } catch (e) {
      setError(e.message || t("res.couldNotLoad"));
      setItems([]);
    }
  }, [esTaxista, tab]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function aceptar(r) {
    try { await api.reservaAceptar(r.id); cargar(); }
    catch (e) { setError(e.message || t("res.couldNotAccept")); }
  }
  async function cancelar(r) {
    try { await api.reservaCancelar(r.id); cargar(); }
    catch (e) { setError(e.message || t("res.couldNotCancel")); }
  }

  const render = ({ item: r }) => {
    const contactoNombre = !esTaxista ? r.taxistaNombre : r.clienteNombre;
    const contactoTel = !esTaxista ? r.taxistaTelefono : r.clienteTelefono;
    const cancelable = r.estado === "PENDIENTE" || r.estado === "ACEPTADA";
    return (
      <Card className="mb-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 font-display text-[14px] text-volcanic">
            {TIPO_ICON[r.tipo] || "📍"} {r.detalle || t(r.tipo === "EXCURSION" ? "res.excursion" : r.tipo === "TRANSFER" ? "nav.transfers" : "res.trip")}
          </Text>
          <Badge className={r.estado === "ACEPTADA" ? "bg-atlantic/15" : ""}>{t(ESTADO_KEY[r.estado] || "res.pending")}</Badge>
        </View>
        <Text className="mt-1.5 font-bodybold text-[13px] text-atlantic-dark">🕐 {fmtFecha(r.programadaPara, lang)}</Text>
        {r.origenTexto ? <Text className="mt-1 font-bodysemi text-[13px] text-volcanic/70" numberOfLines={1}>📍 {r.origenTexto}</Text> : null}
        {r.destinoTexto ? <Text className="mt-1 font-bodysemi text-[13px] text-volcanic/70" numberOfLines={1}>🏁 {r.destinoTexto}</Text> : null}
        {r.notas ? <Text className="mt-1 font-body text-[12px] text-volcanic/50" numberOfLines={2}>📝 {r.notas}</Text> : null}
        {r.precioEstimado != null && (
          <Text className="mt-1.5 font-bodybold text-[13px] text-volcanic">{rangoEur(r.precioMin, r.precioMax, r.precioEstimado)} · {t("res.estimated")}</Text>
        )}
        {r.estado === "ACEPTADA" && contactoNombre && (
          <View className="mt-2 flex-row items-center gap-2 rounded-xl bg-sand p-2">
            <Text className="flex-1 font-bodybold text-[13px] text-volcanic" numberOfLines={1}>
              {!esTaxista ? `🚕 ${t("res.yourDriver")}` : `🧍 ${t("res.yourClient")}`}: {contactoNombre}
            </Text>
            {contactoTel ? (
              <Btn title="📞" kind="ghost" className="px-2.5 py-1.5" onPress={() => Linking.openURL(`tel:${contactoTel}`)} />
            ) : null}
          </View>
        )}
        <View className="mt-2.5 flex-row gap-2">
          {esTaxista && tab === "disponibles" && r.estado === "PENDIENTE" && (
            <Btn title={`✅ ${t("res.acceptBooking")}`} className="flex-1" onPress={() => aceptar(r)} />
          )}
          {cancelable && (!esTaxista || r.estado === "ACEPTADA") && (
            <Btn title={t("res.cancel")} kind="danger" className="flex-1" onPress={() => cancelar(r)} />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-cream pt-14">
      <Text className="px-4 font-display text-[19px] text-volcanic">
        📅 {esTaxista ? t("res.acceptBookings") : t("res.myBookings")}
      </Text>
      {esTaxista && (
        <View className="mt-2.5 flex-row gap-2 px-4">
          <Btn title={t("bell.available")} kind={tab === "disponibles" ? "primary" : "ghost"} className="flex-1 py-2.5" onPress={() => setTab("disponibles")} />
          <Btn title={t("bell.yours")} kind={tab === "mias" ? "primary" : "ghost"} className="flex-1 py-2.5" onPress={() => setTab("mias")} />
        </View>
      )}
      {error ? <Text className="mt-2 px-4 font-bodybold text-[13px] text-coral">{error}</Text> : null}
      <FlatList
        data={items || []}
        keyExtractor={(r) => String(r.id)}
        renderItem={render}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await cargar(); setRefreshing(false); }} />}
        ListEmptyComponent={items != null && (
          <Text className="mt-10 text-center font-bodysemi text-volcanic/50">
            {esTaxista ? (tab === "disponibles" ? t("res.noneAvail") : t("res.noneAccepted")) : t("res.none")}
          </Text>
        )}
      />
    </View>
  );
}
