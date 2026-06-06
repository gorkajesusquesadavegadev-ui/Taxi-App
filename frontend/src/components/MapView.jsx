import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Las Palmas de Gran Canaria
export const LPGC = { lat: 28.1235, lng: -15.4363 };

const DOT_COLORS = {
  origin: "#2F8F5B", // palm green
  destino: "#E8643C", // coral
  nearby: "#FFC400", // taxi yellow
};

function dotIcon(kind) {
  const color = DOT_COLORS[kind] || "#0E7C9B";
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
  html: `<div class="taya-car">🚕</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
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
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        maxZoom={20}
      />
      {onClick && <ClickHandler onClick={onClick} />}
      <Recenter center={center} follow={follow} />
      {route && route.length > 1 && (
        <Polyline
          positions={route.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "#0E7C9B", weight: 5, opacity: 0.7, dashArray: "1 10", lineCap: "round" }}
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
