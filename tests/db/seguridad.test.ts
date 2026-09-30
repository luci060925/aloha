// Pruebas de seguridad de la base (informe.md). Cada bloque indica el hallazgo SEC-xxx que verifica.
// `npm test` las ejecuta en una copia local de PostgreSQL (PGlite) con los mismos scripts SQL de supabase/.
import { beforeAll, describe, expect, test } from 'vitest';
import { as, createDb, HARDENED, IDS, insertOrder, item, type Db } from './harness';

let db: Db;
beforeAll(async () => {
  // AUDIT_BASELINE=1 carga la base SIN el endurecimiento: sirve para comprobar que las pruebas detectan las vulnerabilidades
  db = await createDb(process.env.AUDIT_BASELINE ? undefined : HARDENED);
}, 60_000);

const blazer = (qty = 1, price = 50000) => item(IDS.p1, price, qty);
const vestido = (qty = 1, price = 30000) => item(IDS.p2, price, qty);

describe('Controles previos que deben seguir funcionando (regresión de la auditoría anterior)', () => {
  test('un visitante sin sesión no puede crear pedidos ni leer perfiles', async () => {
    await as(db, 'anon', null, async q => {
      expect((await insertOrder(q, { userId: IDS.eva, items: [blazer()], subtotal: 50000 })).ok).toBe(false);
      const r = await q('select count(*)::int as n from public.profiles');
      expect(r.ok && r.rows[0].n).toBe(0);
    });
  });

  test('una clienta no puede otorgarse is_admin', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      await q('update public.profiles set is_admin = true where id = $1', [IDS.eva]);
      const r = await q('select is_admin from public.profiles where id = $1', [IDS.eva]);
      expect(r.ok && r.rows[0].is_admin).toBe(false);
    });
  });

  test('una clienta no puede crear un pedido a nombre de otra', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      expect((await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000 })).ok).toBe(false);
    });
  });

  test('una clienta no ve los pedidos de otra ni la administradora deja de verlos', async () => {
    await db.exec('begin');
    await db.exec(`insert into public.orders(id,user_id,customer_name,items,subtotal,total)
                   values ('ORD-ANA1','${IDS.ana}','Ana','[{"productId":"${IDS.p1}","quantity":1,"price":50000}]',50000,50000)`);
    const ver = async (uid: string, role: 'authenticated') => {
      await db.exec(`set local role ${role}`);
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid })]);
      const r = await db.query('select count(*)::int as n from public.orders');
      await db.exec('reset role');
      return (r.rows[0] as { n: number }).n;
    };
    expect(await ver(IDS.eva, 'authenticated')).toBe(0);
    expect(await ver(IDS.ana, 'authenticated')).toBe(1);
    expect(await ver(IDS.admin, 'authenticated')).toBe(1);
    await db.exec('rollback');
  });
});

