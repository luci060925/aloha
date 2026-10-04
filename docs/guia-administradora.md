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
3. El formulario tiene **tres pestañas** arriba (un tilde verde marca las que están completas):
   - **Datos de la prenda:** nombre, categoría y subcategoría, precio, precio original (opcional: se muestra tachado y calcula el % de descuento), casillas de **destacada** y de **"Último en stock"** (muestra esa etiqueta amarilla en la prenda; desmarcala cuando repongas) y descripción. En la descripción podés tocar **Sugerir con IA** (si querés mejores resultados, anotá antes en el campo "Para la IA" datos reales como tela o detalles) para que te proponga 3 opciones (cercana, elegante y canchera): tocá la que te guste, editala si querés y **revisá que sea correcta** antes de guardar. Se instala una vez (ver [ia-descripciones.md](./ia-descripciones.md)).
   - **Imágenes cargadas:** tocá el recuadro y elegí las fotos desde tu celular o computadora. Cada foto se ve en su recuadro vertical 3:4, tal como la verá la clienta: **arrastrala con el dedo o el mouse** para acomodarla. La primera foto es la principal; la segunda aparece al pasar el mouse.
   - **Talle, color y tipo:**
     - **Talles:** tocá los que correspondan o escribí uno nuevo. Si la prenda no se elige por talle, marcá **Talle único** y elegí "calza del … al …" (letras o números).
     - **Colores:** tocá los que correspondan o agregá uno nuevo.
     - **Tipo de prenda** (opcional, uno solo): por ejemplo *Mom*, *Oxford* o *Wide Leg* dentro de Pantalones → Jeans. Si una clienta busca ese nombre, la prenda aparece. Escribilo siempre igual para que se agrupen; el campo sugiere los tipos que ya usaste en esa categoría.
4. Con **Siguiente →** y **← Atrás** pasás de una pestaña a otra, y nada se pierde al cambiar. Si falta un dato al guardar, el formulario te lleva a la pestaña donde está.
5. **Publicar Prenda.** Aparece de inmediato para todas las clientas.

Para **modificar** o **eliminar**, en la tienda cada prenda muestra dos botones (lápiz y tacho) mientras estés con sesión de administradora. Al cambiar o quitar fotos, las que ya no se usan se borran solas.

> Si una prenda no se guarda, el formulario muestra el motivo (por ejemplo, "Ya existe una prenda con ese nombre").

## Categorías y subcategorías

Panel → **Categorías & Subcategorías**.
- **Nueva categoría:** nombre (y opcionalmente descripción). Aparece en el menú de la tienda.
- **Subcategoría:** elegí la categoría padre y escribí el nombre.
- **Magnolia Intimates** es una categoría **fija** (Lencería, Pijamas, Medias y Conjuntos): ya está en el menú y en el inicio, y no se puede editar ni borrar. Para cargar una prenda de esa línea, elegí "Magnolia Intimates" como categoría y una de sus 4 subcategorías. Las prendas de Magnolia también aparecen en "Todas las Prendas".
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

Panel → **Descuentos & Promociones**. Todos los descuentos son **cupones**: la clienta escribe el código en su bolsa (tiene que haber iniciado sesión). No existen descuentos automáticos.

**Reglas**
- Una compra admite **un solo cupón** (no se acumulan).
- Cada clienta puede usar cada cupón **una sola vez**.
- Después de usar un cupón, la clienta **no puede usar otro durante 24 horas**. El sitio le avisa a qué hora puede volver a usar uno.
- Si cancelás un pedido, ese cupón y la espera de 24 horas quedan libres, y el uso se descuenta del contador de personas del cupón. Si reactivás el pedido, se vuelve a contar.

**Crear un cupón** (cada cupón tiene un solo tipo)
1. **Tipo de cupón:**
   - *Por monto de compra:* vale si el total de la bolsa llega al mínimo que pongas (ej. $80.000).
   - *Por cantidad de prendas:* vale si la bolsa tiene esa cantidad de prendas o más (ej. 3).
   - *Global:* vale para cualquier compra de la tienda, sin condición.
   - *Por categoría:* descuenta solo sobre las prendas de la categoría elegida.
2. **Modalidad:** *Porcentaje* (mayor a 0 y hasta 100) o *Valor fijo* en pesos (cualquier monto mayor a cero; nunca descuenta más que el total elegible).
3. **Valor** a descontar.
4. La **condición** del tipo elegido (monto mínimo, prendas mínimas o categoría).
5. **Código** que escribe la clienta (ej. `VERANO10`): letras sin tilde, números o guiones; los espacios pasan a guión. No se pueden repetir códigos.
6. **Límite de personas** (opcional): cuántas clientas distintas pueden usarlo.
7. **Crear Cupón.**

En los tipos por monto, por cantidad y global el descuento se calcula sobre **todo el total** de la bolsa. Solo el cupón por categoría descuenta únicamente sobre las prendas de esa categoría. No se aceptan valores negativos ni cero.

En la tabla ves el tipo y la condición de cada cupón y cuántas personas lo usaron (`3 de 50`). Al llegar al límite pasa a **Agotado**. Con **Pausar** lo desactivás sin borrarlo y con el tacho lo eliminás.

> Conviene **pausar** en vez de borrar: pausado conserva el historial y se puede reactivar, y si después creás otro cupón con el mismo código, quienes ya usaron el anterior no podrían usarlo de nuevo. Si una clienta tiene el cupón en la bolsa y lo pausás, borrás, vence o se agota, al confirmar la compra el sitio se lo avisa, le quita el cupón y **no abre WhatsApp** hasta que revise el nuevo total.

## Ajustes de tienda y portada

Panel → **Ajustes de Tienda & Portada**:
- **Marquesina** (la barra negra de arriba), **dirección** y **horarios** del showroom.
- **Foto del Showroom:** la foto de fondo de la sección "Vení a conocer nuestro local" (se ve en blanco y negro, con el cartel de la dirección encima). Se sube con **Subir Foto del Local**; con **Quitar foto** vuelve la tarjeta oscura sin foto.
- **Portada:** foto de fondo (se optimiza sola), título y bajada. Debajo de la foto hay dos marcos, **Computadora** y **Celular**: **arrastrá la foto** dentro de cualquiera para elegir qué parte se ve (el botón "Centrar" la deja en el medio). Lo mismo vale para la foto del local. Los botones de la portada son fijos: **Ver Catálogo** e **Instagram**. A la derecha ves una vista previa.

> El número de WhatsApp y los enlaces de Instagram, Facebook y TikTok ya no se editan desde el panel: el sitio usa los que están guardados. Para cambiarlos, pedir el cambio al desarrollo.

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
