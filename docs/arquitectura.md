# Arquitectura

## Visión general

Aloha es una **aplicación de una sola página (SPA)** hecha con React. No tiene servidor propio: el navegador habla directamente con **Supabase** (base de datos PostgreSQL, autenticación y almacenamiento de fotos) usando la clave pública. La seguridad de los datos la garantizan las políticas de fila (**RLS**) de la base, no el código del navegador (ver [seguridad.md](./seguridad.md)).

El pago **no se procesa en el sitio**: la clienta arma su bolsa, el sitio genera un mensaje de pedido y abre **WhatsApp**; la dueña confirma el pago y la entrega por ese canal. El pedido queda registrado en la base para seguimiento.

```
 Clienta / Dueña (navegador)
          │
          ▼
 Cloudflare Pages ── sirve HTML, JS y CSS estáticos (dist/)
          │
          ▼  (clave pública + sesión del usuario)
 ┌─────────────────────── Supabase ───────────────────────┐
 │  Auth        cuentas con correo y contraseña           │
 │  PostgreSQL  productos, categorías, pedidos, cupones,  │
 │              perfiles, ajustes  ← protegidos con RLS   │
 │  Storage     bucket público "catalog-images" (fotos)   │
 └─────────────────────────────────────────────────────────┘
          │
          ▼
      WhatsApp (wa.me) ── pedido y coordinación de pago
```

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | React 19, TypeScript (modo estricto) |
| Estilos | Tailwind CSS 4 |
| Empaquetado | Vite 8 |
| Datos, login y fotos | Supabase (`@supabase/supabase-js`) |
| Íconos / efectos | `lucide-react`, `canvas-confetti` (carga diferida) |
| Calidad | `oxlint` |
| Alojamiento | Cloudflare Pages |

## Estructura de carpetas

```
aloha/
├── docs/                          Esta documentación (y assets/ con el logo original de referencia)
├── public/                        Archivos estáticos (favicon, robots.txt, _redirects, _headers)
├── supabase/                      Scripts SQL (esquema, seguridad, cupones, categorías)
├── src/
│   ├── main.tsx                   Punto de entrada
│   ├── App.tsx                    Tienda o panel según la ruta; barrera de acceso a /admin
│   ├── index.css                  Tailwind + tema (colores, animaciones, fuentes)
│   ├── context/
│   │   └── StoreContext.tsx       Estado global y acceso a Supabase (ver abajo)
│   ├── components/
│   │   ├── admin/                 Panel de administración (carga diferida)
│   │   ├── auth/                  Ingreso / registro y perfil de la clienta
│   │   ├── cart/                  Bolsa, cupón, checkout por WhatsApp, "Mis pedidos"
│   │   ├── catalog/               Grilla, tarjeta, detalle, formulario de prenda, guía de talles
│   │   ├── common/                Header, footer, logo, textos legales y de ayuda
│   │   ├── home/                  Portada y sección del showroom
│   │   └── wishlist/              Favoritos
│   ├── lib/
│   │   ├── supabase.ts            Cliente de Supabase (según variables de entorno)
│   │   ├── images.ts              Compresión a WebP y subida/borrado en Storage
│   │   └── slug.ts                Identificadores de texto sin tildes
│   ├── data/
│   │   ├── defaultSettings.ts     Valores por defecto de los ajustes de la tienda
│   │   └── demoData.ts            Prendas, categorías y cupones de demostración (solo modo sin Supabase)
│   └── types/
│       ├── index.ts               Modelos de la aplicación
│       └── database.ts            Filas de las tablas de Supabase
├── index.html                     SEO, datos estructurados y fuentes
└── vite.config.ts
```

## Estado global (`StoreContext`)

Es el único punto que habla con Supabase. Cada dato tiene una fuente definida:

| Dato | Fuente | Quién lo ve |
|---|---|---|
| Productos, categorías, subcategorías, ajustes | Base de datos (lectura pública) | Todas |
| Fotos | Storage (`catalog-images`), URL en `products.images` | Todas |
| Pedidos | Base de datos | La clienta ve los suyos; la administradora, todos |
| Clientas (perfiles) | Base de datos | Solo la administradora |
| Cupones (lista completa) | Base de datos | Solo la administradora |
| Cupón por código | Función `get_coupon()` | Cualquiera puede validar uno, no listarlos |
| Bolsa y favoritos | `localStorage` del navegador | Cada dispositivo |

Reglas de diseño:
- **La base confirma primero.** Al crear o editar prendas, categorías o cupones se espera la respuesta de la base antes de actualizar la pantalla; si falla, se muestra el motivo.
- **Los datos personales no se guardan en el navegador** (pedidos, clientas, cupones); viven en memoria y se vacían al cerrar sesión.
- **Sesión real:** al cargar, se valida la sesión de Supabase; un usuario o rol guardado a mano en el navegador se descarta.

## Flujos principales

**Ingreso.** Correo + contraseña, o **Google** (ver [login-google.md](./login-google.md)), con Supabase Auth. La primera vez que una cuenta entra se crea su perfil en `profiles`. El rol de administradora (`profiles.is_admin`) se lee de la base; el sitio nunca lo escribe. `/admin` (o `#admin`) muestra "Acceso restringido" si la cuenta no es de administradora.

**Compra.** Bolsa → cupón opcional (se valida en la base) → "Finalizar compra vía WhatsApp": el sitio abre WhatsApp con el mensaje y registra el pedido (`orders`). Un disparador en la base suma el uso del cupón.

**Descuentos.** Se aplica **uno solo por compra**, en este orden: cupón → volumen (cantidad de prendas) → monto mínimo → descuento global.

**Fotos.** El panel recorta la foto a 3:4, la convierte a WebP (menos de 1 MB), la sube a `catalog-images` y guarda solo la URL. Al reemplazar o borrar una prenda se eliminan las fotos que ya no se usan.

**Panel de administración.** Se descarga solo cuando se entra a `/admin` (carga diferida) para no pesar en la tienda.

## Modo demostración

Sin variables de entorno de Supabase, el sitio funciona con datos de demostración guardados en el `localStorage`. No hay cuenta de administradora en este modo. Sirve solo para desarrollo visual.

## Convenciones

- TypeScript estricto y `oxlint` sin advertencias (`npm run build` y `npm run lint`).
- Las filas de Supabase se tipan en `src/types/database.ts` (escritas a mano; hay que mantenerlas al día con `supabase/`).
- Las librerías (React, Supabase) se compilan en archivos aparte (`vite.config.ts`) para que el navegador las guarde en caché entre versiones del sitio.
- Las marcas `TODO(...)` señalan contenido a confirmar con la dueña o tareas previas a publicar (ver [pendientes.md](./pendientes.md)).
