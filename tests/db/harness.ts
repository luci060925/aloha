// Simula lo esencial de Supabase (roles, auth.uid(), auth.users) sobre PostgreSQL real (PGlite)
// y carga los scripts SQL REALES del proyecto. Todo es local y descartable: nunca toca producción.
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase');

export const IDS = {
  admin: '00000000-0000-0000-0000-0000000000a1',
  ana: '00000000-0000-0000-0000-0000000000b1', // clienta legítima
  eva: '00000000-0000-0000-0000-0000000000c1', // atacante (cuenta normal)
  vic: '00000000-0000-0000-0000-0000000000d1', // víctima que todavía no creó su perfil
  zoe: '00000000-0000-0000-0000-0000000000e1', // otra cuenta sin perfil
  p1: '11111111-1111-1111-1111-111111111111', // blazer $50.000 (abrigos-blazers)
  p2: '22222222-2222-2222-2222-222222222222', // vestido $30.000 (vestidos)
  p3: '33333333-3333-3333-3333-333333333333', // prenda agotada
} as const;

const SETUP = `
create role anon nologin; create role authenticated nologin;
create schema auth; create schema extensions;
create table auth.users (id uuid primary key, email text unique not null);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
-- Como en Supabase: todo objeto nuevo de public queda accesible a anon/authenticated y lo limita RLS (o un REVOKE explícito)
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
`;

const SEED = `
insert into auth.users(id,email) values
 ('${IDS.admin}','admin@aloha.test'),('${IDS.ana}','ana@aloha.test'),('${IDS.eva}','eva@aloha.test'),
 ('${IDS.vic}','Victima@Aloha.test'),('${IDS.zoe}','zoe@aloha.test');
insert into public.profiles(id,email,full_name,is_admin) values
 ('${IDS.admin}','admin@aloha.test','Admin',true),('${IDS.ana}','ana@aloha.test','Ana',false),('${IDS.eva}','eva@aloha.test','Eva',false);
insert into public.products(id,name,slug,price,category,subcategory,in_stock) values
 ('${IDS.p1}','Blazer','blazer',50000,'abrigos-blazers','blazers',true),
 ('${IDS.p2}','Vestido','vestido',30000,'vestidos','fiesta',true),
 ('${IDS.p3}','Agotada','agotada',10000,'vestidos','fiesta',false);
insert into public.coupons(code,discount_percentage,max_uses,target_category,is_active) values
 ('ALOHA10',10,2,'all',true),
 ('VESTIDOS20',20,null,'vestidos',true),
 ('VENCIDO',10,null,'all',true);
insert into public.coupons(code,discount_percentage,target_category,min_amount,is_active) values ('GRANDE10',10,'all',80000,true);
insert into public.coupons(code,discount_percentage,target_category,min_items,is_active) values ('TRES15',15,'all',3,true);
update public.coupons set expires_at = now() - interval '1 day' where code = 'VENCIDO';
`;

export type Db = PGlite;
export type Query = (sql: string, params?: unknown[]) => Promise<{ ok: true; rows: Record<string, unknown>[] } | { ok: false; error: string }>;

const FILES_BASE = ['database_schema.sql', 'rls_policies.sql', 'cupones.sql'];

export async function createDb(files: string[] = FILES_BASE): Promise<Db> {
  const db = new PGlite({ extensions: { uuid_ossp } });
  await db.exec(SETUP);
  for (const f of files) await db.exec(fs.readFileSync(path.join(SUPABASE_DIR, f), 'utf8'));
  await db.exec(SEED);
  return db;
}

export const HARDENED = [...FILES_BASE, 'hardening_seguridad.sql'];

/** Ejecuta `fn` como el rol indicado dentro de una transacción que SIEMPRE se revierte. */
export async function as<T>(db: Db, role: 'anon' | 'authenticated' | 'postgres', uid: string | null, fn: (q: Query) => Promise<T>): Promise<T> {
  await db.exec('begin');
  try {
    if (role !== 'postgres') await db.exec(`set local role ${role}`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [uid ? JSON.stringify({ sub: uid, role }) : '']);
    return await fn(async (sql, params) => {
      // Cada sentencia en un savepoint: un error esperado no aborta el resto de la transacción
      await db.exec('savepoint s');
      try {
        const r = await db.query(sql, params);
        await db.exec('release s');
        return { ok: true as const, rows: r.rows };
      } catch (e) {
        await db.exec('rollback to s');
        return { ok: false as const, error: (e as Error).message };
      }
    });
  } finally {
    await db.exec('rollback');
  }
}

// --- Ayudas para armar pedidos ---
export const item = (productId: string, price: number, quantity = 1) => ({
  productId, name: 'X', size: 'M', color: 'Negro', price, quantity,
});

const ORDER_SQL = `insert into public.orders(id,user_id,customer_name,items,subtotal,discount_amount,coupon_code,total,status)
                   values ($1,$2,'Cliente',$3::jsonb,$4,$5,$6,$7,'whatsapp_sent')`;

let seq = 0;
export interface OrderInput {
  userId: string;
  items: ReturnType<typeof item>[];
  subtotal: number;
  discount?: number;
  coupon?: string | null;
  total?: number;
  id?: string;
}
/** Inserta un pedido (con `q` de una sesión de usuaria). Por defecto total = subtotal − descuento. */
export function insertOrder(q: Query, o: OrderInput) {
  const discount = o.discount ?? 0;
  const id = o.id ?? `ORD-T${Date.now().toString(36).toUpperCase()}${(seq++).toString(36).toUpperCase()}`;
  return q(ORDER_SQL, [id, o.userId, JSON.stringify(o.items), o.subtotal, discount, o.coupon ?? null, o.total ?? o.subtotal - discount]);
}
