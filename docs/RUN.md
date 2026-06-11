# TAYA — Cómo arrancar todo (backend + frontend + PostgreSQL + pgAdmin)

Guía para tener el proyecto corriendo en local: PostgreSQL + Redis nativos, backend desde
IntelliJ (botón Play) y frontend con Vite. Sin Docker.

Arquitectura local:

```
Navegador  ──http──>  Frontend (Vite)  ──http/ws──>  Backend (Spring Boot :8080)
http://localhost:5173                                   │
                                                        ├──> PostgreSQL :5432  (datos)
                                                        └──> Redis :6379       (taxistas cercanos, GEORADIUS)

pgAdmin4 ──> PostgreSQL :5432   (ver/editar tablas a mano)
```

---

## 0. Qué necesitas (ya instalado)

- Java 17 ✓
- Node 26 + npm ✓
- IntelliJ IDEA (con Maven incluido — no hace falta instalar Maven aparte)

Falta instalar: **PostgreSQL**, **Redis**, **pgAdmin4**. Pasos abajo.

---

## 1. Instalar PostgreSQL + Redis

Pega en la terminal (el prefijo `! ` en Claude Code ejecuta en la sesión):

```bash
sudo apt update
sudo apt install -y postgresql redis-server
sudo systemctl enable --now postgresql redis-server
```

`enable --now` los deja arrancados **y** configurados para arrancar solos en cada reinicio.
Así el backend siempre encuentra la BD al darle a Play.

Comprobar que están vivos:

```bash
pg_isready                 # -> "accepting connections"
redis-cli ping             # -> "PONG"
```

---

## 2. Crear la base de datos y el usuario

El backend (`application.properties`) espera **db `taya_taxi`**, **user `taya_user`**, **pass `password`**.
Créalos:

```bash
sudo -u postgres psql -c "CREATE USER taya_user WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE taya_taxi OWNER taya_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE taya_taxi TO taya_user;"
```

No hace falta crear tablas a mano: Hibernate (`spring.jpa.hibernate.ddl-auto=update`) las crea
solo la primera vez que arranca el backend.

---

## 3. Instalar pgAdmin4 (GUI para ver las tablas)

pgAdmin no está en los repos por defecto de Ubuntu; se añade su repo oficial:

```bash
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub \
  | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg

sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" \
  > /etc/apt/sources.list.d/pgadmin4.list'

sudo apt update
sudo apt install -y pgadmin4-desktop
```

Abrir pgAdmin (menú de apps → "pgAdmin 4") y registrar el servidor:

- **Register → Server**
- General → Name: `TAYA`
- Connection:
  - Host: `localhost`
  - Port: `5432`
  - Maintenance DB: `taya_taxi`
  - Username: `taya_user`
  - Password: `password`

Luego: `Servers → TAYA → Databases → taya_taxi → Schemas → public → Tables`.

> Alternativa rápida sin pgAdmin: `psql "postgresql://taya_user:password@localhost:5432/taya_taxi"`

---

## 4. Arrancar el backend desde IntelliJ (botón Play)

1. `File → Open` → elige la carpeta **`backend/`** (la que tiene `pom.xml`). IntelliJ la
   importa como proyecto Maven y descarga dependencias solo.
2. Abre `src/main/java/com/taya/TayaApplication.java`.
3. Pulsa el **▶ Play** verde junto a `public static void main`.

Arranca en **http://localhost:8080** con el perfil por defecto → PostgreSQL + Redis locales.
En el primer arranque Hibernate crea las tablas y `DataSeeder` inserta la fila de tarifa.

> Si prefieres arrancar **sin** PostgreSQL/Redis (todo en memoria, H2 + Redis embebido):
> en la config de ejecución de IntelliJ, "Active profiles" = `local`. Útil para probar rápido,
> pero entonces pgAdmin no ve datos (H2 es en memoria).

---

## 5. Arrancar el frontend

```bash
cd ~/TaxiProject/frontend
npm install      # solo la primera vez
npm run dev
```

Abre **http://localhost:5173**. Ya apunta a `http://localhost:8080/api` y `ws://localhost:8080/ws`
por defecto (no hace falta `.env`).

---

## 6. Orden de arranque (resumen diario)

