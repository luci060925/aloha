# Auditoría de Seguridad — Aloha Indumentaria

> Auditoría de seguridad de aplicación (AppSec) de punta a punta.
> **Fecha de detección:** 2026-09-29 · **Auditor:** Claude (rol de auditor senior AppSec) · **Versión auditada:** commit `8a36fa3`

---

## Resumen ejecutivo

Aloha es una aplicación de una sola página (React + Vite) **sin servidor propio**: el navegador habla directamente con Supabase (PostgreSQL, Auth y Storage) usando la clave pública. Por eso la seguridad real está en las **políticas RLS, funciones y disparadores de la base**, no en el código del navegador.

Una auditoría anterior (documentada en [`docs/auditoria.md`](./docs/auditoria.md)) ya eliminó los problemas críticos: contraseña de administradora en el código, `/admin` sin barrera, ingreso sin contraseña, políticas RLS abiertas y escalado a administradora. **Esta auditoría verificó que esos controles siguen funcionando** y buscó lo que quedaba.

**Resultado:** no se encontraron vulnerabilidades *Critical* ni *High*. Se confirmaron **13 hallazgos**: 4 de severidad *Medium*, 5 *Low* y 4 *Informational*/hardening. Los más relevantes están todos en la **capa de datos** y se reprodujeron de forma segura en una copia local de PostgreSQL que carga los mismos scripts SQL del proyecto:

- Un usuario con cuenta normal puede registrar pedidos con **precio $1, cantidades negativas o 100 % de descuento** (SEC-001), **agotar cupones** ajenos (SEC-002) y **suplantar el correo** de otra persona en su perfil, impidiéndole registrarse (SEC-003).
- El sitio no tiene **CSP** (política de contenido) ni HSTS (SEC-007), lo que quita una capa de defensa ante un eventual XSS, ya que la sesión vive en `localStorage`.

**Resultado de la remediación:** 9 hallazgos quedaron 🟢 corregidos y verificados (SEC-006, 007, 008, 009, 010 y 013, más SEC-012 en el sitio); SEC-006 quedó además 🟢 **verificado en producción**; 4 (SEC-001, 002, 003 y 004) tienen la corrección **aplicada en Supabase (`supabase/hardening_seguridad.sql`) y probada localmente, a la espera de una prueba real con un pedido de clienta**, y 3 requieren una **decisión manual** (SEC-005, SEC-011 y la parte de configuración de SEC-012). Las correcciones de la base se probaron en una copia local de PostgreSQL: contra el estado anterior **20 de 31 pruebas fallan** (detectan las vulnerabilidades) y con el endurecimiento **las 31 pasan**.

**Lo que está bien:** no hay sinks de XSS (`dangerouslySetInnerHTML`, `innerHTML`, `eval`); React 19 bloquea URLs `javascript:`; no hay secretos en el código, en el bundle ni en los 7 commits del historial; las dependencias no tienen vulnerabilidades conocidas (`npm audit`: 0); no hay source maps; los visitantes solo pueden leer datos públicos; OpenAPI y GraphQL de Supabase están cerrados; la verificación de correo está activa.

---

## Alcance

**Dentro del alcance**
- Código fuente completo (`src/`, `index.html`, `public/`, configuración de Vite/TS/lint).
- Scripts SQL (`supabase/`): esquema, RLS, funciones, disparadores, bucket de fotos.
- Proyecto Supabase propio (`aloha`), por **lecturas anónimas** con la clave pública: configuración de Auth, tablas, RPC, Storage.
- Historial de git (7 commits), `.env`, `.gitignore`, `dist/` (bundle publicable), dependencias.
- Servidor local de desarrollo.

**Fuera del alcance:** infraestructura de Cloudflare y Google Cloud (aún no desplegado), paneles de Supabase no accesibles por API, servicios de terceros.

## Metodología

OWASP Top 10 (2021), OWASP ASVS, OWASP WSTG, OWASP API Security Top 10 (2023), CWE, CVSS v3.1, Secure by Design, mínimo privilegio y defensa en profundidad.

Fases: (1) inventario y mapa de ataque; (2) revisión de código con análisis contextual; (3) revisión de la "API" (PostgREST/RLS/RPC de Supabase); (4) frontend; (5) dependencias; (6) secretos e historial; (7) cabeceras; (8) lógica de negocio; (9) exposición de información; (10) **pruebas dinámicas**:
- lecturas anónimas contra el Supabase real (sin escrituras);
- **reproducción de ataques en una base local descartable** (PGlite = PostgreSQL real) que carga `database_schema.sql`, `rls_policies.sql` y `cupones.sql`, con roles `anon`/`authenticated` y `auth.uid()` simulados. Las pruebas que escriben datos **solo se hicieron ahí, nunca en producción**.

Los valores de CVSS son **estimaciones** calculadas con el vector indicado; los cambios de severidad por contexto se explican en cada hallazgo. Donde un puntaje no aplica (mejoras de hardening) se indica "N/A".

## Arquitectura analizada

| Elemento | Detalle |
|---|---|
| Frontend | React 19, TypeScript estricto, Tailwind 4, Vite 8 (SPA) |
| Backend | No hay servidor propio. Supabase: PostgREST (API de tablas), funciones SQL (`is_admin`, `get_coupon`), disparadores |
| Base de datos | PostgreSQL 17 (Supabase), 7 tablas con RLS activo |
| Autenticación | Supabase Auth: correo + contraseña, Google OAuth; verificación de correo activa; flujo *implicit*; token en `localStorage` |
| Autorización | RLS por rol: visitante / clienta / administradora (`profiles.is_admin`, solo editable desde el panel de Supabase) |
| Storage | Bucket público `catalog-images` (solo WebP/JPEG/PNG, 1 MB); escritura solo administradora |
| Servicios externos | Google (OAuth y fuentes), WhatsApp (`wa.me`), Google Maps (enlace) |
| Correo | SMTP por defecto de Supabase (límite bajo) |
| Despliegue | Cloudflare Pages (pendiente); `public/_headers` y `_redirects` |
| CI/CD, Docker | No existen |
| Pagos | No hay: el cobro es manual por WhatsApp |

