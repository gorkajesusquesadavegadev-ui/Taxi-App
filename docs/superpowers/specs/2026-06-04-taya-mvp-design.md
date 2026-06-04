# TAYA — Spec de Diseño · MVP Vertical

**Fecha:** 2026-06-04
**Estado:** Aprobado (brainstorming)
**Alcance:** MVP vertical fino — un flujo completo de punta a punta.

---

## 1. Visión y alcance

TAYA conecta clientes con taxistas en Las Palmas de Gran Canaria. Este spec cubre **solo el primer ciclo de construcción**: un MVP vertical que prueba el bucle central (pedir → asignar → seguir → finalizar → tarifa) con clientes web y backend de producción.

El documento original (`documentacion_taxprojtec.md`) describe el producto final completo (apps Flutter, pagos, predicciones, panel admin). Eso queda como visión a largo plazo, **no** como alcance de este ciclo.

### Entra en el MVP
1. Registro/login email + password (rol `CLIENTE` o `TAXISTA`), JWT.
2. Cliente: mapa, ver taxis libres cercanos, marcar origen + destino, ver **estimación** de precio, pedir taxi.
3. Asignación por **broadcast**: taxistas libres en radio reciben el viaje por WebSocket → primero que acepta gana.
4. Cliente ve el taxi moverse en vivo (WebSocket).
5. Taxista: aceptar → "He llegado" → iniciar → finalizar.
6. Precio final = bajada de bandera + km reales × €/km.
7. Historial básico de viajes.

### NO entra (fases futuras)
Pagos / Stripe / comisiones · predicciones de demanda · eventos y alertas (cruceros, partidos, vuelos) · panel admin · push FCM · login SMS · valoraciones · apps Flutter · verificación de taxistas · reasignación automática por timeout.

### Decisiones clave tomadas
| Tema | Decisión |
|------|----------|
| Alcance | MVP vertical fino |
| Clientes | Páginas web ligeras (cliente + taxista); Flutter es fase futura, la API no cambia |
| Backend | Spring Boot 3.2 / Java 17 (target real) |
| Auth | Email + password + JWT, roles CLIENTE/TAXISTA |
| Matching | Broadcast a libres en radio, primero acepta gana |
| Tarifa | Estimación antes de pedir + precio final por distancia real al finalizar |
| Mapas | OpenLayers + OSM (gratis), routing/distancia vía OSRM público (fallback Haversine) |
| Geo/vivo | Redis (ubicación + GEORADIUS) |

---

## 2. Arquitectura

```
┌─ Cliente web (OpenLayers)  ─┐
├─ Taxista web (OpenLayers)  ─┤── HTTP REST + WebSocket ──> Backend Spring Boot
└─────────────────────────────┘                              │
                                                    ┌─────────┼─────────┐
                                                PostgreSQL   Redis    OSRM (público)
                                                (datos)   (geo+vivo)  (rutas/dist)
```

### Componentes backend
- `AuthController` + seguridad JWT — register, login.
- `ViajeController` — estimar, solicitar, aceptar, llegada, iniciar, finalizar, cancelar, historial.
- `TaxistaController` — estado (LIBRE/DESCONECTADO).
- `UsuarioController` — perfil (`/me`).
- `TarifaService` — estimación + cálculo final desde `configuracion_tarifa`.
- `MatchingService` — GEORADIUS taxistas libres en radio, broadcast `trip:new`, resolución first-accept.
- `UbicacionService` — Redis: posición, estado, heartbeat de cada taxista.
- `WebSocketHandler` / `WebSocketService` — eventos viaje + ubicación viva.
- `HeartbeatScheduler` — marca DESCONECTADO cuando expira `last_ping`.

### Clientes web
HTML + JS ligero (Vite opcional). OpenLayers para mapa, geolocalización del navegador, WebSocket nativo. Dos vistas: `/cliente` y `/taxista`. Migración a Flutter es fase futura; la API REST/WS no cambia.

### Servicios externos
- **OSRM** público (demo) para ruta y distancia en la estimación. Fallback: distancia Haversine si OSRM no responde.
- **Redis** para ubicación viva del taxi + GEORADIUS (taxistas libres cerca).

---

## 3. Modelo de datos

