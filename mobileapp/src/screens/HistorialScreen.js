// Historial + estadísticas — espejo de Historial.jsx + Estadisticas.jsx.
import { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { Card, Badge } from "../components/UI";

const BADGE_EMOJI = {
  COMPLETADO: "✅", CANCELADO: "✖️", EN_CURSO: "🚕",
  ACEPTADO: "🕐", SOLICITADO: "🔎", LLEGADO: "📍",
};

function fmtFecha(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "es-ES",
      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export default function HistorialScreen() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const esTaxista = user?.rol === "TAXISTA";
  const [items, setItems] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    setError("");
    try {
      const [hist, st] = await Promise.all([
        esTaxista ? api.historialTaxista() : api.historialCliente(),
        (esTaxista ? api.statsTaxista() : api.statsCliente()).catch(() => null),
      ]);
      setItems(hist || []);
      setStats(st);
    } catch (e) {
      setError(e.message || t("hist.couldNotLoad"));
      setItems([]);
    }
  }, [esTaxista]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  return (
    <View className="flex-1 bg-cream pt-14">
      <Text className="px-4 font-display text-[19px] text-volcanic">
        🧾 {esTaxista ? t("hist.myRides") : t("hist.myTrips")}
      </Text>

      {stats && (
        <View className="mt-3 flex-row gap-2 px-3.5">
          <Card className="flex-1 items-center py-3">
            <Text className="font-display text-[17px] text-volcanic">{stats.viajes}</Text>
            <Text className="mt-0.5 font-bodybold text-[11px] text-volcanic/50">{t("st.trips")}</Text>
          </Card>
          <Card className="flex-1 items-center py-3">
            <Text className="font-display text-[17px] text-volcanic">{Number(stats.total ?? 0).toFixed(0)} €</Text>
            <Text className="mt-0.5 font-bodybold text-[11px] text-volcanic/50">{esTaxista ? t("st.earned") : t("st.spent")}</Text>
          </Card>
          <Card className="flex-1 items-center py-3">
            <Text className="font-display text-[17px] text-volcanic">{Number(stats.km ?? 0).toFixed(0)}</Text>
            <Text className="mt-0.5 font-bodybold text-[11px] text-volcanic/50">{t("common.km")}</Text>
          </Card>
        </View>
      )}

      {stats?.topRutas?.length > 0 && (
        <Card className="mx-3.5 mt-2.5">
          <Text className="mb-1.5 font-display text-[12px] text-volcanic">
            🏆 {esTaxista ? t("st.topRidesDriver") : t("st.topRidesClient")}
          </Text>
          {stats.topRutas.slice(0, 3).map((r, i) => (
            <Text key={i} className="mt-0.5 font-bodysemi text-[12px] text-volcanic/70" numberOfLines={1}>
              {i + 1}. {r.origen} → {r.destino} · ×{r.veces}
            </Text>
          ))}
        </Card>
      )}

      {error ? <Text className="mt-2 px-4 font-bodybold text-[13px] text-coral">{error}</Text> : null}

      <FlatList
        data={items || []}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await cargar(); setRefreshing(false); }} />}
        ListEmptyComponent={items != null && (
          <Text className="mt-10 text-center font-bodysemi text-volcanic/50">
            {esTaxista ? t("hist.driverEmpty") : t("hist.clientEmpty")}
          </Text>
        )}
        renderItem={({ item: v }) => (
          <Card className="mb-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-bodybold text-[13px] text-atlantic-dark">
                {BADGE_EMOJI[v.estado] || "🚕"} {fmtFecha(v.completadoEn || v.solicitadoEn, lang)}
              </Text>
              <Badge>{t(`badge.${v.estado}`)}</Badge>
            </View>
            <Text className="mt-1 font-bodysemi text-[13px] text-volcanic/70" numberOfLines={1}>📍 {v.origenTexto || t("hist.mapPoint")}</Text>
            <Text className="mt-1 font-bodysemi text-[13px] text-volcanic/70" numberOfLines={1}>🏁 {v.destinoTexto || t("hist.mapPoint")}</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="flex-1 font-bodysemi text-[12px] text-volcanic/50" numberOfLines={1}>
                {esTaxista
                  ? (v.clienteNombre ? `🧍 ${v.clienteNombre}` : "")
                  : (v.taxistaNombre ? `🚕 ${v.taxistaNombre}` : "")}
              </Text>
              {v.precioFinal != null && (
                <Text className="font-display text-[15px] text-volcanic">{Number(v.precioFinal).toFixed(2)} €</Text>
              )}
            </View>
          </Card>
        )}
      />
    </View>
  );
}
