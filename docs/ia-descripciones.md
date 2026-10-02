# Sugerencias de descripción con IA (Gemini)

En el formulario de cada prenda, el botón **"Sugerir con IA"** propone **3 descripciones** para elegir:

1. **Cercana:** tono amigable y práctico.
2. **Elegante:** tono sobrio y sofisticado.
3. **Canchera:** tono juvenil y directo.

Camila toca la que le gusta, la edita si quiere y guarda la prenda. La IA no publica nada sola.

## Cómo funciona

```
Formulario de la prenda ──► Función de Supabase ──► Gemini (Google)
  (botón, solo admin)        (guarda la clave,        (genera las 3
                              verifica que sea         descripciones)
                              la administradora)
```

- La **clave de Gemini nunca llega al navegador**: vive como secreto en Supabase.
- La función **rechaza a cualquiera que no sea administradora** (usa `is_admin()` de la base).
- Se manda a Gemini el nombre, la categoría, los colores y los talles, y una **foto chica** (hasta 768 px) de la primera imagen. No se envían datos de clientas.
- La IA tiene la orden de **no inventar** tela, medidas, forro ni cuidados. Igual puede equivocarse: **hay que revisar antes de guardar**.

## Costo y límites

- Se usa el **nivel gratuito** de Gemini: no se cobra. Google fija un máximo de pedidos por minuto y por día (se ve en [Google AI Studio](https://aistudio.google.com)); cargar prendas a mano queda muy por debajo.
- Si se llega al límite, el botón avisa "Se alcanzó el límite gratuito" y la descripción se escribe a mano. Al día siguiente vuelve a funcionar.
- En el nivel gratuito, **Google puede usar lo enviado para mejorar sus productos** (aquí: nombres y fotos de prendas). Si eso no te gusta, se puede pasar al nivel pago de Google, donde no se usa.

## Instalación (una sola vez, unos 10 minutos)

### 1. Crear la clave de Gemini
1. Entrá a <https://aistudio.google.com> con una cuenta de Google.
2. Tocá **Get API key → Create API key**. No pide tarjeta.
3. Copiá la clave y no la compartas con nadie.

### 2. Crear la función en Supabase
1. En Supabase: **Edge Functions → Deploy a new function → Via Editor**.
2. Nombre: `sugerir-descripcion` (exactamente así).
3. Borrá el código de ejemplo y pegá todo el contenido de [`supabase/functions/sugerir-descripcion/index.ts`](../supabase/functions/sugerir-descripcion/index.ts).
4. **Deploy**. Dejá activada la opción *Verify JWT* (viene así por defecto).

### 3. Guardar la clave como secreto
1. En Supabase: **Edge Functions → Secrets** (o *Project Settings → Edge Functions*).
2. **Add new secret**: nombre `GEMINI_API_KEY`, valor: la clave del paso 1.
3. Opcional: otro secreto `GEMINI_MODEL` para cambiar de modelo (por defecto usa `gemini-3.5-flash-lite`, gratuito y rápido).

### 4. Probar
Panel → cargá una prenda, escribí el nombre, tocá **Sugerir con IA**. En unos segundos aparecen las 3 opciones.

## Si algo falla

| El botón dice | Qué pasa |
|---|---|
| "La función de IA todavía no está instalada" | Falta el paso 2 (o el nombre no es exactamente `sugerir-descripcion`). |
| "Falta configurar la clave de Gemini" | Falta el paso 3. |
| "Solo la administradora puede usar las sugerencias" | Se usó con una cuenta que no es administradora. |
| "Se alcanzó el límite gratuito" | Se llegó al tope diario o por minuto de Google. Esperar un rato o escribir a mano. |
| "La IA no pudo responder" | Falla momentánea de Google o el modelo cambió de nombre: probar de nuevo, o actualizar `GEMINI_MODEL` con un modelo vigente de la lista de AI Studio. |

Los errores técnicos quedan en **Edge Functions → sugerir-descripcion → Logs**.

## Cambiar el estilo de las descripciones

Las instrucciones para la IA están al principio de `supabase/functions/sugerir-descripcion/index.ts` (constante `SYSTEM_INSTRUCTION`). Para cambiar el tono, la longitud o las reglas, se edita ese texto y se vuelve a desplegar la función.
