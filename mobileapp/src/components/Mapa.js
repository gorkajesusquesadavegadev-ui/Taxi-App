// Mapa Leaflet dentro de WebView — EXACTAMENTE el mismo mapa que la web
// (react-leaflet + CARTO Voyager + pins taya). Funciona en Expo Go y en APK
// sin Google Maps ni API keys.
//
// API declarativa:
//   <Mapa ref={r} markers={[{id,lat,lng,kind}]} circles={[{lat,lng,radius,nivel}]}
//         onMapPress={(lat,lng)=>{}} />
//   r.current.animateToRegion({latitude, longitude}) · r.current.fitToCoordinates([{latitude,longitude},…])
//
// kinds: origin (punto amarillo pulsante) · nearby (punto azul) · stop (punto tinta)
//        destino (lágrima tinta+sol) · taxi (coche amarillo) · carOcupado (coche gris)
import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from "react";
import { WebView } from "react-native-webview";

const HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  onerror="this.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // Fallback de CDN: si unpkg falla, cargar de cdnjs antes de arrancar.
  if (typeof L === 'undefined') {
    document.write('<scr'+'ipt src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\\/scr'+'ipt>');
  }
</script>
<style>
  html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#E8F1F8}
  .leaflet-control-attribution{font-size:8px}
  /* — pins CanaryCab: copiados 1:1 de frontend/src/index.css — */
  .taya-pin{position:relative;width:30px;height:30px}
  .taya-pin__dot{position:absolute;inset:0;margin:auto;width:18px;height:18px;border-radius:50%;
    border:3px solid #fff;box-shadow:0 3px 10px -2px rgba(11,46,79,.55)}
  .taya-pin__ring{position:absolute;inset:0;margin:auto;width:18px;height:18px;border-radius:50%;
    animation:pulse-ring 1.8s ease-out infinite}
  @keyframes pulse-ring{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.4);opacity:0}}
  .taya-flag{filter:drop-shadow(0 6px 8px rgba(11,46,79,.45));
    animation:pin-drop .45s cubic-bezier(.22,1.4,.36,1) both}
  @keyframes pin-drop{0%{transform:translateY(-14px);opacity:0}100%{transform:translateY(0);opacity:1}}
  .taya-car{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;
    background:#0B2E4F;border:3px solid #fff;box-shadow:0 4px 12px -2px rgba(11,46,79,.6)}
  /* taxis se deslizan suave entre pings (estilo Uber) */
  .glide{transition:transform 1.1s linear}
  /* radar de búsqueda: ondas que se expanden desde el punto de recogida */
  .taya-radar{position:relative;width:30px;height:30px}
  .taya-radar span{position:absolute;inset:0;margin:auto;width:22px;height:22px;border-radius:50%;
    border:3px solid #FFC400;animation:radar 2.2s ease-out infinite}
  .taya-radar span:nth-child(2){animation-delay:.7s}
  .taya-radar span:nth-child(3){animation-delay:1.4s}
  .taya-radar i{position:absolute;inset:0;margin:auto;width:14px;height:14px;border-radius:50%;
    background:#FFC400;border:3px solid #fff;box-shadow:0 2px 8px rgba(11,46,79,.5)}
  @keyframes radar{0%{transform:scale(.5);opacity:.9}100%{transform:scale(4.5);opacity:0}}
</style></head><body><div id="map"></div><script>
  function reportar(msg){
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'maperror', msg: String(msg) })); } catch(e){}
  }
  window.onerror = function(m, s, l){ reportar(m + ' @' + l); };
  if (typeof L === 'undefined') {
    document.getElementById('map').innerHTML =
      '<div style="display:grid;place-items:center;height:100%;font-family:sans-serif;color:#0B2E4F;text-align:center;padding:20px">'+
      '<div>🗺️<br/>No se pudo cargar el mapa.<br/><b>Comprueba la conexión a internet.</b></div></div>';
    reportar('Leaflet no cargó (CDN inaccesible)');
    throw new Error('leaflet-missing');
  }
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([28.1235, -15.4363], 12);
  // Fondo con proveedor fiable + respaldo. CARTO devolvia "API key required"
  // dentro de la tesela (rechaza peticiones y ya no es abierto para cualquier
  // volumen). Principal pasa a OpenStreetMap, sin clave y estable; CARTO queda
  // solo de respaldo por si OSM cae con error de red real. Cada tesela buena
  // reinicia el contador; el salto solo ocurre ante una rafaga de fallos.
  var FONDOS = [
    { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', sub: 'abc', attr: '&copy; OpenStreetMap' },
    { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', sub: 'abcd', attr: '&copy; OpenStreetMap &copy; CARTO' }
  ];
  var fondoIdx = 0, erroresTesela = 0, capaFondo;
  function ponerFondo(i) {
    if (capaFondo) map.removeLayer(capaFondo);
    capaFondo = L.tileLayer(FONDOS[i].url, { attribution: FONDOS[i].attr, subdomains: FONDOS[i].sub, maxZoom: 20 });
    capaFondo.on('tileload', function () { erroresTesela = 0; });
    capaFondo.on('tileerror', function () {
      erroresTesela++;
      if (erroresTesela >= 5 && fondoIdx < FONDOS.length - 1) { erroresTesela = 0; fondoIdx++; ponerFondo(fondoIdx); }
    });
    capaFondo.addTo(map);
  }
  ponerFondo(0);

  var DOT = { origin: '#FFC400', nearby: '#1577C2', stop: '#0B2E4F' };
  function dotIcon(kind){
    var c = DOT[kind] || '#1577C2';
    return L.divIcon({ className:'', iconSize:[30,30], iconAnchor:[15,15],
      html: '<div class="taya-pin"><span class="taya-pin__ring" style="background:'+c+'"></span>'+
            '<span class="taya-pin__dot" style="background:'+c+'"></span></div>' });
  }
  var flagIcon = L.divIcon({ className:'', iconSize:[32,40], iconAnchor:[16,38],
    html: '<svg class="taya-flag" width="32" height="40" viewBox="0 0 32 40" fill="none">'+
      '<path d="M16 1.5C8 1.5 1.5 7.9 1.5 15.7 1.5 26.2 16 38.5 16 38.5s14.5-12.3 14.5-22.8C30.5 7.9 24 1.5 16 1.5Z" fill="#0B2E4F" stroke="#fff" stroke-width="2.4"/>'+
      '<circle cx="16" cy="15.5" r="5" fill="#FFC400"/></svg>' });
  function carIcon(stroke){
    return L.divIcon({ className:'glide', iconSize:[40,40], iconAnchor:[20,20],
      html: '<div class="taya-car"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
        '<path d="M5 11l1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11"/>'+
        '<path d="M3 16v-2.2A2 2 0 0 1 4.4 12h15.2A2 2 0 0 1 21 13.8V16a1 1 0 0 1-1 1h-1"/>'+
        '<path d="M6 17v1.5M18 17v1.5M5 17h14"/><circle cx="7.5" cy="16.5" r="1.3"/><circle cx="16.5" cy="16.5" r="1.3"/></svg></div>' });
  }
  var taxiIcon = carIcon('#FFC400'), ocupadoIcon = carIcon('#94a3b8');
  var radarIcon = L.divIcon({ className:'', iconSize:[30,30], iconAnchor:[15,15],
    html: '<div class="taya-radar"><span></span><span></span><span></span><i></i></div>' });
  function iconFor(kind){
    if (kind === 'taxi') return taxiIcon;
    if (kind === 'carOcupado') return ocupadoIcon;
    if (kind === 'destino') return flagIcon;
    if (kind === 'radar') return radarIcon;
    return dotIcon(kind);
  }

  var capaMarkers = L.layerGroup().addTo(map);
  var capaCircles = L.layerGroup().addTo(map);
  var capaRuta = L.layerGroup().addTo(map);
  var ZONA = { ALTO: '#E03131', MEDIO: '#F08C00', BAJO: '#FFC400' };
  var rutaKey = '';

  // Marcadores persistentes por id: mover en vez de recrear (el CSS .glide anima el desliz)
  var vivos = {};
  function pintarMarkers(items){
    var nuevos = {};
    (items || []).forEach(function(x){
      var key = String(x.id);
      if (vivos[key] && vivos[key]._kind === x.kind) {
        vivos[key].setLatLng([x.lat, x.lng]);
        nuevos[key] = vivos[key];
        delete vivos[key];
      } else {
        var mk = L.marker([x.lat, x.lng], { icon: iconFor(x.kind) }).addTo(capaMarkers);
        mk._kind = x.kind;
        nuevos[key] = mk;
      }
    });
    Object.keys(vivos).forEach(function(k){ capaMarkers.removeLayer(vivos[k]); });
    vivos = nuevos;
  }

  // Ruta: doble capa (funda blanca + tinta atlántica) — igual que la web
  function pintarRuta(pts){
    var key = pts && pts.length > 1 ? pts.length + ':' + pts[0] + ':' + pts[pts.length-1] : '';
    if (key === rutaKey) return;
    rutaKey = key;
    capaRuta.clearLayers();
    if (!pts || pts.length < 2) return;
    L.polyline(pts, { color:'#FFFFFF', weight:12, opacity:.9, lineCap:'round', lineJoin:'round' }).addTo(capaRuta);
    L.polyline(pts, { color:'#0B5C9E', weight:8, opacity:1, lineCap:'round', lineJoin:'round' }).addTo(capaRuta);
    map.fitBounds(L.latLngBounds(pts), { paddingTopLeft:[40,90], paddingBottomRight:[40,340] });
  }

  function send(o){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  map.on('click', function(e){ send({ type:'press', lat: e.latlng.lat, lng: e.latlng.lng }); });

  function handle(raw){
    try { var m = JSON.parse(raw); } catch(e){ return; }
    if (m.type === 'state'){
      pintarMarkers(m.markers);
      pintarRuta(m.route);
      capaCircles.clearLayers();
      (m.circles || []).forEach(function(z){
        L.circle([z.lat, z.lng], { radius: z.radius || 500, color: 'transparent',
          fillColor: ZONA[z.nivel] || z.color || '#FFC400', fillOpacity: 0.28 }).addTo(capaCircles);
      });
    }
    if (m.type === 'fly') map.flyTo([m.lat, m.lng], m.zoom || 15, { duration: 0.8 });
    if (m.type === 'fit' && m.points && m.points.length){
      map.fitBounds(L.latLngBounds(m.points), { paddingTopLeft: [40, 90], paddingBottomRight: [40, 340] });
    }
  }
  document.addEventListener('message', function(e){ handle(e.data); });   // Android
  window.addEventListener('message', function(e){ handle(e.data); });     // iOS
  send({ type: 'ready' });
</script></body></html>`;

const Mapa = forwardRef(function Mapa({ markers = [], circles = [], route = null, onMapPress, style }, ref) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const pendientes = useRef([]);

  function post(obj) {
    const msg = JSON.stringify(obj);
    if (ready && webRef.current) webRef.current.postMessage(msg);
    else pendientes.current.push(msg);
  }

  useImperativeHandle(ref, () => ({
    animateToRegion: (r) => post({ type: "fly", lat: r.latitude, lng: r.longitude, zoom: 15 }),
    fitToCoordinates: (coords) =>
      post({ type: "fit", points: coords.map((c) => [c.latitude, c.longitude]) }),
  }));

  // Estado declarativo → mapa
  useEffect(() => {
    post({ type: "state", markers, circles, route });
  }, [JSON.stringify(markers), JSON.stringify(circles), JSON.stringify(route), ready]);

  return (
    <WebView
      ref={webRef}
      source={{ html: HTML }}
      style={style}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      androidLayerType="hardware"
      onMessage={(e) => {
        try {
          const m = JSON.parse(e.nativeEvent.data);
          if (m.type === "ready") {
            setReady(true);
            pendientes.current.forEach((msg) => webRef.current?.postMessage(msg));
            pendientes.current = [];
          }
          if (m.type === "press" && onMapPress) onMapPress(m.lat, m.lng);
          if (m.type === "maperror") console.log("[mapa] ERROR dentro del WebView:", m.msg);
        } catch (_) {}
      }}
      onError={(e) => console.log("[mapa] WebView error:", e.nativeEvent?.description)}
    />
  );
});

export default Mapa;
