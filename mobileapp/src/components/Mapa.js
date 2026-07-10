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
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([28.1235, -15.4363], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 20
  }).addTo(map);

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
  function iconFor(kind){
    if (kind === 'taxi') return taxiIcon;
    if (kind === 'carOcupado') return ocupadoIcon;
    if (kind === 'destino') return flagIcon;
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
        } catch (_) {}
      }}
    />
  );
});

export default Mapa;
