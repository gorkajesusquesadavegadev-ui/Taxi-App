# TAYA — Estado y aspectos de mejora

Estado de la aplicación y trabajo pendiente. Lo ya hecho queda como referencia;
las mejoras están priorizadas.

## ✅ Implementado

**Cuenta y perfil**
- Registro/login con JWT; validaciones en vivo (email, nombre, contraseña, fuerza).
- Perfil editable (nombre, teléfono, vehículo/matrícula del taxista) y cambio de contraseña.

**Viajes (cliente)**
- Búsqueda de direcciones con autocompletado y **dictado por voz**, o tocar el mapa.
- Ruta real por calles (OSRM) con tiempo, km y precio antes de pedir.
- Seguimiento en vivo por WebSocket con avisos (en camino / llegó / en curso / completado).
- Historial con nombres de origen/destino y contacto (llamada + WhatsApp) con el taxista.

**Viajes (taxista)**
- Recepción de solicitudes en tiempo real con sonido; ciclo Llegué → Iniciar → Finalizar.
- Estado en línea persistente; reaparición correcta como libre tras cada viaje.
- Mapa de **demanda** (zonas calientes) por histórico + eventos.

**Ofertas y reservas**
- Transfers y excursiones de precio cerrado (con paradas reales en las excursiones).
- Reservas programadas con difusión a taxistas, recordatorios, activación a la hora,
  política de cancelación y contacto WhatsApp.

**Tarifas**
- Tarifa oficial LPGC por franja horaria, festivos (Semana Santa incluida) y 3 zonas.
- Pantalla "Tarifa actual" en tiempo real.

**Extra**
- Foro de taxistas en tiempo real, estadísticas (cliente y taxista), notificaciones in-app.

## 🔧 Mejoras pendientes

### Alta prioridad
1. **Geolocalización real del taxista** (GPS del navegador) en vez de posición fija; mover
   el marcador en vivo durante la carrera. *(Hoy el taxista usa una posición fija de Las Palmas.)*
2. **Ubicación actual del cliente** como punto de recogida por defecto (un toque).
3. **Suplementos oficiales** que faltan del BOC: radio-taxi (0,50 €), entrada/salida de muelle
   (0,70 €), bultos +50 kg (0,35 €) y **hora de espera/marcha lenta** (16–18 €/h).
4. **Festivos locales** de Las Palmas precargados por año (ahora solo nacionales+autonómicos
   automáticos; los locales se añaden a mano en BD).

### Media prioridad
5. **Pago in-app** (tarjeta) y recibo del viaje.
6. **Valoraciones** mutuas cliente↔taxista tras el viaje.
7. **Reasignación de reserva** si el taxista cancela con antelación (volver a difundir).
8. **Notificaciones push** reales (service worker) para avisos con la app cerrada.
9. **Tarifa según hora programada** en reservas (hoy se fija al crearla con la hora actual).

### Baja prioridad / técnica
10. **Tests** automatizados (backend e integración del flujo de viaje).
11. **Caché propia de geocodificación/rutas** para no depender de servicios públicos.
12. **Panel de administración** (gestionar tarifas, eventos y festivos desde la web).
13. **Internacionalización** (EN/DE) para turistas.
14. Despliegue productivo (HTTPS, dominios, variables de entorno, observabilidad).

## ⚠️ Limitaciones conocidas
- OSRM y Nominatim son servicios públicos: pueden tener cortes puntuales (hay fallback).
- Posición del taxista fija (MVP); la demanda y el "llegó" se gestionan por estados, no por GPS.
- Precios de transfers/excursiones son cerrados y orientativos del mercado local.
