// Supabase Edge Function (Deno): sugiere descripciones de prendas con Gemini.
// Instalación paso a paso: docs/ia-descripciones.md
//
// - Solo la administradora puede usarla (se verifica con is_admin() de la base).
// - La clave de Gemini vive en un secreto de Supabase (GEMINI_API_KEY): nunca llega al navegador.
// - Devuelve 3 descripciones: cercana, elegante y canchera.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const MAX_BODY_BYTES = 1_800_000;
const MAX_IMAGE_BASE64 = 1_400_000;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

const SYSTEM_INSTRUCTION = `Sos redactora de moda de Aloha Indumentaria, un showroom de moda femenina de Comodoro Rivadavia (Argentina).
Escribí en español rioplatense, con voseo ("llevás", "combinás", "elegí").
Devolvé EXACTAMENTE 3 descripciones, cada una un párrafo corto (2 o 3 oraciones, máximo 350 caracteres).
Las 3 tienen que ser MUY DISTINTAS entre sí: cada una con su tono y su enfoque, y sin repetir ideas ni palabras clave entre ellas.
1. Cercana (enfoque: USO). Tono amigable y práctico: en qué momentos se usa y con qué se arma.
2. Elegante (enfoque: DISEÑO). Tono sobrio y sofisticado: qué se ve en la prenda (corte, caída, línea, detalles).
3. Canchera (enfoque: ACTITUD). Tono juvenil y directo: cómo hace sentir a quien la usa. Corta y con carácter.
Reglas obligatorias:
- Usá solamente los datos recibidos, los "Datos de la dueña" (son ciertos y podés usarlos) y lo que se ve en la foto.
- NO inventes tela, composición, medidas, forro, cuidados, origen ni precios que no estén en esos datos.
- Nombrá la prenda de maneras distintas en cada opción (no repitas siempre el mismo sustantivo).
- No empieces dos descripciones con la misma palabra ni con la misma estructura. Seguí la sugerencia de apertura de cada una.
- Evitá estas frases gastadas: "comodín", "esencial", "infaltable", "no puede faltar", "imprescindible", "must have", "para todos los días", "jean y pollera".
- Mencioná los colores y los talles solo si aportan, y no en las 3.
- Sin emojis, sin hashtags, sin comillas y sin marcas.
- Respondé únicamente con un arreglo JSON de 3 textos.`;

// Sugerencias de apertura: se sortean en cada pedido para que apretar de nuevo dé resultados distintos
const OPENING_HINTS = [
  'arrancá por la ocasión en que la usarías',
  'arrancá por un detalle concreto de la prenda',
  'arrancá por cómo se siente usarla',
  'arrancá con una pregunta corta',
  'arrancá con el nombre de la prenda',
  'arrancá con el color',
  'arrancá con una frase corta y afirmativa',
];
const pickOpenings = (): string[] =>
  [...OPENING_HINTS].sort(() => Math.random() - 0.5).slice(0, 3);

const clean = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const cleanList = (value: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(value) ? value.map(v => clean(v, maxLen)).filter(Boolean).slice(0, maxItems) : [];

/** Saca los textos de la respuesta de Gemini, aunque venga envuelta en un bloque de código. */
function parseOptions(text: string): string[] {
  const unfenced = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = unfenced.indexOf('[');
  const end = unfenced.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(unfenced.slice(start, end + 1));
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean).slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return reply(405, { error: 'Método no permitido.' });

  // 1. Solo la administradora
  const authorization = req.headers.get('Authorization');
  if (!authorization) return reply(401, { error: 'Iniciá sesión como administradora.' });
  // La clave pública llega también en el encabezado "apikey" (la manda el sitio): sirve de respaldo si el proyecto usa claves nuevas
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY') ?? req.headers.get('apikey') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', publicKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || isAdmin !== true) return reply(403, { error: 'Solo la administradora puede usar las sugerencias.' });

  // 2. Datos de entrada
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return reply(413, { error: 'La foto es demasiado grande.' });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'Pedido inválido.' });
  }

  const name = clean(body.name, 120);
  if (!name) return reply(400, { error: 'Falta el nombre de la prenda.' });
  const category = clean(body.category, 80);
  const subcategory = clean(body.subcategory, 80);
  const colors = cleanList(body.colors, 10, 30);
  const sizes = cleanList(body.sizes, 15, 20);
  const notes = clean(body.notes, 300);
  const openings = pickOpenings();

  const parts: Record<string, unknown>[] = [];
  const image = body.image as { mimeType?: unknown; data?: unknown } | undefined;
  if (image && typeof image.data === 'string' && image.data.length > 0) {
    if (typeof image.mimeType !== 'string' || !ALLOWED_IMAGE_TYPES.includes(image.mimeType) || image.data.length > MAX_IMAGE_BASE64) {
      return reply(400, { error: 'La foto no tiene un formato válido o es muy grande.' });
    }
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }
  parts.push({
    text: [
      `Prenda: ${name}`,
      category && `Categoría: ${category}`,
      subcategory && `Subcategoría: ${subcategory}`,
      colors.length > 0 && `Colores: ${colors.join(', ')}`,
      sizes.length > 0 && `Talles: ${sizes.join(', ')}`,
      notes && `Datos de la dueña: ${notes}`,
      parts.length > 0 ? 'Mirá la foto adjunta para describir lo que se ve.' : 'No hay foto: usá solo los datos de arriba.',
      `Aperturas sugeridas: la 1) ${openings[0]}; la 2) ${openings[1]}; la 3) ${openings[2]}.`,
    ].filter(Boolean).join('\n'),
  });

  // 3. Gemini
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return reply(500, { error: 'Falta configurar la clave de Gemini en Supabase (GEMINI_API_KEY).' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 1.1,
          responseMimeType: 'application/json',
          responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
        },
      }),
    });
  } catch {
    return reply(504, { error: 'La IA tardó demasiado en responder. Probá de nuevo.' });
  } finally {
    clearTimeout(timeout);
  }

  if (geminiResponse.status === 429) {
    return reply(429, { error: 'Se alcanzó el límite gratuito de la IA por ahora. Probá más tarde o escribí la descripción a mano.' });
  }
  if (!geminiResponse.ok) {
    console.error('Gemini respondió', geminiResponse.status, await geminiResponse.text().catch(() => ''));
    return reply(502, { error: 'La IA no pudo responder. Probá de nuevo en un rato.' });
  }

  const data = await geminiResponse.json().catch(() => null);
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const options = parseOptions(text);
  if (options.length === 0) return reply(502, { error: 'La IA no devolvió sugerencias válidas. Probá de nuevo.' });

  return reply(200, { options });
});
