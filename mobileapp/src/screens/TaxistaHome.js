import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Switch, Modal, Linking } from "react-native";
import { Marker, Circle } from "react-native-maps";
import Mapa from "../components/Mapa";
import * as Location from "expo-location";
import { api } from "../api/client";
import { connectWs } from "../api/ws";
import { pedirPermisoUbicacion } from "../api/geo";
import { useAuth } from "../context/AuthContext";
import { useI18n, zonaTraducida } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import ValorarModal from "../components/ValorarModal";
import { Btn, Card, SHADOW_CARD } from "../components/UI";

const GC = { latitude: 28.1, longitude: -15.43, latitudeDelta: 0.4, longitudeDelta: 0.4 };
const NIVEL_COLOR = { ALTO: "#E0313166", MEDIO: "#F08C0055", BAJO: "#FFC40044" };

export default function TaxistaHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [online, setOnline] = useState(false);
  const [pos, setPos] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [viaje, setViaje] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [valorando, setValorando] = useState(null);
  const [msg, setMsg] = useState("");
  const wsRef = useRef(null);
  const watchRef = useRef(null);
  const hbRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    api.taxistaActivo().then((v) => v && setViaje(v)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!online) { setZonas([]); return; }
    let alive = true;
    const load = () => api.zonasCalientes().then((z) => alive && setZonas(z || [])).catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [online]);

  const apagar = useCallback(() => {
    wsRef.current?.close(); wsRef.current = null;
    watchRef.current?.remove(); watchRef.current = null;
    if (hbRef.current) clearInterval(hbRef.current);
  }, []);

  const encender = useCallback(async () => {
    const ok = await pedirPermisoUbicacion();
    if (!ok) { setMsg(t("ride.errLocGps")); setOnline(false); return; }

    const ws = connectWs((event, data) => {
      if (event === "trip:new") {
        setSolicitud(data);
        ws.send("trip:ack", { viajeId: data.viajeId });
      }
      if (event === "trip:assigned") {
        setSolicitud(null);
        api.taxistaActivo().then((v) => v && setViaje(v)).catch(() => {});
      }
      if (event === "trip:cancelled") {
        setSolicitud(null);
        setViaje(null);
        setMsg(t("drv.clientCancelled"));
      }
    });
    wsRef.current = ws;

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 4000, distanceInterval: 15 },
      (p) => {
        const fix = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(fix);
        wsRef.current?.send("location:update", fix);
      }
    );

    hbRef.current = setInterval(() => wsRef.current?.send("heartbeat", {}), 25_000);
  }, []);

  async function toggle(v) {
    setOnline(v);
    setMsg("");
    try { await api.estado({ disponible: v }); } catch (_) {}
    if (v) encender();
    else apagar();
  }

  useEffect(() => () => apagar(), [apagar]);

  useEffect(() => {
    if (pos) mapRef.current?.animateToRegion(
      { latitude: pos.lat, longitude: pos.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500
    );
  }, [pos?.lat, pos?.lng]);

  async function aceptar() {
    if (!solicitud) return;
    try {
      await api.aceptar(solicitud.viajeId);
      setSolicitud(null);
      const v = await api.taxistaActivo();
      if (v) setViaje(v);
      setMsg(`✅ ${t("drv.tripAccepted")}`);
    } catch (e) {
      setSolicitud(null);
      setMsg(t("drv.otherTook"));
    }
  }

  async function avanzar(accion) {
    if (!viaje) return;
    try {
      if (accion === "llegada") { await api.llegada(viaje.id); setViaje({ ...viaje, estado: "LLEGADO" }); setMsg(t("drv.arrivedMsg")); }
      if (accion === "iniciar") { await api.iniciar(viaje.id); setViaje({ ...viaje, estado: "EN_CURSO" }); setMsg(t("drv.startedMsg")); }
      if (accion === "finalizar") {
        const r = await api.finalizar(viaje.id);
        const id = viaje.id;
        setViaje(null);
        setMsg(`✅ ${t("drv.rideDone")}${r?.precio ? ` · ${Number(r.precio).toFixed(2)} €` : ""}`);
        setValorando(id);
      }
    } catch (e) {
      setMsg(e.message || t("drv.errFinish"));
    }
  }

  const estado = viaje?.estado;
  const noVerificado = user && user.verificado === false;

  return (
    <View className="flex-1 bg-cream">
      <Mapa ref={mapRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} initialRegion={GC} showsUserLocation>
        {zonas.map((z, i) => (
          <Circle key={i} center={{ latitude: z.lat, longitude: z.lng }} radius={z.radioM || 500}
            fillColor={NIVEL_COLOR[z.nivel] || NIVEL_COLOR.BAJO} strokeColor="transparent" />
        ))}
        {viaje?.origenLat != null && (
          <Marker coordinate={{ latitude: viaje.origenLat, longitude: viaje.origenLng }} pinColor="#1577C2" title={t("drv.pickup")} />
        )}
        {viaje?.destinoLat != null && (
          <Marker coordinate={{ latitude: viaje.destinoLat, longitude: viaje.destinoLng }} pinColor="#0B5C9E" title={t("drv.dest")} />
        )}
      </Mapa>

      {online && zonas.length > 0 && (
        <View className="absolute right-3 top-28 rounded-2xl bg-cream/95 px-2.5 py-2" style={SHADOW_CARD}>
          <Text className="font-bodybold text-[9px] uppercase tracking-wider text-volcanic/50">{t("drv.demand")}</Text>
          <Text className="mt-0.5 font-bodysemi text-[11px] text-volcanic">🔴 {t("drv.high")}</Text>
          <Text className="font-bodysemi text-[11px] text-volcanic">🟠 {t("drv.medium")}</Text>
          <Text className="font-bodysemi text-[11px] text-volcanic">🟡 {t("drv.low")}</Text>
        </View>
      )}

      <View
        className="absolute left-3 right-3 top-12 flex-row items-center justify-between rounded-2xl bg-cream/95 px-3 py-2"
        style={SHADOW_CARD}
      >
        <Text className="font-displayblack text-[16px] text-volcanic">
          Canary<Text className="text-taxi-dark">Cab</Text> 🚕
        </Text>
        <LangSwitcher />
      </View>

      <View className="absolute bottom-2 left-2.5 right-2.5">
        <Card>
          {noVerificado && (
            <View className="mb-2.5 rounded-xl bg-taxi/20 p-2.5">
              <Text className="font-bodybold text-[13px] text-volcanic">⏳ {t("drv.notVerifiedT")}</Text>
              <Text className="mt-0.5 font-bodysemi text-[12px] text-volcanic/70">{t("drv.notVerifiedD")}</Text>
            </View>
          )}
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="font-display text-[15px] text-volcanic">🚕 {user?.nombre?.split(" ")[0]}</Text>
              <Text className={`mt-0.5 font-bodybold text-[13px] ${online ? "text-atlantic" : "text-volcanic/40"}`}>
                {online ? `● ${t("drv.online")}` : `○ ${t("drv.offline")}`}
              </Text>
            </View>
            <Switch value={online} onValueChange={toggle}
              trackColor={{ false: "#CFE0EE", true: "#FFC400" }} thumbColor="#fff" />
          </View>

          {msg ? <Text className="mt-2.5 font-bodybold text-[13px] text-atlantic-dark">{msg}</Text> : null}

          {viaje && (
            <View className="mt-3 border-t border-sand pt-3">
              <Text className="font-bodysemi text-[14px] text-volcanic/80" numberOfLines={1}>📍 {viaje.origenTexto || "—"}</Text>
              <Text className="mt-1 font-bodysemi text-[14px] text-volcanic/80" numberOfLines={1}>🏁 {viaje.destinoTexto || "—"}</Text>
              {viaje.clienteNombre ? (
                <Text className="mt-1.5 font-bodybold text-[13px] text-atlantic-dark">🧍 {viaje.clienteNombre}</Text>
              ) : null}
              {viaje.clienteTelefono ? (
                <Btn title={`📞 ${t("ride.call")}`} kind="ghost" className="mt-3"
                  onPress={() => Linking.openURL(`tel:${viaje.clienteTelefono}`)} />
              ) : null}
              {estado === "ACEPTADO" && <Btn title={t("drv.arrivedBtn")} className="mt-3" onPress={() => avanzar("llegada")} />}
              {estado === "LLEGADO" && <Btn title={t("drv.startBtn")} className="mt-3" onPress={() => avanzar("iniciar")} />}
              {estado === "EN_CURSO" && <Btn title={t("drv.finishBtn")} kind="dark" className="mt-3" onPress={() => avanzar("finalizar")} />}
            </View>
          )}

          {!viaje && online && <Text className="mt-2.5 font-bodysemi text-[13px] text-volcanic/50">{t("drv.ready")}</Text>}
          {!online && <Text className="mt-2.5 font-bodysemi text-[13px] text-volcanic/50">{t("drv.connectToReceive")}</Text>}
        </Card>
      </View>

      <Modal visible={!!solicitud} transparent animationType="slide" onRequestClose={() => setSolicitud(null)}>
        <View className="flex-1 justify-end bg-volcanic/60 p-3.5">
          <Card className="pb-6">
            <Text className="mb-2 font-display text-[18px] text-volcanic">🚖 {t("drv.newTrip")}</Text>
            {solicitud?.detalle ? (
              <Text className="font-bodysemi text-[14px] text-volcanic/80" numberOfLines={2}>🌋 {solicitud.detalle}</Text>
            ) : null}
            {solicitud?.zona ? (
              <Text className="mt-1 font-bodysemi text-[14px] text-volcanic/80" numberOfLines={1}>🗺️ {zonaTraducida(t, solicitud.zona)}</Text>
            ) : null}
            {solicitud?.precioEstimado != null && (
              <Text className="mt-2.5 font-display text-[24px] text-volcanic">~{Number(solicitud.precioEstimado).toFixed(2)} €</Text>
            )}
            <View className="mt-4 flex-row gap-2.5">
              <Btn title={t("drv.reject")} kind="ghost" className="flex-1" onPress={() => setSolicitud(null)} />
              <Btn title={`✅ ${t("drv.accept")}`} className="flex-[2]" onPress={aceptar} />
            </View>
          </Card>
        </View>
      </Modal>

      {valorando != null && (
        <ValorarModal viajeId={valorando} quien="client" onClose={() => setValorando(null)} />
      )}
    </View>
  );
}