describe('SEC-001 · Pedidos: precios, cantidades, totales y descuentos se validan en el servidor', () => {
  test('rechaza un precio unitario adulterado', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      const r = await insertOrder(q, { userId: IDS.eva, items: [blazer(1, 1)], subtotal: 1 });
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toMatch(/precio/i);
    });
  });

  test('rechaza cantidades negativas, cero, decimales o mayores a 50', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      for (const qty of [-3, 0, 1.5, 51]) {
        const r = await insertOrder(q, { userId: IDS.eva, items: [blazer(qty)], subtotal: 50000 * qty });
        expect(r.ok, `cantidad ${qty}`).toBe(false);
      }
    });
  });

  test('rechaza un descuento del 100 % sin promoción', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      const r = await insertOrder(q, { userId: IDS.eva, items: [blazer()], subtotal: 50000, discount: 50000 });
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toMatch(/descuento/i);
    });
  });

  test('rechaza un subtotal o un total que no coinciden', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      expect((await insertOrder(q, { userId: IDS.eva, items: [blazer()], subtotal: 40000 })).ok).toBe(false);
      expect((await insertOrder(q, { userId: IDS.eva, items: [blazer()], subtotal: 50000, total: 100 })).ok).toBe(false);
    });
  });

  test('rechaza prendas inexistentes, agotadas o con datos inválidos', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      const fantasma = item('99999999-9999-9999-9999-999999999999', 100);
      expect((await insertOrder(q, { userId: IDS.eva, items: [fantasma], subtotal: 100 })).ok).toBe(false);
      expect((await insertOrder(q, { userId: IDS.eva, items: [item(IDS.p3, 10000)], subtotal: 10000 })).ok).toBe(false);
      expect((await insertOrder(q, { userId: IDS.eva, items: [item('no-es-uuid', 5)], subtotal: 5 })).ok).toBe(false);
    });
  });

  test('rechaza identificadores de pedido con formato inválido', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      expect((await insertOrder(q, { userId: IDS.eva, id: 'hack; drop', items: [blazer()], subtotal: 50000 })).ok).toBe(false);
    });
  });

  test('REGRESIÓN: acepta un pedido legítimo sin descuento', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const r = await insertOrder(q, { userId: IDS.ana, items: [blazer(), vestido()], subtotal: 80000 });
      expect(r.ok, !r.ok ? r.error : '').toBe(true);
    });
  });

  test('no hay descuentos automáticos: ni por cantidad, ni por monto, ni global (aunque estén activados en la base)', async () => {
    await db.exec(`update public.store_settings set volume_discount_active = true, volume_discount_min_items = 3, volume_discount_percentage = 15,
                   price_discount_active = true, price_discount_min_amount = 80000, price_discount_percentage = 10,
                   global_discount_active = true, global_discount_percentage = 5 where id = 1`);
    await as(db, 'authenticated', IDS.ana, async q => {
      const volumen = await insertOrder(q, { userId: IDS.ana, items: [blazer(3)], subtotal: 150000, discount: 22500, coupon: 'VOLUMEN-15%' });
      expect(volumen.ok).toBe(false); // la etiqueta VOLUMEN ya no existe
      const sinEtiqueta = await insertOrder(q, { userId: IDS.ana, items: [blazer(3)], subtotal: 150000, discount: 22500 });
      expect(sinEtiqueta.ok).toBe(false);
      const global = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 2500 });
      expect(global.ok).toBe(false);
    });
    await db.exec(`update public.store_settings set volume_discount_active = false, price_discount_active = false, global_discount_active = false where id = 1`);
  });
});

describe('SEC-002 · Cupones: se validan al usarlos y no se pueden agotar sin aprovecharlos', () => {
  test('rechaza cupones inexistentes, vencidos o inactivos', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      for (const coupon of ['INVENTADO50', 'VENCIDO']) {
        const r = await insertOrder(q, { userId: IDS.eva, items: [blazer()], subtotal: 50000, discount: 5000, coupon });
        expect(r.ok, coupon).toBe(false);
        expect(!r.ok && r.error).toMatch(/cup[oó]n/i);
      }
    });
  });

  test('un cupón válido descuenta lo que corresponde y suma un uso', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const r = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 5000, coupon: 'ALOHA10' });
      expect(r.ok, !r.ok ? r.error : '').toBe(true);
      await db.exec('reset role'); // las clientas no leen la tabla de cupones: se consulta como administrador de la base
      const c = (await db.query(`select used_count from public.coupons where code = 'ALOHA10'`)).rows[0] as { used_count: number };
      expect(c.used_count).toBe(1);
    });
  });

  test('rechaza un descuento mayor al del cupón', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const r = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 25000, coupon: 'ALOHA10' });
      expect(r.ok).toBe(false);
    });
  });

  test('una clienta usa cada cupón una sola vez, y un pedido cancelado lo libera', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const primero = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 5000, coupon: 'ALOHA10', id: 'ORD-UNAVEZ1' });
      expect(primero.ok, !primero.ok ? primero.error : '').toBe(true);
      const segundo = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 5000, coupon: 'aloha10' });
      expect(segundo.ok).toBe(false);
      expect(!segundo.ok && segundo.error).toMatch(/solo uso|ya usaste/i);
      // otro cupón sí puede usarlo
      const otro = await insertOrder(q, { userId: IDS.ana, items: [vestido()], subtotal: 30000, discount: 6000, coupon: 'VESTIDOS20' });
      expect(otro.ok, !otro.ok ? otro.error : '').toBe(true);
      // si el primer pedido se cancela, el cupón queda libre otra vez
      await db.exec('reset role');
      await db.exec(`update public.orders set status = 'cancelled' where id = 'ORD-UNAVEZ1'`);
      await db.exec('set local role authenticated');
      const tercero = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 5000, coupon: 'ALOHA10' });
      expect(tercero.ok, !tercero.ok ? tercero.error : '').toBe(true);
    });
  });

  test('un pedido con cupón pero sin descuento real no gasta el cupón ni lo bloquea', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      // El blazer no es de vestidos: el cupón no descuenta nada, pero el pedido es válido
      const sinDescuento = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 0, coupon: 'VESTIDOS20' });
      expect(sinDescuento.ok, !sinDescuento.ok ? sinDescuento.error : '').toBe(true);
      const conDescuento = await insertOrder(q, { userId: IDS.ana, items: [vestido()], subtotal: 30000, discount: 6000, coupon: 'VESTIDOS20' });
      expect(conDescuento.ok, !conDescuento.ok ? conDescuento.error : '').toBe(true);
    });
  });

  test('el cupo se respeta: con 2 usos el tercer pedido es rechazado (no se puede agotar de más)', async () => {
    await db.exec('begin');
    await db.exec(`set local role authenticated`);
    const resultados: boolean[] = [];
    // Tres clientas distintas (cada una puede usarlo una vez) contra un cupón con cupo de 2
    for (const [i, uid] of [IDS.ana, IDS.eva, IDS.admin].entries()) {
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid })]);
      await db.exec('savepoint s');
      try {
        await db.query(
          `insert into public.orders(id,user_id,customer_name,items,subtotal,discount_amount,coupon_code,total,status)
           values ($1,$2,'X',$3::jsonb,50000,5000,'ALOHA10',45000,'whatsapp_sent')`,
          [`ORD-CUPO${i}`, uid, JSON.stringify([blazer()])]
        );
        await db.exec('release s');
        resultados.push(true);
      } catch {
        await db.exec('rollback to s');
        resultados.push(false);
      }
    }
    await db.exec('reset role');
    const used = (await db.query(`select used_count from public.coupons where code = 'ALOHA10'`)).rows[0] as { used_count: number };
    await db.exec('rollback');
    expect(resultados.filter(Boolean).length).toBe(2);
    expect(used.used_count).toBe(2);
  });

  test('un cupón por categoría solo descuenta sobre las prendas de esa categoría', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      // El blazer no es de "vestidos": el descuento sobre él no corresponde
      const mal = await insertOrder(q, { userId: IDS.ana, items: [blazer()], subtotal: 50000, discount: 10000, coupon: 'VESTIDOS20' });
      expect(mal.ok).toBe(false);
      // Vestido (30.000) + blazer (50.000): 20 % solo sobre el vestido = 6.000
      const ok = await insertOrder(q, { userId: IDS.ana, items: [vestido(), blazer()], subtotal: 80000, discount: 6000, coupon: 'VESTIDOS20' });
      expect(ok.ok, !ok.ok ? ok.error : '').toBe(true);
    });
  });
});

