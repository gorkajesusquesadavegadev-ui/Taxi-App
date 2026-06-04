Aquí tienes el contenido del PDF **"Documentacion taxi.pdf"** convertido a un solo bloque de **Markdown** limpio y estructurado, listo para que Claude Code lo procese o lo uses en tu documentación:

```markdown
# Documentación TAYA - Aplicación de Taxis en Las Palmas de Gran Canaria

## 1. Visión General de la Aplicación

TAYA es una aplicación completa de movilidad que conecta clientes con taxistas en Las Palmas de Gran Canaria, con un sistema inteligente de predicción de demanda basado en datos históricos y eventos en tiempo real (cruceros, partidos, vuelos).

**Los tres pilares:**
- **App Cliente (Flutter):** Cualquier persona puede pedir un taxi con 1 botón. **Gratis**.
- **App Taxista (Flutter):** Conductores profesionales reciben viajes y ven zonas calientes. **Comisión del 10% por viaje**.
- **Panel Admin (Next.js):** Administradores gestionan todo y ven estadísticas.

**Diferencias clave con Uber/Cabify:**
- Precio: Taxímetro oficial (sin comisión) vs Precio dinámico (+25% comisión)
- Comisión al taxista: **10%** vs 25-30%
- Mapa de calor: ✅ Gratis para taxistas vs ❌ No lo comparten
- Alertas de eventos: ✅ Cruceros, partidos, vuelos vs ❌ No
- Enfoque: Ayudar al taxista local vs Maximizar beneficio propio

## 2. Pila Tecnológica Completa

### Backend
- **Lenguaje:** Java 17
- **Framework:** Spring Boot 3.2.x
- **Seguridad:** Spring Security + JWT
- **ORM:** Spring Data JPA
- **BD Principal:** PostgreSQL 16
- **BD Tiempo Real:** Redis 7.2
- **WebSockets:** Spring WebSocket
- **Notificaciones:** Firebase Admin SDK
- **Pagos:** Stripe Connect
- **Testing:** JUnit 5 + Mockito
- **Build:** Maven

### App Móvil (Flutter)
- **Framework:** Flutter 3.x
- **Lenguaje:** Dart 3.x
- **Mapas:** google_maps_flutter
- **Geolocalización:** geolocator
- **Notificaciones:** firebase_messaging
- **WebSockets:** web_socket_channel
- **HTTP:** dio 5.x
- **Estado:** Riverpod 2.x
- **Almacenamiento:** shared_preferences
- **Diseño:** Material 3

### Panel Administrador (Next.js)
- **Framework:** Next.js 15
- **Lenguaje:** TypeScript 5.x
- **Estilos:** Tailwind CSS 3.x
- **Componentes:** shadcn/ui
- **HTTP:** Axios
- **Mapas:** Mapbox GL JS
- **Gráficos:** Recharts

### Infraestructura y Herramientas
- Git + GitHub
- Docker + Docker Compose
- Postman
- Android Studio / IntelliJ IDEA / VS Code
- Stripe Dashboard
- Firebase Console

## 3. Arquitectura del Sistema

### Flujo principal de un viaje:
1. Cliente abre la app y pulsa [PEDIR TAXI]
2. Backend busca taxis cerca (Redis GEORADIUS)
3. Envía notificación (Firebase FCM)
4. Taxista recibe alerta y acepta
5. "Taxista asignado"
6. Taxista envía ubicación cada 3s (WebSocket)
7. Cliente ve taxi moviéndose (WS)
8. Taxista marca [HE LLEGADO]
9. "Tu taxi ha llegado"
10. Taxista inicia viaje
11. "En viaje" + taxímetro (cada 5s)
12. Taxista finaliza
13. Calcula tarifa (según tarifas oficiales)
14. Cobra 10% comisión (Stripe Connect)
15. "Viaje completado"
16. Valoración (opcional)
17. Actualiza análisis de demanda

## 4. Modelo de Datos - Todas las Tablas

### Tabla: usuarios
```sql
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    rol ENUM('CLIENTE', 'TAXISTA', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
    fcm_token VARCHAR(255),
    licencia VARCHAR(50), -- Solo para taxistas
    vehiculo_matricula VARCHAR(20), -- Solo para taxistas
    vehiculo_modelo VARCHAR(100), -- Solo para taxistas
    stripe_account_id VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    INDEX idx_telefono (telefono),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
);
```

### Tabla: viajes
```sql
CREATE TABLE viajes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    taxista_id BIGINT,
    origen_lat DOUBLE NOT NULL,
    origen_lng DOUBLE NOT NULL,
    destino_lat DOUBLE,
    destino_lng DOUBLE,
    origen_texto VARCHAR(255),
    destino_texto VARCHAR(255),
    distancia_km DECIMAL(10,2),
    tiempo_segundos INT,
    precio DECIMAL(10,2),
    estado ENUM('SOLICITADO', 'ASIGNADO', 'ACEPTADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
    tiempo_respuesta_segundos INT,
    tiempo_llegada_segundos INT,
    valoracion_cliente INT CHECK (valoracion_cliente BETWEEN 1 AND 5),
    valoracion_taxista INT CHECK (valoracion_taxista BETWEEN 1 AND 5),
    solicitado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aceptado_en TIMESTAMP,
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP,
    cancelado_en TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (taxista_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_estado (estado),
    INDEX idx_cliente (cliente_id),
    INDEX idx_taxista (taxista_id),
    INDEX idx_solicitado (solicitado_en),
    INDEX idx_ubicacion_origen (origen_lat, origen_lng)
);
```

### Tabla: comisiones
```sql
CREATE TABLE comisiones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    viaje_id BIGINT NOT NULL,
    taxista_id BIGINT NOT NULL,
    importe_viaje DECIMAL(10,2) NOT NULL,
    porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    importe_comision DECIMAL(10,2) NOT NULL,
    importe_taxista DECIMAL(10,2) NOT NULL,
    estado ENUM('PENDIENTE', 'PAGADO', 'FALLIDO', 'REEMBOLSADO') DEFAULT 'PENDIENTE',
    stripe_transfer_id VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pagado_en TIMESTAMP,
    FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
    FOREIGN KEY (taxista_id) REFERENCES usuarios(id),
    INDEX idx_estado (estado),
    INDEX idx_taxista (taxista_id)
);
```

### Tabla: saldo_taxistas
```sql
CREATE TABLE saldo_taxistas (
    taxista_id BIGINT PRIMARY KEY,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0.00,
    saldo_retenido DECIMAL(10,2) DEFAULT 0.00,
    total_ganado DECIMAL(10,2) DEFAULT 0.00,
    total_comisiones DECIMAL(10,2) DEFAULT 0.00,
    ultimo_pago TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (taxista_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

### Tabla: eventos_programados
```sql
CREATE TABLE eventos_programados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo ENUM('CRUCERO', 'PARTIDO', 'CONCIERTO', 'VUELO', 'FESTIVAL', 'OTRO') NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    direccion VARCHAR(255),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    afluencia_estimada INT,
    porcentaje_taxi DECIMAL(5,2) DEFAULT 10.0,
    destinos_json JSON,
    fuente VARCHAR(100),
    external_id VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha_inicio, fecha_fin),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (activo),
    INDEX idx_ubicacion (lat, lng)
);
```

### Tabla: alertas_taxistas
```sql
CREATE TABLE alertas_taxistas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evento_id BIGINT,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    radio_km DOUBLE DEFAULT 5.0,
    nivel ENUM('INFO', 'ALTA', 'URGENTE') DEFAULT 'INFO',
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    enviada BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: analisis_demanda
```sql
CREATE TABLE analisis_demanda (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora INT NOT NULL,
    zona_id VARCHAR(50) NOT NULL,
    lat_centro DOUBLE NOT NULL,
    lng_centro DOUBLE NOT NULL,
    total_solicitudes INT DEFAULT 0,
    total_completados INT DEFAULT 0,
    tiempo_medio_respuesta DECIMAL(10,2),
    porcentaje_exito DECIMAL(5,2),
    viajes_largos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha_hora (fecha, hora),
    INDEX idx_zona (zona_id),
    UNIQUE KEY uk_fecha_hora_zona (fecha, hora, zona_id)
);
```

### Tabla: notificaciones_log
```sql
CREATE TABLE notificaciones_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    tipo ENUM('VIAJE_ASIGNADO', 'VIAJE_ACEPTADO', 'VIAJE_CANCELADO', 'ALERTA_EVENTO') NOT NULL,
    titulo VARCHAR(200),
    mensaje TEXT,
    viaje_id BIGINT,
    leida BOOLEAN DEFAULT FALSE,
    enviado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida_en TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_leida (leida),
    INDEX idx_enviado (enviado_en)
);
```

### Datos en Redis (Estructuras en Memoria)
```redis
# Ubicacion de un taxi (expira cada 10s)
SETEX taxi:123:ubicacion 10 "28.1234,-15.5678"

# Estado de un taxi
SET taxi:123:estado "LIBRE"  # LIBRE, OCUPADO, DESCONECTADO

# Ultimo ping (expira cada 30s)
SETEX taxi:123:last_ping 30 "2026-05-26 10:30:00"

# Cola de taxis por zona (FIFO)
LPUSH zona:aeropuerto:cola "123"
LPUSH zona:aeropuerto:cola "456"
LPUSH zona:aeropuerto:cola "789"

# Evento activo (para alertas)
SETEX evento:crucero:activo 43200 "true"

# Zonas calientes (calculadas cada 5 min)
GEOADD zonas:calientes -15.4333 28.1333 "puerto"
GEOADD zonas:calientes -15.4567 28.1003 "estadio"
GEOADD zonas:calientes -15.3866 27.9319 "aeropuerto"
```

## 5. Backend - Spring Boot

### Estructura de paquetes
```
src/main/java/com/taya/
├── TayaApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── WebSocketConfig.java
│   ├── RedisConfig.java
│   ├── StripeConfig.java
│   └── FirebaseConfig.java
├── controller/
│   ├── AuthController.java
│   ├── UsuarioController.java
│   ├── ViajeController.java
│   ├── TaxistaController.java
│   ├── AdminController.java
│   ├── EventoController.java
│   ├── AnalisisController.java
│   └── PagoController.java
├── service/
│   ├── AuthService.java
│   ├── UsuarioService.java
│   ├── ViajeService.java
│   ├── MatchingService.java
│   ├── UbicacionService.java
│   ├── TaxistaService.java
│   ├── AdminService.java
│   ├── EventoService.java
│   ├── AnalisisDemandaService.java
│   ├── PagoService.java
│   ├── NotificationService.java
│   └── TarifaService.java
├── repository/
│   ├── UsuarioRepository.java
│   ├── ViajeRepository.java
│   ├── ComisionRepository.java
│   ├── EventoRepository.java
│   ├── AlertaRepository.java
│   ├── AnalisisDemandaRepository.java
│   └── NotificacionLogRepository.java
├── model/
│   ├── Usuario.java
│   ├── Viaje.java
│   ├── Comision.java
│   ├── EventoProgramado.java
│   ├── AlertaTaxista.java
│   ├── AnalisisDemanda.java
│   └── NotificacionLog.java
├── enums/
│   ├── Rol.java
│   ├── EstadoViaje.java
│   ├── TipoEvento.java
│   └── NivelAlerta.java
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── ViajeRequest.java
│   │   ├── UbicacionRequest.java
│   │   └── EventoRequest.java
│   └── response/
│       ├── LoginResponse.java
│       ├── ViajeResponse.java
│       ├── ZonaCalienteDTO.java
│       ├── AlertaDTO.java
│       └── EstadisticasDTO.java
├── websocket/
│   ├── WebSocketHandler.java
│   └── WebSocketService.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   └── CustomUserDetailsService.java
├── scheduler/
│   ├── AnalisisDemandaScheduler.java
│   ├── EventosScheduler.java
│   └── AlertasScheduler.java
└── util/
    ├── GeoUtil.java
    ├── DateUtil.java
    └── ValidationUtil.java
```

### Configuración principal (application.properties)
```properties
# Servidor
server.port=8080
server.error.include-message=always

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/taya_taxi
spring.datasource.username=${DB_USERNAME:taya_user}
spring.datasource.password=${DB_PASSWORD:password}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Redis
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.password=${REDIS_PASSWORD:}
spring.redis.timeout=5000ms

# JWT
jwt.secret=${JWT_SECRET:miClaveSecretaMuySeguraParaJWT2026}
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# Stripe
stripe.api.key=${STRIPE_API_KEY}
stripe.webhook.secret=${STRIPE_WEBHOOK_SECRET}

# Firebase
firebase.service-account-file=firebase-service-account.json
```

## 6. App Cliente - Flutter

### Servicio API con Dio
```dart
// api_service.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
    static final ApiService _instance = ApiService._internal();
    factory ApiService() => _instance;
    ApiService._internal();
    
    late Dio _dio;
    final String baseUrl = 'https://api.taya.com/api';
    
    Future<void> init() async {
        _dio = Dio(BaseOptions(
            baseURL: baseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 30),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        ));
        
        // Interceptor para añadir token JWT
        _dio.interceptors.add(InterceptorWrapper(
            onRequest: (options, handler) async {
                final prefs = await SharedPreferences.getInstance();
                final token = prefs.getString('jwt_token');
                if (token != null) {
                    options.headers['Authorization'] = 'Bearer $token';
                }
                return handler.next(options);
            },
            onError: (error, handler) async {
                if (error.response?.statusCode == 401) {
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.remove('jwt_token');
                }
                return handler.next(error);
            },
        ));
    }
    
    // Métodos de API
    Future<Response> login(String telefono, String codigo) async {
        return _dio.post('/auth/login', data: {
            'telefono': telefono,
            'codigo': codigo,
        });
    }
    
    Future<Response> solicitarViaje({
        required double origenLat,
        required double origenLng,
        String? origenTexto,
        double? destinoLat,
        double? destinoLng,
        String? destinoTexto,
    }) async {
        return _dio.post('/viajes/solicitar', data: {
            'origen_lat': origenLat,
            'origen_lng': origenLng,
            'origen_texto': origenTexto,
            'destino_lat': destinoLat,
            'destino_lng': destinoLng,
            'destino_texto': destinoTexto,
        });
    }
}
```

## 7. App Taxista - Flutter

### Servicio de WebSocket para ubicaciones
```dart
// websocket_service.dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/io.dart';

