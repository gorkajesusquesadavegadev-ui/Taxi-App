# Servidor de rutas OSRM propio, con el callejero de Canarias.
#
# Por qué: hasta ahora las distancias (y por tanto los precios) se pedían a
# router.project-osrm.org, que es el servidor PÚBLICO DE DEMOSTRACIÓN del
# proyecto OSRM — su documentación pide expresamente no depender de él en
# producción. Cuando se saturaba, el backend estimaba por línea recta y la
# misma ruta salía a distinto precio según la suerte. Con esta instancia el
# router es nuestro: sin límites de uso, sin terceros y con latencia de red
# interna.
#
# El preprocesado (extract → partition → customize) se hace AQUÍ, en el build,
# no al arrancar: el contenedor arranca ya con los datos listos en segundos, y
# un reinicio no vuelve a descargar ni recalcular nada.
#
# Datos: extracto de Canarias de Geofabrik (~60 MB), derivado de OpenStreetMap,
# bajo licencia ODbL. Para actualizar el callejero basta con volver a construir
# esta imagen.

FROM ghcr.io/project-osrm/osrm-backend:latest AS build

WORKDIR /data

# Extracto de Canarias. Geofabrik lo publica bajo "africa" (por geografía, no
# por país), no bajo europe/spain — ahí no existe.
ADD https://download.geofabrik.de/africa/canary-islands-latest.osm.pbf /data/canarias.osm.pbf

# Perfil de coche: la red que recorre un taxi.
RUN osrm-extract -p /opt/car.lua /data/canarias.osm.pbf

# MLD (multi-level Dijkstra): preprocesado más rápido y menos memoria que CH,
# de sobra para una isla. El servidor debe arrancar con --algorithm mld.
RUN osrm-partition /data/canarias.osrm && osrm-customize /data/canarias.osrm

# ── Imagen final: solo el runtime y los datos ya procesados ──────────────────
FROM ghcr.io/project-osrm/osrm-backend:latest

WORKDIR /data
COPY --from=build /data/canarias.osrm* /data/

# Railway inyecta $PORT; en local cae a 5000. Forma shell para que se expanda.
ENV PORT=5000
CMD osrm-routed --algorithm mld --port ${PORT} --max-matching-size 1000 /data/canarias.osrm
