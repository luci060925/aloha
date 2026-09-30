# Aloha Indumentaria

> Tienda online con pedidos por WhatsApp para un showroom de moda femenina en Comodoro Rivadavia — catálogo, cupones, panel de administración y seguridad por roles sobre Supabase.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

> Proyecto para un cliente real: **Aloha Indumentaria**. Repositorio privado.

## Contexto

Aloha vende ropa femenina desde un showroom en **25 de Mayo 903, Piso 3, Comodoro Rivadavia (Chubut)** y necesitaba un catálogo online que la dueña pueda administrar sola.

El pago **no se procesa en el sitio**: la clienta arma su bolsa, el sitio genera el mensaje de pedido y abre **WhatsApp**, donde se coordinan el pago y la entrega. Cada pedido queda registrado en la base para que la dueña lo siga y la clienta vea su estado.

## Funcionalidades

**Tienda**
- Catálogo con categorías, subcategorías, búsqueda, orden y paginación.
- Detalle de prenda con galería, talles, colores, guía de talles y favoritos.
- Bolsa con descuentos automáticos (por cantidad, por monto, global) y cupones (uno por compra).
- Checkout por WhatsApp, cuenta de clienta (correo y contraseña, o **Google**) y "Mis pedidos" con el estado real.
- Textos de ayuda, devoluciones, términos y **Botón de Arrepentimiento**.

**Panel de administración** (`/admin`, solo cuentas con rol de administradora)
- Ajustes de tienda: WhatsApp, horarios, redes, marquesina y portada.
- Alta, edición y baja de prendas con fotos optimizadas a WebP.
- Categorías, subcategorías, descuentos y cupones con conteo de usos.
- Pedidos de todas las clientas con cambio de estado.

## Tech Stack

| Capa | Detalle |
|---|---|
| **Interfaz** | React 19 + TypeScript (modo estricto) |
| **Estilos** | Tailwind CSS 4 |
| **Empaquetado** | Vite 8 |
| **Datos, login y fotos** | Supabase: PostgreSQL con RLS, Auth y Storage |
| **Calidad** | oxlint |
| **Alojamiento** | Cloudflare Pages |

## Requisitos previos

