import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Las Palmas de Gran Canaria
export const LPGC = { lat: 28.1235, lng: -15.4363 };

const DOT_COLORS = {
  origin: "#FFC400", // amarillo
  destino: "#0B5C9E", // azul oscuro
  nearby: "#1577C2", // azul
};

function dotIcon(kind) {
  const color = DOT_COLORS[kind] || "#1577C2";
  const ring =
    kind === "nearby"
      ? `<span class="taya-pin__ring" style="background:${color}"></span>`
      : "";
  return L.divIcon({
    className: "",
    html: `<div class="taya-pin">${ring}<span class="taya-pin__dot" style="background:${color}"></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const carIcon = L.divIcon({
  className: "",
  html: `<div class="taya-car"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11"/><path d="M3 16v-2.2A2 2 0 0 1 4.4 12h15.2A2 2 0 0 1 21 13.8V16a1 1 0 0 1-1 1h-1"/><path d="M6 17v1.5M18 17v1.5M5 17h14"/><circle cx="7.5" cy="16.5" r="1.3"/><circle cx="16.5" cy="16.5" r="1.3"/></svg></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center, follow }) {
  const map = useMap();
  useEffect(() => {
    if (follow && center) map.panTo([center.lat, center.lng], { animate: true });
  }, [center?.lat, center?.lng, follow, map]);
  return null;
}

export default function MapView({
  center = LPGC,
  zoom = 14,
  markers = [],
  route = null,
  onClick,
  follow = false,
  className = "",
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={true}
      className={`h-full w-full ${className}`}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        maxZoom={20}
      />
      {onClick && <ClickHandler onClick={onClick} />}
      <Recenter center={center} follow={follow} />
      {route && route.length > 1 && (
        <Polyline
          positions={route.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "#1577C2", weight: 5, opacity: 0.75, dashArray: "1 10", lineCap: "round" }}
        />
      )}
      {markers.map((m) => (
        <Marker
          key={m.id ?? `${m.kind}-${m.lat}-${m.lng}`}
          position={[m.lat, m.lng]}
          icon={m.kind === "taxi" ? carIcon : dotIcon(m.kind)}
        />
      ))}
    </MapContainer>
  );
}