### Tabla `usuarios`
```
id              BIGINT PK
nombre          VARCHAR(100) NOT NULL
email           VARCHAR(100) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
rol             ENUM('CLIENTE','TAXISTA') NOT NULL
licencia            VARCHAR(50)   -- solo taxista
vehiculo_matricula  VARCHAR(20)   -- solo taxista
vehiculo_modelo     VARCHAR(100)  -- solo taxista
activo          BOOLEAN DEFAULT TRUE
creado_en       TIMESTAMP DEFAULT now()
```
Omitido del doc original para MVP: `telefono`, `fcm_token`, `stripe_account_id`, `verificado`, `ultimo_acceso`. (`verificado` vuelve cuando exista alta real de taxistas.)

### Tabla `viajes`
```
id                    BIGINT PK
cliente_id            BIGINT FK -> usuarios(id)
taxista_id            BIGINT FK -> usuarios(id) NULL
origen_lat/lng        DOUBLE NOT NULL
destino_lat/lng       DOUBLE NOT NULL
origen_texto          VARCHAR(255)
destino_texto         VARCHAR(255)
distancia_estimada_km DECIMAL(10,2)   -- al pedir
precio_estimado       DECIMAL(10,2)   -- al pedir
distancia_real_km     DECIMAL(10,2)   -- al finalizar
precio_final          DECIMAL(10,2)   -- al finalizar
estado                ENUM('SOLICITADO','ACEPTADO','LLEGADO','EN_CURSO','COMPLETADO','CANCELADO')
solicitado_en         TIMESTAMP DEFAULT now()
aceptado_en           TIMESTAMP
llegada_en            TIMESTAMP
iniciado_en           TIMESTAMP
completado_en         TIMESTAMP
cancelado_en          TIMESTAMP
```
Cambios vs doc: estados `ASIGNADO`+`ACEPTADO` fusionados en `ACEPTADO` (broadcast first-accept); añadido `LLEGADO` + `llegada_en`. Omitido para MVP: `tiempo_respuesta_segundos`, `tiempo_llegada_segundos`, valoraciones.

### Tabla `configuracion_tarifa` (una fila editable)
```
id              BIGINT PK
bajada_bandera  DECIMAL(10,2)   -- €
precio_km       DECIMAL(10,2)   -- €/km
radio_busqueda_km DECIMAL(5,2)
actualizado_en  TIMESTAMP DEFAULT now()
```

### Estructuras Redis (vivo, no en Postgres)
```
SETEX taxi:{id}:ubicacion 10 "lat,lng"     # posición, expira 10s
SET   taxi:{id}:estado "LIBRE"             # LIBRE | OCUPADO | DESCONECTADO
SETEX taxi:{id}:last_ping 30 "<iso8601>"   # heartbeat, expira 30s
GEOADD taxis:libres {lng} {lat} {id}       # índice geo para GEORADIUS
viaje:{id}:subs                            # clientes suscritos a ubicación
```

---

## 4. API REST y WebSocket

### REST (JWT obligatorio salvo `/api/auth/**`)
```
POST /api/auth/register        {nombre,email,password,rol,licencia?,vehiculo?} 
POST /api/auth/login           -> {token}
GET  /api/usuarios/me

POST /api/viajes/estimar       {origen,destino} -> {distancia_km,precio_estimado}
POST /api/viajes/solicitar     {origen,destino,textos} -> viaje SOLICITADO
PUT  /api/viajes/{id}/aceptar      (TAXISTA)
PUT  /api/viajes/{id}/llegada      (TAXISTA)
PUT  /api/viajes/{id}/iniciar      (TAXISTA)
PUT  /api/viajes/{id}/finalizar    {distancia_real} -> precio_final
PUT  /api/viajes/{id}/cancelar     (CLIENTE/TAXISTA)
GET  /api/viajes/historial

GET  /api/taxistas/cercanos    {lat,lng,radio?} -> [{id,lat,lng}]   (cliente, taxis libres)
PUT  /api/taxista/estado       {LIBRE|DESCONECTADO}                 (TAXISTA)
```

