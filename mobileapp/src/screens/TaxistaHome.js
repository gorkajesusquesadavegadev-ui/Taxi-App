// Home del taxista — espejo de pages/taxista/TaxistaHome.jsx (web, layout móvil).
import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Modal, Linking, Pressable, Vibration, AppState, Animated, Easing } from "react-native";
import Mapa from "../components/Mapa";
import * as Location from "expo-location";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { api } from "../api/client";
import { connectWs } from "../api/ws";
import { pedirPermisoUbicacion } from "../api/geo";
import { useAuth } from "../context/AuthContext";
import { useI18n, zonaTraducida } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import Sheet from "../components/Sheet";
import Badge from "../components/Badge";
import ValorarModal from "../components/ValorarModal";
import { Btn, Card, SHADOW_CARD } from "../components/UI";
import { rangoEur } from "../utils/precio";

const fmtEur = (x) => (x == null ? "—" : `${Number(x).toFixed(2)} €`);

// Toggle píldora online/offline — espejo del OnlineToggle web.
function OnlineToggle({ online, onToggle, t }) {
  return (
    <Pressable
      onPress={onToggle}
      className={`flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1.5 ${
        online ? "border-palm bg-palm/15" : "border-volcanic/15 bg-white"
      }`}
    >
      <View className={`h-2 w-2 rounded-full ${online ? "bg-palm" : "bg-volcanic/30"}`} />
      <Text className={`font-bodybold text-[13px] ${online ? "text-palm" : "text-volcanic/55"}`}>
        {online ? t("drv.online") : t("drv.offline")}
      </Text>
    </Pressable>
  );
}

