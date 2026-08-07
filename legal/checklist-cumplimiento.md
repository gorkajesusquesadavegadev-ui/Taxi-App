# Checklist de cumplimiento — CanaryCab

> Estado a agosto de 2026. Lo marcado con ⬜ requiere una acción **tuya**: no
> puede hacerse desde el código.

---

## Hecho ✅

### Información y consentimiento
- ✅ **Aviso Legal** publicado en `/aviso-legal` (LSSI-CE art. 10) con titular, domicilio y correo de contacto real
- ✅ **Política de Privacidad** con toda la información del art. 13 RGPD: responsable, finalidades, bases jurídicas, destinatarios, transferencias internacionales, plazos, derechos y reclamación ante la AEPD
- ✅ **Política de Cookies** que refleja la realidad (incluido Google Sign-In)
- ✅ **Términos y Condiciones**
- ✅ Los cuatro documentos en **español, inglés y alemán**
- ✅ **Casilla de consentimiento** obligatoria al registrarse, nunca premarcada, con enlaces a los textos
- ✅ El consentimiento se **impone en el servidor**, no solo en el formulario
- ✅ Se guarda **cuándo** aceptó cada usuario y **qué versión** del texto (art. 7.1)

### Derechos de los interesados
- ✅ **Acceso y portabilidad**: descarga de todos sus datos en JSON, autoservicio
- ✅ **Supresión**: borrado de cuenta autoservicio, anonimización inmediata
- ✅ Correo de contacto real para el resto de derechos

### Minimización
- ✅ Los teléfonos solo se muestran **durante el viaje**, no en el historial
- ✅ La ubicación GPS **no se almacena** de forma permanente
- ✅ Las respuestas de la API no exponen contraseñas ni tokens

### Seguridad
- ✅ **HTTPS/TLS 1.3** con HSTS y redirección forzosa
- ✅ Contraseñas con **bcrypt coste 12**
- ✅ **Limitación de intentos** de acceso (rate limiting)
- ✅ Control de acceso por rol verificado en servidor *(probado: 403 en accesos ajenos y de admin)*
- ✅ **Base de datos cerrada a internet** — proxy TCP público eliminado
- ✅ Cabeceras de seguridad del navegador (CSP, HSTS, X-Frame-Options…)
- ✅ Repositorio de código **privado**
- ✅ Credenciales en variables de entorno, no en el código

### Documentación interna
- ✅ **Registro de Actividades de Tratamiento** (art. 30) — `registro-actividades-tratamiento.md`
- ✅ **Procedimiento ante brechas** (art. 33/34) — `procedimiento-brechas.md`
- ✅ **DPA de Railway firmado** — `dpa/railway-dpa-firmado.pdf` (no versionado)
- ✅ **Consentimiento de cuentas antiguas**: las 35 cuentas creadas antes de que
  existiera la casilla no tenían constancia de consentimiento (art. 7.1). Se
  les pide aceptar la política al entrar, con un aviso bloqueante; quien no
  quiera, cierra sesión. Alternativa habría sido borrarles la cuenta.

---

## Pendiente, y depende de ti ⬜

### 1. Acuerdos de Encargado del Tratamiento (art. 28)

Comprobado el mecanismo de cada proveedor — **no los tres funcionan igual**:

#### ✅ Vercel — ya está en vigor, no hay que firmar nada

Su DPA se incorpora automáticamente: *«This Addendum shall become legally
binding upon Customer entering into the Agreement»*. Al crear la cuenta quedó
aceptado, y con él las Cláusulas Contractuales Tipo de 2021 (*«By entering into
the Agreement, Data Exporter is deemed to have signed these Standard
Contractual Clauses»*).

- ⬜ Única tarea: descargar https://vercel.com/legal/dpa en PDF y guardarlo en
  `legal/dpa/` como prueba documental.

#### ✅ Railway — FIRMADO (7 de agosto de 2026)

Era el único que exigía ejecución activa, y el más importante: Railway aloja el
servidor, la base de datos y Redis, es decir trata *todos* los datos personales
del proyecto.

- ✅ Firmado por ambas partes el **2026-08-07** (Docusign Envelope ID
  4CAF1B04-BBF1-44B7-92A8-753CC8296329). Por Railway: Christian Ohrgaard, Head
  of Operations.
- ✅ **Exhibit B completo**: identificados nombre, dirección y contacto del
  exportador de datos, que es lo que da validez a las Cláusulas Contractuales
  Tipo que amparan la transferencia a EE. UU.
- ✅ PDF archivado en `legal/dpa/railway-dpa-firmado.pdf` (fuera de git: el
  documento contiene la dirección postal del titular).

#### ℹ️ Google — probablemente NO necesita DPA

Aquí conviene no firmar por firmar. El *Cloud Data Processing Addendum* de
Google está pensado para cuando Google trata datos **por cuenta tuya** (Google
Cloud Platform, Workspace, Cloud Identity). No es el caso:

En «Continuar con Google» el usuario se autentica **directamente ante Google**,
y Google le pide su consentimiento para compartir contigo el correo, el nombre
y un identificador. Google no actúa como encargado tuyo, sino como
**responsable independiente** de su propia relación con ese usuario. A partir
del momento en que recibes esos datos, el responsable eres tú — y eso ya está
cubierto por tu propia política de privacidad y por el consentimiento del
registro.

- ⬜ Solo si algún día usas Google Cloud para *almacenar* datos (Firestore,
  Cloud Storage, BigQuery…) habría que aceptar su Addendum. Hoy no aplica.
- ✅ El uso actual se rige por los términos de Google Identity Services, ya
  aceptados al crear el Client ID en Google Cloud Console.

### 2. Rotar la contraseña de la base de datos — 10 minutos

Apareció en pantalla durante el desarrollo. Con el puerto público ya cerrado el
riesgo es bajo, pero rotarla es lo correcto.

⚠️ **Cuidado:** las credenciales del backend están **copiadas a mano**, no
enlazadas. Hay que cambiar las dos cosas a la vez o el backend deja de
conectar:

1. Railway → Postgres → *Variables* → regenerar `POSTGRES_PASSWORD`
2. Railway → taya-backend → *Variables* → actualizar `DB_PASSWORD` y `DATABASE_URL` con la nueva
3. Redesplegar el backend y comprobar `/actuator/health`

### 3. Si algún día empiezas a cobrar ⬜

Nada de lo anterior cambia, pero se añade:

- ⬜ Alta como autónomo (RETA) y en Hacienda
- ⬜ Consultar a una gestoría si la actividad de **central de reservas de taxi** requiere autorización (Decreto 74/2012, Reglamento del Servicio de Taxi de Canarias)
- ⬜ Añadir el **NIF** al Aviso Legal
- ⬜ Revisar los Términos con un abogado
- ⬜ Valorar un seguro de responsabilidad civil

---

## Qué revisar cada cierto tiempo

| Cuándo | Qué |
|---|---|
| Al añadir una función que trate datos nuevos | Actualizar el Registro de Actividades y la Política de Privacidad |
| Cada 6-12 meses | Releer los cuatro documentos legales: ¿siguen siendo ciertos? |
| Al cambiar de proveedor | Actualizar la tabla de transferencias internacionales y firmar el nuevo DPA |
| Siempre | Que ninguna política afirme algo que el código no hace |

---

## Aviso

Este material lo ha preparado un asistente técnico a partir del código real del
proyecto. Es un trabajo serio, pero **no es asesoramiento jurídico**. Si la app
pasa a tener uso comercial o un volumen relevante de usuarios, conviene que un
abogado especializado lo revise, en especial la parte de intermediación en el
servicio de taxi, que está regulada.
