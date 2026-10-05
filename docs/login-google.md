# Ingreso con Google

El botón **Continuar con Google** ya está en el sitio. Para que funcione hay que habilitar el proveedor en **Google Cloud** y en **Supabase**. Es una configuración de una sola vez y no requiere cambiar código.

> Mientras no esté habilitado, el botón lleva a una página de Supabase con el mensaje `Unsupported provider: provider is not enabled`. Es normal: significa que falta esta configuración.

## Cómo funciona

1. La clienta toca **Continuar con Google** y se la redirige a Google.
2. Google le pide elegir su cuenta y autorizar el acceso a su **nombre, correo y foto**.
3. Vuelve al sitio con la sesión iniciada. Si es su primera vez, el sitio crea su perfil con esos datos (nombre, correo y foto de Google); nunca se crea como administradora.
4. Como Google no entrega el teléfono, antes de finalizar su primera compra el sitio le pide completarlo en su perfil (lo necesita la dueña para coordinar la entrega).

Si una clienta ya se había registrado con correo y contraseña y después entra con Google usando el **mismo correo**, Supabase une ambas identidades en una sola cuenta (mismo perfil y mismos pedidos).

## Paso 1 · Google Cloud

1. Entrar a [console.cloud.google.com](https://console.cloud.google.com) y crear un proyecto (por ejemplo, `aloha-login`).
2. **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo**.
   - Nombre de la app: `Aloha Indumentaria`; correo de asistencia y correo del desarrollador.
   - Alcances: dejar los básicos (`email`, `profile`, `openid`); no hace falta agregar nada más.
   - Al final, **Publicar la aplicación** (pasarla de "Prueba" a "En producción"). En modo *Prueba* solo pueden ingresar las cuentas que agregues como usuarios de prueba. Con los alcances básicos la publicación no requiere verificación de Google.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **Orígenes de JavaScript autorizados:** la dirección del sitio (`https://TU-SITIO`) y `http://localhost:5173` para desarrollo.
   - **URI de redireccionamiento autorizados:** la de Supabase, que tiene esta forma:
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`
     (Supabase la muestra en el paso siguiente, en la ficha de Google.)
4. Copiar el **ID de cliente** y el **Secreto del cliente**.

## Paso 2 · Supabase

1. **Authentication → Sign In / Providers → Google → Enable.**
2. Pegar el **Client ID** y el **Client Secret** y guardar.
3. **Authentication → URL Configuration:**
   - **Site URL:** la dirección final del sitio.
   - **Redirect URLs:** agregar `https://TU-SITIO/**` y `http://localhost:5173/**`.

> El **Client Secret** se guarda únicamente en Supabase. **No va** en el código, en `.env`, en Cloudflare ni en el repositorio.

## Paso 3 · Probar

1. Abrir el sitio → ícono de persona → **Continuar con Google**.
2. Elegir una cuenta. Debe volver al sitio con la sesión iniciada (ícono con la foto o inicial).
3. En Supabase → *Table Editor → `profiles`* debe aparecer la fila nueva con `provider = google` e `is_admin = false`.
4. Agregar una prenda a la bolsa: como la cuenta no tiene teléfono, en lugar de *Finalizar compra* se ve **Completar mi perfil**. Cargar el teléfono y repetir.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `provider is not enabled` | Falta habilitar Google en Supabase (Paso 2) |
| Error `redirect_uri_mismatch` de Google | La URI `https://TU-PROYECTO.supabase.co/auth/v1/callback` no está en las autorizadas de Google Cloud (Paso 1.3) |
| Google dice "Acceso bloqueado: la app no completó la verificación" | La app sigue en modo *Prueba*: publicarla o agregar la cuenta como usuario de prueba |
| Vuelve al sitio pero sin sesión | Falta la dirección del sitio en *Redirect URLs* de Supabase |
| Entra pero no se crea el perfil | Revisar las políticas de `profiles` (`supabase/rls_policies.sql`) y la consola del navegador |
| La foto de perfil no se ve | Las imágenes de Google se cargan sin enviar el `referrer`; si aun así falla, se muestra la inicial |

## Notas de seguridad

- El rol de administradora **nunca** se asigna por Google: una cuenta nueva siempre entra con `is_admin = false`; se otorga solo desde el panel de Supabase.
- Las cuentas de Google verificadas se enlazan por correo. Si el correo de la dueña ya es administradora con contraseña, entrar con Google con ese mismo correo abre la misma cuenta (y el mismo rol).

## Botón oficial de Google (para que no aparezca la dirección de Supabase)

Si se define `VITE_GOOGLE_CLIENT_ID` (el ID de cliente de Google Cloud, que es público), el login usa el botón oficial de Google en una ventana emergente y Supabase valida el token (`signInWithIdToken`). Requisitos: en Google Cloud, el cliente debe tener la web de la tienda en **Orígenes autorizados de JavaScript**. Sin esa variable se usa el ingreso por redirección de siempre.
