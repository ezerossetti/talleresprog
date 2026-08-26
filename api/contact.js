import { google } from "googleapis";
import fs from "node:fs/promises";
import path from "node:path";

const KNOWLEDGE_BASE = `
Sos el asistente virtual de atención al socio del Club Atlético Talleres de Córdoba.
Respondé siempre en español argentino, con tono amable, institucional, claro y breve.
NO inventes precios, horarios, requisitos, fechas, promociones, links ni políticas.
Usá únicamente la información de esta base. Si la consulta requiere información que no aparece acá, NO intentes adivinar: indicá que Atención al Socio revisará la consulta y responderá por email.

INFORMACIÓN INSTITUCIONAL DISPONIBLE:
- Para asociarse: https://www.clubtalleres.com.ar/asociat/
- Plataforma de socios para consultar y gestionar la cuota: https://socios.clubtalleres.com.ar/
- Atención al Socio por WhatsApp: 351 226 8833.
- Email de Atención al Socio: socios@clubtalleres.com.ar.
- Sede Social: Rosario de Santa Fe 15, Córdoba.
- Para ingresar a partidos, la cuota debe estar al día y, cuando corresponda, puede ser necesario reservar la ubicación. Las condiciones pueden variar según cada partido.
- En la web aparecen Platea Ardiles, Platea Gasparini y Popular Willington, con diferentes valores según categoría de socio. Los valores pueden cambiar: si preguntan un precio exacto, indicar que debe verificarse en la web oficial.
`;

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

    const aiReply = await askOpenAI(nombre,motivoTexto,mensaje);
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