**Mapa de ataque (superficie)**
1. Escrituras autenticadas de una clienta: `orders` (INSERT), `profiles` (INSERT/UPDATE) → SEC-001/002/003/004.
2. RPC `get_coupon` sin sesión → SEC-006.
3. Registro y recuperación de contraseña abiertos a cualquiera → SEC-005.
4. Sesión en `localStorage` + ausencia de CSP → SEC-007/008.
5. Datos controlados por usuarios/administradora que se renderizan (URLs de avatar y redes) → SEC-009.

---

## Resumen de hallazgos

| ID | Vulnerabilidad | Severidad | CVSS | OWASP | CWE | Componente | Estado |
| -- | -------------- | --------- | ---- | ----- | --- | ---------- | ------ |
| SEC-001 | Pedidos: precios, cantidades, totales y descuentos no se validan en el servidor | Medium | 6.5 | A04:2021 · API6:2023 | CWE-602 | `orders` (RLS/BD), checkout | 🟡 En corrección |
| SEC-002 | Cupones: el contador de usos se puede agotar/manipular; sin validar vigencia ni cupo al usar | Medium | 5.4 | A04:2021 · API6:2023 | CWE-841 | disparador `count_coupon_use` | 🟡 En corrección |
| SEC-003 | Perfiles: la clienta controla su columna `email` (suplantación y bloqueo del alta de otra persona) | Medium | 5.4 | A01:2021 · API3:2023 | CWE-915 | `profiles` (RLS/BD) | 🟡 En corrección |
| SEC-004 | Sin límite de frecuencia ni de tamaño en pedidos y perfiles | Low | 4.3 | A04:2021 · API4:2023 | CWE-770 | `orders`, `profiles` | 🟡 En corrección |
| SEC-005 | Cuota de correos de Supabase agotable por cualquiera (registro y recuperación sin CAPTCHA, SMTP por defecto) | Medium | 5.3 | A04:2021 · API4:2023 | CWE-799 | Auth / configuración | ⚪ Requiere decisión |
| SEC-006 | `get_coupon` ejecutable sin sesión: fuerza bruta de códigos | Low | 3.7 | A07:2021 · API4:2023 | CWE-307 | función `get_coupon` | 🟢 Corregido |
| SEC-007 | Sin Content-Security-Policy ni HSTS | Low | N/A (hardening) | A05:2021 | CWE-693 | `public/_headers`, `index.html` | 🟢 Corregido |
| SEC-008 | Datos personales del perfil persistidos en `localStorage` | Low | N/A (hardening) | A02:2021 | CWE-922 | `StoreContext.tsx` | 🟢 Corregido |
| SEC-009 | URLs controladas por usuarios/administradora sin validar el esquema (avatar en el panel, enlaces a redes) | Low | 3.5 | A03:2021 | CWE-20 | `AdminPage`, `Header`, `Footer`, `InfoModal` | 🟢 Corregido |
| SEC-010 | `window.open` a sitios externos sin `noopener` | Informational | N/A | A05:2021 | CWE-1022 | varios componentes | 🟢 Corregido |
| SEC-011 | Flujo OAuth *implicit* (tokens en el fragmento de la URL) en vez de PKCE | Informational | N/A | A07:2021 | CWE-522 | `src/lib/supabase.ts` | ⚪ Requiere decisión |
| SEC-012 | Política de contraseñas débil (mínimo 6, sin control de contraseñas filtradas) | Low | N/A (hardening) | A07:2021 | CWE-521 | registro / recuperación | 🟢 Corregido (sitio) · ⚪ Supabase |
| SEC-013 | Sin CI, sin análisis automático de dependencias ni pruebas automatizadas | Informational | N/A | A06:2021 | CWE-1104 | repositorio | 🟢 Corregido |

Prioridad de corrección: SEC-001 → 002 → 003 → 005 → 004 → 006 → 007 → 009 → 012 → 008 → 010 → 013 → 011.

---

## Detalle de cada vulnerabilidad

### SEC-001 — Pedidos: precios, cantidades, totales y descuentos no se validan en el servidor

**Severidad:** Medium (con impacto de negocio alto) · **CVSS:** 6.5 — `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`
**OWASP:** A04:2021 Insecure Design · API6:2023 Unrestricted Access to Sensitive Business Flows
**CWE:** CWE-602 (aplicación de reglas solo en el cliente)
**Componente:** tabla `orders` (política y disparadores), checkout de la tienda
**Archivo:** `supabase/rls_policies.sql` · **Línea:** 116–121 (`orders_insert`); cliente: `src/context/StoreContext.tsx` 707–731 (cálculo de descuentos) y 926 (insert)

**Descripción:** la política `orders_insert` solo exige sesión, `user_id = auth.uid()` y estado inicial. El **total, subtotal, descuento, precios unitarios y cantidades los calcula el navegador** y la base los acepta tal cual. Cualquier cuenta puede llamar a la API directamente y registrar un pedido con los valores que quiera.

**Evidencia (reproducción local, datos ficticios):**
- `A1` pedido con precio unitario $1 para una prenda de $50.000 → **PERMITIDO**.
- `A2` pedido con cantidad −3 y total negativo → **PERMITIDO**.
- `A2b` descuento del 100 % sin cupón (total $0) → **PERMITIDO**.
- `A2c` cupón inexistente con 50 % de descuento → **PERMITIDO**.

**Impacto:** el panel de la dueña muestra pedidos con montos falsos (métricas de ventas adulteradas) y el mensaje de WhatsApp puede llevar un precio que no corresponde. Como el cobro es manual, no hay pérdida automática, pero se confunde a la dueña, se ensucian los datos y se abre la puerta a fraude por engaño.