class WebSocketService {
    static final WebSocketService _instance = WebSocketService._internal();
    factory WebSocketService() => _instance;
    WebSocketService._internal();
    
    IOWebSocketChannel? _channel;
    bool _isConnected = false;
    
    void connect(String token) {
        final wsUrl = 'wss://api.taya.com/ws?token=$token';
        _channel = IOWebSocketChannel.connect(Uri.parse(wsUrl));
        _isConnected = true;
        
        _channel!.stream.listen(
            (message) {
                _handleMessage(message);
            },
            onError: (error) {
                print('WebSocket error: $error');
                _isConnected = false;
            },
            onDone: () {
                print('WebSocket disconnected');
                _isConnected = false;
            },
        );
    }
    
    void _handleMessage(dynamic message) {
        final data = jsonDecode(message);
        final event = data['event'];
        final payload = data['data'];
        
        switch (event) {
            case 'trip:assigned':
                NotificationService().showTripRequest(payload);
                break;
            case 'trip:status':
                ViajeProvider().updateEstado(payload);
                break;
        }
    }
    
    void enviarUbicacion(double lat, double lng, String estado) {
        if (!_isConnected) return;
        
        final message = {
            'event': 'location:update',
            'data': {
                'lat': lat,
                'lng': lng,
                'estado': estado,
                'timestamp': DateTime.now().toIso8601String(),
            }
        };
        _channel!.sink.add(jsonEncode(message));
    }
    
