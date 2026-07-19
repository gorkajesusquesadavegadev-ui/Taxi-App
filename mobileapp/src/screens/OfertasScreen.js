// Excursiones y transfers — espejo de cliente/Ofertas.jsx.
import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { api } from "../api/client";
import { ubicacionPrecisa, buscarDirecciones } from "../api/geo";
import { useI18n } from "../i18n";
import { Btn, Input, Card } from "../components/UI";
import ReservaModal from "../components/ReservaModal";

const ofTxt = (t, id, campo, fallback) => {
  const k = `of.${id}.${campo}`;
  const v = t(k);
  return v === k ? (fallback || "") : v;
};

export default function OfertasScreen() {
  const { t } = useI18n();
  const [tipo, setTipo] = useState("excursiones");
  const [items, setItems] = useState(null);
  const [recogida, setRecogida] = useState(null);
  const [queryRec, setQueryRec] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [reservando, setReservando] = useState(null);
  const [okMsg, setOkMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setItems(null);
    api.catalogo()
      .then((c) => alive && setItems(c?.[tipo] || []))
      .catch(() => alive && setError(t("of.couldNotLoadCatalog")));
    return () => { alive = false; };
  }, [tipo]);

  useEffect(() => {
    if (queryRec.trim().length < 3) { setSugerencias([]); return; }
    const id = setTimeout(() => {
      buscarDirecciones(queryRec).then(setSugerencias).catch(() => {});
    }, 400);
    return () => clearTimeout(id);
  }, [queryRec]);

  async function usarGps() {
    const p = await ubicacionPrecisa();
    if (p) setRecogida({ lat: p.lat, lng: p.lng, label: t("ride.useMyLocation") });
  }

  async function pedirAhora(oferta) {
    setBusyId(oferta.id); setError(""); setOkMsg("");
    try {
      await api.solicitarOferta({
        ofertaId: oferta.id,
        recogidaLat: recogida?.lat ?? null,
        recogidaLng: recogida?.lng ?? null,
      });
      setOkMsg(`✅ ${t("ride.searching")}`);
    } catch (e) {
      setError(e.message || t("of.couldNotRequest"));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmarReserva({ programadaPara, notas }) {
    await api.reservarCrear({
      tipo: tipo === "transfers" ? "TRANSFER" : "EXCURSION",
      ofertaId: reservando.id,
      origenLat: recogida?.lat ?? null,
      origenLng: recogida?.lng ?? null,
      origenTexto: recogida?.label ?? null,
      programadaPara, notas,
    });
    setReservando(null);
    setOkMsg(`✅ ${t("of.bookingSent")}`);
  }

  const esTransfer = tipo === "transfers";

  return (
    <View className="flex-1 bg-cream pt-14">
      <Text className="px-4 font-display text-[19px] text-volcanic">
        {esTransfer ? `✈️ ${t("of.transfersTitle")}` : `🌋 ${t("of.excursionsTitle")}`}
      </Text>
      <Text className="mt-0.5 px-4 font-bodysemi text-[13px] text-volcanic/50">
        {esTransfer ? t("of.transfersSub") : t("of.excursionsSub")}
      </Text>

      <View className="mt-3 flex-row gap-2 px-4">
        <Btn title={`🌋 ${t("nav.excursions")}`} kind={!esTransfer ? "primary" : "ghost"} className="flex-1 py-2.5" onPress={() => setTipo("excursiones")} />
        <Btn title={`✈️ ${t("nav.transfers")}`} kind={esTransfer ? "primary" : "ghost"} className="flex-1 py-2.5" onPress={() => setTipo("transfers")} />
      </View>

      <View className="mt-2 px-4">
        <Input
          placeholder={t("of.pickupOptional")}
          value={recogida ? recogida.label : queryRec}
          onChangeText={(v) => { setRecogida(null); setQueryRec(v); }}
        />
        {sugerencias.length > 0 && !recogida && (
          <Card className="mt-1 p-1.5">
            {sugerencias.slice(0, 4).map((x, i) => (
              <Pressable key={x.label + i} className="border-b border-sand px-1.5 py-2" onPress={() => { setRecogida(x); setSugerencias([]); }}>
                <Text className="font-body text-[13px] text-volcanic" numberOfLines={1}>📍 {x.label}</Text>
              </Pressable>
            ))}
          </Card>
        )}
        <Pressable onPress={usarGps}>
          <Text className="mt-1.5 font-bodybold text-[13px] text-atlantic-dark">🛰️ {t("ride.useMyLocation")}</Text>
        </Pressable>
      </View>

      {okMsg ? <Text className="mt-2 px-4 font-bodybold text-[13px] text-atlantic">{okMsg}</Text> : null}
      {error ? <Text className="mt-2 px-4 font-bodybold text-[13px] text-coral">{error}</Text> : null}

      <FlatList
        data={items || []}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        ListEmptyComponent={items != null && (
          <Text className="mt-10 text-center font-bodysemi text-volcanic/50">{t("of.emptyHint")}</Text>
        )}
        renderItem={({ item: o }) => (
          <Card className="mb-2.5">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-display text-[15px] text-volcanic">{ofTxt(t, o.id, "n", o.nombre)}</Text>
              <Text className="font-display text-[17px] text-taxi-dark">{Number(o.precio).toFixed(0)} €</Text>
            </View>
            <Text className="mt-1 font-body text-[13px] leading-[18px] text-volcanic/70">{ofTxt(t, o.id, "d", o.descripcion)}</Text>
            <Text className="mt-1.5 font-bodysemi text-[12px] text-volcanic/50">
              {o.duracion ? `⏱️ ${ofTxt(t, o.id, "dur", o.duracion)} · ` : ""}👥 {t("of.upTo4")} · {t("of.approxPrice")}
            </Text>
            <View className="mt-2.5 flex-row gap-2">
              <Btn title={`🚕 ${t("of.now")}`} className="flex-1" busy={busyId === o.id} onPress={() => pedirAhora(o)} />
              <Btn title={`📅 ${t("of.book")}`} kind="ghost" className="flex-1" onPress={() => setReservando(o)} />
            </View>
          </Card>
        )}
      />

      {reservando && (
        <ReservaModal
          titulo={`${t("of.bookPrefix")} · ${ofTxt(t, reservando.id, "n", reservando.nombre)}`}
          onConfirm={confirmarReserva}
          onClose={() => setReservando(null)}
        />
      )}
    </View>
  );
}
