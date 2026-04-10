#!/usr/bin/env node

/**
 * Servidor Fidelizacred - Multipla Plataforma (Vercel + Hostinger + Local)
 * Compatível com Vercel (serverless), Hostinger (Node.js), e desenvolvimento local
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV !== "production";

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// Firebase Admin Setup (Múltiplos Ambientes)
// ========================================

let firebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized) return true;

  try {
    let serviceAccount = null;

    // Tentar carregar credenciais do arquivo (desenvolvimento local)
    if (isDevelopment) {
      const credentialsPath = path.join(
        __dirname,
        "credentials",
        "documentos-87058-firebase-adminsdk-7t6zq-e4da8be629.json",
      );

      if (fs.existsSync(credentialsPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
        console.log("[FIREBASE-ADMIN] ✅ Credenciais carregadas do arquivo");
      }
    }

    // Se não encontrou arquivo, usar variáveis de ambiente (Hostinger/Vercel/Produção)
    if (!serviceAccount) {
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.warn(
          "[FIREBASE-ADMIN] ⚠️ Variáveis de ambiente não configuradas",
        );
        return false;
      }

      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      console.log(
        "[FIREBASE-ADMIN] ✅ Credenciais carregadas de variáveis de ambiente",
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET || "documentos-87058.appspot.com",
    });

    firebaseAdminInitialized = true;
    console.log(
      "[FIREBASE-ADMIN] ✅ Firebase Admin SDK inicializado com sucesso",
    );
    return true;
  } catch (error) {
    console.error("[FIREBASE-ADMIN] ❌ Erro ao inicializar:", error.message);
    return false;
  }
}

// ========================================
// Firebase Upload Routes (Server-side)
// ========================================

// POST /api/firebase/upload - Fazer upload via servidor (evita CORS)
app.post("/api/firebase/upload", upload.single("file"), async (req, res) => {
  try {
    if (!initializeFirebaseAdmin()) {
      return res.status(500).json({
        success: false,
        error: "Firebase Admin SDK não configurado",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Arquivo não fornecido",
      });
    }

    const { clientId, clientName, documentType } = req.body;

    if (!clientId || !clientName || !documentType) {
      return res.status(400).json({
        success: false,
        error: "clientId, clientName e documentType são obrigatórios",
      });
    }

    console.log(`[FIREBASE-UPLOAD] Iniciando upload: ${req.file.originalname}`);

    // Criar caminho no Storage
    const timestamp = Date.now();
    const sanitizedName = req.file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    const storagePath = `documentos-clientes/${clientId}/${clientName.replace(/[^a-z0-9]/gi, "_")}/${documentType}/${timestamp}_${sanitizedName}`;

    // Upload para Cloud Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=3600",
      },
    });

    console.log(`[FIREBASE-UPLOAD] ✅ Upload concluído: ${storagePath}`);

    // URL de download
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/documentos-87058.appspot.com/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Salvar metadados no Firestore
    const firestore = admin.firestore();
    const docRef = await firestore.collection("documentos").add({
      clientId: String(clientId),
      clientName,
      documentType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      storagePath,
      downloadUrl,
      createdAt: new Date(),
      uploadedBy: "servidor",
    });

    console.log(`[FIREBASE-UPLOAD] ✅ Metadata salvo: ${docRef.id}`);

    res.json({
      success: true,
      fileUrl: downloadUrl,
      docId: docRef.id,
      storagePath,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("[FIREBASE-UPLOAD] ❌ Erro:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao fazer upload",
    });
  }
});

// DELETE /api/firebase/delete - Deletar documento
app.delete("/api/firebase/delete", async (req, res) => {
  try {
    if (!initializeFirebaseAdmin()) {
      return res.status(500).json({
        success: false,
        error: "Firebase Admin SDK não configurado",
      });
    }

    const { docId, storagePath } = req.body;

    if (!docId || !storagePath) {
      return res.status(400).json({
        success: false,
        error: "docId e storagePath são obrigatórios",
      });
    }

    // Deletar arquivo do Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    try {
      await file.delete();
      console.log(`[FIREBASE-DELETE] ✅ Arquivo deletado`);
    } catch (storageError) {
      console.warn(`[FIREBASE-DELETE] ⚠️ Erro ao deletar arquivo`);
    }

    // Deletar metadata do Firestore
    const firestore = admin.firestore();
    await firestore.collection("documentos").doc(docId).delete();

    console.log(`[FIREBASE-DELETE] ✅ Metadata deletado`);

    res.json({
      success: true,
      message: "Documento deletado com sucesso",
    });
  } catch (error) {
    console.error("[FIREBASE-DELETE] ❌ Erro:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao deletar documento",
    });
  }
});

// ========================================
// Static Files (React App)
// ========================================

app.use(express.static(DIST));

// SPA - Serve index.html para todas as rotas desconhecidas (APENAS GET)
app.get(/.*/, (req, res) => {
  const indexPath = path.join(DIST, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not found - Build the app first with: npm run build");
  }
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🚀 Fidelizacred - Servidor Integrado         ║
║  Rodando em http://localhost:${PORT}           ║
║  App: React + Express                        ║
║  Upload: Backblaze B2 + Firebase              ║
║  Firebase: Admin SDK (Server-side)           ║
╚════════════════════════════════════════════════╝
  `);
});
