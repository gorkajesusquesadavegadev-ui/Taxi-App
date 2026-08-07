# Procedimiento ante una brecha de seguridad

**Artículos 33 y 34 del RGPD**

> Documento **interno**. El objetivo es que, si algún día pasa, no haya que
> improvisar: el reloj de las **72 horas** empieza a correr en cuanto se tiene
> constancia de la brecha, y ese no es momento para ponerse a leer el
> reglamento.

---

## Qué cuenta como brecha

Cualquier incidente que provoque **destrucción, pérdida, alteración, acceso o
divulgación no autorizados** de datos personales. Por ejemplo:

- Alguien accede a la base de datos sin autorización
- Se filtra una credencial (contraseña de la base de datos, `JWT_SECRET`, claves de un proveedor)
- Un fallo de la aplicación deja ver datos de un usuario a otro
- Pérdida irreversible de datos sin copia de seguridad
- Un proveedor (Railway, Vercel, Google) comunica un incidente que nos afecta

**No es brecha** una caída del servicio sin acceso a datos, ni un error que
solo afecta a datos ya anonimizados.

---

## Paso 1 — Contener (primeros minutos)

1. **Cortar el acceso.** Según el caso:
   - Credencial filtrada → rotarla de inmediato en Railway y actualizar las variables del backend
   - Acceso indebido a la base de datos → verificar en Railway que el *Public Networking / TCP Proxy* del servicio Postgres sigue **desactivado**
   - Fallo en la aplicación → desplegar el arreglo o revertir al despliegue anterior
2. **Revocar sesiones** si hay sospecha de tokens comprometidos (cambiar `JWT_SECRET` invalida todas las sesiones activas).
3. **No borrar registros.** Los logs son la prueba de qué pasó y hasta dónde llegó.

## Paso 2 — Evaluar (mismo día)

Anotar por escrito, aunque sea en un correo a uno mismo con fecha:

- **Qué ocurrió** y cómo se detectó
- **Cuándo** empezó y cuándo se detectó *(aquí arranca el plazo de 72 h)*
- **Qué datos** se vieron afectados: ¿solo correos? ¿teléfonos? ¿ubicaciones? ¿contraseñas?
- **Cuántas personas** afectadas, aproximadamente
- **Consecuencias probables** para esas personas
- **Qué se ha hecho** para contenerlo

## Paso 3 — ¿Hay que notificar a la AEPD?

**Sí, salvo que sea improbable que suponga un riesgo para los derechos de las personas** (art. 33.1).

En la práctica, **notificar** si se han visto afectados datos identificativos
(nombre, correo, teléfono), ubicaciones o credenciales.

**No haría falta** si, por ejemplo, solo se vieron datos ya anonimizados o
cifrados de forma que sigan siendo inaccesibles.

> Ante la duda, **notificar**. Notificar de más no se sanciona; no notificar, sí.

**Cómo:** sede electrónica de la AEPD → *«Notificación de brechas de seguridad»*
→ https://sedeagpd.gob.es
**Plazo:** 72 horas desde que se tuvo constancia. Si se pasa, se notifica igual
**indicando el motivo del retraso** (art. 33.1).

## Paso 4 — ¿Hay que avisar a los usuarios?

**Sí si el riesgo es alto** para sus derechos y libertades (art. 34): por
ejemplo, si se han filtrado contraseñas, teléfonos o historiales de ubicación.

El aviso debe ser **en lenguaje claro** y contener:
- Qué ha pasado, en términos comprensibles
- Qué datos suyos están afectados
- Qué consecuencias puede tener para ellos
- Qué se ha hecho para resolverlo
- **Qué deberían hacer ellos** (por ejemplo, cambiar la contraseña)
- Un correo de contacto: gorkajesusquesadavegadev@gmail.com

Se envía por correo electrónico a los afectados.

## Paso 5 — Documentar (siempre)

**Aunque no haya que notificar a nadie**, el art. 33.5 obliga a dejar
constancia interna de toda brecha: qué pasó, sus efectos y qué medidas se
tomaron. Ese registro es lo que la AEPD pedirá si algún día pregunta.

Guardar cada incidente en `legal/brechas/AAAA-MM-DD-descripcion.md`.

---

## Contactos

| | |
|---|---|
| **Responsable** | Gorka Jesús Quesada Vega — gorkajesusquesadavegadev@gmail.com |
| **AEPD** | https://sedeagpd.gob.es · 901 100 099 |
| **Soporte Railway** | https://railway.app/help |
| **Soporte Vercel** | https://vercel.com/help |

---

## Registro de brechas

| Fecha | Descripción | ¿Notificada a AEPD? | ¿Notificada a usuarios? | Estado |
|---|---|---|---|---|
| — | *Ninguna hasta la fecha* | — | — | — |
