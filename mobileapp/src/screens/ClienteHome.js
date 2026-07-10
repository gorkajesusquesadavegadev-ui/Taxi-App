import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, Linking, Share, ScrollView, Switch } from "react-native";
import { Marker } from "react-native-maps";
import Mapa from "../components/Mapa";
import { api } from "../api/client";
import { connectWs } from "../api/ws";
import { ubicacionPrecisa, buscarDirecciones, direccionDe } from "../api/geo";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import ValorarModal from "../components/ValorarModal";
import ReservaModal from "../components/ReservaModal";
import { Btn, Input, Card, SHADOW_CARD } from "../components/UI";

const GC = { latitude: 28.1, longitude: -15.43, latitudeDelta: 0.4, longitudeDelta: 0.4 };

function haversineKm(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export default function ClienteHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [paradas, setParadas] = useState([]);
  const [queryDest, setQueryDest] = useState("");
  const [queryParada, setQueryParada] = useState("");
  const [buscandoParada, setBuscandoParada] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [accesible, setAccesible] = useState(false);
  const [estimacion, setEstimacion] = useState(null);
  const [viaje, setViaje] = useState(null);
  const [taxiPos, setTaxiPos] = useState(null);
  const [taxis, setTaxis] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [guardandoFav, setGuardandoFav] = useState(false);
  const [etiquetaFav, setEtiquetaFav] = useState("");
  const [fidelidad, setFidelidad] = useState(null);
  const [valorando, setValorando] = useState(null);
  const [reservando, setReservando] = useState(false);
  const [sinTaxi, setSinTaxi] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mapRef = useRef(null);
  const viajeIdRef = useRef(null);

  // ── GPS inicial → origen ──────────────────────────────────────────────────
  const localizar = useCallback(async () => {
    setError("");
    const p = await ubicacionPrecisa();
    if (!p) { setError(t("ride.errLocGps")); return; }
    const label = (await direccionDe(p.lat, p.lng)) || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    setOrigen({ lat: p.lat, lng: p.lng, label });
    mapRef.current?.animateToRegion(
      { latitude: p.lat, longitude: p.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600
    );
  }, []);
  useEffect(() => { localizar(); }, [localizar]);

  // ── Restaurar viaje activo + favoritos + fidelidad ────────────────────────
  useEffect(() => {
    api.activo().then((v) => v && setViaje(v)).catch(() => {});
    api.favoritos().then((f) => setFavoritos(f || [])).catch(() => {});
  }, []);
  useEffect(() => {
    api.fidelidad().then(setFidelidad).catch(() => {});
  }, [viaje?.estado]);
  useEffect(() => { viajeIdRef.current = viaje?.id ?? null; }, [viaje?.id]);

  // ── Taxis online cercanos ─────────────────────────────────────────────────
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

  // ── WebSocket eventos del viaje ───────────────────────────────────────────
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

  // ── Aviso "sin taxi" a los 45 s buscando ──────────────────────────────────
  useEffect(() => {
    if (!viaje || viaje.estado !== "SOLICITADO") { setSinTaxi(false); return; }
    const id = setTimeout(() => setSinTaxi(true), 45_000);
    return () => clearTimeout(id);
  }, [viaje?.id, viaje?.estado]);

  // ── Autocomplete (destino o parada) ───────────────────────────────────────
  const query = buscandoParada ? queryParada : queryDest;
  useEffect(() => {
    if (query.trim().length < 3) { setSugerencias([]); return; }
    const id = setTimeout(() => {
      buscarDirecciones(query).then(setSugerencias).catch(() => setSugerencias([]));
    }, 400);
    return () => clearTimeout(id);
  }, [query]);

  function elegirSugerencia(item) {
    setSugerencias([]);
    if (buscandoParada) {
      setParadas((p) => [...p, item]);
      setQueryParada("");
      setBuscandoParada(false);
      return;
    }
    setDestino(item);
    if (origen) {
      mapRef.current?.fitToCoordinates(
        [
          { latitude: origen.lat, longitude: origen.lng },
          { latitude: item.lat, longitude: item.lng },
        ],
        { edgePadding: { top: 120, bottom: 380, left: 60, right: 60 }, animated: true }
      );
    }
  }

  // ── Estimación ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!origen || !destino) { setEstimacion(null); return; }
    let alive = true;
    api.estimar({
      origenLat: origen.lat, origenLng: origen.lng,
      destinoLat: destino.lat, destinoLng: destino.lng,
      paradas: paradas.map((p) => [p.lat, p.lng]),
    })
      .then((e) => alive && setEstimacion(e))
      .catch(() => alive && setError(t("ride.errEstimate")));
    return () => { alive = false; };
  }, [origen?.lat, destino?.lat, destino?.lng, paradas.length]);

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
        paradas: paradas.map((p) => [p.lat, p.lng]),
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
    if (!viaje) return;
    try { await api.cancelar(viaje.id); } catch (_) {}
    limpiar();
  }

  function limpiar() {
    setViaje(null); setTaxiPos(null); setDestino(null); setQueryDest("");
    setParadas([]); setEstimacion(null); setSinTaxi(false);
  }

  async function compartir() {
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

  async function guardarFav() {
    const p = destino || origen;
    if (!p || !etiquetaFav.trim()) return;
    try {
      await api.favoritoCrear({ etiqueta: etiquetaFav.trim(), direccion: p.label || null, lat: p.lat, lng: p.lng });
      setEtiquetaFav(""); setGuardandoFav(false);
      setFavoritos((await api.favoritos()) || []);
    } catch (e) {
      setError(e.message || t("fav.couldNotSave"));
    }
  }

  async function borrarFav(id) {
    try { await api.favoritoBorrar(id); setFavoritos((f) => f.filter((x) => x.id !== id)); } catch (_) {}
  }

  async function crearReserva({ programadaPara, notas }) {
    await api.reservarCrear({
      tipo: "NORMAL",
      origenLat: origen.lat, origenLng: origen.lng, origenTexto: origen.label || null,
      destinoLat: destino.lat, destinoLng: destino.lng, destinoTexto: destino.label || null,
      programadaPara, notas,
    });
    setReservando(false);
    limpiar();
  }

  // ── Derivados ─────────────────────────────────────────────────────────────
  const estado = viaje?.estado;
  const enCurso = estado && !["COMPLETADO", "CANCELADO"].includes(estado);
  const etaMin = taxiPos && viaje?.origenLat
    ? Math.max(1, Math.round((haversineKm(taxiPos, { lat: viaje.origenLat, lng: viaje.origenLng }) / 28) * 60))
    : null;

  const estadoTxt = {
    SOLICITADO: t("ride.searching"),
    ACEPTADO: t("ride.driverOnWay"),
    LLEGADO: t("ride.hasArrived"),
    EN_CURSO: t("ride.inProgress"),
    COMPLETADO: t("ride.completed"),
  }[estado];

  const libres = taxis.filter((x) => !x.enViaje).length;

  return (
    <View className="flex-1 bg-cream">
      <Mapa ref={mapRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} initialRegion={GC} showsUserLocation>
        {origen && <Marker coordinate={{ latitude: origen.lat, longitude: origen.lng }} pinColor="#1577C2" />}
        {destino && <Marker coordinate={{ latitude: destino.lat, longitude: destino.lng }} pinColor="#0B5C9E" />}
        {paradas.map((p, i) => (
          <Marker key={`p${i}`} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor="#E8AF00" />
        ))}
        {taxiPos && (
          <Marker coordinate={{ latitude: taxiPos.lat, longitude: taxiPos.lng }}>
            <Text className="text-[26px]">🚕</Text>
          </Marker>
        )}
        {!enCurso && taxis.map((tx, i) => (
          <Marker key={tx.taxistaId ?? i} coordinate={{ latitude: tx.lat, longitude: tx.lng }} opacity={tx.enViaje ? 0.45 : 1}>
            <Text className="text-[26px]">🚕</Text>
          </Marker>
        ))}
      </Mapa>

      {/* header glass */}
      <View
        className="absolute left-3 right-3 top-12 flex-row items-center justify-between rounded-2xl bg-cream/95 px-3 py-2"
        style={SHADOW_CARD}
      >
        <Text className="font-displayblack text-[16px] text-volcanic">
          Canary<Text className="text-taxi-dark">Cab</Text>
        </Text>
        <View className="flex-row items-center gap-2">
          {!enCurso && (
            <View className="rounded-full bg-sand px-2 py-1">
              <Text className="font-bodybold text-[11px] text-volcanic">🚕 {libres} {t("ride.taxisFree")}</Text>
            </View>
          )}
          <LangSwitcher />
        </View>
      </View>

      {/* hoja inferior */}
      <View className="absolute bottom-2 left-2.5 right-2.5">
        {!enCurso ? (
          <Card>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
              {fidelidad && fidelidad.faltanParaRecompensa === 0 && (
                <Text className="mb-1.5 font-bodybold text-[13px] text-atlantic-dark">🎁 {t("ride.freeRideReady")}</Text>
              )}
              {fidelidad && fidelidad.faltanParaRecompensa > 0 && (
                <Text className="mb-1.5 font-bodybold text-[12px] text-atlantic-dark">
                  ⭐ {fidelidad.completados} {t("ride.trips")} · {fidelidad.faltanParaRecompensa} {t("ride.toNextFree")}
                </Text>
              )}

              <Text className="font-bodysemi text-[13px] text-volcanic/60" numberOfLines={1}>
                📍 {origen?.label || t("ride.locating")}
              </Text>
              <Pressable onPress={localizar}>
                <Text className="mt-2 font-bodybold text-[13px] text-atlantic-dark">🛰️ {t("ride.useMyLocation")}</Text>
              </Pressable>

              {favoritos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                  {favoritos.map((f) => (
                    <Pressable
                      key={f.id}
                      className="mr-2 rounded-full bg-sand px-3 py-1.5"
                      onPress={() => elegirSugerencia({ lat: f.lat, lng: f.lng, label: f.direccion || f.etiqueta })}
                      onLongPress={() => borrarFav(f.id)}
                    >
                      <Text className="font-bodybold text-[12px] text-volcanic">⭐ {f.etiqueta}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Input
                placeholder={t("ride.destPh")}
                value={destino ? destino.label : queryDest}
                onChangeText={(v) => { setDestino(null); setBuscandoParada(false); setQueryDest(v); }}
                className="mt-2.5"
              />

              {paradas.map((p, i) => (
                <View key={i} className="mt-2 flex-row items-center gap-2">
                  <Text className="flex-1 font-bodysemi text-[13px] text-volcanic/80" numberOfLines={1}>🟡 {p.label}</Text>
                  <Pressable onPress={() => setParadas((ps) => ps.filter((_, j) => j !== i))} hitSlop={8}>
                    <Text className="font-bodybold text-[15px] text-coral">✕</Text>
                  </Pressable>
                </View>
              ))}
              {buscandoParada ? (
                <Input placeholder={t("ride.stopPh")} value={queryParada} onChangeText={setQueryParada} className="mt-2" autoFocus />
              ) : (
                destino && paradas.length < 2 && (
                  <Pressable onPress={() => setBuscandoParada(true)}>
                    <Text className="mt-2 font-bodybold text-[13px] text-atlantic-dark">➕ {t("ride.addStop")}</Text>
                  </Pressable>
                )
              )}

              {sugerencias.length > 0 && (
                <View className="mt-1">
                  {sugerencias.map((item, i) => (
                    <Pressable key={item.label + i} className="border-b border-sand py-2.5 active:bg-sand" onPress={() => elegirSugerencia(item)}>
                      <Text className="font-body text-[14px] text-volcanic" numberOfLines={1}>📍 {item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="font-bodybold text-[13px] text-volcanic">♿ {t("ride.needAccessible")}</Text>
                <Switch value={accesible} onValueChange={setAccesible}
                  trackColor={{ false: "#CFE0EE", true: "#FFC400" }} thumbColor="#fff" />
              </View>

              {estimacion && (
                <>
                  <View className="mt-2.5 flex-row items-baseline gap-2.5">
                    <Text className="font-display text-[22px] text-volcanic">
                      ~{Number(estimacion.precio ?? estimacion.precioEstimado ?? 0).toFixed(2)} €
                    </Text>
                    <Text className="font-bodysemi text-[13px] text-volcanic/60">
                      {(estimacion.distanciaKm ?? 0).toFixed(1)} {t("common.km")} · {Math.round(estimacion.duracionMin ?? 0)} {t("common.min")}
                    </Text>
                  </View>
                  <Text className="mt-0.5 font-body text-[11px] text-volcanic/40">{t("ride.meterNote")}</Text>
                </>
              )}

              {(destino || origen) && !guardandoFav && (
                <Pressable onPress={() => setGuardandoFav(true)}>
                  <Text className="mt-2 font-bodybold text-[13px] text-atlantic-dark">⭐ {t("fav.saveAddress")}</Text>
                </Pressable>
              )}
              {guardandoFav && (
                <View className="mt-2 flex-row gap-2">
                  <Input placeholder={t("fav.savePh")} value={etiquetaFav} onChangeText={setEtiquetaFav} className="flex-1" />
                  <Btn title="✓" onPress={guardarFav} className="px-4" />
                </View>
              )}

              {error ? <Text className="mt-2 font-bodybold text-[13px] text-coral">{error}</Text> : null}

              <Btn title={`🚕 ${t("ride.requestNow")}`} onPress={pedir} busy={busy}
                disabled={!origen || !destino} className="mt-3" />
              <Btn title={`📅 ${t("ride.book")}`} kind="ghost" onPress={() => setReservando(true)}
                disabled={!origen || !destino} className="mt-2" />
            </ScrollView>
          </Card>
        ) : (
          <Card>
            <Text className="font-display text-[16px] text-volcanic">{estadoTxt}</Text>
            {estado === "ACEPTADO" && etaMin != null && (
              <Text className="mt-1.5 font-bodybold text-[14px] text-atlantic-dark">
                ⏱️ {t("ride.arrivesIn")} ~{etaMin} {t("common.min")}
              </Text>
            )}
            {viaje?.taxistaNombre && (
              <Text className="mt-2 font-bodysemi text-[14px] text-volcanic/80">
                🚕 {viaje.taxistaNombre}
                {viaje.taxistaVerificado ? " ✓" : ""}
                {viaje.taxistaRating ? ` · ⭐ ${Number(viaje.taxistaRating).toFixed(1)}` : ""}
              </Text>
            )}
            {(viaje?.taxistaMatricula || viaje?.taxistaLicencia) && (
              <Text className="mt-1 font-bodysemi text-[13px] text-volcanic/60">
                {viaje.taxistaModelo ? `${viaje.taxistaModelo} · ` : ""}
                {viaje.taxistaMatricula || ""}
                {viaje.taxistaLicencia ? ` · ${t("ride.licensePrefix")} ${viaje.taxistaLicencia}` : ""}
              </Text>
            )}
            {sinTaxi && estado === "SOLICITADO" && (
              <>
                <Text className="mt-2.5 font-bodybold text-[13px] text-coral">😕 {t("ride.stillSearching")}</Text>
                <Btn title={t("ride.retrySearch")} kind="ghost" className="mt-2" onPress={reintentar} />
              </>
            )}
            <View className="mt-3 flex-row gap-2">
              {viaje?.taxistaTelefono && (
                <Btn title="📞" kind="ghost" className="flex-1" onPress={() => Linking.openURL(`tel:${viaje.taxistaTelefono}`)} />
              )}
              {["EN_CURSO", "ACEPTADO", "LLEGADO"].includes(estado) && (
                <>
                  <Btn title={`🔗 ${t("ride.share")}`} kind="ghost" className="flex-[2]" onPress={compartir} />
                  <Btn title="🆘" kind="danger" className="flex-1" onPress={sos} />
                </>
              )}
            </View>
            {["SOLICITADO", "ACEPTADO", "LLEGADO"].includes(estado) && (
              <Btn title={t("ride.cancelTrip")} kind="danger" className="mt-2" onPress={cancelar} />
            )}
            {estado === "COMPLETADO" && (
              <Btn title={t("ride.newTrip")} className="mt-2" onPress={limpiar} />
            )}
          </Card>
        )}
      </View>

      {valorando != null && (
        <ValorarModal viajeId={valorando} quien="trip" onClose={() => setValorando(null)} />
      )}
      {reservando && (
        <ReservaModal titulo={`📅 ${t("ride.book")}`} onConfirm={crearReserva} onClose={() => setReservando(false)} />
      )}
    </View>
  );
}