1. PostgreSQL y Redis ya arrancan solos al encender el PC (paso 1 `enable`).
2. IntelliJ → Play en `TayaApplication`.
3. Terminal → `cd frontend && npm run dev`.
4. Navegador → http://localhost:5173.

---

## 7. Las tablas y qué se guarda

Hibernate genera 3 tablas a partir de las entidades (`com.taya.model`):

### `usuarios`  (entidad `Usuario`) — clientes y taxistas
| columna | tipo | qué es |
|---|---|---|
| `id` | bigserial PK | id autoincremental |
| `nombre` | text | nombre del usuario |
| `email` | text UNIQUE | login, único |
| `password_hash` | text | contraseña cifrada (BCrypt), nunca en claro |
| `rol` | text | `CLIENTE` o `TAXISTA` |
| `licencia` | text | nº licencia taxi (solo taxistas) |
| `vehiculo_matricula` | text | matrícula (solo taxistas) |
| `vehiculo_modelo` | text | modelo coche (solo taxistas) |
| `activo` | boolean | cuenta activa |
| `creado_en` | timestamp | alta |

### `viajes`  (entidad `Viaje`) — cada carrera
| columna | tipo | qué es |
|---|---|---|
| `id` | bigserial PK | id viaje |
| `cliente_id` | bigint | FK lógica → `usuarios.id` (quien pide) |
| `taxista_id` | bigint | FK lógica → `usuarios.id` (quien acepta; null hasta aceptar) |
| `origen_lat` / `origen_lng` | double | coords recogida |
| `destino_lat` / `destino_lng` | double | coords destino |
| `origen_texto` / `destino_texto` | text | direcciones legibles |
| `distancia_estimada_km` | numeric | km estimados al pedir |
| `precio_estimado` | numeric | precio estimado al pedir |
| `distancia_real_km` | numeric | km reales al finalizar |
| `precio_final` | numeric | cobro final |
| `estado` | text | `SOLICITADO`→`ACEPTADO`→`LLEGADO`→`EN_CURSO`→`COMPLETADO`/`CANCELADO` |
| `solicitado_en` … `cancelado_en` | timestamp | sello de cada cambio de estado |

### `configuracion_tarifa`  (entidad `ConfiguracionTarifa`) — parámetros de precio
| columna | tipo | valor sembrado |
|---|---|---|
| `id` | bigserial PK | 1 |
| `bajada_bandera` | numeric | `1.50` € (precio fijo de inicio) |
| `precio_km` | numeric | `0.80` €/km |
| `radio_busqueda_km` | numeric | `5` km (radio para buscar taxistas) |

Fórmula precio: `precio = bajada_bandera + km * precio_km`.

> **Redis** no usa tablas: guarda la posición en vivo de cada taxista en un índice geoespacial
> (GEORADIUS) para encontrar los cercanos rápido. Es volátil, no es la BD principal.

### Ver datos a mano (ejemplos en pgAdmin o psql)
```sql
SELECT id, nombre, email, rol FROM usuarios;
SELECT id, cliente_id, taxista_id, estado, precio_final FROM viajes ORDER BY id DESC;
SELECT * FROM configuracion_tarifa;
```

---

## 8. Datos de prueba

No hay usuarios sembrados (solo la tarifa). Para crear cuentas usa la propia app
(pantalla de registro) o la API:

```bash
# Cliente
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Cliente","email":"ana@taya.es","password":"123456","rol":"CLIENTE"}'

# Taxista
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Luis Taxi","email":"luis@taya.es","password":"123456","rol":"TAXISTA"}'
```

Tras esto verás filas en `usuarios` desde pgAdmin.

---

## 9. Problemas frecuentes

| Síntoma | Causa / arreglo |
|---|---|
| Backend no arranca, `Connection refused :5432` | PostgreSQL parado → `sudo systemctl start postgresql` |
| `password authentication failed for user "taya_user"` | rol/clave no creados → repite paso 2 |
| `Connection refused :6379` | Redis parado → `sudo systemctl start redis-server` |
| Frontend carga pero login falla / CORS | backend no arrancado, o no en :8080 |
| Quiero empezar de cero la BD | `sudo -u postgres psql -c "DROP DATABASE taya_taxi;"` y repite paso 2 |

> Nota: los tests de integración (`*IT.java`) usan Testcontainers y **sí** necesitan Docker.
> Para solo *ejecutar* la app no hace falta; el botón Play no corre los tests.
