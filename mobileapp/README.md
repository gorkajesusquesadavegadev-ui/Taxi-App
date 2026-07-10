# CanaryCab Mobile (Android/iOS)

App nativa que renderiza **la web real** (https://canarycab.com) dentro de un
WebView. Paridad visual y funcional **100%** con el frontend web: misma escena
de portada, mismo mapa Leaflet, mismo Tailwind, mismos 3 idiomas. Un solo
frontend que mantener: cada deploy de la web se refleja en la app al instante.

## Extras nativos incluidos

- **GPS**: permiso de ubicación nativo + `geolocationEnabled` (la web usa
  `navigator.geolocation` igual que en Chrome).
- **Botón atrás** (Android): navega atrás dentro de la web.
- **Enlaces externos**: `tel:`, `mailto:`, WhatsApp y cualquier dominio ajeno
  abren en la app del sistema.
- **Pantalla offline** con reintento + splash de carga con el logo.
- **Sesión persistente** (localStorage/cookies como un navegador normal).

## Probar en el móvil (2 min)

1. Instala **Expo Go** (Play Store / App Store).
2. ```bash
   npm install
   npx expo start
   ```
3. Escanea el QR. Verás canarycab.com exacto dentro de la app.

## Compilar APK

```bash
npm install -g eas-cli
eas login                # cuenta gratis en expo.dev
eas build:configure
eas build -p android --profile preview     # APK instalable
```

No hace falta Google Maps API key (el mapa es Leaflet dentro de la web).

## Publicar en Play Store

1. Cuenta Google Play Developer (25 $ una vez): https://play.google.com/console
2. `eas build -p android --profile production` → sube el `.aab`.
3. Ficha: capturas, descripción, política de privacidad → https://canarycab.com/privacidad
4. Nota: Google pide que las apps WebView aporten valor añadido — esta lo hace
   (GPS nativo, offline, navegación) pero conviene describir la app como el
   cliente oficial del servicio CanaryCab.

## Limitación conocida

- **Push con app cerrada**: el Web Push del navegador no funciona dentro de
  WebView Android. Siguiente iteración: FCM nativo (expo-notifications) +
  endpoint en el backend para tokens FCM. Dentro de la app abierta, todos los
  avisos en tiempo real (WebSocket) funcionan normal.
