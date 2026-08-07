# Registro de Actividades de Tratamiento — CanaryCab

**Artículo 30 del Reglamento (UE) 2016/679 (RGPD)**

> Documento **interno**. No se publica en la web. Es el primer documento que
> solicita la Agencia Española de Protección de Datos en una inspección o al
> tramitar una reclamación. Debe mantenerse actualizado: cada vez que se añada
> una funcionalidad que trate datos nuevos, hay que reflejarla aquí.

- **Versión:** 1.0
- **Fecha:** agosto de 2026
- **Última revisión:** agosto de 2026

---

## 1. Responsable del tratamiento

| | |
|---|---|
| **Responsable** | Gorka Jesús Quesada Vega |
| **Domicilio** | Las Palmas de Gran Canaria, Islas Canarias, España |
| **Correo electrónico** | gorkajesusquesadavegadev@gmail.com |
| **Sitio web** | https://canarycab.com |
| **Delegado de Protección de Datos** | No procede — no concurre ninguno de los supuestos del art. 37.1 RGPD (no es autoridad pública, el tratamiento no exige observación habitual y sistemática a gran escala, y no se tratan categorías especiales de datos del art. 9) |
| **Actividad económica** | Ninguna. El proyecto no genera ingresos, no cobra comisión y no procesa pagos |

### Por qué se lleva este registro

El artículo 30.5 exime de llevarlo a organizaciones de menos de 250 empleados,
**salvo** que el tratamiento no sea ocasional. Aquí el tratamiento **es
sistemático y continuado** (cada viaje genera datos) e incluye **datos de
geolocalización**, por lo que la exención no resulta aplicable y se lleva el
registro.

---

## 2. Actividades de tratamiento

### 2.1 Gestión de cuentas de usuario

| Elemento | Detalle |
|---|---|
| **Finalidad** | Crear, autenticar y mantener las cuentas de clientes y taxistas |
| **Base jurídica** | Art. 6.1.b — ejecución de un contrato (condiciones de uso aceptadas al registrarse) |
| **Interesados** | Clientes y taxistas registrados |
| **Categorías de datos** | Nombre, correo electrónico, contraseña (hash bcrypt coste 12), teléfono (opcional), rol. En alta con Google: correo, nombre e identificador de cuenta de Google |
| **Registro del consentimiento** | Fecha y hora de aceptación y versión del texto aceptado (art. 7.1) |
| **Destinatarios** | Ninguno externo, salvo los encargados del apartado 3 |
| **Transferencias internacionales** | Sí — alojamiento en EE. UU. (ver apartado 3) |
| **Plazo de supresión** | Mientras la cuenta esté activa. Al solicitar la baja, los datos identificativos se anonimizan **de inmediato** |

### 2.2 Prestación del servicio (viajes)

| Elemento | Detalle |
|---|---|
| **Finalidad** | Solicitar, asignar, seguir y completar un viaje entre cliente y taxista |
| **Base jurídica** | Art. 6.1.b — ejecución de un contrato |
| **Interesados** | Clientes y taxistas |
| **Categorías de datos** | Origen, destino, paradas intermedias, distancia, duración, precio estimado, estado y marcas temporales del viaje |
| **Destinatarios** | La otra parte del viaje: durante el trayecto el cliente ve nombre, teléfono, matrícula, modelo y licencia del taxista; el taxista ve nombre y teléfono del cliente. **Al finalizar el viaje los teléfonos dejan de mostrarse** |
| **Plazo de supresión** | El registro del viaje se conserva **anonimizado** si una de las partes se da de baja, por interés legítimo de la otra parte en conservar su propio historial (art. 6.1.f). Sin datos identificativos deja de ser dato personal |

### 2.3 Geolocalización en tiempo real

| Elemento | Detalle |
|---|---|
| **Finalidad** | Mostrar taxis cercanos, calcular la ruta y permitir al cliente seguir la llegada de su taxi |
| **Base jurídica** | Art. 6.1.a — consentimiento (permiso del sistema operativo), revocable en cualquier momento |
| **Interesados** | Clientes y taxistas |
| **Categorías de datos** | Coordenadas GPS (latitud/longitud) y precisión |
| **Destinatarios** | Ninguno externo |
| **Plazo de supresión** | **No se almacena de forma permanente.** Se guarda en Redis con expiración automática de segundos. La última posición conocida del taxista se borra al darse de baja |
| **Nota** | Es el dato más sensible del sistema y por eso el que menos tiempo se conserva |

### 2.4 Valoraciones y reputación

| Elemento | Detalle |
|---|---|
| **Finalidad** | Permitir puntuar un viaje y mostrar la reputación media del taxista |
| **Base jurídica** | Art. 6.1.f — interés legítimo en la confianza y seguridad de la plataforma |
| **Categorías de datos** | Puntuación (1-5), comentario libre opcional, autor y viaje asociado |
| **Plazo de supresión** | Se conserva mientras exista la cuenta valorada; se desvincula del autor si este se da de baja |

### 2.5 Notificaciones push

