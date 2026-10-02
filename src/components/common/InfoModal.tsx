import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, 
  ShoppingBag, 
  MessageSquare, 
  RotateCcw, 
  FileText, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  ArrowRight,
  Tag
} from 'lucide-react';
import { openExternal, safeUrl } from '../../lib/external';
import { displayPhone } from '../../lib/phone';

export const InfoModal: React.FC = () => {
  const { activeInfoModal, setActiveInfoModal, settings } = useStore();

  if (!activeInfoModal) return null;

  const handleWhatsApp = () => {
    const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hola Aloha! Tengo una consulta sobre una compra.`);
    openExternal(`https://wa.me/${phone}?text=${msg}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#121212] text-white max-w-2xl w-full p-6 sm:p-10 relative shadow-2xl border border-neutral-800 rounded-2xl my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => setActiveInfoModal(null)}
          className="absolute top-5 right-5 w-9 h-9 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-800"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. CÓMO COMPRAR */}
        {activeInfoModal === 'como-comprar' && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-neutral-800">
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
                Guía Rápida
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mt-1">
                ¿Cómo Comprar en Aloha?
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 max-w-sm mx-auto">
                Elegí tus prendas en la web y coordiná el pago y retiro o envío directo por WhatsApp.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3.5">
              <div className="flex gap-4 p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl items-start">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  1
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-white">Elegí tus prendas y talles</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Navegá por las secciones, elegí el color y talle que prefieras y agregalos a tu bolsa de compras.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl items-start">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  2
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-white">Revisá tu bolsa de compras</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Comprobá las cantidades y aplicá cupones de descuento o promociones por cantidad si están vigentes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl items-start">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  3
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-white">Finalizá tu pedido por WhatsApp</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Hacé clic en <strong>"Finalizar Compra vía WhatsApp"</strong> para enviarnos el detalle exacto de tus prendas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl items-start">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  4
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-white">Coordiná pago y retiro o envío</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Podés abonar por transferencia bancaria o en efectivo/débito en nuestro local de <strong>{settings.address}</strong>, o solicitar envío a todo el país.
                  </p>
                </div>
              </div>
            </div>

            {/* Consejo de Seguridad y Verificación de Fuente Confiable */}
            <div className="p-4 bg-amber-950/40 border border-amber-700/70 rounded-xl space-y-2 text-left">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Consejo de Seguridad y Verificación</span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                Corroborá siempre estar comunicándote con la <strong>fuente oficial y confiable</strong> de Aloha a través de esta página web (número oficial de WhatsApp: <strong>{displayPhone(settings.whatsappNumber)}</strong>).
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Como consejo de compra segura, <strong>verificá bien todos los datos del destinatario, titularidad de la cuenta y detalle del pedido</strong> antes de realizar transferencias para no cometer equivocaciones.
              </p>
            </div>

            <button
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm"
            >
              Comenzar a Comprar
            </button>
          </div>
        )}

        {/* 2. POLÍTICA DE DEVOLUCIÓN Y CAMBIOS */}
        {/* TODO(revisar con contador/abogado y confirmar con la dueña): borrador ajustado a la Ley 24.240 de Defensa del Consumidor */}
        {activeInfoModal === 'devoluciones' && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-neutral-800">
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
                Atención & Garantía
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mt-1">
                Cambios y Devoluciones
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5">
                Políticas transparentes para el cuidado mutuo de nuestras clientas y nuestro showroom.
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-300 leading-relaxed max-h-80 overflow-y-auto pr-1">
              {/* Plazo 7 días */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Cambios de talle o modelo: 7 días corridos
                </h4>
                <p className="text-neutral-400">
                  Tenés <strong className="text-white">7 días corridos</strong> a partir de la fecha de entrega o retiro para solicitar un cambio de talle o modelo. Vencido este plazo, no se aceptarán solicitudes de cambio. Este plazo no limita tu derecho de arrepentimiento en compras online.
                </p>
              </div>

              {/* Arrepentimiento en compras a distancia */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  Compras online: derecho de arrepentimiento (10 días)
                </h4>
                <p className="text-neutral-300">
                  Si compraste a distancia (por la web y WhatsApp), podés revocar la compra dentro de los <strong className="text-white">10 días corridos</strong> desde que recibís la prenda, sin necesidad de dar motivos y con devolución del dinero.
                </p>
                <button
                  onClick={() => setActiveInfoModal('arrepentimiento')}
                  className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 underline underline-offset-4 hover:text-emerald-200 cursor-pointer"
                >
                  Ver cómo solicitarlo
                </button>
              </div>

              {/* Prendas para Regalo */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  Prendas para Regalo
                </h4>
                <p className="text-neutral-400">
                  Las compras efectuadas para regalo cuentan con el mismo plazo de <strong className="text-white">7 días corridos</strong> desde la entrega para realizar el cambio de talle o modelo (presentando ticket/comprobante de compra y prenda intacta con etiqueta).
                </p>
              </div>

              {/* Excepciones: Prendas SIN cambio */}
              <div className="p-4 bg-neutral-900/80 border border-amber-900/40 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Prendas SIN Cambio (Excepciones)
                </h4>
                <ul className="text-neutral-400 space-y-1 list-disc list-inside">
                  <li><strong className="text-white">Prendas probadas en el local:</strong> Aquellas prendas que hayan sido medidas y corroboradas presencialmente por la clienta en el showroom no admiten cambio posterior.</li>
                  <li><strong className="text-white">Prendas en Descuento / Sale / Liquidación:</strong> Las prendas adquiridas en oferta, promociones especiales o liquidación final no admiten cambio de talle o modelo. Esto no afecta el derecho de arrepentimiento en compras online ni la garantía por fallas de fábrica.</li>
                </ul>
              </div>

              {/* Valor de Cambio */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  Valor Tomado para el Cambio
                </h4>
                <p className="text-neutral-400">
                  En caso de cambio por otra prenda, se computará siempre el <strong className="text-white">valor efectivamente abonado</strong> al momento de la compra (reflejado en el comprobante).
                </p>
              </div>

              {/* Protocolo de Seguridad - Video Unboxing */}
              <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-red-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  Falla de fábrica: cómo reclamar
                </h4>
                <p className="text-neutral-300 leading-relaxed">
                  Si tu prenda llega con una falla de confección o rotura de origen, escribinos por WhatsApp con fotos. Para agilizar el reclamo en envíos por correo, <strong className="text-white">te recomendamos grabar un video del momento en que abrís el paquete</strong>, mostrando la prenda desde el primer momento.
                </p>
                <p className="text-[11px] text-neutral-400 italic">
                  * El video ayuda a acreditar el estado de la prenda al momento de la entrega. Si no lo tenés, igualmente analizamos tu caso.
                </p>
              </div>

              {/* Estado de la Prenda */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  Condiciones Indispensables de la Prenda
                </h4>
                <ul className="text-neutral-400 space-y-1 list-disc list-inside">
                  <li>La prenda debe estar <strong className="text-white">sin uso</strong>, sin lavar y sin alteraciones.</li>
                  <li>Debe conservar intactas sus <strong className="text-white">etiquetas originales colocadas</strong> y su packaging original.</li>
                  <li>No se aceptarán prendas con olores a perfume, tabaco, marcas de desodorante o maquillaje.</li>
                </ul>
              </div>

              {/* Procedimiento */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white" />
                  ¿Cómo Gestionar tu Cambio?
                </h4>
                <p className="text-neutral-400">
                  • <strong className="text-white">En Showroom:</strong> Acercate a {settings.address}, {settings.city} con tu comprobante.<br />
                  • <strong className="text-white">A Distancia / Envíos:</strong> Contactanos por WhatsApp con tu número de pedido para coordinar. El costo de envío de un cambio de talle o modelo corre por cuenta de la clienta; en caso de arrepentimiento o de falla de fábrica, los gastos de devolución están a cargo de Aloha.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* 2b. DERECHO DE ARREPENTIMIENTO (compras a distancia) */}
        {/* TODO(revisar con contador/abogado): la normativa (Ley 24.240 art. 34 y Res. 424/2020) exige informar este derecho y un botón de arrepentimiento visible */}
        {activeInfoModal === 'arrepentimiento' && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-neutral-800">
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
                Compras online
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mt-1">
                Botón de Arrepentimiento
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 max-w-sm mx-auto">
                Podés arrepentirte de tu compra dentro de los 10 días corridos desde que recibís la prenda.
              </p>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white">¿Cómo funciona?</h4>
                <ul className="text-neutral-400 space-y-1 list-disc list-inside">
                  <li>Tenés <strong className="text-white">10 días corridos</strong> desde la entrega de la prenda para revocar tu compra, sin dar explicaciones.</li>
                  <li>Aloha te <strong className="text-white">devuelve el dinero</strong> abonado y se hace cargo de los gastos de devolución.</li>
                  <li>La prenda debe estar sin uso y con sus etiquetas.</li>
                  <li>Te confirmamos por WhatsApp que recibimos tu solicitud.</li>
                </ul>
              </div>
              <p className="text-[11px] text-neutral-500">
                Este derecho no puede ser dispensado ni limitado por ninguna otra condición de esta tienda (Ley 24.240 de Defensa del Consumidor, art. 34).
              </p>
            </div>

            <button
              onClick={() => {
                const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
                const msg = encodeURIComponent('Hola Aloha! Quiero ejercer mi derecho de arrepentimiento sobre mi compra.\nNúmero de pedido: \nNombre y apellido: ');
                openExternal(`https://wa.me/${phone}?text=${msg}`);
              }}
              className="w-full py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Solicitar arrepentimiento por WhatsApp</span>
            </button>
          </div>
        )}

        {/* 3. TÉRMINOS Y CONDICIONES, SEGURIDAD & PRIVACIDAD */}
        {/* TODO(confirmar con la dueña y revisar con contador/abogado): plazo de retiro de 30 días, gift cards/vouchers, cámaras de seguridad y datos del comerciante (razón social, CUIT, domicilio legal) */}
        {activeInfoModal === 'terminos' && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-neutral-800">
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
                Marco Legal & Seguridad
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mt-1">
                Términos, Condiciones & Privacidad
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5">
                Aloha Indumentaria • Showroom Comodoro Rivadavia, Chubut, República Argentina.
              </p>
            </div>

            {/* Alerta de Canales Oficiales y Pagos */}
            <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Seguridad en Pagos y Verificación de Cuentas Oficiales
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-white">Canales Verificados:</strong> Antes de concretar pagos o enviar información, corroborá comunicarte exclusivamente a través de nuestro WhatsApp oficial <strong className="text-emerald-400 font-mono">{displayPhone(settings.whatsappNumber)}</strong> e Instagram oficial <strong className="text-white font-mono">@{settings.instagramHandle}</strong>.
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-white">Responsabilidad en Transferencias:</strong> El comprador debe verificar con atención el CBU, Alias, CUIT y nombre del titular antes de transferir. <span className="text-amber-300 font-semibold">Aloha Indumentaria no se responsabiliza ni realiza reintegros por equivocaciones en transferencias emitidas a cuentas bancarias de terceros o datos mal ingresados por el cliente.</span>
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-300 leading-relaxed max-h-72 overflow-y-auto pr-1">
              {/* 1. Plazo de Retiro */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  1. Plazo de Retiro en Showroom (Guarda de Pedidos)
                </h4>
                <p className="text-neutral-400">
                  Los pedidos abonados para retiro en el local disponen de un <strong className="text-white">plazo máximo de 1 mes (30 días corridos)</strong> a partir de la confirmación de la compra para ser retirados en nuestro showroom. Transcurrido dicho plazo, el local no asume responsabilidad por la guarda prolongada ni disponibilidad indefinida del paquete.
                </p>
              </div>

              {/* 2. Cupones de Descuento y Promociones (No Acumulables y Exclusivos Online) */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  2. Cupones de Descuento y Promociones
                </h4>
                <p className="text-neutral-300 leading-relaxed">
                  Los cupones de descuento y códigos promocionales son <strong className="text-white">estrictamente válidos y exclusivos para la venta online</strong> a través de nuestra plataforma web. Se permite el uso de <strong className="text-white">un solo cupón por compra</strong>; los cupones <span className="text-white font-semibold">no son acumulables</span> entre sí ni con otras promociones o descuentos especiales vigentes, ni tienen validez para compras presenciales directas en el showroom salvo indicación expresa de la marca.
                </p>
              </div>

              {/* 3. Vouchers de Regalo */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  3. Vouchers de Compra y Gift Cards para Regalo
                </h4>
                <p className="text-neutral-400">
                  Es posible adquirir <strong className="text-white">Vouchers de Compra / Gift Cards</strong> a nombre de un tercero para que otra persona pueda elegir y canjear sus prendas favoritas tanto en la web como en el showroom presencial.
                </p>
              </div>

              {/* 4. Seguridad en Showroom y Retiros por Terceros */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  4. Seguridad en Showroom y Retiro por Terceros
                </h4>
                <p className="text-neutral-400">
                  Para resguardo y seguridad de nuestras clientas, si el retiro en local lo realiza una tercera persona, deberá presentar el comprobante de compra o haber sido autorizada previamente vía WhatsApp informando nombre completo y DNI. Nuestro showroom cuenta con circuito cerrado de cámaras para protección y seguridad mutua.
                </p>
              </div>

              {/* 4. Privacidad y Resguardo de Datos Personales */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  5. Resguardo y Privacidad de Datos del Cliente
                </h4>
                <p className="text-neutral-400">
                  Toda la información personal suministrada por los clientes (nombre, teléfono, correo, domicilio y comprobantes) queda bajo <strong className="text-white">estricto resguardo y confidencialidad de Aloha Indumentaria</strong>, en cumplimiento con la Ley N° 25.326 de Protección de Datos Personales. Jamás será cedida ni comercializada a terceros, utilizándose únicamente para la gestión logística de entrega y atención directa.
                </p>
              </div>

              {/* 5. Logística, Envíos y Reenvíos */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white" />
                  6. Envíos Nacionales, Seguimiento y Reenvíos
                </h4>
                <p className="text-neutral-400">
                  Una vez despachado el pedido y proporcionado el código de seguimiento, los plazos de entrega y visitas corresponden a la empresa de correo seleccionada. En caso de que el correo devuelva el paquete al showroom por dirección incorrecta provista por el cliente o por vencimiento del plazo de retiro en sucursal, el costo del reenvío será a cargo exclusivo de la clienta.
                </p>
              </div>

              {/* 6. Cuidados y Lavado de las Prendas */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-white" />
                  7. Cuidados y Mantenimiento de Prendas
                </h4>
                <p className="text-neutral-400">
                  Cada prenda requiere cuidados especiales según su composición textil. La garantía no cubre daños, encogimientos, desteñidos o deformaciones ocasionadas por mal lavado (como uso de agua caliente, secarropas por calor, lavandina, plancha directa en apliques o centrifugado inadecuado en telas delicadas).
                </p>
              </div>

              {/* 7. Variaciones de Tono por Pantalla */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  8. Tonalidades y Calibración de Pantalla
                </h4>
                <p className="text-neutral-400">
                  Las fotografías de catálogo buscan reflejar fielmente cada producto; no obstante, pueden existir leves variaciones de tono atribuibles a la iluminación fotográfica o a la calibración de color, brillo y pantalla del dispositivo de la clienta.
                </p>
              </div>

              {/* 8. Quiebre de Stock Simultáneo */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white" />
                  9. Disponibilidad y Quiebre de Stock Simultáneo
                </h4>
                <p className="text-neutral-400">
                  En caso fortuito de coincidencia simultánea en la venta de la última unidad entre el showroom presencial y la web, nos comunicaremos inmediatamente con la clienta para ofrecerle una prenda similar de su preferencia o la devolución total e inmediata del dinero.
                </p>
              </div>

              {/* 9. Propiedad Intelectual */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                <h4 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  10. Propiedad Intelectual y Marca
                </h4>
                <p className="text-neutral-400">
                  Todas las imágenes de producciones, fotografías de catálogo, logotipos y contenidos de esta plataforma son propiedad de <strong>Aloha Indumentaria</strong>. Queda terminantemente prohibida su reproducción o uso comercial no autorizado por terceros o revendedoras.
                </p>
              </div>
            </div>

            <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5 text-xs">
              <h4 className="font-sans text-sm font-bold text-white">Defensa del Consumidor</h4>
              <p className="text-neutral-400 leading-relaxed">
                Tenés derecho a revocar tu compra online dentro de los 10 días corridos de recibirla (
                <button
                  onClick={() => setActiveInfoModal('arrepentimiento')}
                  className="text-white underline underline-offset-4 hover:text-neutral-300 cursor-pointer"
                >
                  Botón de Arrepentimiento
                </button>
                ). Ante cualquier reclamo podés acudir a la{' '}
                <a
                  href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-4 hover:text-neutral-300"
                >
                  Dirección Nacional de Defensa del Consumidor
                </a>
                .
              </p>
            </div>

            <button
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* 4. CONTACTO Y HISTORIA DE LA DUEÑA */}
        {activeInfoModal === 'contacto' && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-neutral-800">
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
                Conocé Aloha
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mt-1">
                Sobre Nosotras
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5">
                Diseño, elegancia y atención personalizada en Comodoro Rivadavia.
              </p>
            </div>

            {/* TODO(pedir a Camila): su historia de la marca y foto, si quiere mostrarlas. Hasta entonces, texto neutro. */}
            <div className="p-5 bg-gradient-to-br from-neutral-900 to-[#181818] border border-neutral-800 rounded-2xl">
              <h4 className="font-serif text-base font-bold text-white mb-2">Sobre Aloha</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Aloha Indumentaria es el showroom de moda femenina de Camila en {settings.city}. Elegí tus prendas en la web y coordiná tu pedido, el pago y el retiro o envío directamente con nosotras por WhatsApp.
              </p>
            </div>

            {/* Canales Oficiales Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                onClick={(e) => {
                  e.preventDefault();
                  openExternal(`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`);
                }}
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3 hover:bg-emerald-900/40 transition-colors group"
              >
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold block">WhatsApp Oficial</span>
                  <span className="font-mono text-xs font-bold text-white">{displayPhone(settings.whatsappNumber)}</span>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={safeUrl(settings.instagramUrl)}
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3 hover:bg-neutral-800/80 transition-colors group"
              >
                <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-bold block">Instagram Oficial</span>
                  <span className="font-mono text-xs font-bold text-white">@{settings.instagramHandle}</span>
                </div>
              </a>
            </div>

            <button
              onClick={handleWhatsApp}
              className="w-full py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-sm"
            >
              <span>Escribinos por WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};