    void disconnect() {
        _channel?.sink.close();
        _isConnected = false;
    }
}
```

## 8. Panel Administrador - Next.js

### Funcionalidades del Admin (34 en total)
- **Dashboard:** Tarjetas stats, gráficos, mapa vivo, alertas, últimos viajes
- **Gestión de taxistas:** Lista, filtrar, ver detalle, verificar, desactivar, historial, ganancias
- **Gestión de clientes:** Lista, ver detalle, bloquear
- **Gestión de viajes:** Lista, filtrar, ver detalle, exportar a CSV
- **Gestión de eventos:** Lista, crear, editar, eliminar, importar desde APIs, activar alertas
- **Análisis y predicciones:** Mapa de calor histórico, ranking zonas calientes, predicción de demanda, informes de eventos
- **Configuración:** Tarifas de taxi, porcentaje de comisión, radio de búsqueda, tiempo de respuesta

## 9. Endpoints de la API

### Autenticación (/api/auth)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login con teléfono | No |
| POST | `/auth/register` | Registro cliente | No |
| POST | `/auth/register/taxista` | Registro taxista | No |
| POST | `/auth/verify-code` | Verificar código SMS | No |
| POST | `/auth/send-code` | Enviar código SMS | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| GET | `/auth/validate` | Validar token | Sí |

### Usuarios (/api/usuarios)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/usuarios/me` | Obtener mi perfil | Sí |
| PUT | `/usuarios/me` | Actualizar mi perfil | Sí |
| GET | `/usuarios/taxistas` | Listar taxistas | ADMIN |
| GET | `/usuarios/taxistas/pendientes` | Taxistas sin verificar | ADMIN |
| PUT | `/usuarios/taxistas/{id}/verificar` | Verificar taxista | ADMIN |

