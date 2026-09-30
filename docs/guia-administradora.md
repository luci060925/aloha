# Guía de la administradora

Guía de uso diario del panel de Aloha. No hace falta saber programar.

## Cómo ingresar

1. Entrá al sitio y tocá el ícono de persona (arriba a la derecha) → **Iniciar sesión**, con el correo y la contraseña de administradora.
2. Tocá tu perfil → **Panel Admin** (o agregá `/admin` al final de la dirección del sitio).
3. Si aparece "Acceso restringido", tu cuenta no tiene permisos de administradora: avisá a quien mantiene el sitio.

Para salir, volvé a la tienda → tu perfil → **Salir**. Hacelo siempre si usás una computadora compartida.

## Cargar una prenda

Se hace desde la **tienda** (no desde el panel), estando con tu sesión de administradora:

1. Entrá a la sección donde va la prenda (por ejemplo, Pantalones → Calzas).
2. Tocá **Agregar Prenda**. Se abre el formulario con esa sección ya elegida.
3. Completá: nombre, categoría y subcategoría, precio, precio original (opcional: se muestra tachado y calcula el % de descuento) y descripción.
4. **Fotos:** tocá el recuadro y elegí las imágenes desde tu celular o computadora.
   - Se recortan solas en formato vertical 3:4.
   - Con **Enfoque vertical** (Arriba / Centro / Abajo o el deslizador) elegís qué parte de la foto se ve.
   - La primera foto es la principal; la segunda aparece al pasar el mouse.
5. **Talles** y **colores:** tocá los que correspondan, o escribí uno nuevo.
6. **Publicar Prenda.** Aparece de inmediato para todas las clientas.

Para **modificar** o **eliminar**, en la tienda cada prenda muestra dos botones (lápiz y tacho) mientras estés con sesión de administradora. Al cambiar o quitar fotos, las que ya no se usan se borran solas.

> Si una prenda no se guarda, el formulario muestra el motivo (por ejemplo, "Ya existe una prenda con ese nombre").

## Categorías y subcategorías

Panel → **Categorías & Subcategorías**.
- **Nueva categoría:** nombre (y opcionalmente descripción). Aparece en el menú de la tienda.
- **Subcategoría:** elegí la categoría padre y escribí el nombre.
- **Eliminar:** solo se puede si no tiene prendas. Si las tiene, el panel avisa cuántas son; movelas o eliminalas primero.

## Pedidos

Panel → **Pedidos WhatsApp**. Muestra los pedidos de **todas** las clientas, con el más nuevo primero.

1. Cuando una clienta finaliza su compra, te llega el mensaje por WhatsApp y el pedido aparece acá.
2. Coordiná el pago y la entrega por WhatsApp.
3. Cambiá el **estado** del pedido; la clienta lo ve en *Mi bolsa → Mis pedidos*:

| Estado | Significa | Ve la clienta |
|---|---|---|
| Pedido Enviado | Llegó el pedido, todavía sin contacto | "Pedido WhatsApp Enviado" |
| Contactado WhatsApp | Ya hablaste con ella | "Contactado vía WhatsApp" |
| Pago Confirmado / En Preparación | Pagó y se está preparando | "Pago Aprobado • En Preparación" |
| Compra Realizada / Entregado | Retiró o recibió la prenda | "Compra Entregada" |
| Cancelado | No se concretó | "Cancelado" |

4. **Ver Detalle** muestra las prendas, talles y colores. El botón de actualizar (flechas) trae los pedidos nuevos.

> Antes de cobrar, revisá que el total del pedido coincida con los precios del catálogo.
> Los pedidos cancelados no suman al monto de "Volumen Solicitado".

## Descuentos y cupones

Panel → **Descuentos & Promociones**. En cada compra se aplica **un solo descuento**, en este orden de prioridad: cupón → cantidad de prendas → monto de compra → descuento global.

**Descuentos automáticos** (se activan y pausan con el botón de la tabla):
- **Por cantidad de prendas:** ej. 15 % llevando 3 o más.
- **Por monto de compra:** ej. 10 % si supera $80.000.
- **Global:** un porcentaje para toda la tienda.

**Cupones** (los usa la clienta ingresando el código en la bolsa):
1. En el formulario elegí el tipo **Por Categoría Específica** (con "Todas las categorías" para toda la tienda).
2. Elegí **Porcentaje** o **Valor fijo**, el valor, un **límite de personas** (opcional) y un **código** (ej. `VERANO10`).
3. **Guardar / Activar Descuento.**
4. En la tabla ves cuántos usos lleva (`3 / 50 personas`). Al llegar al límite pasa a **Agotado**. Con **Pausar** lo desactivás sin borrarlo.

> Los descuentos por cantidad, monto o globales no admiten límite de personas ni valor fijo; el panel avisa si lo intentás.

## Ajustes de tienda y portada

Panel → **Ajustes de Tienda & Portada**:
- **Número de WhatsApp** que recibe los pedidos (formato: país + área + número, sin signos; ej. `5492974201122`).
- **Marquesina** (la barra negra de arriba), **dirección** y **horarios** del showroom.
- **Redes sociales:** Instagram, Facebook y TikTok.
- **Portada:** foto de fondo (se optimiza sola), insignia, título, bajada y textos de los botones. A la derecha ves una vista previa.

Tocá **Guardar Ajustes**: si dice "guardados correctamente", ya lo ven todas las clientas. Si aparece un mensaje en rojo, no se guardó.

## Clientas y métricas

Panel → **Métricas & Clientas**: cantidad de cuentas, pedidos, monto pedido (sin contar cancelados) y el listado de clientas registradas con su contacto.

## Problemas frecuentes

| Situación | Qué hacer |
|---|---|
| "Acceso restringido" al entrar | Cerrá sesión y volvé a ingresar; si sigue, avisá al desarrollo (falta el permiso `is_admin`) |
| No se guarda algo y sale un mensaje rojo | Revisá la conexión, volvé a ingresar y reintentá; anotá el mensaje |
| Una foto no se sube | Probá con otra; la web las achica sola, pero un archivo dañado puede fallar |
| El sitio no carga el catálogo | Puede estar pausado el proyecto de Supabase (plan gratuito, 7 días sin uso): avisá al desarrollo |
| Una clienta olvidó su contraseña | Que use **¿Olvidaste tu contraseña?** en la ventana de ingreso: recibe un correo con un enlace para elegir una nueva. Si no le llega, que revise el spam; el enlace vence en poco tiempo y se puede pedir otro |
| Vos olvidaste tu contraseña de administradora | Lo mismo: **¿Olvidaste tu contraseña?** con el correo de tu cuenta |