**Precondiciones:** cuenta registrada (correo confirmado o Google).

**Reproducción segura:** en la base local, `insert into orders … items='[{"price":1,…}]', total=1` como usuaria `authenticated` (ver `tests/db/`). **No** ejecutar contra producción.

**Remediación recomendada:** disparador `BEFORE INSERT` en `orders` que valide en la base: prendas existentes, en stock y con el **precio vigente**; cantidades enteras 1–50; subtotal = Σ precio × cantidad; total = subtotal − descuento; y que el descuento **no supere el máximo legítimo** (cupón válido, volumen, monto o descuento global). En el cliente, tomar los precios del catálogo vigente y no de una bolsa guardada.

**Estado:** 🟡 En corrección · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** —

**Situación:** Corregido y probado en el repositorio (45 pruebas) y `supabase/hardening_seguridad.sql` **aplicado en Supabase** el 2026-09-29. La aplicación se comprobó de forma indirecta (el primer cambio del script, la revocación de `get_coupon`, está en efecto y el script no tiene transacciones propias, por lo que se aplica entero o nada). **Pendiente:** confirmar el comportamiento real con un pedido de prueba de una cuenta de clienta (uno sin cupón y otro con cupón) y con el intento de un precio adulterado; hasta entonces no se marca 🟢.

**Corrección aplicada:** Disparador `validate_order` (BEFORE INSERT en `orders`): valida prendas existentes y en stock, precio vigente, cantidades enteras 1–50, subtotal, total y que el descuento no supere el máximo legítimo (cupón, volumen, monto o global). En el sitio, la bolsa usa siempre el precio y stock vigentes (`src/lib/pricing.ts`, `syncCartWithCatalog`) y el checkout avisa si el pedido no quedó registrado.

**Test / verificación:** `tests/db/seguridad.test.ts` (SEC-001, 10 pruebas) y `tests/unit/lib.test.ts` (pricing).

---

### SEC-002 — Cupones: contador de usos manipulable y sin validación al usarlos

**Severidad:** Medium · **CVSS:** 5.4 — `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:L`
**OWASP:** A04:2021 · API6:2023 · **CWE:** CWE-841 (aplicación incorrecta del flujo de negocio)
**Componente:** disparador `count_coupon_use` y política `orders_insert`
**Archivo:** `supabase/cupones.sql` · **Línea:** 9–30

**Descripción:** el disparador suma 1 a `used_count` por cada pedido cuyo `coupon_code` coincida, **sin comprobar que el cupón esté activo, vigente ni con cupo**, y sin bloqueo de concurrencia. La clienta elige libremente `coupon_code` al insertar.

**Evidencia (reproducción local):** `A3` una cuenta creó 5 pedidos con el código `ALOHA10` (cupo de 2) → `used_count = 5 / max_uses = 2`: el cupón queda **agotado para todas las demás clientas**. El cupo tampoco se respeta en pedidos simultáneos (condición de carrera).

**Impacto:** denegación de una promoción (agotar un cupón ajeno) y desvío de las estadísticas de uso. También permite consumir cupos sin haberlos ganado.

**Precondiciones:** cuenta registrada y conocer (o adivinar, ver SEC-006) el código.

**Reproducción segura:** en la base local, insertar varios pedidos con el mismo código y leer `used_count`.

**Remediación recomendada:** validar el cupón dentro del mismo disparador de SEC-001, con `SELECT … FOR UPDATE` sobre la fila del cupón: activo, no vencido, `used_count < max_uses`, y aplicable a la categoría. El descuento debe corresponder al cupón real. Cada pedido válido cuenta una vez.

**Estado:** 🟡 En corrección · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** —

**Situación:** Corregido y probado en el repositorio (45 pruebas) y `supabase/hardening_seguridad.sql` **aplicado en Supabase** el 2026-09-29. La aplicación se comprobó de forma indirecta (el primer cambio del script, la revocación de `get_coupon`, está en efecto y el script no tiene transacciones propias, por lo que se aplica entero o nada). **Pendiente:** confirmar el comportamiento real con un pedido de prueba de una cuenta de clienta (uno sin cupón y otro con cupón) y con el intento de un precio adulterado; hasta entonces no se marca 🟢.

**Corrección aplicada:** El mismo disparador exige un cupón real, activo, vigente y con cupo, con `SELECT … FOR UPDATE` sobre la fila (serializa pedidos simultáneos). `count_coupon_use` solo cuenta cuando el pedido realmente descuenta.

**Test / verificación:** `tests/db/seguridad.test.ts` (SEC-002, 5 pruebas: cupón inexistente/vencido, descuento mayor, cupo respetado, cupón por categoría).

---

### SEC-003 — Perfiles: la clienta controla su columna `email`

**Severidad:** Medium · **CVSS:** 5.4 — `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:L`
**OWASP:** A01:2021 Broken Access Control · API3:2023 Broken Object Property Level Authorization
**CWE:** CWE-915 (modificación de atributos no controlada)
**Componente:** tabla `profiles`
**Archivo:** `supabase/rls_policies.sql` · **Línea:** 103–113 (`profiles_insert`, `profiles_update`)

**Descripción:** las políticas validan **quién** puede escribir y que no se otorgue `is_admin`, pero no restringen **qué columnas** cambian. `profiles.email` es único y la clienta puede fijarlo a cualquier valor, sin relación con el correo real de su cuenta.

**Evidencia (reproducción local):**
- `A5a` una clienta cambia el email de su perfil al de otra persona → **PERMITIDO**.
- `A5b` cuando la persona real intenta crear su perfil → **falla** con `duplicate key … profiles_email_key`: queda sin perfil, y como `orders.user_id` referencia a `profiles`, **no puede registrar pedidos**.

**Impacto:** bloqueo del alta de una persona concreta (denegación dirigida) y suplantación visual de correos en el listado de clientas de la administradora. No hay escalada de privilegios: la identidad se resuelve por `id`, no por correo.

