# TAYA — PWA, despliegue y APK

Guía para probar la app como móvil (PWA), desplegarla online y empaquetarla
como APK para la Google Play. De lo más rápido a lo más completo.

---

## 0. Resumen de la estrategia

> **La web vive desplegada; la app es un envoltorio fino que la carga.**
> Así, cuando actualizas la web, **la app se actualiza sola** sin reinstalar.

```
Usuario ──> PWA / APK (Capacitor) ──> Web desplegada (Vercel) ──> Backend (Railway)
                                                                      ├─ PostgreSQL
                                                                      └─ Redis
```

- **PWA**: ya configurada (manifest + service worker, auto-actualización). Instalable
  desde el navegador. Base para todo.
- **Capacitor**: genera el APK/AAB para la Play Store, con acceso nativo (GPS, push).

---

## 1. Probar la PWA en móvil (ahora mismo, sin desplegar)

La PWA solo se activa en el build de producción (no en `npm run dev`).

```bash
cd frontend
npm install
npm run build
npm run preview -- --host      # sirve dist en http://localhost:4173 y en tu IP de red
```

### Opción A — tu móvil real (lo más fácil)
1. PC y móvil en la **misma WiFi**.
2. En el móvil abre `http://IP-DE-TU-PC:4173` (la "Network URL" que muestra el preview,
   p. ej. `http://192.168.1.145:4173`).
3. Chrome Android → menú ⋮ → **Añadir a pantalla de inicio** / "Instalar app".
4. Se instala con icono TAYA y se abre a pantalla completa, como una app.

> Para que funcione el login contra tu backend local, arranca también el backend y pon
> en `frontend/.env` la IP: `VITE_API_URL=http://IP-DE-TU-PC:8080/api` y
> `VITE_WS_URL=ws://IP-DE-TU-PC:8080/ws`; añade esa IP a `CORS_ORIGINS`. (Lo simple es
> probar contra el backend ya desplegado — sección 3.)

### Opción B — emulador Android (Android Studio)
1. Instala **Android Studio** → Device Manager → crea un dispositivo (Pixel) → arráncalo.
2. En el emulador, Chrome → abre `http://10.0.2.2:4173`
   (`10.0.2.2` es el "localhost del PC" visto desde el emulador).
3. Menú ⋮ → Instalar app.

### Opción C — Chrome DevTools (verificación rápida)
F12 → **Application → Manifest** (ver iconos/manifest) y **Service Workers** (activo).
Pestaña **Lighthouse → Progressive Web App** para auditar que todo está OK.

---

## 2. Desplegar el FRONTEND (Vercel) — gratis, CDN, auto-deploy

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub.
2. **Add New → Project** → importa el repo `Taxi-App`.
3. Configuración:
   - **Root Directory**: `frontend`
   - Framework: **Vite** (lo detecta). Build `npm run build`, output `dist` (ya en `vercel.json`).
4. **Environment Variables** (las del backend, sección 3):
   - `VITE_API_URL = https://TU-BACKEND.up.railway.app/api`
   - `VITE_WS_URL  = wss://TU-BACKEND.up.railway.app/ws`
5. Deploy. Te da una URL tipo `https://taya.vercel.app`.

> **Cada `git push` redespliega solo.** Eso es el "actualizo y ya": la PWA detecta la
> versión nueva y se actualiza en el móvil al reabrir.

---

## 3. Desplegar el BACKEND (Railway) — Spring Boot + PostgreSQL + Redis

1. Entra en [railway.app](https://railway.app) con GitHub → **New Project → Deploy from repo**.
2. Selecciona el repo; **Root Directory** = `backend` (usa el `Dockerfile` incluido).
3. En el proyecto, **+ New** → añade **PostgreSQL** y **Redis** (plugins de Railway).
4. En el servicio del backend → **Variables**:
   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | `jdbc:postgresql://HOST:PORT/DB` (de la pestaña Postgres → Connect; formato JDBC) |
   | `DB_USERNAME` / `DB_PASSWORD` | usuario y contraseña de Postgres |
   | `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | del plugin Redis |
   | `JWT_SECRET` | una cadena aleatoria de 32+ caracteres |
   | `CORS_ORIGINS` | `https://taya.vercel.app` (tu web de Vercel) |
5. Deploy. Te da una URL `https://TU-BACKEND.up.railway.app`. Esa es la que pones en Vercel (paso 2.4).
6. Elige región **Europa (West)** para baja latencia desde Canarias.

> Alternativas equivalentes: **Render**, **Fly.io**. El `Dockerfile` sirve para todas.
> Railway inyecta `PORT`; el backend ya lo lee.

Listo: web + backend online, HTTPS automático, PWA instalable desde la URL real.

---

## 4. Empaquetar como APK (Capacitor) → Google Play

El APK carga tu web de Vercel → **actualizas la web y la app cambia sola**
(salvo cambios nativos, que sí requieren regenerar el APK).

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init TAYA es.taya.app --web-dir=dist
```

En `capacitor.config.json`, apunta a la web desplegada:

```json
{
  "appId": "es.taya.app",
  "appName": "TAYA",
  "webDir": "dist",
  "server": { "url": "https://taya.vercel.app", "cleartext": false }
}
```

Generar el proyecto Android y abrirlo:

```bash
npx cap add android
npx cap open android      # abre Android Studio
```

En Android Studio:
- **Run** en un emulador/móvil para probar.
- **Build → Generate Signed Bundle/APK** → crea un **.aab** firmado (lo que pide Play).
- Sube el `.aab` a [Google Play Console](https://play.google.com/console) (cuenta de
  desarrollador: pago único de 25 $). Rellena ficha, capturas e icono y publica.

### Funciones nativas (futuro, ya en el roadmap)
Con Capacitor puedes añadir plugins:
- `@capacitor/geolocation` → GPS real del taxista/cliente.
- `@capacitor/push-notifications` → avisos con la app cerrada.
- `@capacitor/app` → control de back button, deep links.

---

## 5. Rendimiento (que vaya fluida)

- **Service worker** (ya activo): arranque casi instantáneo y caché de mapas/fuentes.
- **CDN** del frontend (Vercel) + backend en **Europa** → poca latencia.
- Posible mejora: **lazy-load de rutas** con `React.lazy` para cargar solo la pantalla visible.
- WebSocket para tiempo real (ya en uso) en vez de polling pesado.

---

## 6. Checklist de publicación

- [ ] Backend desplegado y accesible por HTTPS (Railway).
- [ ] `CORS_ORIGINS` = dominio de la web; `JWT_SECRET` fuerte.
- [ ] Frontend en Vercel con `VITE_API_URL` / `VITE_WS_URL` correctos (https/wss).
- [ ] PWA instalable verificada (Lighthouse PWA en verde).
- [ ] `capacitor.config.json` con `server.url` = web de producción.
- [ ] `.aab` firmado subido a Google Play.