describe('SEC-003 · Perfiles: email, is_admin e id no los controla la clienta', () => {
  test('cambiar el email del perfil no tiene efecto (sale de la cuenta de acceso)', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      await q(`update public.profiles set email = 'victima@aloha.test' where id = $1`, [IDS.eva]);
      const r = await q('select email from public.profiles where id = $1', [IDS.eva]);
      expect(r.ok && r.rows[0].email).toBe('eva@aloha.test');
    });
  });

  test('la víctima real puede crear su perfil aunque otra cuenta haya intentado su correo', async () => {
    await db.exec('begin');
    await db.exec(`set local role authenticated`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: IDS.eva })]);
    await db.query(`update public.profiles set email = 'victima@aloha.test' where id = $1`, [IDS.eva]);
    await db.exec('reset role');
    await db.exec(`set local role authenticated`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: IDS.vic })]);
    const r = await db.query(`insert into public.profiles(id,email,full_name) values ($1,'lo-que-sea@x.com','Víctima') returning email`, [IDS.vic]);
    await db.exec('reset role');
    await db.exec('rollback');
    expect((r.rows[0] as { email: string }).email).toBe('victima@aloha.test'); // en minúsculas, tomado de la cuenta
  });

  test('crear un perfil con el email de otra persona no lo pisa: se guarda el de la propia cuenta', async () => {
    await as(db, 'authenticated', IDS.zoe, async q => {
      const r = await q(`insert into public.profiles(id,email,full_name) values ($1,'ana@aloha.test','Zoe') returning email`, [IDS.zoe]);
      expect(r.ok && r.rows[0].email).toBe('zoe@aloha.test');
    });
  });

  test('nadie puede crear su perfil ya como administradora (el rol queda en false)', async () => {
    await as(db, 'authenticated', IDS.zoe, async q => {
      const r = await q(`insert into public.profiles(id,email,full_name,is_admin) values ($1,'x@x.com','Zoe',true) returning is_admin`, [IDS.zoe]);
      expect(r.ok && r.rows[0].is_admin).toBe(false);
    });
  });

  test('la administradora sí puede cambiar el rol de otra cuenta', async () => {
    await as(db, 'authenticated', IDS.admin, async q => {
      await q('update public.profiles set is_admin = true where id = $1', [IDS.ana]);
      const r = await q('select is_admin from public.profiles where id = $1', [IDS.ana]);
      expect(r.ok && r.rows[0].is_admin).toBe(true);
    });
  });

  test('desde el panel de Supabase (sin sesión de usuaria) se puede seguir otorgando is_admin', async () => {
    await as(db, 'postgres', null, async q => {
      await q('update public.profiles set is_admin = true where id = $1', [IDS.ana]);
      const r = await q('select is_admin from public.profiles where id = $1', [IDS.ana]);
      expect(r.ok && r.rows[0].is_admin).toBe(true);
    });
  });

  test('el id de un perfil no se puede reasignar', async () => {
    await as(db, 'authenticated', IDS.eva, async q => {
      await q('update public.profiles set id = $1 where id = $2', [IDS.ana, IDS.eva]);
      const r = await q('select count(*)::int as n from public.profiles where id = $1', [IDS.eva]);
      expect(r.ok && r.rows[0].n).toBe(1);
    });
  });
});

