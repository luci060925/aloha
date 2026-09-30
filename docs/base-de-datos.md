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
| 5 | `categorias_iniciales.sql` | Carga 5 categorías y 18 subcategorías de arranque (opcional) |

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
| `store_settings` | **Una sola fila** (`id = 1`): WhatsApp, dirección, horarios, descuentos automáticos, marquesina, redes, textos de portada | |

Estados de un pedido (`orders.status`): `whatsapp_sent` → `contacted` → `confirmed` → `delivered` (o `cancelled`).

## Funciones y disparadores

| Nombre | Tipo | Para qué |
|---|---|---|
| `is_admin()` | Función (`SECURITY DEFINER`) | Indica si la cuenta actual es administradora. Evita la recursión al usarla dentro de las políticas de `profiles` |
| `get_coupon(código)` | Función (`SECURITY DEFINER`) | Valida **un** cupón: activo, no vencido y con cupo. Devuelve sus datos sin permitir listar los demás |
| `count_coupon_use()` | Disparador en `orders` (después de insertar) | Suma 1 a `used_count` del cupón usado en el pedido |

## Almacenamiento de fotos

Bucket público **`catalog-images`**:
- Lectura pública (las fotos se ven en el sitio).
- Solo la administradora puede subir, reemplazar o borrar.
- Máximo 1 MB por archivo; solo WebP, JPEG o PNG.
- Carpetas: `products/` (fotos de prendas) y `hero/` (portada).

## Crear la cuenta de administradora

1. **Authentication → Users → Add user → Create new user**, con *Auto Confirm User*.
2. Ingresar una vez en el sitio con esa cuenta: se crea su fila en `profiles`.
3. **Table Editor → `profiles`**: poner `is_admin = true` en esa fila.

`is_admin` **solo se cambia desde el panel de Supabase**; ni el sitio ni las clientas pueden escribirlo.

> Si una cuenta se creó a mano y su `profiles.id` no coincide con el `id` de Authentication, el sitio no la reconoce como administradora. Deben ser idénticos.

## Mantenimiento

- **Copias de seguridad:** el plan gratuito no incluye backups automáticos. Se puede exportar desde *Database → Backups* o con `pg_dump`. El plan Pro los incluye.
- **Pausa por inactividad:** el plan gratuito pausa el proyecto tras 7 días sin actividad.
- **Cambios de esquema:** aplicarlos como scripts nuevos en `supabase/` (no editar los ya ejecutados) y documentarlos acá.
