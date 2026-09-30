# Base de datos

Proyecto de Supabase (PostgreSQL 17). Todos los scripts están en [`supabase/`](../supabase).

## Orden de ejecución

Ejecutar en **SQL Editor**, en este orden. Todos son re-ejecutables (no duplican datos).

| # | Archivo | Qué hace |
|---|---|---|
| 1 | `database_schema.sql` | Crea las tablas y los índices base |
| 2 | `rls_policies.sql` | **Seguridad.** Define quién puede leer y escribir cada tabla. Reemplaza las políticas del paso 1 |
| 3 | `storage_y_ajustes.sql` | Agrega columnas de redes y portada a `store_settings` y crea el bucket `catalog-images` |
| 4 | `cupones.sql` | Disparador que cuenta los usos de cada cupón |
| 5 | `hardening_seguridad.sql` | **Endurecimiento** (informe de seguridad): valida cada pedido en el servidor, protege el email y el rol de los perfiles, limita frecuencia y tamaño, y exige sesión para validar cupones. Reemplaza `count_coupon_use` de `cupones.sql`, por eso va **después** |
| 6 | `showroom_foto.sql` | Agrega la columna `showroom_image_url` (foto editable de la sección del local) |
| 7 | `categorias_iniciales.sql` | Carga 5 categorías y 18 subcategorías de arranque (opcional) |

`schema.sql` es una versión anterior e insegura: **no ejecutar**.

## Tablas

| Tabla | Contenido | Notas |
|---|---|---|
| `profiles` | Perfil de cada cuenta: nombre, teléfono, dirección, `is_admin` | `id` = el `id` del usuario en Authentication |
| `products` | Prendas: nombre, `slug`, precio, precio original, `category`, `subcategory`, `images[]`, `sizes[]`, `colors` (JSON), `in_stock`, `featured`, `is_new_arrival` | `category` y `subcategory` guardan el **slug** (texto), no un id |
| `categories` | Nombre, `slug` único, descripción, `display_order` | |
| `subcategories` | Nombre, `slug`, `category_id` | Se borran en cascada con su categoría |
| `orders` | Pedido: cliente, teléfono, ubicación, `items` (JSON), subtotal, descuento, cupón, total, `status`, mensaje enviado | `id` es texto tipo `ORD-…`; `user_id` → `profiles` |
| `coupons` | Código único, % o monto fijo, `max_uses`, `used_count`, categoría destino, `is_active`, `expires_at` | |
| `store_settings` | **Una sola fila** (`id = 1`): WhatsApp, dirección, horarios, marquesina, redes, textos y foto de portada, foto del showroom | |

Estados de un pedido (`orders.status`): `whatsapp_sent` → `contacted` → `confirmed` → `delivered` (o `cancelled`).

## Funciones y disparadores

| Nombre | Tipo | Para qué |
|---|---|---|
| `is_admin()` | Función (`SECURITY DEFINER`) | Indica si la cuenta actual es administradora. Evita la recursión al usarla dentro de las políticas de `profiles` |
| `get_coupon(código)` | Función (`SECURITY DEFINER`) | Valida **un** cupón: activo, no vencido y con cupo. Devuelve sus datos sin permitir listar los demás |
| `count_coupon_use()` | Disparador en `orders` (después de insertar) | Suma 1 a `used_count` del cupón usado, solo si el pedido realmente descuenta |
| `validate_order()` | Disparador en `orders` (antes de insertar) | Valida el pedido con los datos reales de la base: prendas existentes y en stock, precio vigente, cantidades 1–50, subtotal, total y descuento máximo legítimo (solo cupón: real, activo, vigente, con cupo, con su condición cumplida —compra o prendas mínimas—, no usado antes por la clienta y sin otro cupón usado en las últimas 24 horas); bloquea la fila del cupón para respetar el cupo; máximo 10 pedidos por hora por cuenta |
| `protect_profile_columns()` | Disparador en `profiles` | El email sale siempre de la cuenta de acceso, `id` y `created_at` no cambian y `is_admin` solo lo cambia una administradora o el panel de Supabase |

## Almacenamiento de fotos

Bucket público **`catalog-images`**:
- Lectura pública (las fotos se ven en el sitio).
- Solo la administradora puede subir, reemplazar o borrar.
- Máximo 1 MB por archivo; solo WebP, JPEG o PNG.
- Carpetas: `products/` (fotos de prendas), `hero/` (portada) y `showroom/` (foto del local).

## Crear la cuenta de administradora

1. **Authentication → Users → Add user → Create new user**, con *Auto Confirm User*.
2. Ingresar una vez en el sitio con esa cuenta: se crea su fila en `profiles`.
3. **Table Editor → `profiles`**: poner `is_admin = true` en esa fila.

`is_admin` **solo se cambia desde el panel de Supabase**; ni el sitio ni las clientas pueden escribirlo.

> Si una cuenta se creó a mano y su `profiles.id` no coincide con el `id` de Authentication, el sitio no la reconoce como administradora. Deben ser idénticos.

## Pruebas de la base

`npm test` carga los scripts reales de `supabase/` en una copia local de PostgreSQL (PGlite, sin tocar Supabase) y comprueba las reglas de seguridad con roles simulados (visitante, clienta, administradora). Cada cambio en `supabase/` debe pasar esas pruebas antes de aplicarse; con `AUDIT_BASELINE=1` se ejecutan contra la base **sin** el endurecimiento y deben fallar (así se comprueba que las pruebas detectan las vulnerabilidades).

Después de ejecutar `hardening_seguridad.sql` en Supabase, la última consulta del script debe mostrar los disparadores `orders_validate`, `profiles_protect` y `orders_count_coupon`.

## Mantenimiento

- **Copias de seguridad:** el plan gratuito no incluye backups automáticos. Se puede exportar desde *Database → Backups* o con `pg_dump`. El plan Pro los incluye.
- **Pausa por inactividad:** el plan gratuito pausa el proyecto tras 7 días sin actividad.
- **Cambios de esquema:** aplicarlos como scripts nuevos en `supabase/` (no editar los ya ejecutados) y documentarlos acá.
