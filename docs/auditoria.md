# Auditoría de punta a punta

Revisión archivo por archivo del sitio completo (septiembre de 2026), en tres bloques por prioridad. Este documento resume los hallazgos y su estado actual.

**Bloques revisados**
1. Núcleo, datos y seguridad: `StoreContext`, esquemas SQL, cliente de Supabase, tipos, arranque y configuración.
2. Compra, cuenta y administración: ingreso, bolsa, panel, formulario de prendas, catálogo, favoritos.
3. Presentación, contenido y recursos: cabecera, pie, textos, portada, estilos, `index.html`, README y recursos.

## Seguridad y datos

| Hallazgo | Gravedad | Estado |
|---|---|---|
| Contraseña de administradora escrita en el código (visible en el sitio publicado) | Crítica | ✅ Eliminada; el rol se asigna desde Supabase |
| `/admin` sin ninguna barrera | Crítica | ✅ Pantalla de acceso restringido (y protección real por RLS) |
| Ingreso solo con el correo, sin contraseña | Crítica | ✅ Sesión real de Supabase Auth obligatoria |
| Políticas RLS abiertas: cualquiera podía editar cualquier perfil, hacerse administradora, leer datos personales y cupones | Crítica | ✅ Reescritas y verificadas por rol (`rls_policies.sql`) |
| Rol `isAdmin` falsificable desde el navegador | Alta | ✅ Se valida contra la sesión y la base al cargar |
| Pedidos, cupones, categorías y ajustes solo en el navegador de quien los editaba | Alta | ✅ Persistidos en la base |
| La dueña no veía los pedidos de otras clientas ni los estados llegaban a la clienta | Alta | ✅ Pedidos compartidos vía base |
| Fotos en base64 llenaban el navegador y rompían el sitio | Crítica | ✅ Subida a Storage (WebP) |
| IDs de pedido de 4 dígitos con colisiones | Media | ✅ IDs únicos por fecha y azar |
| WhatsApp se abría después de esperar a la base (bloqueado en celulares) | Media | ✅ Se abre primero |
| Datos personales guardados en `localStorage` | Media | ✅ Solo en memoria |
| README indicaba ejecutar el esquema inseguro | Alta | ✅ README corregido; `schema.sql` marcado obsoleto |

## Funcionalidad

| Hallazgo | Estado |
|---|---|
| Prendas nuevas quedaban en la categoría `all` (no aparecían en ningún filtro) | ✅ |
| Editar una prenda reactivaba stock, quitaba "destacado" y la marcaba "nueva" | ✅ |
| El formulario de prenda se borraba al terminar de cargar categorías | ✅ |
| Cupones de monto fijo mostraban "-0%" | ✅ |
| Descuentos con límite de personas perdían su condición | ✅ El panel lo rechaza y explica |
| Cupones nunca se agotaban; los de demostración eran públicos | ✅ Conteo automático; demostración eliminada |
| Categorías con prendas podían borrarse dejándolas sin sección | ✅ Se rechaza con aviso |
| Identificadores sin tildes ni ñ (`pantal-n`) | ✅ |
| Botón de Google que no hacía nada | ✅ Ingreso con Google implementado (falta habilitar el proveedor: [login-google.md](./login-google.md)) |
| Registro fingía éxito si Supabase fallaba | ✅ Informa el error |
| Métricas incluían pedidos cancelados; nombre fijo "Camila Teixeira" en el panel | ✅ |
| Valores por defecto de ciudad/provincia falsos en el registro | ⏳ Pendiente ([pendientes.md](./pendientes.md)) |
| No se pide la calle para envíos | ⏳ Pendiente |
| Sin recuperación de contraseña | ✅ "¿Olvidaste tu contraseña?" con enlace por correo |

## Contenido y presentación

| Hallazgo | Estado |
|---|---|
| Textos de devolución que podían chocar con el derecho de arrepentimiento online | ✅ Borrador ajustado + Botón de Arrepentimiento (**requiere revisión profesional**) |
| Biografía y cita atribuidas sin confirmar; foto de stock como "showroom"; frases sin respaldo | ✅ Retiradas o neutralizadas |
| Redes sociales inconsistentes y sin poder editarse | ✅ Todo sale del panel |
| Logo distinto al real | 🟡 Aproximado; falta el archivo vectorial original |
| `_redirects` con BOM (rutas directas podían dar 404) | ✅ |
| Clases de Tailwind inexistentes (`neutral-750`, `neutral-850`, animación del menú) | ✅ Definidas en el tema |
| Título, descripción, favicon y datos estructurados genéricos | ✅ |
| Código inicial de 713 KB; 5 familias de fuentes | ✅ 649 KB + panel aparte; 4 familias |
| TypeScript sin `strict`; lint mínimo; restos de plantilla y 4 dependencias sin uso | ✅ |
| Deuda técnica menor: envoltorio `AdminDashboard` sin uso, datos de demostración mezclados con los valores por defecto, logo de referencia dentro de `public/`, filas de la base tipadas con `any`, código inicial de 649 KB | ✅ Resuelta |

## Estado final

Compilación y `npm run lint` sin errores ni advertencias. Los pendientes que quedan son de contenido a confirmar con la dueña, decisiones de negocio y mejoras futuras; están en [pendientes.md](./pendientes.md).
