# Seguridad

## Principio

La clave `anon` (pública) de Supabase viaja dentro del JavaScript del sitio y **cualquiera puede leerla**. Por eso el código del navegador no protege nada: todo lo que importa lo decide la base mediante **políticas de fila (RLS)**, definidas en [`supabase/rls_policies.sql`](../supabase/rls_policies.sql). Las restricciones de la interfaz (ocultar botones, la pantalla "Acceso restringido") son solo comodidad.

Reglas de oro:
- En este proyecto solo se usa la clave **pública**. La clave `service_role` **nunca** va en el código, en `.env` ni en Cloudflare.
- El archivo `.env` está en `.gitignore`; solo se versiona `.env.example`.

## Roles

| Rol | Cómo se obtiene | Puede |
|---|---|---|
| Visitante | Sin sesión | Ver catálogo, categorías y ajustes; validar un cupón por código |
| Clienta | Cuenta con correo y contraseña | Todo lo anterior + crear pedidos a su nombre + ver su perfil y sus pedidos |
| Administradora | `profiles.is_admin = true` (solo desde el panel de Supabase) | Todo lo anterior + gestionar prendas, categorías, cupones, ajustes, pedidos, fotos y ver a todas las clientas |

## Permisos por tabla (RLS)

| Tabla | Visitante | Clienta | Administradora |
|---|---|---|---|
| `products`, `categories`, `subcategories`, `store_settings` | Leer | Leer | Leer y escribir |
| `coupons` | — (usa `get_coupon`) | — (usa `get_coupon`) | Todo |
| `profiles` | — | Leer y editar **solo el suyo**; no puede darse `is_admin` | Todo |
| `orders` | — | Crear **a su nombre** (`user_id = su id`, estado inicial); leer los suyos | Todo |
| Storage `catalog-images` | Ver fotos | Ver fotos | Subir, cambiar y borrar |

Se verificó con simulaciones de cada rol dentro de una transacción con rollback:
un visitante no lee perfiles ni pedidos; una clienta no puede ascenderse a administradora, editar otro perfil, crear pedidos a nombre de otra ni crear productos.

## Autenticación

- Correo y contraseña con Supabase Auth; el sitio exige sesión real (un usuario guardado a mano en el navegador se descarta al cargar).
- El ingreso con Google usa el mismo circuito de sesión; una cuenta nueva siempre nace con `is_admin = false` (ver [login-google.md](./login-google.md)).
- **Recuperar contraseña:** el enlace llega por correo y abre una sesión temporal solo para elegir la contraseña nueva. El sitio responde igual exista o no la cuenta (no permite averiguar qué correos están registrados). Supabase limita los pedidos repetidos (uno por minuto por correo).
- El registro exige contraseña de al menos 6 caracteres y maneja la confirmación por correo si está activada.
- La cuenta de administradora **no tiene contraseña en el código**. Se crea en Supabase con una contraseña única y larga, guardada en un gestor de contraseñas.

## Cabeceras del sitio

`public/_headers` (Cloudflare Pages) agrega: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, y caché larga para `/assets`.

La **CSP** solo permite scripts propios y conexiones a Supabase; imágenes de Supabase, Google y Unsplash; y fuentes de Google. Si se suma un servicio externo (analítica, mapa embebido, chat), hay que agregar su dominio a `_headers` y probar el sitio: una política de más rompe la página y una de menos la debilita. Se verificó cargando `dist/` con esas mismas cabeceras y comprobando que un script inyectado y una conexión a un dominio no autorizado quedan bloqueados.

## Validación en el servidor

El navegador nunca decide precios ni descuentos: la base recalcula y rechaza los pedidos que no coinciden (`validate_order`). Esto cubre precios adulterados, cantidades inválidas, descuentos inexistentes, cupones vencidos o agotados y el abuso por frecuencia. La lógica de descuentos está duplicada a propósito en `src/lib/pricing.ts` (lo que ve la clienta) y en el SQL (lo que se acepta); si se cambia una, hay que cambiar la otra y correr `npm test`.

## Riesgos abiertos

| Riesgo | Detalle | Mitigación / decisión |
|---|---|---|
| Contraseñas filtradas | La protección contra contraseñas comprometidas (Supabase → Password) está desactivada | Activarla si el plan lo permite |
| Pausa del proyecto (plan gratuito) | Tras 7 días sin actividad la base se pausa y el catálogo deja de cargar | Plan Pro para producción |
| Datos personales | Nombre, teléfono y dirección de clientas en `profiles` y `orders` | Solo visibles para la titular y la administradora; respetar la Ley 25.326 de Protección de Datos Personales |

| Correos de Supabase | El envío por defecto tiene una cuota baja por hora y el registro/recuperación no tienen CAPTCHA: cualquiera podría agotarla | SMTP propio + Cloudflare Turnstile (informe SEC-005) |
| Flujo de sesión *implicit* | Los tokens llegan en el fragmento de la URL al volver de Google o del correo | Se mantiene para que los enlaces de recuperación funcionen entre dispositivos (informe SEC-011) |
| Cuenta de administradora sin MFA | Una sola contraseña protege el panel | Activar MFA en Supabase (informe SEC-012) |

La auditoría completa está en [`informe.md`](../informe.md).

## Qué hacer si se filtra una clave o contraseña

1. Cambiar la contraseña de la cuenta afectada en Supabase (Authentication → Users).
2. Si fue la clave `anon`, rotarla en *Project Settings → API* y actualizar la variable en Cloudflare Pages.
3. Si fue la `service_role` (no debería estar en ningún lado), rotarla de inmediato.
4. Revisar en `profiles` que solo las cuentas esperadas tengan `is_admin = true`.