- Node.js 22 o superior
- npm 10 o superior
- Un proyecto de [Supabase](https://supabase.com) (gratuito alcanza para empezar)

## Instalación y ejecución

```bash
git clone https://github.com/luci060925/aloha.git
cd aloha
npm install
cp .env.example .env      # completar con los datos de tu proyecto Supabase
npm run dev
```

La tienda queda en `http://localhost:5173` y el panel en `http://localhost:5173/admin`.

### Variables de entorno

Se obtienen en Supabase → *Project Settings → API*.

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

> Solo se usa la clave **pública** (`anon` / `publishable`). Nunca pongas la clave `service_role` en este proyecto. El archivo `.env` está en `.gitignore`.

Sin estas variables el sitio arranca en **modo demostración** (datos de ejemplo en el navegador, sin cuenta de administradora).

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Comprueba los tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run lint` | Análisis estático con oxlint |

## Base de datos

Los scripts están en [`supabase/`](./supabase). Ejecutarlos en el **SQL Editor** de Supabase, en este orden:

| # | Archivo | Para qué |
|---|---|---|
| 1 | `database_schema.sql` | Tablas base |
| 2 | `rls_policies.sql` | **Seguridad:** quién puede leer y escribir cada tabla |
| 3 | `storage_y_ajustes.sql` | Columnas de redes y portada + bucket público de fotos |
| 4 | `cupones.sql` | Conteo automático de usos de cupones |
| 5 | `categorias_iniciales.sql` | Categorías de arranque (opcional) |

`schema.sql` es una versión anterior e **insegura**: no ejecutarla.

**Cuenta de administradora:** crear el usuario en *Authentication → Users* (con *Auto Confirm User*), ingresar una vez al sitio y poner `is_admin = true` en su fila de `profiles`. Ese campo solo se cambia desde el panel de Supabase. Detalle en [`docs/base-de-datos.md`](./docs/base-de-datos.md).

## Estructura del proyecto

```
aloha/
├── docs/                     Documentación técnica y guía de la administradora
├── public/                   Favicon, robots.txt, _redirects, _headers
├── supabase/                 Scripts SQL (esquema, seguridad, cupones, categorías)
├── src/
│   ├── main.tsx              Punto de entrada
│   ├── App.tsx               Tienda o panel según la ruta; barrera de acceso a /admin
│   ├── index.css             Tailwind y tema
│   ├── context/
│   │   └── StoreContext.tsx  Estado global y acceso a Supabase
│   ├── components/
│   │   ├── admin/            Panel de administración (carga diferida)
│   │   ├── auth/             Ingreso, registro y perfil
│   │   ├── cart/             Bolsa, cupón, checkout y "Mis pedidos"
│   │   ├── catalog/          Grilla, tarjeta, detalle, formulario de prenda, guía de talles
│   │   ├── common/           Header, footer, logo, textos legales y de ayuda
│   │   ├── home/             Portada y sección del showroom
│   │   └── wishlist/         Favoritos
│   ├── lib/                  Cliente de Supabase, subida de fotos, slugs
│   ├── data/                 Ajustes por defecto y datos de demostración (modo sin Supabase)
│   └── types/                Modelos de la aplicación y filas de la base
├── index.html                SEO, datos estructurados y fuentes
├── .env.example              Variables de entorno (sin valores reales)
└── vite.config.ts
```

### Arquitectura

Es una aplicación de una sola página **sin servidor propio**: el navegador habla directo con Supabase usando la clave pública. Como esa clave es visible para cualquiera, **la seguridad no está en el código del sitio sino en las políticas RLS de la base**:

| Rol | Puede |
|---|---|
| Visitante | Ver catálogo y ajustes; validar un cupón por código |
| Clienta | Lo anterior + crear pedidos a su nombre y ver sus pedidos y su perfil |
| Administradora | Todo: prendas, categorías, cupones, ajustes, pedidos y clientas |

Todo el acceso a datos pasa por `StoreContext`, con estas reglas:
- **La base confirma primero:** si falla un guardado, se muestra el motivo y la pantalla no queda desincronizada.
- **Sin datos personales en el navegador:** pedidos, clientas y cupones viven en memoria y se vacían al cerrar sesión.
- **Rol validado contra la sesión real** al cargar; un rol guardado a mano en el navegador se descarta.

Más en [`docs/arquitectura.md`](./docs/arquitectura.md) y [`docs/seguridad.md`](./docs/seguridad.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/arquitectura.md`](./docs/arquitectura.md) | Capas, carpetas, estado y flujos |
| [`docs/base-de-datos.md`](./docs/base-de-datos.md) | Tablas, funciones, fotos y orden de los SQL |
| [`docs/seguridad.md`](./docs/seguridad.md) | Roles, permisos por tabla y riesgos abiertos |
| [`docs/guia-administradora.md`](./docs/guia-administradora.md) | Uso diario del panel para la dueña |
| [`docs/despliegue.md`](./docs/despliegue.md) | Cloudflare Pages, Supabase y checklist de lanzamiento |
| [`docs/login-google.md`](./docs/login-google.md) | Cómo habilitar el ingreso con Google |
| [`docs/auditoria.md`](./docs/auditoria.md) | Revisión de punta a punta y estado de cada hallazgo |
| [`docs/pendientes.md`](./docs/pendientes.md) | Qué falta antes de lanzar y mejoras futuras |

## Despliegue

Cloudflare Pages conectado a este repositorio: *Build command* `npm run build`, *Output directory* `dist`, y las dos variables `VITE_SUPABASE_*`. Además hay que cargar la URL del sitio en Supabase (*Authentication → URL Configuration*). Paso a paso en [`docs/despliegue.md`](./docs/despliegue.md).

## Estado

Funcional y revisado de punta a punta. **Antes de publicar** faltan tareas de contenido con la dueña (textos legales revisados por un profesional, redes, fotos y logo original) y decisiones como el plan de Supabase. La lista completa está en [`docs/pendientes.md`](./docs/pendientes.md).