### WebSocket `/ws?token=`
| Evento | Dirección | Datos | Descripción |
|--------|-----------|-------|-------------|
| `location:update` | Taxista → BE | `{lat,lng}` | Cada 3s; escribe Redis |
| `heartbeat` | Taxista → BE | `{}` | Cada 30s; `SETEX last_ping 30` |
| `trip:new` | BE → Taxistas | `{viaje,origen,estimado}` | Broadcast a libres en radio |
| `trip:accepted` | BE → Cliente | `{taxista,vehiculo,ubicacion}` | Un taxista aceptó |
| `trip:taken` | BE → Taxistas | `{viaje_id}` | Ya no disponible |
| `trip:location` | BE → Cliente | `{lat,lng}` | Posición del taxi en vivo |
| `trip:arrived` | BE → Cliente | `{viaje_id}` | Taxista pulsó "He llegado" |
| `trip:status` | BE → Cliente | `{status: PENDING\|ARRIVED\|IN_PROGRESS\|COMPLETED}` | Cambio de estado del viaje |
| `trip:cancelled` | BE → ambos | `{viaje_id}` | Viaje cancelado |

### Máquina de estados del viaje
```
SOLICITADO ──aceptar──> ACEPTADO ──llegada──> LLEGADO ──iniciar──> EN_CURSO ──finalizar──> COMPLETADO
     │                     │                      │                    │
     └─────────────────── cancelar ──────────────┴────────────────────┘ ──> CANCELADO
(CANCELADO posible desde cualquier estado anterior a COMPLETADO)
```
Mapeo `trip:status` (ENUM cliente): `SOLICITADO/ACEPTADO`→`PENDING`, `LLEGADO`→`ARRIVED`, `EN_CURSO`→`IN_PROGRESS`, `COMPLETADO`→`COMPLETED`.

### Flujo solicitar → asignar
1. Cliente `POST /viajes/estimar` → ve precio aproximado.
2. `POST /viajes/solicitar` → viaje `SOLICITADO` en Postgres.
3. `MatchingService`: `GEORADIUS taxis:libres` en radio → `trip:new` por WS a esos taxistas.
4. Taxista `PUT /aceptar` → update condicional `WHERE estado='SOLICITADO'`; primero gana, resto recibe `trip:taken`.
5. Taxista pasa a `OCUPADO` en Redis, sale de `taxis:libres`.
6. Cliente recibe `trip:accepted`, se suscribe a ubicación → `trip:location` en vivo.

---

## 5. Errores, casos límite y testing

### Casos límite
- **Nadie acepta:** viaje sigue `SOLICITADO`; cliente puede cancelar. Reintento/timeout automático = fase futura.
- **Dos taxistas aceptan a la vez:** update condicional `WHERE estado='SOLICITADO'`; perdedor recibe `trip:taken`.
- **Taxista se desconecta con viaje activo:** heartbeat expira → DESCONECTADO; viaje queda activo, MVP resuelve cancelando (`trip:cancelled` al cliente). Reasignación = futura.
- **Cliente cancela tras aceptar:** taxista recibe `trip:cancelled`, vuelve a `LIBRE`.
- **OSRM caído:** fallback a distancia Haversine para estimar.
- **Sin taxis en radio:** respuesta clara "no hay taxis disponibles".

### Errores HTTP
`400` validación · `401` sin/mal token · `403` rol incorrecto · `404` viaje no existe · `409` conflicto de estado (ej. aceptar viaje ya tomado).

### Testing (TDD: test antes de implementación)
- **Unit (JUnit5 + Mockito):** `TarifaService` (estimación y final), `MatchingService` (radio + first-accept), transiciones de estado del viaje.
- **Integración (Spring Boot Test + Testcontainers Postgres + Redis):** flujo auth, solicitar→aceptar→finalizar, GEORADIUS.
- **WebSocket:** test de conexión + broadcast `trip:new`.

---

## 6. Fases futuras (fuera de este spec)
Cada una será su propio ciclo spec → plan → build:
1. Pagos y comisiones (Stripe Connect, tablas `comisiones`, `saldo_taxistas`).
2. Apps Flutter (cliente + taxista) reutilizando esta API.
3. Predicciones de demanda y zonas calientes (`analisis_demanda`).
4. Eventos y alertas (cruceros, partidos, vuelos — `eventos_programados`, `alertas_taxistas`).
5. Panel admin Next.js.
6. Push FCM, login SMS, valoraciones, verificación de taxistas.
