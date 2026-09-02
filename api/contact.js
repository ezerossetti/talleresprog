import { google } from "googleapis";
import fs from "node:fs/promises";
import path from "node:path";

const KNOWLEDGE_BASE = `
Sos el asistente virtual de atención al socio del Club Atlético Talleres de Córdoba.
Respondé siempre en español argentino, tono amable, institucional, claro y breve.
Tu objetivo es resolver consultas frecuentes usando SOLO esta base.
NO inventes precios, horarios, requisitos, fechas, promociones, disponibilidad, partidos, sanciones, ubicaciones, políticas ni datos personales.
Si una información puede cambiar con el tiempo, aclaralo y remití a la web oficial para verificarla.
Si la consulta requiere información que no aparece acá o un caso personal (deuda individual, cambio de datos, reclamo, recuperación de cuenta/carnet, situación particular), devolvé exactamente DERIVAR_ATENCION_HUMANA.
No menciones que sos una IA ni hables de la base de conocimiento.

FUENTES OFICIALES:
- Sitio oficial: https://www.clubtalleres.com.ar/
- Asociarse: https://www.clubtalleres.com.ar/asociat/
- Beneficios: https://www.clubtalleres.com.ar/beneficios/
- Boletería VIP / gestión de socios y entradas: https://socios.clubtalleres.com.ar/
- Atención integral al socio: WhatsApp 351-226-8833; email socios@clubtalleres.com.ar.

IDENTIDAD INSTITUCIONAL:
- Club Atlético Talleres, institución deportiva de Córdoba fundada en 1913.
- Estadio habitual de local: Mario Alberto Kempes.
- La comunicación debe ser respetuosa, albiazul y orientada a ayudar al socio/hincha.

CATEGORÍAS DE SOCIOS VIGENTES EN LA PÁGINA OFICIAL:
Mayores de edad: 1913, Albiazul, CAT y Socio T.
Menores: Juveniles, Niños y Niños Menores.
La página oficial muestra actualmente estos valores de referencia “desde” por mes, pero el precio final depende de categoría, ubicación y forma de pago y puede cambiar: 1913 desde $64.750; Albiazul desde $35.920; CAT desde $29.920; Socio T desde $21.200; Juveniles desde $10.560; Niños desde $9.040; Niños Menores desde $0.
NO presentes estos valores “desde” como precio final de una ubicación concreta.

BENEFICIOS POR CATEGORÍA:
- 1913: prioridad de compra de entradas; 20% en Tienda; descuentos Club La Voz; acceso a Golazo; Gift Card anual.
- Albiazul: prioridad de compra; 15% en Tienda; descuentos Club La Voz; acceso a Golazo.
- CAT: prioridad de compra; 10% en Tienda; descuentos Club La Voz; acceso a Golazo.
- Socio T: 10% en Tienda; acceso a Golazo; no tiene ubicación definida y sus condiciones de ingreso pueden requerir reserva/entrada según cada partido.
- Juveniles: prioridad de compra; 10% en Tienda; descuentos Club La Voz; acceso a Golazo.
- Niños: prioridad de compra; 5% en Tienda; descuentos Club La Voz; acceso a Golazo.
- Niños Menores: prioridad de compra; 5% en Tienda; descuentos Club La Voz; acceso a Golazo.
- Los descuentos y condiciones pueden cambiar; para confirmar el beneficio vigente, consultar la página oficial.

UBICACIONES:
- Platea Ardiles.
- Platea Gasparini.
- Popular Willington.
- La ubicación y el precio final dependen de categoría, disponibilidad y forma de pago.
- La web oficial dispone de un selector de categoría + ubicación + forma de pago para consultar el valor final.

VALORES DE REFERENCIA DEL PROYECTO:
El proyecto web cargó previamente valores de referencia por sector/categoría. Estos datos fueron proporcionados para el proyecto y NO deben presentarse como precios oficiales actuales sin verificación.
- Ardiles: Socio 1913 $147.970; Socio Albiazul $82.160; Socio CAT $68.480; Socio Juveniles $34.160; Socio Niños $12.560.
- Gasparini: Socio 1913 $66.120; Socio Albiazul $36.720; Socio CAT $30.560; Socio Juveniles $15.280; Socio Niños $12.560.
- Otro sector de referencia cargado en el proyecto: Socio 1913 $93.180; Socio Albiazul $51.360; Socio CAT $42.800; Socio Juveniles $21.360; Socio Niños $12.560.
- No hay un valor de Willington confirmado en esta base.
Regla: si el usuario pregunta por uno de estos valores del proyecto, podés responderlo como “valor de referencia cargado en esta web” y recomendar verificar el precio vigente en https://www.clubtalleres.com.ar/asociat/ antes de pagar.

CÓMO ASOCIARSE:
- Online: mediante Boletería VIP / canales oficiales. También se puede completar la solicitud online para que el área de socios contacte al interesado.
- Presencial: Sede Social, Rosario de Santa Fe 15, 1° Piso; lunes a viernes de 10 a 18 h. La página de preguntas frecuentes también informa sábado de 9 a 13 h; si hay diferencia con otra página, indicar que conviene verificar horario oficial antes de ir.
- Paseo del Jockey, Elías Yofre 1050: todos los días de 10 a 22 h.
- Dinosaurio Mall, Rodríguez del Busto 4086: todos los días de 10 a 22 h.
- WhatsApp de atención al socio: 351-226-8833, lunes a viernes de 10 a 18 h.
- Email: socios@clubtalleres.com.ar.

PAGO DE CUOTA:
- Boletería VIP permite abonar online con tarjeta de crédito o débito.
- También se informan Rapipago, Pago Fácil, Pago Mis Cuentas, Mercado Pago y pago presencial en puntos de atención integral al socio.
- La información oficial indica un 20% de descuento sobre el valor de la cuota al adherirse al débito automático con tarjetas habilitadas.
- Tarjetas informadas para débito automático: crédito bancarizadas Visa, Mastercard y NaranjaX (si nunca se tuvo Naranja adherida antes) y débito bancarizada Visa.
- Los tiempos de acreditación de algunos medios pueden ser de hasta 72 horas hábiles; si el usuario pregunta por su pago particular, DERIVAR_ATENCION_HUMANA.

INGRESO AL ESTADIO Y PARTIDOS:
- Con cuota social al día, las categorías con ubicación pueden ingresar a los partidos de local de la Liga Profesional según las condiciones comunicadas por el Club.
- Socio T no tiene ubicación asignada. Para partidos habilitados en tribuna SUR puede ser obligatorio reservar previamente el lugar; para algunos partidos (copas internacionales, clásicos, definiciones u otros) el Club puede establecer reserva o venta de entradas.
- Las condiciones de ingreso cambian partido a partido. Siempre verificar el evento concreto en Boletería VIP.
- Toda persona que ingresa al estadio debe contar con entrada o carnet social, sin excepción, según las comunicaciones de Boletería VIP.
- Para no socios, cuando se habilita venta, se selecciona el sector y la opción Ticket NO SOCIO; normalmente se envía confirmación con ticket QR.
- Si el usuario pregunta por un partido concreto, precio, horario, disponibilidad o modalidad actual, DERIVAR_ATENCION_HUMANA o indicarle que consulte Boletería VIP, porque esos datos cambian.

CAMBIOS DE UBICACIÓN:
- Se pueden solicitar cambios o asignaciones de ubicación en puntos de atención presencial o por WhatsApp 351-226-8833.
- Dependen de la disponibilidad.
- Si no hay disponibilidad, existe lista de espera: https://formit.clubtalleres.com.ar/listaespera/

NIÑOS:
- Categoría Niños: 0 a 11 años.
- 0 a 5 años inclusive: cuota 100% bonificada. Para asistir a partidos de local deben retirar el carnet físico con ubicación asignada presencialmente en los Centros de Atención Integral al Socio.
- Desde los 6 años se abona el monto correspondiente a la categoría.
- Si el caso es personal o requiere verificar la ficha de un menor, DERIVAR_ATENCION_HUMANA.

CARNET Y NÚMERO DE SOCIO:
- Si se pierde el carnet, hay que presentarse en un punto de atención integral al socio con exposición de extravío o denuncia por robo/hurto.
- La web oficial muestra un costo de reposición que puede actualizarse; no dar un monto sin verificarlo.
- El número de socio se puede consultar en Boletería VIP o por WhatsApp 351-226-8833.

GOLAZO:
- Programa de fidelización que premia la pasión del socio con goles/puntos canjeables por experiencias.
- Se pueden sumar goles mediante acciones como compras en Tiendas Oficiales, asistencia a partidos de local, pago de cuota en término y adhesión al débito automático, entre otras.
- Los socios Albiazul duplican goles y los 1913 triplican goles, según la información oficial publicada.
- Las experiencias incluyen, según disponibilidad, visitas/experiencias en Boutique, Kempes, firmas de camisetas, videos saludos de jugadores y presenciar entrenamientos.

AHORRAT Y CLUB LA VOZ:
- AhorraT es el club de beneficios para socios, con descuentos y promociones en rubros como supermercados, gastronomía, accesorios, cines, farmacias, viajes, heladerías y Tienda Talleres.
- Al asociarse a Talleres, el socio también forma parte de Club La Voz según la información oficial.
- La disponibilidad de promociones puede cambiar. Para ver descuentos actuales, consultar https://club.lavoz.com.ar/

APP TU CLUB:
- La app oficial permite acceder a beneficios del programa de socios, AhorraT, Tienda Talleres, canjear goles de Golazo, acceder a contenido exclusivo y usar la tienda online.
- Está disponible para Android/Google Play y iOS/App Store.
- Si el usuario tiene un problema de acceso a su cuenta o app, DERIVAR_ATENCION_HUMANA.

EXPERIENCIA TALLERES:
- Son experiencias de acercamiento de los socios con instalaciones, historia y proyecto del Club.
- Pueden incluir visitas guiadas a la Boutique de Barrio Jardín, Centro de Alto Rendimiento Deportivo y estadio Kempes; también entrenamientos, firmas y videos saludos, según disponibilidad.
- Se accede mediante canje de goles en la App cuando la experiencia está habilitada.

TIENDA:
- Los socios tienen descuentos según categoría y pueden tener prioridad en lanzamientos de camisetas.
- La categoría 1913 tiene 20% de descuento en Tienda y Gift Card anual según la página oficial.
- No inventes stock, talles, precios ni promociones actuales.

CONTENIDO Y COMUNICACIÓN:
- El Club informa actividad y novedades a través de sus canales oficiales.
- Para noticias, horarios, partidos, venta de entradas, promociones y cambios recientes, priorizar la web oficial y Boletería VIP.

CASOS QUE SIEMPRE DEBEN DERIVARSE A UNA PERSONA:
- Reclamos.
- Problemas con pagos, débitos, cuotas o deudas personales.
- Cambios de datos personales.
- Recuperación de cuenta, DNI, carnet o número de socio que requiera verificar identidad.
- Problemas con entradas, QR o acceso a un partido concreto.
- Solicitudes de devolución.
- Consultas legales o institucionales sensibles.
- Cualquier precio/disponibilidad/horario actual que no esté explícitamente confirmado en esta base.
- Cualquier pregunta cuya respuesta no pueda darse con certeza usando exclusivamente esta información.

REGLA FINAL:
Si sabés la respuesta con esta base, contestá de manera útil y concreta. Si no, devolvé exactamente DERIVAR_ATENCION_HUMANA. Nunca inventes.
`