### Viajes (/api/viajes)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/viajes/solicitar` | Pedir taxi | CLIENTE |
| GET | `/viajes/{id}` | Obtener viaje | Sí |
| PUT | `/viajes/{id}/aceptar` | Taxista acepta | TAXISTA |
| PUT | `/viajes/{id}/rechazar` | Taxista rechaza | TAXISTA |
| PUT | `/viajes/{id}/iniciar` | Iniciar viaje | TAXISTA |
| PUT | `/viajes/{id}/finalizar` | Finalizar viaje | TAXISTA |
| PUT | `/viajes/{id}/cancelar` | Cancelar viaje | CLIENTE/TAXISTA |
| POST | `/viajes/{id}/valorar` | Valorar viaje | CLIENTE |

### Taxista (/api/taxista)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/taxista/ubicacion` | Enviar ubicación | TAXISTA |
| PUT | `/taxista/estado` | Conectar/desconectar | TAXISTA |
| GET | `/taxista/zonas-calientes` | Zonas con demanda | TAXISTA |
| GET | `/taxista/alertas` | Alertas activas | TAXISTA |
| GET | `/taxista/ganancias` | Estadísticas ganancias | TAXISTA |

### Admin (/api/admin)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Estadísticas generales | ADMIN |
| GET | `/admin/taxistas/online` | Taxistas conectados | ADMIN |
| GET | `/admin/viajes/hoy` | Viajes de hoy | ADMIN |
| POST | `/admin/eventos` | Crear evento | ADMIN |
| POST | `/admin/eventos/importar` | Importar eventos de APIs | ADMIN |

