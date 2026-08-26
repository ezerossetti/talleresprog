import { google } from "googleapis";

function env(name){ return String(process.env[name] || "").trim(); }

function escapeHtml(value=""){
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

export default async function handler(req,res){
  const code=String(req.query?.code || "");
  if(!code) return res.status(400).send("No llegó el código de autorización.");

  const clientId=env("GOOGLE_CLIENT_ID");
  const clientSecret=env("GOOGLE_CLIENT_SECRET");
  const redirectUri=env("GOOGLE_REDIRECT_URI");
  if(!clientId || !clientSecret || !redirectUri)
    return res.status(500).send("Faltan variables de Gmail OAuth.");

  try{
    const oauth2=new google.auth.OAuth2(clientId,clientSecret,redirectUri);
    const {tokens}=await oauth2.getToken(code);
    const refreshToken=tokens.refresh_token;
    if(!refreshToken){
      return res.status(400).send(`
        <h2>No se recibió un refresh token</h2>
        <p>Volvé a <a href="/api/auth/google">autorizar la aplicación</a>. La autorización usa prompt=consent para pedir uno nuevo.</p>`);
    }
    res.status(200).setHeader("Content-Type","text/html; charset=utf-8").send(`
      <!doctype html><html lang="es"><head><meta charset="utf-8"><title>Gmail conectado</title>
      <style>body{font-family:Arial,sans-serif;background:#eef2f7;margin:0;padding:40px;color:#10213a}
      main{max-width:760px;margin:auto;background:#fff;border-radius:14px;padding:32px;box-shadow:0 10px 35px rgba(0,0,0,.08)}
      code{display:block;background:#061a33;color:#fff;padding:18px;border-radius:8px;word-break:break-all;white-space:pre-wrap}
      strong{color:#1458b8}</style></head><body><main>
      <h1>Gmail autorizado ✓</h1>
      <p>Copiá el valor de <strong>GOOGLE_REFRESH_TOKEN</strong> y guardalo en <strong>Vercel → Settings → Environment Variables</strong>.</p>
      <code>${escapeHtml(refreshToken)}</code>
      <p><strong>No compartas este token.</strong> Después de guardarlo, eliminá esta ruta de autorización si querés bloquear nuevas autorizaciones.</p>
      </main></body></html>`);
  }catch(error){
    console.error("oauth callback error",error);
    res.status(500).send("No se pudo completar la autorización de Gmail. Revisá el Client ID, Client Secret y Redirect URI.");
  }
}
