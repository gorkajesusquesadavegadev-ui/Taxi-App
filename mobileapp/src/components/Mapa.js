// MapView con tiles CARTO Voyager — el MISMO mapa que la web (Leaflet + cartocdn).
// mapType "none" (Android) evita depender de Google Maps API key.
import { forwardRef } from "react";
import { Platform } from "react-native";
import MapView, { UrlTile } from "react-native-maps";

const TILE_URL = "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";

const Mapa = forwardRef(function Mapa({ children, ...props }, ref) {
  return (
    <MapView
      ref={ref}
      mapType={Platform.OS === "android" ? "none" : "standard"}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      {...props}
    >
      <UrlTile urlTemplate={TILE_URL} maximumZ={19} zIndex={-1} tileSize={512} />
      {children}
    </MapView>
  );
});

export default Mapa;