### Análisis y Predicciones (/api/analisis)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/analysis/zonas-calientes` | Zonas calientes ahora | TAXISTA |
| GET | `/analysis/eventos-activos` | Eventos ocurriendo | TAXISTA |
| GET | `/analysis/prediccion/demanda` | Predicción próximas horas | TAXISTA |
| GET | `/analysis/prediccion/viajes-largos` | Probabilidad viajes largos | TAXISTA |

### Pagos (/api/pagos)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/pagos/taxista/saldo` | Saldo pendiente | TAXISTA |
| POST | `/pagos/taxista/solicitar-pago` | Solicitar transferencia | TAXISTA |
| GET | `/pagos/taxista/historial` | Historial de pagos | TAXISTA |

## 10. WebSockets y Tiempo Real

### Eventos WebSocket
| Evento | Dirección | Datos | Descripción |
|--------|-----------|-------|-------------|
| `location:update` | Taxista → Backend | `{taxista_id, lat, lng, estado}` | Actualiza ubicación del taxi |
| `location:subscribe` | Cliente → Backend | `{viaje_id}` | Cliente se suscribe al taxi |
| `trip:assigned` | Backend → Taxista | `{viaje_id, origen, destino}` | Nuevo viaje asignado |
| `trip:accepted` | Backend → Cliente | `{viaje_id, taxista, ubicacion}` | Taxista aceptó viaje |
| `trip:location` | Backend → Cliente | `{lat, lng, timestamp}` | Ubicación actual del taxi |
| `trip:completed` | Backend → Cliente | `{viaje_id, precio}` | Viaje finalizado |
| `alert:new` | Backend → Taxista | `{titulo, mensaje, lat, lng}` | Nueva alerta de evento |

## 11. Sistema de Notificaciones

### Tipos de notificaciones
| Tipo | Quién lo recibe | Cuándo | Contenido |
|------|-----------------|--------|-----------|
| `VIAJE_ASIGNADO` | Taxista | Nuevo viaje | "Nuevo viaje - Recoger en Calle Mayor 123" |
| `VIAJE_ACEPTADO` | Cliente | Taxista acepta | "Tu taxi está en camino - Llega en 3 min" |
| `VIAJE_LLEGADA` | Cliente | Taxista llega | "Tu taxi ha llegado" |
| `VIAJE_COMPLETADO` | Cliente | Viaje finaliza | "Viaje completado - 15.50€" |
| `ALERTA_EVENTO` | Taxista | Evento próximo | "🔥 Crucero en puerto - Alta demanda hasta 18:00" |
| `PAGO_RECIBIDO` | Taxista | Comisión pagada | "Has recibido 450€ por tus viajes" |