describe('SEC-004 · Límites de frecuencia y de tamaño', () => {
  test('máximo 10 pedidos por hora por cuenta', async () => {
    await db.exec('begin');
    await db.exec(`set local role authenticated`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: IDS.eva })]);
    let aceptados = 0;
    for (let i = 0; i < 25; i++) {
      await db.exec('savepoint s');
      try {
        await db.query(
          `insert into public.orders(id,user_id,customer_name,items,subtotal,discount_amount,total,status)
           values ($1,$2,'X',$3::jsonb,50000,0,50000,'whatsapp_sent')`,
          [`ORD-LIM${i}`, IDS.eva, JSON.stringify([blazer()])]
        );
        await db.exec('release s');
        aceptados++;
      } catch {
        await db.exec('rollback to s');
        break;
      }
    }
    await db.exec('reset role');
    await db.exec('rollback');
    expect(aceptados).toBe(10);
  });

  test('rechaza mensajes, nombres e ítems desmesurados', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const largo = 'x'.repeat(5000);
      const r1 = await q(
        `insert into public.orders(id,user_id,customer_name,items,subtotal,total,whatsapp_message,status)
         values ('ORD-BIG1',$1,'X',$2::jsonb,50000,50000,$3,'whatsapp_sent')`,
        [IDS.ana, JSON.stringify([blazer()]), largo]
      );
      expect(r1.ok).toBe(false);
      const r2 = await q('update public.profiles set full_name = $1 where id = $2', ['n'.repeat(500), IDS.ana]);
      expect(r2.ok).toBe(false);
      const muchos = Array.from({ length: 31 }, () => blazer());
      const r3 = await insertOrder(q, { userId: IDS.ana, items: muchos, subtotal: 50000 * 31 });
      expect(r3.ok).toBe(false);
    });
  });
});

describe('SEC-006 · get_coupon requiere sesión', () => {
  test('un visitante sin sesión no puede ejecutarla', async () => {
    await as(db, 'anon', null, async q => {
      const r = await q(`select * from public.get_coupon('ALOHA10')`);
      expect(r.ok).toBe(false);
    });
  });

  test('una clienta con sesión sí puede validar un cupón', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const r = await q(`select code from public.get_coupon('aloha10')`);
      expect(r.ok && r.rows.length).toBe(1);
    });
  });
});

describe('SEC-009 · avatar_url solo de Google', () => {
  test('rechaza una URL de un sitio de terceros y acepta una de Google', async () => {
    await as(db, 'authenticated', IDS.ana, async q => {
      const mal = await q(`update public.profiles set avatar_url = 'https://atacante.example/pixel.gif' where id = $1`, [IDS.ana]);
      expect(mal.ok).toBe(false);
      const script = await q(`update public.profiles set avatar_url = 'javascript:alert(1)' where id = $1`, [IDS.ana]);
      expect(script.ok).toBe(false);
      const bien = await q(`update public.profiles set avatar_url = 'https://lh3.googleusercontent.com/a/abc=s96-c' where id = $1`, [IDS.ana]);
      expect(bien.ok, !bien.ok ? bien.error : '').toBe(true);
    });
  });
});
