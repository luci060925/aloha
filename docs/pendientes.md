# Pendientes

Buscá `TODO(` en el código para ubicar cada marca.

## Antes de lanzar (bloquean la publicación)

| # | Tarea | Quién |
|---|---|---|
| 1 | Revisar los textos legales (`InfoModal.tsx`: devoluciones, arrepentimiento, términos) y cargar razón social, CUIT y domicilio legal | Contador / abogado |
| 2 | Confirmar el plazo de retiro de 30 días, las gift cards, las cámaras de seguridad y demás condiciones de los términos | Dueña |
| 3 | Confirmar enlaces reales de Instagram, Facebook y TikTok (se editan en el panel) | Dueña |
| 4 | Foto real del showroom, historia de la marca y logo original en vector (`StoreLocationSection.tsx`, `InfoModal.tsx`, `BrandLogo.tsx`) | Dueña / diseño |
| 5 | `index.html`: URL canónica e imagen para compartir; sitemap en `robots.txt` | Desarrollo (con el dominio final) |
| 6 | Recuperación de contraseña ("Olvidé mi contraseña") con `supabase.auth.resetPasswordForEmail` | Desarrollo |
| 7 | Decidir el plan de Supabase (el gratuito se pausa tras 7 días sin actividad) | Dueña |
| 8 | Activar la protección contra contraseñas filtradas en Supabase, si el plan lo permite | Desarrollo |

## Mejoras recomendadas

- **Dirección de entrega:** pedir calle y localidad reales al registrarse (hoy se asume "Comodoro Rivadavia, Chubut") y no completar valores por defecto.
- **URLs por prenda:** hoy todo es un modal; no se puede compartir el enlace de una prenda ni indexarla en Google.
- **Total del pedido calculado en la base** (función) para no depender de los precios que envía el navegador.
- **Renombrar categorías** desde el panel (la función existe en el código, falta el botón).
- **Stock por talle** y aviso de agotado por talle.
- **Política de seguridad de contenido (CSP)** en `public/_headers`.
- **Sitemap** generado desde la base.
- **Correos transaccionales** (confirmación de pedido) o aviso a la dueña por correo.
- **Validación de imágenes** más estricta (dimensiones mínimas) y alt descriptivo por prenda.
- **Accesibilidad:** cerrar modales con Esc y al tocar afuera, `role="dialog"`, bloqueo del scroll del fondo y manejo del foco.
- **Pruebas automatizadas** de los cálculos de descuento y de los permisos RLS.
- **Copias de seguridad** programadas de la base.

## Deuda técnica menor

- `src/components/admin/AdminDashboard.tsx` es un envoltorio sin uso; puede eliminarse.
- `src/data/initialData.ts` se usa solo en modo demostración (sin Supabase).
- `public/logo.png` no se usa en el sitio (es solo la referencia del logo real; 150 px de ancho).
- Filas de Supabase tipadas como `DbRow`; se puede pasar a tipos generados (`supabase gen types`).
- Dividir el código restante (649 KB) con `build.rolldownOptions.output.codeSplitting`.