### Servicio de notificaciones (Firebase)
```java
@Service
public class NotificationService {
    
    @Autowired
    private FirebaseMessaging firebaseMessaging;
    
    public void sendViajeAsignado(String fcmToken, Viaje viaje) {
        Message message = Message.builder()
            .setToken(fcmToken)
            .setNotification(Notification.builder()
                .setTitle("🔔 Nuevo viaje")
                .setBody("Recoger en " + viaje.getOrigenTexto())
                .build())
            .putData("viaje_id", viaje.getId().toString())
            .putData("type", "VIAJE_ASIGNADO")
            .build();
        
        firebaseMessaging.sendAsync(message);
    }
}
```

## 12. Sistema de Análisis y Predicciones

### Cálculo de Zonas Calientes
```java
@Service
public class AnalisisDemandaService {
    
    @Scheduled(fixedRate = 300000) // Cada 5 minutos
    public void actualizarZonasCalientes() {
        int horaActual = LocalTime.now().getHour();
        
        List<Object[]> zonas = viajeRepository.findZonasCalientes(horaActual);
        
        redisTemplate.delete("zonas:calientes");
        
        for (Object[] zona : zonas) {
            double lat = (double) zona[0];
            double lng = (double) zona[1];
            int demanda = (int) zona[2];
            int nivel = calcularNivelDemanda(demanda);
            redisTemplate.opsForGeo().add("zonas:calientes", new Point(lng, lat), "zona_" + demanda);
        }
    }
    
    private int calcularNivelDemanda(int viajesPorHora) {
        if (viajesPorHora > 50) return 5;
        if (viajesPorHora > 30) return 4;
        if (viajesPorHora > 15) return 3;
        if (viajesPorHora > 5) return 2;
        return 1;
    }
}
```

### Predicción de Viajes Largos
```java
public double predecirProbabilidadViajeLargo(double lat, double lng, int hora) {
    // Puerto de la Luz (cruceros) → Maspalomas
    if (distanciaEntrePuntos(lat, lng, 28.1333, -15.4333) < 0.5 && horaEntre(7, 10)) {
        return 0.85; // 85% probabilidad
    }
    
    // Aeropuerto → Maspalomas
    if (distanciaEntrePuntos(lat, lng, 27.9319, -15.3866) < 0.5) {
        return 0.70; // 70% probabilidad
    }
    
    return 0.15; // Probabilidad base
}
```

## 13. Sistema de Pagos y Comisiones

### Modelo de monetización
- **Comisión:** 10% del importe del viaje
- **Cálculo del importe:** Basado en tarifas oficiales de taxis de Las Palmas
- **Cobro:** Al finalizar el viaje, se retiene automáticamente
- **Pago al taxista:** Transferencia semanal a su cuenta bancaria

### Servicio de pagos con Stripe
```java
@Service
public class PagoService {
    
    @Transactional
    public void procesarComision(Viaje viaje, double importe) {
        double comision = importe * 0.10;
        double netoTaxista = importe - comision;
        
        Comision comisionEntity = Comision.builder()
            .viaje(viaje)
            .taxista(viaje.getTaxista())
            .importeViaje(importe)
            .porcentajeComision(10.0)
            .importeComision(comision)
            .importeTaxista(netoTaxista)
            .estado(EstadoComision.PENDIENTE)
            .build();
        comisionRepository.save(comisionEntity);
        
        SaldoTaxista saldo = saldoTaxistaRepository.findByTaxistaId(viaje.getTaxista().getId())
            .orElse(new SaldoTaxista());
        saldo.setSaldoPendiente(saldo.getSaldoPendiente() + netoTaxista);
        saldoTaxistaRepository.save(saldo);
    }
    
    @Scheduled(cron = "0 0 0 * * MON") // Cada lunes a las 00:00
    public void pagarTaxistas() {
        List<SaldoTaxista> saldosPendientes = saldoTaxistaRepository.findBySaldoPendienteGreaterThan(50);
        
        for (SaldoTaxista saldo : saldosPendientes) {
            // Transferencia a Stripe y actualización de estados
            // ...
        }
    }
}
```

## 14. Seguridad y Autenticación

### JWT Configuration
```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private int jwtExpiration;
    
    public String generateToken(Usuario usuario) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
            .setSubject(usuario.getId().toString())
            .claim("email", usuario.getEmail())
            .claim("nombre", usuario.getNombre())
            .claim("rol", usuario.getRol().name())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
}
```

