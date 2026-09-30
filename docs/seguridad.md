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
- El registro exige contraseña de al menos 6 caracteres y maneja la confirmación por correo si está activada.
- La cuenta de administradora **no tiene contraseña en el código**. Se crea en Supabase con una contraseña única y larga, guardada en un gestor de contraseñas.

## Cabeceras del sitio

`public/_headers` (Cloudflare Pages) agrega: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, y caché larga para `/assets`.

## Riesgos abiertos

| Riesgo | Detalle | Mitigación / decisión |
|---|---|---|
| Precios del pedido confiados al navegador | Un usuario técnico podría enviar un pedido con un total alterado | El cobro es manual por WhatsApp: la dueña confirma cada pedido contra el catálogo. A futuro: calcular el total en una función de la base |
| Contador de cupones | Cuenta usos al crear el pedido; no bloquea un pedido con un cupón ya agotado | Aceptable con confirmación manual. A futuro: validar dentro de la base al insertar |
| Contraseñas filtradas | La protección contra contraseñas comprometidas (Supabase → Password) está desactivada | Activarla si el plan lo permite |
| Sin recuperación de contraseña | El sitio no ofrece "Olvidé mi contraseña" | Ver [pendientes.md](./pendientes.md) |
| Sin CSP | No hay política de contenido (`Content-Security-Policy`) | Definirla al publicar, contemplando fuentes de Google, Supabase y WhatsApp |
| Pausa del proyecto (plan gratuito) | Tras 7 días sin actividad la base se pausa y el catálogo deja de cargar | Plan Pro para producción |
| Datos personales | Nombre, teléfono y dirección de clientas en `profiles` y `orders` | Solo visibles para la titular y la administradora; respetar la Ley 25.326 de Protección de Datos Personales |

## Qué hacer si se filtra una clave o contraseña

1. Cambiar la contraseña de la cuenta afectada en Supabase (Authentication → Users).
2. Si fue la clave `anon`, rotarla en *Project Settings → API* y actualizar la variable en Cloudflare Pages.
3. Si fue la `service_role` (no debería estar en ningún lado), rotarla de inmediato.
4. Revisar en `profiles` que solo las cuentas esperadas tengan `is_admin = true`.
