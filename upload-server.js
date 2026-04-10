#!/usr/bin/env node

/**
 * 🚀 Servidor de Upload para Google Drive
 * Executa em porta 3001 e faz upload para Google Drive usando Service Account
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Carregamento das credenciais do Google Service Account
let serviceAccount;
try {
  const credentialsPath = path.join(
    __dirname,
    "credentials",
    "google-service-account.json",
  );
  serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  console.log("✅ Credenciais carregadas");
} catch (error) {
  console.error("❌ Erro ao carregar credenciais:", error.message);
  process.exit(1);
}

const GOOGLE_DRIVE_FOLDER_ID = "1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf";

// Função para gerar JWT token
function generateGoogleJWT() {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hora

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: expiry,
    iat: now,
  };

  const token = jwt.sign(payload, serviceAccount.private_key, {
    algorithm: "RS256",
    header: {
      typ: "JWT",
      alg: "RS256",
    },
  });

  return token;
}

// Função para obter access token do Google
async function getGoogleAccessToken() {
  const assertion = generateGoogleJWT();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: assertion,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error_description}`);
  }

  return data.access_token;
}

// Rota para upload de arquivo
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { clientId, clientName, documentType } = req.body;
    const file = req.file;

    if (!file || !clientId || !clientName || !documentType) {
      return res.status(400).json({
        error: "Arquivo, clientId, clientName e documentType são obrigatórios",
      });
    }

    console.log(`📤 Iniciando upload de: ${file.originalname}`);

    // Obter access token
    const accessToken = await getGoogleAccessToken();
    console.log("✅ Token JWT obtido");

    // Criar pasta do cliente se não existir
    const safeName = clientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderName = `${safeName}_${clientId}`;

    let clientFolderId = null;

    // Buscar pasta existente
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const listData = await listResponse.json();

    if (listData.files && listData.files.length > 0) {
      clientFolderId = listData.files[0].id;
      console.log("✅ Pasta do cliente encontrada");
    } else {
      // Criar nova pasta
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      };

      const createFolderResponse = await fetch(
        "https://www.googleapis.com/drive/v3/files?fields=id",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(folderMetadata),
        },
      );

      const createFolderData = await createFolderResponse.json();
      clientFolderId = createFolderData.id;
      console.log("✅ Pasta do cliente criada");
    }

    // Upload do arquivo
    const docType = (documentType || "documento").replace(/\s+/g, "_");
    const fileName = `${docType}_${file.originalname}`;

    const fileMetadata = {
      name: fileName,
      parents: [clientFolderId],
    };

    const fileContent = file.buffer;

    // Criar FormData para upload multipart
    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(fileMetadata)], { type: "application/json" }),
    );
    formData.append(
      "file",
      new Blob([fileContent], {
        type: file.mimetype || "application/octet-stream",
      }),
    );

    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(
        uploadData.error?.message || "Erro ao fazer upload do arquivo",
      );
    }

    console.log(`✅ Arquivo enviado: ${uploadData.id}`);

    res.json({
      success: true,
      fileId: uploadData.id,
      fileUrl: uploadData.webViewLink,
      folderUrl: `https://drive.google.com/drive/folders/${clientFolderId}`,
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);
    res.status(500).json({
      error: error.message || "Erro ao processar upload",
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Servidor rodando na porta 3001" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🚀 Servidor de Upload - Google Drive         ║
║  Rodando em http://localhost:${PORT}            ║
║  Credenciais: credentials/google-service...  ║
╚════════════════════════════════════════════════╝
  `);
});