### SecurityConfig
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/ws/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/taxista/**").hasRole("TAXISTA")
                .requestMatchers("/api/viajes/**").hasAnyRole("CLIENTE", "TAXISTA")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

## 15. Despliegue y DevOps

### Docker Compose para desarrollo
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: taya_taxi
      POSTGRES_USER: taya_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/taya_taxi
      SPRING_DATASOURCE_USERNAME: taya_user
      SPRING_DATASOURCE_PASSWORD: password
      SPRING_REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Variables de entorno para producción
```bash
# Base de datos
DB_HOST=prod-postgres.rds.amazonaws.com
DB_PORT=5432
DB_NAME=taya_taxi
DB_USERNAME=prod_user
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=prod-redis.aws.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=supersecretkeyforjwtproduction2026

# Stripe
STRIPE_API_KEY=sk_live...
STRIPE_WEBHOOK_SECRET=whsec...

# Comisión
COMISION_PORCENTAJE=10.0
```

## 16. Resumen de Funcionalidades por Rol

### Cliente (39 funcionalidades)
- **Autenticación:** Registro, Login, Cerrar sesión, Recuperar cuenta
- **Pantalla principal:** Ver mapa, Buscar dirección, Ver ubicación
- **Pedir taxi:** Botón pedir, Seleccionar destino, Ver precio, Confirmar, Cancelar
- **Seguimiento:** Ver estado, Ver taxi en mapa, Ver tiempo, Info taxista, Llamar
- **Durante viaje:** Ver taxímetro, Ver tiempo restante, Ver ruta
- **Post-viaje:** Ver resumen, Valorar taxista, Nuevo viaje
- **Historial:** Ver lista viajes, Ver detalle, Filtrar
- **Perfil:** Ver perfil, Editar datos, Ver notificaciones

### Taxista (45 funcionalidades)
- **Registro:** Registro especial, Subir documentos, Esperar verificación
- **Pantalla principal:** Ver mapa, Conectar/desconectar, Ver ganancias, Mapa de calor, Alertas
- **Recibir viajes:** Notificación, Ver detalles, Aceptar/Rechazar
- **En camino:** Ver ruta, Ver ETA, Botón llegada, Llamar cliente
- **Viaje en curso:** Iniciar viaje, Taxímetro, Ver ruta, Finalizar
- **Post-viaje:** Ver resumen, Confirmar importe, Ver comisión (10%)
- **Zonas calientes:** Mapa de calor, Alertas cruceros, Alertas partidos, Predicciones
- **Ganancias:** Ver diarias, semanales, mensuales, Desglose, Saldo pendiente

### Administrador (34 funcionalidades)
- **Dashboard:** Tarjetas stats, Gráficos, Mapa en vivo, Alertas, Últimos viajes
- **Taxistas:** Lista, Filtrar, Ver detalle, Verificar, Desactivar, Historial, Ganancias
- **Clientes:** Lista, Ver detalle, Bloquear
- **Viajes:** Lista, Filtrar, Ver detalle, Exportar a CSV
- **Eventos:** Lista, Crear, Editar, Eliminar, Importar desde APIs, Activar alertas
- **Análisis:** Mapa de calor histórico, Ranking zonas, Predicciones, Informes
- **Configuración:** Tarifas, Comisión (10%), Radio de búsqueda, Tiempo de respuesta

---

## Cierre

TAYA es una aplicación **completa, escalable y lista para producción** que resuelve un problema real en Las Palmas de Gran Canaria.

**Puntos clave:**
- 8 tablas principales en PostgreSQL + estructuras en Redis
- 3 apps (Flutter cliente, Flutter taxista, Next.js admin)
- Sistema de análisis y predicciones basado en datos históricos
- Alertas de eventos (cruceros, partidos, vuelos)
- Monetización justa (10% comisión solo si ganan)
- Arquitectura escalable (Spring Boot + Redis)

**¿Estás listo para construir TAYA?** Comienza por el backend, luego la app Flutter y finalmente el panel admin. En 4-6 semanas tendrás un MVP funcional. ¡Buena suerte!
```

---

✅ **Listo.** Ese bloque completo de Markdown ya está formateado, limpio y listo para que lo uses en Claude Code, lo guardes como `.md`, o lo pegues directamente en tu chat.

