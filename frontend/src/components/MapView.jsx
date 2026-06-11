import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Las Palmas de Gran Canaria
export const LPGC = { lat: 28.1235, lng: -15.4363 };

const DOT_COLORS = {
  origin: "#FFC400", // amarillo
  nearby: "#1577C2", // azul
};

function dotIcon(kind) {
  const color = DOT_COLORS[kind] || "#1577C2";
  // origin + nearby both pulse: live points on the map
  const ring = `<span class="taya-pin__ring" style="background:${color}"></span>`;
  return L.divIcon({
    className: "",
    html: `<div class="taya-pin">${ring}<span class="taya-pin__dot" style="background:${color}"></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// destination: teardrop pin (Atlantic ink, sun core) anchored at its tip
const flagIcon = L.divIcon({
  className: "",
  html: `<svg class="taya-flag" width="32" height="40" viewBox="0 0 32 40" fill="none">
    <path d="M16 1.5C8 1.5 1.5 7.9 1.5 15.7 1.5 26.2 16 38.5 16 38.5s14.5-12.3 14.5-22.8C30.5 7.9 24 1.5 16 1.5Z" fill="#0B2E4F" stroke="#fff" stroke-width="2.4"/>
    <circle cx="16" cy="15.5" r="5" fill="#FFC400"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 38],
});

const carIcon = L.divIcon({
  className: "",
  html: `<div class="taya-car"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FFC400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11"/><path d="M3 16v-2.2A2 2 0 0 1 4.4 12h15.2A2 2 0 0 1 21 13.8V16a1 1 0 0 1-1 1h-1"/><path d="M6 17v1.5M18 17v1.5M5 17h14"/><circle cx="7.5" cy="16.5" r="1.3"/><circle cx="16.5" cy="16.5" r="1.3"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function iconFor(kind) {
  if (kind === "taxi") return carIcon;
  if (kind === "destino") return flagIcon;
  return dotIcon(kind);
}

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
  const routePts = route && route.length > 1 ? route.map((p) => [p.lat, p.lng]) : null;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={true}
      className={`h-full w-full ${className}`}
      attributionControl={true}
    >
      {/* CARTO Voyager: soft whites, dune-yellow roads, Atlantic blue water */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        maxZoom={20}
      />
      {onClick && <ClickHandler onClick={onClick} />}
      <Recenter center={center} follow={follow} />
      {routePts && (
        <>
          {/* navigation-style route: white halo, ink casing, ocean-blue core */}
          <Polyline
            positions={routePts}
            pathOptions={{ color: "#FFFFFF", weight: 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={routePts}
            pathOptions={{ color: "#0B5C9E", weight: 8, opacity: 1, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={routePts}
            pathOptions={{ color: "#3D9BE9", weight: 4.5, opacity: 1, lineCap: "round", lineJoin: "round" }}
          />
        </>
      )}
      {markers.map((m) => (
        <Marker
          key={m.id ?? `${m.kind}-${m.lat}-${m.lng}`}
          position={[m.lat, m.lng]}
          icon={iconFor(m.kind)}
        />
      ))}
    </MapContainer>
  );
}