const FALLBACK = "¡Recibimos tu consulta! Gracias por comunicarte con nosotros. Recibimos correctamente tu mensaje y te responderemos a la brevedad.";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8").send(body);
}

function env(name) {
  return String(process.env[name] || "").trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function b64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildRawMessage({ to, subject, html, replyTo }) {
  const from = env("MAIL_FROM") || env("GOOGLE_EMAIL") || "ezequielrossettti8000@gmail.com";
  const boundary = `talleres_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const lines = [
    `From: Club Atlético Talleres <${from}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo || from}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    "Este correo requiere un cliente compatible con HTML.",
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    ""
  ];
  return b64url(lines.join("\r\n"));
}

async function getGmail() {
  const clientId = env("GOOGLE_CLIENT_ID");
  const clientSecret = env("GOOGLE_CLIENT_SECRET");
  const refreshToken = env("GOOGLE_REFRESH_TOKEN");
  const redirectUri = env("GOOGLE_REDIRECT_URI");

  if (!clientId || !clientSecret || !refreshToken || !redirectUri) {
    throw new Error("Faltan variables de Gmail OAuth en Vercel.");
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}

function emailLayout(title, intro, content) {
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#10213a;">
  <div style="max-width:680px;margin:0 auto;background:#fff;">
    <img src="https://talleresprog.vercel.app/assets/images/mail-talleres-banner.jpg"
      alt="Club Atlético Talleres" style="display:block;width:100%;height:auto;max-height:190px;object-fit:cover;">
    <div style="height:6px;background:linear-gradient(90deg,#0a4da2 0 50%,#fff 50% 100%);"></div>
    <div style="padding:34px 34px 30px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#1458b8;text-transform:uppercase;margin-bottom:10px;">ATENCIÓN AL SOCIO · TALLERES</div>
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.08;color:#08244a;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#607087;">${intro}</p>
      ${content}
    </div>
    <div style="background:#061a33;padding:24px 30px;text-align:center;">
      <div style="font-size:13px;font-weight:800;letter-spacing:1px;color:#fff;">CLUB ATLÉTICO TALLERES</div>
      <div style="margin-top:7px;font-size:11px;color:rgba(255,255,255,.72);">Córdoba, Argentina · Desde 1913</div>
      <div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,.5);">IDENTIDAD ALBIAZUL · LA T DE CÓRDOBA</div>
    </div>
  </div>
</body></html>`;
}

function knownProjectAnswer(mensaje) {
  const q = String(mensaje || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const sectors = {
    ardiles: {
      "1913": "$147.970",
      "albiazul": "$82.160",
      "cat": "$68.480",
      "juveniles": "$34.160",
      "ninos": "$12.560",
      "niños": "$12.560"
    },
    gasparini: {
      "1913": "$66.120",
      "albiazul": "$36.720",
      "cat": "$30.560",
      "juveniles": "$15.280",
      "ninos": "$12.560",
      "niños": "$12.560"
    }
  };

  const sector = Object.keys(sectors).find(s => q.includes(s));
  if (!sector) return null;

  let category = null;
  if (/\b1913\b/.test(q) || /categoria\\s*1913/.test(q)) category = "1913";
  else if (/\balbiazul\b/.test(q)) category = "albiazul";
  else if (/\\bcat\\b|categoria\\s*cat/.test(q)) category = "cat";
  else if (/juvenil/.test(q)) category = "juveniles";
  else if (/nino/.test(q)) category = "ninos";

  const asksPrice = /(cuanto|cuánto|valor|precio|sale|cuesta|costo|pagar|cuota)/.test(q);
  if (!asksPrice || !category || !sectors[sector][category]) return null;

  const label = category === "1913" ? "Socio 1913"
    : category === "albiazul" ? "Socio Albiazul"
    : category === "cat" ? "Socio CAT"
    : category === "juveniles" ? "Socio Juveniles"
    : "Socio Niños";

  return `Como referencia cargada en esta web, la cuota para ${label} en la platea ${sector[0].toUpperCase()+sector.slice(1)} es de ${sectors[sector][category]}. El valor puede actualizarse, por lo que recomendamos verificar el importe vigente en la sección oficial de asociados de Talleres antes de realizar el pago.`;
}

async function askOpenAI(nombre, motivo, mensaje) {
  const key = env("OPENAI_API_KEY");
  const model = env("OPENAI_MODEL") || "gpt-5-mini";
  if (!key) return null;

  const prompt = `${KNOWLEDGE_BASE}

CONSULTA RECIBIDA:
Nombre: ${nombre}
Motivo: ${motivo}
Mensaje: ${mensaje}

Redactá únicamente la respuesta que recibirá el socio.
No menciones que sos una IA.
No agregues información que no esté en la base.
Si no podés responder con certeza usando exclusivamente la base, devolvé exactamente: DERIVAR_ATENCION_HUMANA
Máximo 180 palabras.`;

  const r = await fetch("https://api.openai.com/v1/responses", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({model,input:prompt,max_output_tokens:300})
  });
  if (!r.ok) return null;
  const data = await r.json();
  const text = typeof data.output_text === "string" ? data.output_text.trim() : "";
  if (!text || text === "DERIVAR_ATENCION_HUMANA") return null;
  return text;
}

async function sendMail({to, subject, html, replyTo}) {
  const gmail = await getGmail();
  const raw = buildRawMessage({to,subject,html,replyTo});
  await gmail.users.messages.send({
    userId:"me",
    requestBody:{raw}
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res,405,{ok:false,message:"Método no permitido."});

  try {
    const body = req.body || {};
    if (body.website) return json(res,200,{ok:true,message:"Consulta recibida."});

    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim();
    const motivo = String(body.motivo || "").trim();
    const mensaje = String(body.mensaje || "").trim();

    if (!nombre || !email || !motivo || !mensaje)
      return json(res,422,{ok:false,message:"Completá todos los campos antes de enviar."});

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json(res,422,{ok:false,message:"El email ingresado no es válido."});

    if (nombre.length > 120 || mensaje.length > 5000)
      return json(res,422,{ok:false,message:"La consulta supera el límite permitido."});

    const motivos = {
      socios:"Consulta de socios",
      beneficios:"Beneficios y descuentos",
      partidos:"Partidos e ingreso",
      otro:"Otra consulta"
    };
    const motivoTexto = motivos[motivo] || "Otra consulta";
    const adminEmail = env("ADMIN_EMAIL") || "ezequielrossettti8000@gmail.com";

    const aiReply = knownProjectAnswer(mensaje) || await askOpenAI(nombre,motivoTexto,mensaje);
    const automaticText = aiReply || FALLBACK;

    const adminContent = `
      <div style="background:#f5f7fa;border-left:4px solid #1458b8;padding:18px 20px;margin:0 0 20px;">
        <div style="font-size:12px;font-weight:800;color:#6a778a;letter-spacing:1px;">NUEVA CONSULTA WEB</div>
        <p style="margin:10px 0 4px;"><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:4px 0;"><strong>Motivo:</strong> ${escapeHtml(motivoTexto)}</p>
      </div>
      <div style="font-size:14px;line-height:1.7;color:#35445a;">
        <strong>Consulta:</strong><br>${escapeHtml(mensaje).replace(/\n/g,"<br>")}
      </div>
      <div style="margin-top:24px;padding:16px;background:#eaf2fc;border-radius:8px;font-size:13px;line-height:1.6;">
        <strong>Estado IA:</strong> ${aiReply ? "Se envió una respuesta automática al usuario." : "No se encontró una respuesta segura; se envió el acuse y queda para revisión humana."}
      </div>`;

    await sendMail({
      to:adminEmail,
      subject:`Nueva consulta web · ${motivoTexto}`,
      html:emailLayout(`Nueva consulta de ${nombre}`,"Llegó una nueva consulta desde el formulario de la web.",adminContent),
      replyTo:email
    });

    const userContent = `
      <div style="background:#f5f7fa;border-left:4px solid #1458b8;padding:20px 22px;font-size:15px;line-height:1.7;color:#35445a;">
        ${escapeHtml(automaticText).replace(/\n/g,"<br>")}
      </div>
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#7a8798;">
        Si necesitás ampliar la consulta, podés responder directamente a este correo.
      </p>`;

    await sendMail({
      to:email,
      subject:aiReply ? "Respuesta a tu consulta · Club Atlético Talleres" : "¡Recibimos tu consulta! · Club Atlético Talleres",
      html:emailLayout(
        aiReply ? `Hola ${nombre}, tenemos una respuesta para vos.` : "¡Recibimos tu consulta!",
        aiReply
          ? "Gracias por comunicarte con nosotros. Esta respuesta se elaboró con la información institucional disponible."
          : "Gracias por comunicarte con nosotros. Recibimos correctamente tu mensaje y te responderemos a la brevedad.",
        userContent
      ),
      replyTo:adminEmail
    });

    return json(res,200,{
      ok:true,
      message: aiReply
        ? "Consulta enviada. También se envió una respuesta automática al email indicado."
        : "¡Recibimos tu consulta! Te enviamos un correo de confirmación."
    });
  } catch (error) {
    console.error("contact error",error);
    return json(res,500,{ok:false,message:"No pudimos enviar la consulta en este momento. Revisá la configuración de Gmail y las variables de entorno."});
  }
}