**Precondiciones:** cuenta registrada.

**Reproducción segura:** ver `A5a`/`A5b` en `tests/db/`.

**Remediación recomendada:** disparador `BEFORE INSERT OR UPDATE` que fije `email` desde `auth.users`, congele `id`, `created_at` e `is_admin` para quien no sea administradora (defensa en profundidad para `is_admin`).

**Estado:** 🟡 En corrección · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** —

**Situación:** Corregido y probado en el repositorio (45 pruebas) y `supabase/hardening_seguridad.sql` **aplicado en Supabase** el 2026-09-29. La aplicación se comprobó de forma indirecta (el primer cambio del script, la revocación de `get_coupon`, está en efecto y el script no tiene transacciones propias, por lo que se aplica entero o nada). **Pendiente:** confirmar el comportamiento real con un pedido de prueba de una cuenta de clienta (uno sin cupón y otro con cupón) y con el intento de un precio adulterado; hasta entonces no se marca 🟢.

**Corrección aplicada:** Disparador `protect_profile_columns`: el email sale siempre de `auth.users`, `id` y `created_at` no cambian y `is_admin` solo lo modifica una administradora o el panel de Supabase (sin sesión de usuaria).

**Test / verificación:** `tests/db/seguridad.test.ts` (SEC-003, 7 pruebas, incluida la de la víctima que puede registrarse).

---

### SEC-004 — Sin límite de frecuencia ni de tamaño en pedidos y perfiles

**Severidad:** Low · **CVSS:** 4.3 — `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L`
**OWASP:** A04:2021 · API4:2023 Unrestricted Resource Consumption · **CWE:** CWE-770
**Componente:** `orders`, `profiles`
**Archivo:** `supabase/rls_policies.sql` · **Línea:** 116 y 103; columnas de texto/JSON sin tope en `supabase/database_schema.sql`

**Descripción:** no hay límite de pedidos por usuaria ni de tamaño para `items`, `whatsapp_message`, `full_name`, `phone`, etc.

**Evidencia (reproducción local):** `A4` **300 de 300** pedidos consecutivos aceptados desde una sola cuenta.

**Impacto:** inundación del panel de pedidos de la dueña y consumo de almacenamiento (el plan gratuito es limitado).

**Precondiciones:** cuenta registrada.

**Remediación recomendada:** tope de pedidos por usuaria y hora; restricciones `CHECK` de longitud y de estructura JSON.

**Estado:** 🟡 En corrección · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** —

**Situación:** Corregido y probado en el repositorio (45 pruebas) y `supabase/hardening_seguridad.sql` **aplicado en Supabase** el 2026-09-29. La aplicación se comprobó de forma indirecta (el primer cambio del script, la revocación de `get_coupon`, está en efecto y el script no tiene transacciones propias, por lo que se aplica entero o nada). **Pendiente:** confirmar el comportamiento real con un pedido de prueba de una cuenta de clienta (uno sin cupón y otro con cupón) y con el intento de un precio adulterado; hasta entonces no se marca 🟢.

**Corrección aplicada:** Tope de 10 pedidos por usuaria y hora dentro de `validate_order`, y restricciones `CHECK` (`orders_limits_chk`, `profiles_limits_chk`) de longitud, formato de identificador y estructura JSON.

**Test / verificación:** `tests/db/seguridad.test.ts` (SEC-004, 2 pruebas).

---

### SEC-005 — Cuota de correos de Supabase agotable por cualquiera

**Severidad:** Medium · **CVSS:** 5.3 — `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L`
**OWASP:** A04:2021 · API4:2023 · **CWE:** CWE-799 (control insuficiente de la frecuencia de interacción)
**Componente:** Supabase Auth (registro y recuperación de contraseña)
**Archivo:** `src/context/StoreContext.tsx` · **Línea:** 1393 (`resetPasswordForEmail`) y registro ~1260

**Descripción:** registro y recuperación de contraseña son públicos y sin CAPTCHA. El envío de correos por defecto de Supabase tiene una **cuota global muy baja por hora**. Un tercero puede consumirla con pedidos de recuperación o registros con correos ajenos.

**Evidencia:** `GET /auth/v1/settings` confirma registro abierto (`disable_signup: false`) y proveedor de correo activo. El límite por defecto es una característica documentada de Supabase (no medible sin agotarlo, por eso no se probó).

**Impacto:** clientas legítimas no reciben el correo de confirmación ni de recuperación; además, se puede molestar a terceros con correos no solicitados (1 por minuto por dirección).

**Precondiciones:** ninguna (anónimo).

**Remediación recomendada:** SMTP propio (Resend/Brevo) con cuota alta y **CAPTCHA (Cloudflare Turnstile)** en Supabase → Authentication → Bot and Abuse Protection; requiere cuentas y claves externas, por lo que necesita decisión de la dueña.

**Estado:** ⚪ Requiere decisión · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** —

**Situación:** No corregible solo con código: requiere **SMTP propio** (Resend/Brevo) y **CAPTCHA** (Cloudflare Turnstile) en Supabase → Authentication, con cuentas y claves externas. Ver `docs/pendientes.md` (ítem 6).

---

### SEC-006 — `get_coupon` ejecutable sin sesión

**Severidad:** Low · **CVSS:** 3.7 — `AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N`
**OWASP:** A07:2021 · API4:2023 · **CWE:** CWE-307 (intentos excesivos sin restricción)
**Componente:** función `public.get_coupon(text)`
**Archivo:** `supabase/rls_policies.sql` · **Línea:** 56 (`grant execute … to anon, authenticated`)

**Descripción:** cualquier visitante puede probar códigos sin sesión y sin límite.

**Evidencia:** `A6` un visitante obtiene el cupón `ALOHA10` con `select * from get_coupon('ALOHA10')`; en producción `rpc('get_coupon')` responde 200 a la clave pública.

