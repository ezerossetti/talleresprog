import { google } from "googleapis";

function env(name){ return String(process.env[name] || "").trim(); }

export default async function handler(req,res){
  const clientId=env("GOOGLE_CLIENT_ID");
  const clientSecret=env("GOOGLE_CLIENT_SECRET");
  const redirectUri=env("GOOGLE_REDIRECT_URI");
  if(!clientId || !clientSecret || !redirectUri){
    return res.status(500).send("Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI.");
  }
  const oauth2=new google.auth.OAuth2(clientId,clientSecret,redirectUri);
  const url=oauth2.generateAuthUrl({
    access_type:"offline",
    prompt:"consent",
    scope:["https://www.googleapis.com/auth/gmail.send"]
  });
  res.redirect(302,url);
}
