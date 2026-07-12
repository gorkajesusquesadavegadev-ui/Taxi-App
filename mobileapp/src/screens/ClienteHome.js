// Home del cliente — espejo de pages/cliente/ClienteHome.jsx (web, layout móvil).
import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, Linking, Share, ActivityIndicator } from "react-native";
import Mapa from "../components/Mapa";
import { api } from "../api/client";
import { connectWs } from "../api/ws";
import { ubicacionPrecisa, direccionDe } from "../api/geo";
import { useAuth } from "../context/AuthContext";
import { useI18n, zonaTraducida } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import Sheet from "../components/Sheet";
import AddressSearch from "../components/AddressSearch";
import Badge from "../components/Badge";
import ValorarModal from "../components/ValorarModal";
import ReservaModal from "../components/ReservaModal";
import { Btn, Input, SHADOW_CARD } from "../components/UI";

const fmtEur = (x) => (x == null ? "—" : `${Number(x).toFixed(2)} €`);

function haversineKm(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export default function ClienteHome() {
  const { t } = useI18n();
  useAuth();
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [paradas, setParadas] = useState([]); // [point|null]
  const [accesible, setAccesible] = useState(false);
  const [estimacion, setEstimacion] = useState(null);
  const [estimando, setEstimando] = useState(false);
  const [viaje, setViaje] = useState(null);
  const [taxiPos, setTaxiPos] = useState(null);
  const [taxis, setTaxis] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [guardandoFav, setGuardandoFav] = useState(false);
  const [etiquetaFav, setEtiquetaFav] = useState("");
  const [fidelidad, setFidelidad] = useState(null);
  const [valorando, setValorando] = useState(null);
  const [reservando, setReservando] = useState(false);
  const [rutaActiva, setRutaActiva] = useState(null); // geometría real del viaje (OSRM)
  const [sinTaxi, setSinTaxi] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mapRef = useRef(null);
  const viajeIdRef = useRef(null);

  // ── GPS → origen (con dirección real) ─────────────────────────────────────
  const usarMiUbicacion = useCallback(async () => {
    setLocalizando(true);
    setError("");
    const p = await ubicacionPrecisa();
    setLocalizando(false);
    if (!p) { setError(t("ride.errLocGps")); return; }
    const label = (await direccionDe(p.lat, p.lng)) || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    setOrigen({ lat: p.lat, lng: p.lng, label });
    mapRef.current?.animateToRegion(
      { latitude: p.lat, longitude: p.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600
    );
  }, []);
  useEffect(() => { usarMiUbicacion(); }, [usarMiUbicacion]);

  useEffect(() => {
    api.activo().then((v) => v && setViaje(v)).catch(() => {});
    cargarFavs();
  }, []);
  async function cargarFavs() {
    try { setFavoritos((await api.favoritos()) || []); } catch (_) {}
  }
  useEffect(() => {
    api.fidelidad().then(setFidelidad).catch(() => {});
  }, [viaje?.estado]);
  useEffect(() => { viajeIdRef.current = viaje?.id ?? null; }, [viaje?.id]);

  // Ruta real por carretera del viaje activo (misma línea que la web)
  useEffect(() => {
    if (!viaje?.id) { setRutaActiva(null); return; }
    let alive = true;
    api.rutaViaje(viaje.id)
      .then((r) => alive && r?.puntos?.length > 1 && setRutaActiva(r))
      .catch(() => {});
    return () => { alive = false; };
  }, [viaje?.id]);

  // ── Taxis online ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!origen) return;
    let alive = true;
    const load = () =>
      api.taxistasOnline(origen.lat, origen.lng)
        .then((d) => alive && setTaxis(d || []))
        .catch(() => {});
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [origen?.lat, origen?.lng]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event === "trip:accepted") {
        setViaje((v) => (v ? { ...v, estado: "ACEPTADO", taxistaId: data.taxistaId } : v));
        const vid = viajeIdRef.current ?? data.viajeId;
        if (vid) api.viaje(vid).then((full) => full && setViaje(full)).catch(() => {});
      }
      if (event === "trip:location") setTaxiPos({ lat: data.lat, lng: data.lng });
      if (event === "trip:arrived") setViaje((v) => v && { ...v, estado: "LLEGADO" });
      if (event === "trip:status") {
        const map = { ARRIVED: "LLEGADO", IN_PROGRESS: "EN_CURSO", COMPLETED: "COMPLETADO" };
        const est = map[data?.status];
        if (!est) return;
        setViaje((v) => {
          if (v && est === "COMPLETADO" && v.id) setValorando(v.id);
          return v ? { ...v, estado: est } : v;
        });
      }
      if (event === "trip:cancelled") { setViaje(null); setTaxiPos(null); }
    });
    return () => ws.close();
  }, []);

  // Red de seguridad: sondear el viaje activo cada 8 s. Si el WS del móvil se
  // cae, los cambios de estado (aceptado/llegó/en curso/completado) llegan igual,
  // y la posición del taxi asignado se saca de taxistas/online (se ve moverse).
  useEffect(() => {
    if (!viaje?.id || ["COMPLETADO", "CANCELADO"].includes(viaje.estado)) return;
    const id = setInterval(async () => {
      try {
        const v = await api.viaje(viaje.id);
        if (!v) return;
        setViaje((prev) => {
          if (!prev || prev.id !== v.id) return prev;
          if (v.estado !== prev.estado && v.estado === "COMPLETADO") setValorando(v.id);
          return { ...prev, ...v };
        });
        // Posición en vivo del taxi asignado (fallback sin WS)
        if (v.taxistaId && v.origenLat != null) {
          const cerca = await api.taxistasOnline(v.origenLat, v.origenLng);
          const mio = (cerca || []).find((x) => x.taxistaId === v.taxistaId);
          if (mio) setTaxiPos({ lat: mio.lat, lng: mio.lng });
        }
      } catch (_) {}
    }, 8000);
    return () => clearInterval(id);
  }, [viaje?.id, viaje?.estado]);

  // ── Sin taxi tras 45 s ────────────────────────────────────────────────────
  useEffect(() => {
    if (!viaje || viaje.estado !== "SOLICITADO") { setSinTaxi(false); return; }
    const id = setTimeout(() => setSinTaxi(true), 45_000);
    return () => clearTimeout(id);
  }, [viaje?.id, viaje?.estado]);

  // ── Estimación ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!origen || !destino) { setEstimacion(null); return; }
    let alive = true;
    setEstimando(true);
    api.estimar({
      origenLat: origen.lat, origenLng: origen.lng,
      destinoLat: destino.lat, destinoLng: destino.lng,
      paradas: paradas.filter(Boolean).map((p) => [p.lat, p.lng]),
    })
      .then((e) => alive && setEstimacion(e))
      .catch(() => alive && setError(t("ride.errEstimate")))
      .finally(() => alive && setEstimando(false));
    return () => { alive = false; };
  }, [origen?.lat, origen?.lng, destino?.lat, destino?.lng, paradas]);

  // (El encuadre del mapa lo hace la propia ruta al pintarse — ver Mapa.pintarRuta)

  // ── Acciones ──────────────────────────────────────────────────────────────
  async function pedir() {
    if (!origen || !destino) return;
    setBusy(true); setError(""); setSinTaxi(false);
    try {
      const v = await api.solicitar({
        origenLat: origen.lat, origenLng: origen.lng,
        destinoLat: destino.lat, destinoLng: destino.lng,
        origenTexto: origen.label || null, destinoTexto: destino.label || null,
        requiereAccesible: accesible,
        paradas: paradas.filter(Boolean).map((p) => [p.lat, p.lng]),
      });
      setViaje(v);
    } catch (e) {
      setError(e.message || t("ride.errRequest"));
    } finally {
      setBusy(false);
    }
  }

  async function reintentar() {
    if (!viaje) return;
    try { await api.cancelar(viaje.id); } catch (_) {}
    setViaje(null); setTaxiPos(null); setSinTaxi(false);
    setTimeout(pedir, 400);
  }

  async function cancelar() {
    if (viaje && !["COMPLETADO", "CANCELADO"].includes(viaje.estado)) {
      try { await api.cancelar(viaje.id); } catch (_) {}
    }
    reset(true);
  }

  function reset(todo = false) {
    if (todo) { setViaje(null); setTaxiPos(null); }
    setDestino(null); setParadas([]); setEstimacion(null); setSinTaxi(false); setError("");
  }

  async function compartirViaje() {
    if (!viaje) return;
    try {
      const { token } = await api.compartirViaje(viaje.id);
      const url = `https://canarycab.com/seguir/${token}`;
      await Share.share({ message: t("ride.shareText", { url }), title: t("ride.shareTitle") });
    } catch (_) {
      setError(t("ride.linkFail"));
    }
  }

  async function sos() {
    const partes = [t("ride.sosText")];
    if (viaje?.taxistaNombre) partes.push(`${t("ride.sosDriver")}: ${viaje.taxistaNombre}`);
    if (viaje?.taxistaMatricula) partes.push(`${t("ride.sosPlate")}: ${viaje.taxistaMatricula}`);
    if (viaje?.taxistaLicencia) partes.push(`${t("ride.sosLicense")}: ${viaje.taxistaLicencia}`);
    const pos = taxiPos || origen;
    if (pos) partes.push(`${t("ride.sosLoc")}: https://maps.google.com/?q=${pos.lat},${pos.lng}`);
    await Share.share({ message: partes.join("\n") });
  }

  function pickFavorito(f) {
    const punto = { lat: f.lat, lng: f.lng, label: f.direccion || f.etiqueta };
    if (!origen) setOrigen(punto);
    else setDestino(punto);
  }

  async function guardarFav() {
    const p = destino || origen;
    if (!p || !etiquetaFav.trim()) return;
    try {
      await api.favoritoCrear({ etiqueta: etiquetaFav.trim(), direccion: p.label || null, lat: p.lat, lng: p.lng });
      setEtiquetaFav(""); setGuardandoFav(false);
      cargarFavs();
    } catch (e) {
      setError(e.message || t("fav.couldNotSave"));
    }
  }

  async function crearReserva({ programadaPara, notas }) {
    await api.reservarCrear({
      tipo: "NORMAL",
      origenLat: origen.lat, origenLng: origen.lng, origenTexto: origen.label || null,
      destinoLat: destino.lat, destinoLng: destino.lng, destinoTexto: destino.label || null,
      programadaPara, notas,
    });
    setReservando(false);
    reset();
  }

  // ── Derivados ─────────────────────────────────────────────────────────────
  const estado = viaje?.estado;
  const enCurso = !!viaje;
  const etaMin = taxiPos && viaje?.origenLat
    ? Math.max(1, Math.round((haversineKm(taxiPos, { lat: viaje.origenLat, lng: viaje.origenLng }) / 28) * 60))
    : null;
  const libres = taxis.filter((x) => !x.enViaje).length;

  // Ruta a pintar: viaje activo (carretera real) > estimación > recta origen-destino
  const route =
    viaje && rutaActiva
      ? rutaActiva.puntos.map(([lat, lng]) => [lat, lng])
      : estimacion?.ruta?.length > 1
        ? estimacion.ruta.map(([lat, lng]) => [lat, lng])
        : origen && destino
          ? [[origen.lat, origen.lng], [destino.lat, destino.lng]]
          : null;

  const statusMsg = {
    SOLICITADO: t("ride.searching"),
    ACEPTADO: t("ride.driverOnWay"),
    LLEGADO: t("ride.hasArrived"),
    EN_CURSO: t("ride.inProgress"),
    COMPLETADO: t("ride.completed"),
    CANCELADO: t("ride.cancelled"),
  }[estado];

  return (
    <View className="flex-1 bg-cream">
      <Mapa
        ref={mapRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        markers={[
          // radar de búsqueda mientras se asigna taxi
          ...(estado === "SOLICITADO" && viaje?.origenLat
            ? [{ id: "radar", lat: viaje.origenLat, lng: viaje.origenLng, kind: "radar" }]
            : []),
          ...(origen ? [{ id: "o", lat: origen.lat, lng: origen.lng, kind: "origin" }] : []),
          ...paradas.filter(Boolean).map((p, i) => ({ id: `p${i}`, lat: p.lat, lng: p.lng, kind: "stop" })),
          ...(destino ? [{ id: "d", lat: destino.lat, lng: destino.lng, kind: "destino" }] : []),
          ...(taxiPos ? [{ id: "tx", lat: taxiPos.lat, lng: taxiPos.lng, kind: "taxi" }] : []),
          ...(!enCurso
            ? taxis.map((tx, i) => ({
                id: `t${tx.taxistaId ?? i}`, lat: tx.lat, lng: tx.lng,
                kind: tx.enViaje ? "carOcupado" : "taxi",
              }))
            : []),
        ]}
        route={route}
        onMapPress={async (lat, lng) => {
          if (viaje) return;
          const label = (await direccionDe(lat, lng)) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          if (!origen) setOrigen({ lat, lng, label });
          else setDestino({ lat, lng, label });
        }}
      />

      {/* FAB recentrar (estilo Uber) */}
      <Pressable
        className="absolute right-3 top-24 h-11 w-11 items-center justify-center rounded-full bg-white active:bg-sand"
        style={SHADOW_CARD}
        onPress={() => {
          const p = taxiPos || origen;
          if (p) mapRef.current?.animateToRegion({ latitude: p.lat, longitude: p.lng });
        }}
      >
        <Text className="text-[18px]">🎯</Text>
      </Pressable>

      {/* banner: el taxi ha llegado */}
      {estado === "LLEGADO" && (
        <View className="absolute inset-x-3 top-12 items-center" style={{ zIndex: 20 }}>
          <View className="flex-row items-center gap-3 rounded-2xl bg-taxi px-4 py-3" style={SHADOW_CARD}>
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-volcanic">
              <Text className="text-[18px]">🚕</Text>
            </View>
            <View className="shrink">
              <Text className="font-display text-[13px] text-volcanic">{t("ride.arrivedBannerT")}</Text>
              <Text className="font-bodysemi text-[12px] text-volcanic/70">{t("ride.arrivedBannerD")}</Text>
            </View>
          </View>
        </View>
      )}

      {/* chip de ayuda flotante (como la web) */}
      {!viaje && (
        <View className="absolute inset-x-3 top-12 flex-row items-center justify-center" pointerEvents="box-none">
          <View className="max-w-[75%] rounded-full bg-volcanic/90 px-3.5 py-1.5">
            <Text className="text-center font-bodybold text-[12px] text-cream" numberOfLines={1}>
              {!origen ? t("ride.helperPickup") : !destino ? t("ride.helperDest") : t("ride.helperReady")}
            </Text>
          </View>
          <View className="absolute right-0"><LangSwitcher /></View>
        </View>
      )}

      {/* bottom sheet plegable */}
      <Sheet>
        {viaje ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Badge estado={viaje.estado} />
              <Text className="font-display text-[18px] text-volcanic">
                {fmtEur(viaje.precioFinal ?? viaje.precioEstimado)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="font-bodysemi text-[14px] text-volcanic/70">{statusMsg}</Text>
              {!["COMPLETADO", "CANCELADO"].includes(estado) && <ActivityIndicator size="small" color="#E8AF00" />}
            </View>

            {/* Tu taxi: matrícula + licencia + contacto (igual que la web) */}
            {viaje.taxistaId && ["ACEPTADO", "LLEGADO", "EN_CURSO"].includes(estado) && (
              <View className="rounded-2xl border-2 border-taxi/40 bg-taxi/10 p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bodybold text-[10px] uppercase tracking-[2px] text-volcanic/55">
                    {t("ride.yourTaxi")}
                  </Text>
                  {estado === "ACEPTADO" && etaMin != null && (
                    <View className="rounded-full bg-volcanic px-2.5 py-1">
                      <Text className="font-display text-[11px] text-taxi">⏱️ {t("ride.arrivesIn", { min: etaMin })}</Text>
                    </View>
                  )}
                  {estado === "LLEGADO" && (
                    <View className="rounded-full bg-palm px-2.5 py-1">
                      <Text className="font-bodybold text-[11px] text-white">{t("ride.hasArrived")}</Text>
                    </View>
                  )}
                </View>
                <View className="mt-1.5 flex-row items-center justify-between gap-3">
                  <View className="shrink">
                    <Text className="font-display text-[15px] text-volcanic" numberOfLines={1}>
                      {viaje.taxistaNombre || "Taxista"}{viaje.taxistaVerificado ? " ✓" : ""}
                    </Text>
                    <Text className="font-bodymed text-[13px] text-volcanic/65" numberOfLines={1}>
                      {viaje.taxistaModelo || ""}
                      {viaje.taxistaRatingCount > 0 ? `  · ⭐ ${viaje.taxistaRating} (${viaje.taxistaRatingCount})` : ""}
                    </Text>
                  </View>
                  {viaje.taxistaMatricula && (
                    <View className="rounded-lg border-2 border-volcanic bg-white px-2.5 py-1">
                      <Text className="font-bodybold text-[15px] tracking-widest text-volcanic">{viaje.taxistaMatricula}</Text>
                    </View>
                  )}
                </View>
                <View className="mt-2 flex-row items-center gap-2">
                  {viaje.taxistaLicencia && (
                    <View className="rounded-md bg-volcanic/10 px-2 py-1">
                      <Text className="font-bodybold text-[12px] text-volcanic/70">
                        {t("ride.licensePrefix")} {viaje.taxistaLicencia}
                      </Text>
                    </View>
                  )}
                  {viaje.taxistaTelefono && (
                    <Pressable
                      className="ml-auto rounded-xl bg-volcanic px-3 py-1.5 active:scale-95"
                      onPress={() => Linking.openURL(`tel:${viaje.taxistaTelefono}`)}
                    >
                      <Text className="font-bodybold text-[14px] text-cream">📞 {t("ride.call")}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* compartir + SOS */}
            {["ACEPTADO", "LLEGADO", "EN_CURSO"].includes(estado) && (
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 items-center rounded-2xl border border-sand-deep bg-white py-2.5 active:bg-atlantic/10"
                  onPress={compartirViaje}
                >
                  <Text className="font-bodybold text-[14px] text-volcanic">🔗 {t("ride.share")}</Text>
                </Pressable>
                <Pressable className="flex-1 items-center rounded-2xl bg-coral/15 py-2.5 active:bg-coral/25" onPress={sos}>
                  <Text className="font-bodybold text-[14px] text-coral">🆘 {t("ride.sos")}</Text>
                </Pressable>
              </View>
            )}

            {/* sin taxi tras 45 s */}
            {sinTaxi && estado === "SOLICITADO" && (
              <View className="rounded-xl bg-taxi/15 px-3 py-2.5">
                <Text className="font-bodysemi text-[14px] text-volcanic">{t("ride.noTaxisNear")}</Text>
                <Text className="mt-0.5 font-body text-[12px] text-volcanic/60">{t("ride.stillSearching")}</Text>
                <Pressable className="mt-2 items-center rounded-xl bg-taxi py-2 active:scale-95" onPress={reintentar}>
                  <Text className="font-bodybold text-[14px] text-volcanic">{t("ride.retrySearch")}</Text>
                </Pressable>
              </View>
            )}

            {["COMPLETADO", "CANCELADO"].includes(estado) ? (
              <Btn title={t("ride.newTrip")} kind="dark" onPress={cancelar} />
            ) : (
              <Btn title={t("ride.cancelTrip")} kind="danger" onPress={cancelar} />
            )}
          </View>
        ) : (
          <View className="gap-3">
            {/* mi ubicación */}
            <Pressable
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-atlantic/10 px-3 py-2.5 active:bg-atlantic/20"
              onPress={usarMiUbicacion}
              disabled={localizando}
            >
              {localizando
                ? <><ActivityIndicator size="small" color="#0B5C9E" /><Text className="font-bodybold text-[14px] text-atlantic-dark"> {t("ride.locating")}</Text></>
                : <Text className="font-bodybold text-[14px] text-atlantic-dark">📍 {t("ride.useMyLocation")}</Text>}
            </Pressable>

            {/* recogida */}
            <AddressSearch placeholder={t("ride.pickupPh")} value={origen} onSelect={setOrigen} dotClass="bg-taxi" />

            {/* paradas */}
            {paradas.map((p, i) => (
              <View key={i} className="flex-row items-center gap-1.5">
                <View className="flex-1">
                  <AddressSearch
                    placeholder={t("ride.stopPh", { n: i + 1 })}
                    value={p}
                    onSelect={(pt) => setParadas((arr) => arr.map((x, j) => (j === i ? pt : x)))}
                    dotClass="bg-volcanic"
                  />
                </View>
                <Pressable
                  className="h-9 w-9 items-center justify-center rounded-xl bg-sand active:bg-coral/15"
                  onPress={() => setParadas((arr) => arr.filter((_, j) => j !== i))}
                >
                  <Text className="font-bodybold text-[16px] text-volcanic/60">×</Text>
                </Pressable>
              </View>
            ))}

            {/* destino */}
            <AddressSearch placeholder={t("ride.destPh")} value={destino} onSelect={setDestino} dotClass="bg-atlantic-dark" />

            {paradas.length < 3 && (
              <Pressable onPress={() => setParadas((arr) => [...arr, null])}>
                <Text className="font-bodybold text-[14px] text-atlantic-dark">➕ {t("ride.addStop")}</Text>
              </Pressable>
            )}
            {(origen || destino) && (
              <Pressable onPress={() => reset()}>
                <Text className="font-bodysemi text-[13px] text-atlantic-dark">{t("ride.resetPoints")}</Text>
              </Pressable>
            )}

            {/* favoritos */}
            {(favoritos.length > 0 || destino || origen) && (
              <View className="gap-2">
                {favoritos.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    {favoritos.map((f) => (
                      <Pressable
                        key={f.id}
                        className="rounded-full bg-sand px-3 py-1.5 active:bg-sand-deep"
                        onPress={() => pickFavorito(f)}
                        onLongPress={() => api.favoritoBorrar(f.id).then(cargarFavs).catch(() => {})}
                      >
                        <Text className="font-bodybold text-[12px] text-volcanic">⭐ {f.etiqueta}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {(destino || origen) && !guardandoFav && (
                  <Pressable onPress={() => setGuardandoFav(true)}>
                    <Text className="font-bodybold text-[13px] text-atlantic-dark">⭐ {t("fav.saveAddress")}</Text>
                  </Pressable>
                )}
                {guardandoFav && (
                  <View className="flex-row gap-2">
                    <Input placeholder={t("fav.savePh")} value={etiquetaFav} onChangeText={setEtiquetaFav} className="flex-1" />
                    <Btn title="✓" onPress={guardarFav} className="px-4" />
                  </View>
                )}
              </View>
            )}

            {/* taxi adaptado (mini-switch como la web) */}
            <Pressable
              className={`w-full flex-row items-center gap-2 rounded-2xl border-2 px-3 py-2 ${
                accesible ? "border-atlantic bg-atlantic/10" : "border-sand-deep bg-white"
              }`}
              onPress={() => setAccesible((a) => !a)}
            >
              <Text className="text-[16px]">♿</Text>
              <Text className={`font-bodybold text-[14px] ${accesible ? "text-atlantic-dark" : "text-volcanic/60"}`}>
                {t("ride.needAccessible")}
              </Text>
              <View className={`ml-auto h-5 w-9 rounded-full p-0.5 ${accesible ? "bg-atlantic" : "bg-volcanic/20"}`}>
                <View className={`h-4 w-4 rounded-full bg-white ${accesible ? "self-end" : "self-start"}`} />
              </View>
            </Pressable>

            {/* fidelidad */}
            {fidelidad && fidelidad.completados > 0 && (
              <View className="rounded-2xl border border-taxi/40 bg-taxi/10 px-3 py-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bodybold text-[14px] text-volcanic">
                    {fidelidad.nivel === "Oro" ? "🥇" : fidelidad.nivel === "Plata" ? "🥈" : "🥉"} Cliente {fidelidad.nivel}
                  </Text>
                  <Text className="font-bodysemi text-[12px] text-volcanic/60">{fidelidad.completados} {t("ride.trips")}</Text>
                </View>
                <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
                  <View className="h-full rounded-full bg-taxi" style={{ width: `${(fidelidad.progreso / 10) * 100}%` }} />
                </View>
                <Text className="mt-1 font-bodysemi text-[11px] text-volcanic/60">
                  {fidelidad.faltanParaRecompensa === 0
                    ? t("ride.freeRideReady")
                    : t("ride.toNextFree", { n: fidelidad.faltanParaRecompensa })}
                </Text>
              </View>
            )}

            {/* estimación estilo Google */}
            <View className="rounded-2xl bg-sand px-4 py-3">
              {estimando ? (
                <View className="flex-row items-center justify-between">
                  <Text className="font-bodysemi text-[14px] text-volcanic/70">{t("ride.calcRoute")}</Text>
                  <ActivityIndicator size="small" color="#0B2E4F" />
                </View>
              ) : estimacion ? (
                <View className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-display text-[17px] text-atlantic-dark">
                      {estimacion.duracionMin != null && Number(estimacion.duracionMin) > 0
                        ? `${Math.max(1, Math.round(Number(estimacion.duracionMin)))} min`
                        : ""}
                      <Text className="font-bodymed text-[12px] text-volcanic/50">
                        {"  "}{Number(estimacion.distanciaKm).toFixed(1)} km
                      </Text>
                    </Text>
                    <Text className="font-display text-[17px] text-volcanic">{fmtEur(estimacion.precioEstimado)}</Text>
                  </View>
                  {estimacion.zona && (
                    <View className="flex-row items-center gap-1.5 rounded-xl bg-atlantic/10 px-3 py-1.5">
                      <Text className="text-[15px]">🏷️</Text>
                      <Text className="font-bodybold text-[12px] text-atlantic-dark">{zonaTraducida(t, estimacion.zona)}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="flex-row items-center justify-between">
                  <Text className="font-bodysemi text-[14px] text-volcanic/70">{t("ride.estimated")}</Text>
                  <Text className="font-body text-[13px] text-volcanic/40">{t("ride.pickOriginDest")}</Text>
                </View>
              )}
            </View>

            {error ? <Text className="font-bodymed text-[14px] text-coral">{error}</Text> : null}

            {/* taxis disponibles */}
            {taxis.length > 0 && (
              <Text className="text-center font-bodybold text-[12px] text-palm">
                {libres > 0 ? t("ride.taxisFree", { n: libres }) : t("ride.taxisBusy", { n: taxis.length })}
              </Text>
            )}

            {/* reservar (1/3) + pedir ahora (2/3) */}
            <View className="flex-row gap-2">
              <Btn
                title={`📅 ${t("ride.book")}`}
                kind="ghost"
                disabled={!origen || !destino}
                onPress={() => setReservando(true)}
                className="flex-1"
              />
              <Btn
                title={t("ride.requestNow")}
                disabled={!origen || !destino}
                busy={busy}
                onPress={pedir}
                className="flex-[2]"
              />
            </View>
            <Text className="text-center font-body text-[11px] text-volcanic/45">{t("ride.meterNote")}</Text>
          </View>
        )}
      </Sheet>

      {valorando != null && (
        <ValorarModal viajeId={valorando} quien="trip" onClose={() => setValorando(null)} />
      )}
      {reservando && (
        <ReservaModal titulo={`📅 ${t("ride.book")}`} onConfirm={crearReserva} onClose={() => setReservando(false)} />
      )}
    </View>
  );
}
