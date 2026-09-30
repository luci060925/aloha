# Despliegue

El sitio es estático (`dist/`), así que se publica en **Cloudflare Pages** conectado al repositorio de GitHub. Cada `git push` a `main` genera una nueva versión.

## 1. Preparar Supabase

Si es un proyecto nuevo, seguir el orden de [base-de-datos.md](./base-de-datos.md) y crear la cuenta de administradora.

## 2. Crear el proyecto en Cloudflare Pages

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → elegir el repositorio `aloha` (privado; hay que autorizar a Cloudflare a leerlo).
2. Configuración de compilación:

| Campo | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | 22 o superior (variable `NODE_VERSION` si hace falta) |

3. **Variables de entorno** (Production y Preview):

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto (Supabase → Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Clave **pública** (`anon` / `publishable`) |

> Estas variables se incorporan al código durante la compilación. Si se cambian, hay que volver a desplegar.

4. **Save and Deploy.**

## 3. Conectar Supabase con el dominio publicado

En Supabase → **Authentication → URL Configuration**:
- **Site URL:** la dirección final del sitio (ej. `https://aloha.pages.dev` o el dominio propio).
- **Redirect URLs:** la misma dirección (y `http://localhost:5173` para desarrollo).

Sin esto, los correos de confirmación de cuenta apuntan a una dirección equivocada.

Para el ingreso con Google hay que agregar además las dos direcciones (`https://TU-SITIO/**` y `http://localhost:5173/**`) y habilitar el proveedor: ver [login-google.md](./login-google.md).

## 4. Dominio propio (opcional)

Cloudflare Pages → el proyecto → **Custom domains → Set up a domain**. Luego actualizar el **Site URL** de Supabase y las marcas `TODO(al publicar)` de `index.html` (URL canónica e imagen para compartir en redes).

## 5. Checklist antes de lanzar

- [ ] Textos legales revisados por contador o abogado (devoluciones, arrepentimiento, términos) y datos del comerciante cargados.
- [ ] Contenido confirmado con la dueña: redes, foto del showroom, logo original, horarios.
- [ ] Cuenta de administradora creada con contraseña única y larga; `is_admin` solo en las cuentas correctas.
- [ ] `supabase/rls_policies.sql` aplicado (comprobar en Supabase → Authentication → Policies).
- [ ] Categorías cargadas y al menos una prenda de prueba con fotos.
- [ ] `supabase/hardening_seguridad.sql` ejecutado en Supabase (ver [base-de-datos.md](./base-de-datos.md)).
- [ ] SMTP propio y CAPTCHA configurados (informe de seguridad, SEC-005).
- [ ] En Supabase → Authentication: contraseña mínima de 8 caracteres, protección de contraseñas filtradas (si el plan lo permite) y MFA para la administradora.
- [ ] *Redirect URLs* de Supabase sin `localhost` en el proyecto de producción.
- [ ] Ingreso con Google habilitado y probado (o ocultar el botón si no se usará).
- [ ] Protección contra contraseñas filtradas activada (si el plan lo permite).
- [ ] Decidido el plan de Supabase (el gratuito se pausa tras 7 días sin actividad).
- [ ] `index.html`: URL canónica e imagen para compartir; `robots.txt` con el sitemap.

## 6. Pruebas después de publicar

1. **Tienda:** carga el catálogo, el menú de categorías y la portada con datos reales.
2. **Ruta directa:** abrir `https://TU-SITIO/admin` directamente (no debe dar 404; debe mostrar "Acceso restringido").
3. **Clienta de prueba:** registrarse, confirmar el correo si corresponde, comprar una prenda y comprobar que abre WhatsApp y que el pedido aparece en el panel.
3b. **Recuperar contraseña:** desde el ingreso, *¿Olvidaste tu contraseña?* con el correo de esa clienta; abrir el enlace del correo, elegir una contraseña nueva e ingresar con ella.
4. **Cupón:** crear uno, usarlo y ver que el contador sube.
5. **Fotos:** subir una prenda con fotos desde el celular.
5b. **Cabeceras:** en las herramientas del navegador (Red → el documento) comprobar `Content-Security-Policy` y `Strict-Transport-Security`, y que la consola no muestre violaciones de la política al recorrer la tienda, el ingreso y el panel.
6. **Seguridad:** sin sesión, comprobar que no se pueden leer pedidos ni perfiles (ver el método en [seguridad.md](./seguridad.md)).

## Volver a una versión anterior

Cloudflare Pages guarda todas las versiones: **Deployments → la versión buena → Rollback to this deployment**. Los cambios de base de datos no se revierten solos; por eso conviene exportar una copia antes de aplicar un script nuevo.