**Impacto:** adivinar códigos por diccionario (los códigos suelen ser palabras + número) y aprovechar promociones no destinadas a esa persona.

**Precondiciones:** ninguna; se necesita adivinar el código.

**Remediación recomendada:** exigir sesión (`revoke … from anon`), ya que comprar requiere cuenta. Con SEC-002/005 se limita el abuso restante.

**Estado:** 🟢 Corregido · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** Aplicado y **verificado en producción** el 2026-09-29: un visitante sin sesión, con la clave pública, recibe `permission denied for function get_coupon` (código 42501); antes respondía 200 con el cupón.

**Corrección aplicada:** `revoke execute on function get_coupon … from anon`: solo cuentas con sesión pueden validar cupones (comprar ya exige cuenta).

**Test / verificación:** `tests/db/seguridad.test.ts` (SEC-006, 2 pruebas).

---

### SEC-007 — Sin Content-Security-Policy ni HSTS

**Severidad:** Low · **CVSS:** N/A (mejora de hardening) · **OWASP:** A05:2021 Security Misconfiguration · **CWE:** CWE-693
**Componente:** cabeceras del sitio · **Archivo:** `public/_headers` · **Línea:** 1–8

**Descripción:** `_headers` define `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`, pero **no CSP ni HSTS**. La sesión de Supabase se guarda en `localStorage`, por lo que un XSS futuro (hoy no hay ninguno) permitiría robarla; una CSP reduce ese riesgo.

**Evidencia:** contenido de `public/_headers`; no hay `<meta http-equiv="Content-Security-Policy">` en `index.html`.

**Impacto:** menos defensa en profundidad; no es explotable por sí sola.