export default function TaxistaHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [online, setOnline] = useState(false);
  const [wsEstado, setWsEstado] = useState("closed"); // diagnóstico tiempo real
  const [pos, setPos] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [viaje, setViaje] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [rutaGeo, setRutaGeo] = useState(null);   // geometría real (OSRM)
  const [rutaInfo, setRutaInfo] = useState(null); // {min, km}
  const [valorando, setValorando] = useState(null);
  const [msg, setMsg] = useState("");
  const wsRef = useRef(null);
  const watchRef = useRef(null);
  const hbRef = useRef(null);
  const locRef = useRef(null);        // intervalo de pings cada 3 s
  const posRef = useRef(null);        // último fix GPS real (nunca posición falsa)
  const afirmadoRef = useRef(false);  // ya declaramos LIBRE al backend
  const mapRef = useRef(null);
  const solicitudRef = useRef(null);  // acceso desde intervalos sin re-crear closures
  const viajeRef = useRef(null);
  useEffect(() => { solicitudRef.current = solicitud; }, [solicitud]);
  useEffect(() => { viajeRef.current = viaje; }, [viaje]);

  // Solicitud entrante: vibrar + cuenta atrás de 30 s (barra estilo Uber)
  const cuentaAtras = useRef(new Animated.Value(1)).current;
  function recibirSolicitud(data) {
    setSolicitud(data);
    Vibration.vibrate([0, 400, 150, 400]);
    cuentaAtras.setValue(1);
    Animated.timing(cuentaAtras, {
      toValue: 0, duration: 30_000, easing: Easing.linear, useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setSolicitud((s) => (s && s.viajeId === data.viajeId ? null : s));
    });
  }

  // Red de seguridad (igual que la web): sondear viajes pendientes cerca cada 5 s.
  // Cubre avisos WS perdidos (app en segundo plano, microcortes, reconexiones).
  useEffect(() => {
    if (!online) return;
    const id = setInterval(async () => {
      if (solicitudRef.current || viajeRef.current) return;
      try {
        const pend = await api.pendienteCercano();
        if (pend && !solicitudRef.current) {
          // pendienteCercano devuelve ViajeResponse (campo `id`); el modal espera `viajeId`
          recibirSolicitud({ ...pend, viajeId: pend.viajeId ?? pend.id });
        }
      } catch (_) {}
    }, 5000);
    return () => clearInterval(id);
  }, [online]);

  // Al volver la app a primer plano: re-declararse LIBRE (el estado en Redis
  // expira a los 60 s congelada) y comprobar al instante si hay viaje pendiente.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => {
      if (st !== "active" || !online) return;
      afirmadoRef.current = false;
      if (posRef.current && !viajeRef.current) afirmarLibre(posRef.current);
      if (!solicitudRef.current && !viajeRef.current) {
        api.pendienteCercano()
          .then((pend) => pend && recibirSolicitud({ ...pend, viajeId: pend.viajeId ?? pend.id }))
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, [online, afirmarLibre]);

  useEffect(() => {
    api.taxistaActivo().then((v) => v && setViaje(v)).catch(() => {});
  }, []);

  // Ruta real por carretera del viaje activo — misma línea que la web
  useEffect(() => {
    if (!viaje?.id) { setRutaGeo(null); setRutaInfo(null); return; }
    let alive = true;
    api.rutaViaje(viaje.id)
      .then((r) => {
        if (!alive) return;
        if (r?.puntos?.length > 1) setRutaGeo(r.puntos.map(([lat, lng]) => [lat, lng]));
        if (r?.duracionMin != null) setRutaInfo({ min: Math.round(Number(r.duracionMin)), km: Number(r.km) });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [viaje?.id]);

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
    if (locRef.current) clearInterval(locRef.current);
    afirmadoRef.current = false;
    deactivateKeepAwake("taxista-online").catch?.(() => {});
  }, []);

  // Declara LIBRE al backend (Redis GEO + disponibilidad persistente) y manda el primer ping.
  // Igual que la web: api.estado({estado:"LIBRE", lat, lng}) — salvo que haya viaje activo.
  const afirmarLibre = useCallback((p) => {
    if (afirmadoRef.current || !p) return;
    afirmadoRef.current = true;
    setMsg(t("drv.connected"));
    api.taxistaActivo()
      .then((v) => {
        if (!v) api.estado({ estado: "LIBRE", lat: p.lat, lng: p.lng }).catch(() => {});
      })
      .catch(() => {});
    wsRef.current?.send("location:update", { lat: p.lat, lng: p.lng });
  }, []);

  const encender = useCallback(async () => {
    const ok = await pedirPermisoUbicacion();
    if (!ok) { setMsg(t("ride.errLocGps")); setOnline(false); return; }

    // Pantalla siempre encendida mientras estás en línea: si Android congela
    // la app (pantalla apagada), los pings paran y el backend te expira a los
    // 60 s → desapareces del mapa y no te llegan viajes. Como Uber.
    activateKeepAwakeAsync("taxista-online").catch(() => {});

    const ws = connectWs(
      (event, data) => {
        if (event === "trip:new") {
          recibirSolicitud(data);
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
      },
      (state) => {
        console.log("[taxista][ws]", state);
        setWsEstado(state);
        // Al (re)conectar el WS, reafirmar LIBRE con el último fix (como la web)
        if (state === "open") {
          afirmadoRef.current = false;
          if (posRef.current) afirmarLibre(posRef.current);
          else setMsg(t("drv.searchingGps"));
        }
      }
    );
    wsRef.current = ws;

    // Cascada de fixes, del más rápido al más preciso — en interior el GPS puro
    // puede no dar fix nunca; sin posición jamás se declara LIBRE y no llegan viajes.
    const usarFix = (p) => {
      if (!p) return;
      const fix = { lat: p.coords.latitude, lng: p.coords.longitude };
      posRef.current = fix;
      setPos(fix);
      afirmarLibre(fix);
    };
    // 1) Última posición conocida del sistema: instantánea (aunque sea algo vieja)
    Location.getLastKnownPositionAsync().then(usarFix).catch(() => {});
    // 2) Fix rápido de red/wifi
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(usarFix).catch(() => {});
    // 3) Seguimiento continuo (High funciona en interior; sin filtro de distancia)
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 0 },
      usarFix
    );

    // Ping de posición cada 3 s con el último fix real (aunque estés parado).
    // Doble canal: WS (tiempo real) + REST (a prueba de balas — si el WS se cae,
    // el backend sigue viéndote y el sondeo de pendientes funciona igual).
    locRef.current = setInterval(() => {
      const p = posRef.current;
      if (!p) return;
      wsRef.current?.send("location:update", { lat: p.lat, lng: p.lng });
      api.ping({ lat: p.lat, lng: p.lng }).catch(() => {});
    }, 3000);
    hbRef.current = setInterval(() => wsRef.current?.send("heartbeat", {}), 25_000);
  }, [afirmarLibre]);

  async function toggleOnline() {
    setMsg("");
    if (!online) {
      setOnline(true);
      encender();
    } else {
      try { await api.estado({ estado: "DESCONECTADO" }); } catch (_) {}
      setOnline(false);
      apagar();
      setMsg(t("drv.offline") + ".");
    }
  }

  useEffect(() => () => apagar(), [apagar]);

  useEffect(() => {
    if (pos) mapRef.current?.animateToRegion(
      { latitude: pos.lat, longitude: pos.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500
    );
  }, [pos?.lat, pos?.lng]);

  async function aceptar() {
    if (!solicitud) return;
    const id = solicitud.viajeId ?? solicitud.id;
    if (!id) { setSolicitud(null); setMsg(t("drv.invalidReq")); return; }
    try {
      const v = await api.aceptar(id);
      if (v) setViaje(v);
      setSolicitud(null);
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
        setViaje({ ...viaje, estado: "COMPLETADO", precioFinal: r?.precio ?? viaje.precioEstimado });
        setMsg(`✅ ${t("drv.rideDone")}`);
        setValorando(id);
      }
    } catch (e) {
      setMsg(e.message || t("drv.errFinish"));
    }
  }

  const estado = viaje?.estado;
  const enViaje = viaje && estado !== "COMPLETADO";
  const noVerificado = user && user.verificado === false;

  return (
    <View className="flex-1 bg-cream">
      <Mapa
        ref={mapRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        circles={zonas.map((z) => ({ lat: z.lat, lng: z.lng, radius: z.radioM || 500, nivel: z.nivel }))}
        markers={[
          ...(pos ? [{ id: "yo", lat: pos.lat, lng: pos.lng, kind: "taxi" }] : []),
          ...(viaje?.origenLat != null ? [{ id: "o", lat: viaje.origenLat, lng: viaje.origenLng, kind: "origin" }] : []),
          ...(viaje?.destinoLat != null ? [{ id: "d", lat: viaje.destinoLat, lng: viaje.destinoLng, kind: "destino" }] : []),
        ]}
        route={enViaje ? rutaGeo : null}
      />

      {/* FAB recentrar */}
      <Pressable
        className="absolute right-3 top-24 h-11 w-11 items-center justify-center rounded-full bg-white active:bg-sand"
        style={SHADOW_CARD}
        onPress={() => pos && mapRef.current?.animateToRegion({ latitude: pos.lat, longitude: pos.lng })}
      >
        <Text className="text-[18px]">🎯</Text>
      </Pressable>

      {/* header: título + toggle + idioma */}
      <View
        className="absolute left-3 right-3 top-12 flex-row items-center justify-between rounded-2xl bg-cream/95 px-3 py-2"
        style={SHADOW_CARD}
      >
        <Text className="font-displayblack text-[15px] text-volcanic">
          Canary<Text className="text-taxi-dark">Cab</Text>
        </Text>
        <View className="flex-row items-center gap-2">
          {online && (
            <Text className="text-[13px]">{wsEstado === "open" ? "⚡" : "🐢"}</Text>
          )}
          <OnlineToggle online={online} onToggle={toggleOnline} t={t} />
          <LangSwitcher />
        </View>
      </View>

      {/* leyenda demanda */}
      {online && zonas.length > 0 && (
        <View className="absolute right-3 top-40 rounded-2xl bg-cream/95 px-2.5 py-2" style={SHADOW_CARD}>
          <Text className="font-bodybold text-[9px] uppercase tracking-wider text-volcanic/50">{t("drv.demand")}</Text>
          <Text className="mt-0.5 font-bodysemi text-[11px] text-volcanic">🔴 {t("drv.high")}</Text>
          <Text className="font-bodysemi text-[11px] text-volcanic">🟠 {t("drv.medium")}</Text>
          <Text className="font-bodysemi text-[11px] text-volcanic">🟡 {t("drv.low")}</Text>
        </View>
      )}

      <Sheet>
        {enViaje ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Badge estado={viaje.estado} />
              <Text className="font-display text-[18px] text-volcanic">
                {rangoEur(viaje.precioMin, viaje.precioMax, viaje.precioFinal ?? viaje.precioEstimado)}
              </Text>
            </View>
            {viaje.detalle ? (
              <View className="self-start rounded-full bg-taxi/20 px-3 py-1.5">
                <Text className="font-bodybold text-[12px] text-volcanic">{viaje.detalle}</Text>
              </View>
            ) : null}

            {rutaInfo && (
              <Text className="font-display text-[14px] text-atlantic-dark">
                {rutaInfo.min} min
                <Text className="font-bodymed text-[12px] text-volcanic/50">  {rutaInfo.km.toFixed(1)} km</Text>
              </Text>
            )}

            {/* origen → destino con línea de puntos */}
            <View className="flex-row items-start gap-2.5">
              <View className="items-center pt-1">
                <View className="h-2 w-2 rounded-full bg-taxi" />
                <View className="my-0.5 h-4 w-px bg-volcanic/20" />
                <View className="h-2 w-2 rounded-full bg-atlantic-dark" />
              </View>
              <View className="flex-1 gap-1.5">
                <Text className="font-bodysemi text-[13px] text-volcanic" numberOfLines={1}>
                  {viaje.origenTexto || t("drv.pickup")}
                </Text>
                <Text className="font-bodysemi text-[13px] text-volcanic" numberOfLines={1}>
                  {viaje.destinoTexto || t("drv.dest")}
                </Text>
              </View>
            </View>

            {viaje.clienteNombre ? (
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 font-bodysemi text-[13px] text-volcanic/70" numberOfLines={1}>
                  🧍 {viaje.clienteNombre}
                </Text>
                {viaje.clienteTelefono ? (
                  <Pressable
                    className="rounded-xl bg-volcanic px-3 py-1.5 active:scale-95"
                    onPress={() => Linking.openURL(`tel:${viaje.clienteTelefono}`)}
                  >
                    <Text className="font-bodybold text-[13px] text-cream">📞 {t("ride.call")}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Text className="font-bodysemi text-[13px] text-volcanic/70">{msg || t("drv.connectToReceive")}</Text>

            {/* 3 fases: llegada / iniciar / finalizar */}
            <View className="flex-row gap-2">
              <Btn title={t("drv.arrivedBtn")} kind={estado === "ACEPTADO" ? "primary" : "outline"}
                disabled={estado !== "ACEPTADO"} onPress={() => avanzar("llegada")} className="flex-1 px-1 py-2.5" />
              <Btn title={t("drv.startBtn")} kind={estado === "LLEGADO" ? "primary" : "outline"}
                disabled={estado !== "LLEGADO"} onPress={() => avanzar("iniciar")} className="flex-1 px-1 py-2.5" />
              <Btn title={t("drv.finishBtn")} kind={estado === "EN_CURSO" ? "primary" : "outline"}
                disabled={estado !== "EN_CURSO"} onPress={() => avanzar("finalizar")} className="flex-1 px-1 py-2.5" />
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className={`h-11 w-11 items-center justify-center rounded-2xl ${online ? "bg-atlantic/15" : "bg-volcanic/10"}`}>
                <Text className="text-[20px]">🚕</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-display text-[15px] text-volcanic">
                  {estado === "COMPLETADO" ? t("drv.rideDone") : online ? t("drv.online") : t("drv.offline")}
                </Text>
                <Text className="font-bodysemi text-[13px] text-volcanic/60" numberOfLines={1}>
                  {msg || t("drv.connectToReceive")}
                </Text>
              </View>
              {estado === "COMPLETADO" && (
                <Btn title={t("drv.ready")} kind="dark" className="px-3 py-2" onPress={() => setViaje(null)} />
              )}
            </View>

            {!viaje && online && noVerificado && (
              <View className="rounded-2xl bg-coral/10 px-4 py-3">
                <Text className="font-bodybold text-[14px] text-coral">{t("drv.notVerifiedT")}</Text>
                <Text className="mt-0.5 font-body text-[12px] text-volcanic/60">{t("drv.notVerifiedD")}</Text>
              </View>
            )}

            {!online && (
              <Btn title={`🟢 ${t("drv.onlineToggle")}`} onPress={toggleOnline} />
            )}
          </View>
        )}
      </Sheet>

      {/* solicitud entrante */}
      <Modal visible={!!solicitud} transparent animationType="slide" onRequestClose={() => setSolicitud(null)}>
        <View className="flex-1 justify-end bg-volcanic/60 p-3.5">
          <Card className="pb-6">
            {/* barra de tiempo restante (30 s) */}
            <View className="mb-3 h-1.5 overflow-hidden rounded-full bg-sand">
              <Animated.View
                className="h-full rounded-full bg-taxi"
                style={{ width: cuentaAtras.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}
              />
            </View>
            <Text className="mb-2 font-display text-[18px] text-volcanic">🚖 {t("drv.newTrip")}</Text>
            {solicitud?.detalle ? (
              <Text className="font-bodysemi text-[14px] text-volcanic/80" numberOfLines={2}>🌋 {solicitud.detalle}</Text>
            ) : null}
            {solicitud?.origenTexto ? (
              <Text className="font-bodysemi text-[14px] text-volcanic/80" numberOfLines={1}>📍 {solicitud.origenTexto}</Text>
            ) : null}
            {solicitud?.destinoTexto ? (
              <Text className="mt-1 font-bodysemi text-[14px] text-volcanic/80" numberOfLines={1}>🏁 {solicitud.destinoTexto}</Text>
            ) : null}
            {solicitud?.zona ? (
              <Text className="mt-1 font-bodysemi text-[14px] text-volcanic/80" numberOfLines={1}>🗺️ {zonaTraducida(t, solicitud.zona)}</Text>
            ) : null}
            {solicitud?.precioEstimado != null && (
              <Text className="mt-2.5 font-display text-[24px] text-volcanic">{rangoEur(solicitud.precioMin, solicitud.precioMax, solicitud.precioEstimado)}</Text>
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
