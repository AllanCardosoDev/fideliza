// Supabase Edge Function — upload-to-drive
// Recebe um arquivo via multipart/form-data, autentica com service account
// do Google e salva em: Drive/clientes/{NomeCliente_clientId}/{docType_fileName}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helpers JWT / Google OAuth2 ───────────────────────────────────────────────

function base64url(input: string | Uint8Array): string {
  const str = typeof input === "string" ? input : String.fromCharCode(...input);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${payload}`;

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );
  const sig = base64url(new Uint8Array(sigBuf));

  const jwt = `${signingInput}.${sig}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (!data.access_token) {
    throw new Error(`Falha ao obter access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ── Google Drive helpers ──────────────────────────────────────────────────────

async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string,
): Promise<string> {
  const q = encodeURIComponent(
    `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json();
  if (json.files?.length > 0) return json.files[0].id;

  const create = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    },
  );
  const folder = await create.json();
  return folder.id;
}

async function uploadFile(
  token: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBytes: Uint8Array,
): Promise<{ id: string; webViewLink: string }> {
  const boundary = `boundary_${Date.now()}`;
  const meta = JSON.stringify({ name: fileName, parents: [folderId] });

  const enc = new TextEncoder();
  const parts = [
    enc.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    ),
    enc.encode(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileBytes,
    enc.encode(`\r\n--${boundary}--`),
  ];

  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const body = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    body.set(p, offset);
    offset += p.length;
  }

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  return await res.json();
}

// ── Handler principal ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;
    const clientName = formData.get("clientName") as string | null;
    const documentType = formData.get("documentType") as string | null;

    if (!file || !clientId || !clientName) {
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios: file, clientId, clientName",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    const rootFolderId = Deno.env.get("GOOGLE_CLIENTES_FOLDER_ID");

    if (!serviceAccountJson || !rootFolderId) {
      return new Response(
        JSON.stringify({
          error: "Variáveis de ambiente não configuradas no servidor",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = await getAccessToken(serviceAccountJson);

    // Pasta do cliente: clientes/{ClienteName_clientId}
    const safeName = clientName.replace(/[\\/:*?"<>|]/g, "_").trim();
    const folderName = `${safeName}_${clientId}`;
    const clientFolderId = await findOrCreateFolder(
      token,
      folderName,
      rootFolderId,
    );

    // Nome do arquivo: {documentType}_{originalName}
    const docPrefix = (documentType || "documento").replace(/\s+/g, "_");
    const fileName = `${docPrefix}_${file.name}`;

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadFile(
      token,
      clientFolderId,
      fileName,
      file.type,
      fileBytes,
    );

    if (!result.id) {
      throw new Error(`Erro no upload para o Drive: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileId: result.id,
        fileUrl: result.webViewLink,
        folderUrl: `https://drive.google.com/drive/folders/${clientFolderId}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no upload-to-drive:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