**Remediación recomendada:** CSP restrictiva (`default-src 'self'`, conexiones solo a Supabase, imágenes de Supabase/Google, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`) + `Strict-Transport-Security`. Verificar que no rompa la app.

**Estado:** 🟢 Corregido · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** Verificado con un servidor local que aplica `public/_headers` tal cual; **volver a comprobar al desplegar en Cloudflare**.

**Corrección aplicada:** `public/_headers`: `Content-Security-Policy` (solo `self` + Supabase, Google Fonts, imágenes de Supabase/Google/Unsplash; sin `unsafe-inline` en scripts; `frame-ancestors none`, `object-src none`, `base-uri self`) y `Strict-Transport-Security`.

**Test / verificación:** Prueba manual: el sitio carga completo bajo la política (portada, menú con datos de Supabase, fuentes, ingreso con Google) y **se bloquean** un script inyectado y una conexión a `example.org`.

---

### SEC-008 — Perfil de la clienta persistido en `localStorage`

**Severidad:** Low · **CVSS:** N/A (hardening) · **OWASP:** A02:2021 · **CWE:** CWE-922
**Archivo:** `src/context/StoreContext.tsx` · **Línea:** 438

**Descripción:** mientras hay sesión, el objeto del usuario (nombre, teléfono, dirección) se guarda en `localStorage` aunque la sesión real ya la conserva Supabase.

**Impacto:** exposición innecesaria de datos personales ante acceso al equipo o ante un XSS.

**Remediación recomendada:** persistir solo en modo demostración (sin Supabase).

**Estado:** 🟢 Corregido · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** Verificado en el navegador: tras cargar, no quedan `aloha_current_user_v3`, `aloha_orders_v3`, `aloha_users_v3` ni `aloha_coupons_v3`.

**Corrección aplicada:** Con Supabase el perfil ya no se copia a `localStorage` (solo en modo demostración) y se descartan los restos de versiones anteriores. Se agregó `authReady` para que `/admin` no parpadee en "Acceso restringido" mientras se verifica la sesión.

**Test / verificación:** Prueba manual de re-auditoría (perfil falso con `isAdmin` guardado a mano: no da acceso).

---

### SEC-009 — URLs sin validar el esquema (avatar en el panel y enlaces a redes)

**Severidad:** Low · **CVSS:** 3.5 — `AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:N/A:N` (avatar)
**OWASP:** A03:2021 · **CWE:** CWE-20
**Archivo:** `src/components/admin/AdminPage.tsx` 1801 (avatar); `Header.tsx` 377/405/420; `Footer.tsx` 106/133/147; `InfoModal.tsx` 535

**Descripción:** `profiles.avatar_url` es editable por la clienta (vía API) y se dibuja como `<img src>` en el panel de la administradora: al abrir el listado, su navegador consulta una URL elegida por un tercero (filtra su IP y confirma la visita). Los enlaces a redes (editables solo por la administradora) se usan en `href` sin validar el esquema; **React 19 bloquea `javascript:`** (verificado en el bundle), por lo que no es explotable como XSS, pero sigue faltando validación.

**Impacto:** seguimiento (tracking pixel) de la administradora; sin ejecución de código.

**Precondiciones:** cuenta registrada (avatar); administradora comprometida o descuidada (enlaces).

**Remediación recomendada:** función `safeUrl` que solo acepte `http(s)`, usada al renderizar y al guardar los ajustes; restricción de formato `https://` para `avatar_url` en la base.

**Estado:** 🟢 Corregido · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** El sitio solo dibuja avatares de Google; los enlaces a redes se validan al guardar y al mostrarse. La restricción equivalente en la base (`profiles_limits_chk`) se suma con `hardening_seguridad.sql`.

**Corrección aplicada:** `src/lib/external.ts` (`isHttpUrl`, `safeUrl`, `isTrustedAvatarUrl`) aplicado en `Header`, `Footer`, `InfoModal`, `CustomerProfileModal` y `AdminPage` (que además rechaza al guardar enlaces que no sean http(s)).

**Test / verificación:** `tests/unit/lib.test.ts` (URLs) y `tests/db/seguridad.test.ts` (SEC-009).

---

### SEC-010 — `window.open` a sitios externos sin `noopener`

**Severidad:** Informational · **CVSS:** N/A · **OWASP:** A05:2021 · **CWE:** CWE-1022
**Archivo:** `App.tsx:27`, `CartDrawer.tsx:610`, `Footer.tsx:122`, `InfoModal.tsx:25,302`, `StoreLocationModal.tsx:12,18`, `StoreLocationSection.tsx:10,16`, `StoreContext.tsx:921`

**Descripción:** se abren `wa.me` y Google Maps con `window.open(url, '_blank')`, sin `noopener`. Los destinos son de confianza, por lo que el riesgo real es mínimo.

**Remediación recomendada:** helper `openExternal` con `noopener,noreferrer`.

**Estado:** 🟢 Corregido · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** Todas las aperturas externas usan `openExternal` (`noopener,noreferrer`); ya no queda ningún `window.open` suelto.

**Corrección aplicada:** `src/lib/external.ts` → `openExternal`, aplicado en 8 archivos.

**Test / verificación:** Búsqueda de código: 0 usos de `window.open` fuera del helper.

---

### SEC-011 — Flujo OAuth *implicit* en lugar de PKCE

**Severidad:** Informational · **CVSS:** N/A · **OWASP:** A07:2021 · **CWE:** CWE-522
**Archivo:** `src/lib/supabase.ts` · **Línea:** 19–21 (`createClient` sin `flowType`; el bundle confirma el valor por defecto `implicit`)

**Descripción:** los tokens de sesión llegan en el fragmento de la URL al volver de Google o del correo. PKCE es la práctica recomendada, pero **rompe los enlaces de recuperación abiertos en otro navegador/dispositivo** (caso muy común: se pide en la PC y se abre desde el celular), y el sitio detecta la recuperación por `type=recovery`.

**Decisión pendiente:** mantener *implicit* por usabilidad (riesgo aceptado, mitigado por la limpieza inmediata de la URL) o migrar a PKCE aceptando esa limitación.

**Estado:** ⚪ Requiere decisión · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** —

**Situación:** Se mantiene *implicit* por usabilidad (los enlaces de recuperación funcionan al abrirse en otro dispositivo); riesgo mitigado por la limpieza inmediata de la URL y por la nueva CSP. Migrar a PKCE es posible si se acepta esa limitación.

---

### SEC-012 — Política de contraseñas débil

**Severidad:** Low · **CVSS:** N/A (hardening) · **OWASP:** A07:2021 · **CWE:** CWE-521
**Archivo:** `src/context/StoreContext.tsx` · **Línea:** 1260 y 1406 (mínimo 6 caracteres)

**Descripción:** mínimo de 6 caracteres; en Supabase está desactivada la protección contra contraseñas filtradas (aviso del *advisor*).

**Remediación recomendada:** mínimo 8 en el sitio; en Supabase, exigir 8+ y activar *Leaked password protection* (requiere plan compatible); recomendar MFA para la cuenta de administradora.

**Estado:** 🟢 Corregido (sitio) · ⚪ ajuste pendiente en Supabase · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** El sitio exige 8 caracteres en registro y recuperación (`src/lib/constants.ts`). En Supabase falta **exigir 8+ y activar "Leaked password protection"** (según el plan) y **MFA para la administradora**.

**Corrección aplicada:** `MIN_PASSWORD_LENGTH = 8` usado por `registerUser`, `updatePassword`, `AuthModal` y `PasswordRecoveryModal`.

**Test / verificación:** `tests/unit/lib.test.ts`.

---

### SEC-013 — Sin CI, análisis de dependencias ni pruebas automatizadas

**Severidad:** Informational · **CVSS:** N/A · **OWASP:** A06:2021 · **CWE:** CWE-1104
**Componente:** repositorio (no existe `.github/`, ni script `test`)

**Descripción:** nada verifica automáticamente compilación, lint, dependencias vulnerables ni las reglas de seguridad de la base. Una regresión en RLS podría pasar inadvertida.

**Remediación recomendada:** pruebas automatizadas (unitarias y de base con PGlite), flujo de CI con `npm audit` y Dependabot.

**Estado:** 🟢 Corregido · **Fecha de detección:** 2026-09-29 · **Fecha de corrección:** 2026-09-29

**Situación:** Verificado localmente: lint, 45 pruebas, compilación y `npm audit --omit=dev` sin hallazgos. El flujo de CI se activa al subir estos archivos a GitHub.

**Corrección aplicada:** `.github/workflows/ci.yml` (lint, pruebas, compilación con TS estricto y auditoría de dependencias), `.github/dependabot.yml`, script `npm test` y baterías `tests/unit` y `tests/db`.

**Test / verificación:** `npm test`: 45 pruebas.

---

## Riesgos no explotables / sospechas

Elementos que **no** son vulnerabilidades confirmadas:

| Sospecha | Conclusión |
|---|---|
| XSS por `dangerouslySetInnerHTML` / `innerHTML` / `eval` | **Falso positivo:** ningún uso en el código. |
| Ejecución de `javascript:` en enlaces de redes | **Mitigado por React 19** (bloquea esas URLs, verificado en el bundle); queda solo el hardening de SEC-009. |
| Clave `sb_secret` en el bundle | **Falso positivo:** es una comprobación de prefijo dentro de `supabase-js`. La única clave presente es la **publicable**, pensada para ser pública. |
| Inyección SQL | **No aplicable:** no hay SQL armado por el cliente; PostgREST parametriza y `get_coupon` no usa SQL dinámico. |
| CSRF | **No aplicable:** la autenticación va en cabecera `Authorization` (no en cookies). |
| Enumeración de usuarios en el registro | **No confirmada:** con verificación de correo activa, Supabase responde igual para correos existentes; el mensaje "Ya existe una cuenta" no se alcanza en ese modo. En el ingreso los errores son genéricos. |
| Secretos en el historial de git | **Ninguno** en los 7 commits (búsqueda de claves, JWT, `service_role`, secretos de Google, tokens de GitHub). |
| Exposición de esquema (OpenAPI/GraphQL) | **Cerrada:** OpenAPI responde 401 a la clave pública y `pg_graphql` no está habilitado. |
| Source maps | **No se publican** (0 archivos `.map` en `dist/`). |
| Listado del bucket de fotos | **Bloqueado** para visitantes (0 entradas) y la subida anónima falla. |

Sospechas **sin evidencia suficiente** (dependen de configuración que no pude leer):
- Caducidad y rotación del JWT (Supabase por defecto: 1 h con renovación).
- Lista de *Redirect URLs* de Supabase: no debería incluir `localhost` en el proyecto de producción.
- Ausencia de MFA en la cuenta de administradora.
- Que las *plantillas de correo* no interpolen datos de usuario sin escapar (hoy son las predeterminadas).

## Recomendaciones generales

1. Mantener la regla "todo lo que importa se decide en la base": cada regla de negocio nueva debe existir también como restricción o disparador.
2. Separar el proyecto de Supabase de **desarrollo** del de **producción** (hoy comparten `localhost` en las URLs permitidas).
3. Activar MFA para la cuenta de administradora y usar un gestor de contraseñas.
4. Configurar SMTP propio + CAPTCHA antes de abrir el registro al público (SEC-005).
5. Ejecutar la batería de pruebas (`npm test`) antes de cada cambio en `supabase/`.
6. Programar copias de seguridad de la base y revisar el plan de Supabase (el gratuito se pausa por inactividad).
7. Revisar los avisos del *Security Advisor* de Supabase después de cada cambio de esquema.

## Correcciones aplicadas y trazabilidad

`SEC-xxx → evidencia → archivo/línea → corrección → test → verificación`

| ID | Evidencia | Corrección | Test | Verificación |
| -- | --------- | ---------- | ---- | ------------ |
| SEC-001 | Reproducción local A1, A2, A2b, A2c: pedidos falsos aceptados | `supabase/hardening_seguridad.sql` (`validate_order`), `src/lib/pricing.ts`, `StoreContext.tsx` | `tests/db/seguridad.test.ts`, `tests/unit/lib.test.ts` | Sin el arreglo: falla. Con el arreglo: pasa. **Aplicado en Supabase; falta la prueba real con un pedido |
| SEC-002 | Reproducción A3: `used_count=5 / max_uses=2` | `validate_order` (cupón con bloqueo de fila), `count_coupon_use` | `tests/db/seguridad.test.ts` | Sin el arreglo: falla. Con el arreglo: pasa. Aplicado en Supabase; falta la prueba real con un pedido |
| SEC-003 | Reproducción A5a/A5b: email suplantado y alta bloqueada | `protect_profile_columns` | `tests/db/seguridad.test.ts` | Sin el arreglo: falla. Con el arreglo: pasa. Aplicado en Supabase; falta la prueba real con un pedido |
| SEC-004 | Reproducción A4: 300 de 300 pedidos aceptados | `validate_order` (10/hora), `orders_limits_chk`, `profiles_limits_chk` | `tests/db/seguridad.test.ts` | Sin el arreglo: falla. Con el arreglo: pasa. Aplicado en Supabase; falta la prueba real con un pedido |
| SEC-006 | Reproducción A6 y `rpc('get_coupon')` = 200 con la clave pública | `revoke … from anon` | `tests/db/seguridad.test.ts` | **Producción:** ahora `permission denied for function get_coupon` (42501) |
| SEC-007 | `public/_headers` sin CSP/HSTS | `public/_headers` | Prueba manual con servidor local | Sitio íntegro bajo la CSP; script inyectado y conexión externa bloqueados |
| SEC-008 | `StoreContext.tsx:438` | Persistir solo en modo demostración | Re-auditoría dinámica | `localStorage` sin perfil, pedidos, clientas ni cupones |
| SEC-009 | `AdminPage.tsx:1801`, enlaces en `Header/Footer/InfoModal` | `src/lib/external.ts` | `tests/unit/lib.test.ts`, `tests/db/seguridad.test.ts` | Pruebas verdes |
| SEC-010 | 10 llamadas a `window.open` | `openExternal` | Búsqueda de código | 0 usos sueltos |
| SEC-012 | `StoreContext.tsx:1260,1406` | `MIN_PASSWORD_LENGTH = 8` | `tests/unit/lib.test.ts` | Pruebas verdes; falta el ajuste en Supabase |
| SEC-013 | Sin `.github/` ni `npm test` | CI, Dependabot y 45 pruebas | `npm test` | 45/45 |

## Verificación posterior (re-auditoría)

**Pruebas automáticas** (`npm test`): 45 pruebas, todas verdes: 31 de seguridad de la base (PostgreSQL local con los scripts reales) y 14 unitarias.

**Prueba de detección:** con `AUDIT_BASELINE=1` (base sin el endurecimiento) fallan 20 de las 31 pruebas de la base. Las 11 que pasan son controles que ya funcionaban o pedidos legítimos que deben seguir aceptándose.

**Hallazgo durante la corrección:** la primera versión de `validate_order` tenía un error de PL/pgSQL (*record not assigned*) que habría rechazado **todos** los pedidos sin cupón; lo detectaron las pruebas de regresión antes de llegar a producción.

**Calidad:** `npm run lint` sin advertencias; `npm run build` con TypeScript estricto sin errores; `npm audit`: 0 vulnerabilidades.

**Re-auditoría dinámica (servidor local + Supabase real, solo lecturas):**
- `/admin` con un perfil falso `isAdmin: true` guardado a mano → "Acceso restringido".
- Una bolsa guardada con una prenda inexistente y cantidad 500 → la prenda se descarta.
- Sin datos personales en `localStorage` (perfil, pedidos, clientas, cupones).
- Con las cabeceras reales de `_headers`: la app carga completa y la CSP bloquea un script inyectado y una conexión a `example.org`.
- Los flujos de recuperación de contraseña y de enlace vencido siguen funcionando.
- Lecturas anónimas de Supabase sin cambios (solo tablas públicas).

**Verificación en el sitio desplegado (2026-09-30, Cloudflare, solo lecturas):**
- Las cabeceras `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` llegan en la respuesta real; caché larga e inmutable en `/assets`. **SEC-007 confirmado en el entorno real.**
- Sin violaciones de la CSP ni errores en consola al recorrer la portada, el menú (5 categorías desde Supabase), la ventana de ingreso y la recuperación de contraseña.
- `/admin` y cualquier ruta inexistente devuelven la aplicación (fallback de SPA); `/admin` muestra "Acceso restringido".
- El ingreso con Google llega a la pantalla de Google con `redirect_uri` correcta (callback de Supabase) y retorno al sitio publicado.
- "Olvidé mi contraseña" responde con el mensaje neutro; en celular no hay desbordes ni scroll horizontal.
- La dirección anterior del sitio (subdominio viejo de la cuenta) dejó de responder tras el cambio, como corresponde.

**Verificación en producción (2026-09-29, solo lecturas con la clave pública):**
- `rpc('get_coupon')` como visitante → `permission denied for function get_coupon` (42501). ✅ SEC-006.
- Lecturas de visitante sin cambios: `profiles`, `orders`, `coupons` y `products` = 0 filas; `categories` = 5, `subcategories` = 18, `store_settings` = 1.
- `is_admin()` como visitante → `false`.

**CI en GitHub:** el primer push (commit `59e1132`) pasó completo: instalación con `npm ci`, lint, 45 pruebas, compilación con TypeScript estricto y `npm audit --omit=dev`.

**No se puede verificar desde afuera:** los disparadores `validate_order` y `protect_profile_columns` (requieren una sesión de clienta para ejercerse). Se infiere que están aplicados; la confirmación definitiva es un pedido de prueba real (ver pendientes).

### Observación sobre el ingreso con Google

La pantalla de Google muestra el dominio del proyecto de Supabase ("Ir a …supabase.co") en lugar de una marca propia. No es una vulnerabilidad, pero puede generar desconfianza en las clientas. Se mitiga completando el nombre y el logo de la aplicación en la pantalla de consentimiento de Google Cloud; la solución completa es un dominio propio para Supabase (complemento pago). Queda como decisión de negocio.

## Checklist final de seguridad

- [x] Sin secretos en el código, el bundle ni el historial de git
- [x] `.env` fuera del repositorio; solo clave pública en el navegador
- [x] Sin sinks de XSS; URLs configurables validadas; avatares solo de Google
- [x] Autorización real en la base (RLS) para las 7 tablas y el bucket de fotos
- [x] `is_admin` solo asignable desde el panel de Supabase (y protegido por disparador)
- [x] CSP, HSTS y demás cabeceras definidas y probadas
- [x] Dependencias sin vulnerabilidades conocidas; CI y Dependabot configurados
- [x] Pruebas automáticas de las reglas de seguridad de la base
- [x] `supabase/hardening_seguridad.sql` aplicado en Supabase (SEC-006 verificado en producción)
- [ ] **Prueba real de pedidos** con una cuenta de clienta: uno sin cupón, uno con cupón y confirmar que un precio adulterado se rechaza (cierra SEC-001, 002, 003, 004)
- [ ] SMTP propio + CAPTCHA (SEC-005)
- [ ] Contraseña de 8+ caracteres, protección de contraseñas filtradas y MFA para la administradora en Supabase (SEC-012)
- [ ] Decidir flujo PKCE o *implicit* (SEC-011)
- [ ] Revisar que las *Redirect URLs* de producción no incluyan `localhost`
- [x] Cabeceras comprobadas tras el primer despliegue en Cloudflare

## Pendientes y decisiones manuales

| Qué | Quién | Detalle |
|---|---|---|
| Prueba real de pedidos con una cuenta de clienta | Desarrollo / dueña | Cierra SEC-001, 002, 003 y 004: el script ya está aplicado, falta comprobar en vivo que los pedidos legítimos se registran y los adulterados se rechazan |
| SMTP propio + CAPTCHA | Dueña / desarrollo | Requiere cuentas de Resend o Brevo y de Cloudflare Turnstile (SEC-005) |
| Política de contraseñas y MFA en Supabase | Desarrollo | SEC-012 |
| PKCE vs. *implicit* | Desarrollo | SEC-011 |

## Limitaciones de la auditoría

- **No pude leer la configuración interna de Supabase** (conector con sesión vencida): caducidad de JWT, plantillas de correo, SMTP, CAPTCHA, lista de redirecciones y políticas de contraseñas se infirieron de `auth/v1/settings` o quedan como recomendaciones.
- Las pruebas de escritura se hicieron **solo en una base local (PGlite)**, no en producción. Reproduce PostgreSQL 17 y los mismos scripts, pero simula `auth.uid()`, roles y `auth.users`; no cubre PostgREST, Storage ni el envío de correos.
- No se probó el flujo de Google OAuth completo ni la entrega de correos (requieren una cuenta real).
- El sitio no está desplegado: las cabeceras de Cloudflare Pages no pudieron verificarse en un entorno real (solo se probará su efecto con un servidor local que las aplica).
- No se realizó análisis de tráfico, fuerza bruta ni pruebas de carga.
- Los CVSS son estimaciones del auditor.

## Hallazgos previos ya corregidos

La auditoría anterior (`docs/auditoria.md`) resolvió, entre otros: contraseña de administradora en el código, `/admin` sin barrera, ingreso sin contraseña, RLS abierta (lectura de perfiles y escalado a administradora), rol falsificable desde el navegador, fotos en base64 que rompían el sitio, cupones de demostración públicos y pedidos sin persistencia compartida. **En esta auditoría se re-verificó** que siguen resueltos (controles `CTRL-1` a `CTRL-4` y lecturas anónimas).