| Elemento | Detalle |
|---|---|
| **Finalidad** | Avisar de eventos del viaje (taxi aceptado, llegada) aunque la app esté cerrada |
| **Base jurídica** | Art. 6.1.a — consentimiento explícito del navegador o dispositivo |
| **Categorías de datos** | Endpoint de suscripción y claves públicas del navegador |
| **Destinatarios** | Servicio de push del navegador (Google FCM / Mozilla / Apple) según el dispositivo |
| **Plazo de supresión** | **Borrado real e inmediato** al darse de baja o desactivar las notificaciones |

### 2.6 Foro de taxistas

| Elemento | Detalle |
|---|---|
| **Finalidad** | Comunicación entre taxistas de la plataforma |
| **Base jurídica** | Art. 6.1.b — ejecución del contrato |
| **Interesados** | Taxistas |
| **Categorías de datos** | Texto del mensaje, autor y fecha |
| **Plazo de supresión** | El mensaje se conserva pero el autor se sustituye por «Usuario eliminado» al darse de baja |

### 2.7 Verificación de taxistas

| Elemento | Detalle |
|---|---|
| **Finalidad** | Comprobar que quien se registra como taxista dispone de licencia en vigor, antes de permitirle aceptar viajes |
| **Base jurídica** | Art. 6.1.f — interés legítimo en la seguridad de los pasajeros; y cumplimiento de la normativa canaria del taxi |
| **Categorías de datos** | Número de licencia, matrícula, modelo de vehículo y, en su caso, documento acreditativo |
| **Plazo de supresión** | Mientras la cuenta esté activa; se borra al darse de baja |

### 2.8 Seguridad y registros técnicos

| Elemento | Detalle |
|---|---|
| **Finalidad** | Detectar incidencias, prevenir el abuso y limitar intentos de acceso |
| **Base jurídica** | Art. 6.1.f — interés legítimo en la seguridad |
| **Categorías de datos** | Dirección IP, navegador, sistema operativo, marcas temporales de acceso |
| **Plazo de supresión** | Según la política de retención de registros del proveedor de infraestructura |

---

## 3. Encargados del tratamiento y transferencias internacionales

| Encargado | Servicio prestado | Ubicación | Garantía de la transferencia |
|---|---|---|---|
| **Railway** | Servidor de aplicación, base de datos PostgreSQL y Redis | EE. UU. | Cláusulas Contractuales Tipo |
| **Vercel** | Alojamiento de la web y analítica sin cookies | EE. UU. | Cláusulas Contractuales Tipo |
| **Google** | Autenticación «Continuar con Google» (solo si el usuario la usa) | EE. UU. | Marco de Privacidad de Datos UE-EE. UU. |
| **CARTO / OpenStreetMap** | Cartografía | Unión Europea | No procede — dentro de la UE |
| **Komoot (Photon)** | Búsqueda de direcciones | Unión Europea | No procede — dentro de la UE |
| **Cartociudad (IGN)** | Callejero oficial español | España | No procede |

> **Estado de los acuerdos de encargado (art. 28):**
> - **Vercel** — DPA en vigor automáticamente al aceptar sus términos, con las
>   SCC de 2021 incorporadas por firma implícita. Pendiente solo archivar copia.
> - **Railway** — requiere **firma activa** (DocuSign, sección 14 de su DPA).
>   Es el encargado principal: aloja servidor, base de datos y Redis. **Pendiente.**
> - **Google** — no procede: en «Continuar con Google» Google actúa como
>   responsable independiente frente al usuario, no como encargado nuestro.
>
> Ver `checklist-cumplimiento.md` y `dpa/LEEME.md`.

---

## 4. Medidas técnicas y organizativas de seguridad

*(art. 30.1.g y art. 32)*

### Cifrado y transporte
- **HTTPS/TLS 1.3** en toda la web y la API, con certificado válido
- **HSTS** activo (2 años, `includeSubDomains`, `preload`): el navegador se niega a usar conexiones sin cifrar
- Redirección automática de `http://` a `https://`

### Autenticación y control de acceso
- Contraseñas con **bcrypt de coste 12**, nunca en texto claro
- Sesiones con **tokens JWT firmados** y caducidad de 12 horas, con lista de revocación al cerrar sesión
- **Limitación de intentos de acceso** (rate limiting): bloqueo tras varios fallos consecutivos
- Control de acceso por rol verificado en el servidor: un cliente no puede acceder a datos de otro usuario ni a funciones de administración *(verificado: devuelve 403)*

### Red y base de datos
- La base de datos **no es accesible desde internet**. El acceso público por proxy TCP fue eliminado; solo se llega por la red privada interna del proveedor
- Credenciales en variables de entorno, nunca en el código fuente
- Repositorio de código **privado**

### Navegador
- Cabeceras de seguridad: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`
- CORS restringido al dominio propio

### Minimización
- Los teléfonos solo se muestran **durante el viaje activo**, nunca en el historial
- La ubicación GPS **no se almacena de forma permanente**
- El borrado de cuenta anonimiza el perfil de forma inmediata

### Derechos de los interesados
- **Descarga de datos** en formato JSON, autoservicio e inmediata
- **Eliminación de cuenta** autoservicio e inmediata, sin intervención del responsable

---

## 5. Control de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | agosto 2026 | Versión inicial |
