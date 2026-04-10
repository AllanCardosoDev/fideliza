#!/usr/bin/env node

/**
 * Servidor Fidelizacred - Aplicação + Upload (Backblaze B2 + Firebase)
 * Um único servidor para produção
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cliente S3 apontando para Backblaze B2
function createB2Client() {
  return new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_BUCKET_REGION || "us-west-005",
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
  });
}

// ========================================
// API Routes
// ========================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rota para upload de arquivo para Backblaze B2
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const bucketName = process.env.B2_BUCKET_NAME;
    if (!bucketName || !process.env.B2_KEY_ID) {
      return res.status(500).json({
        error: "Variáveis de ambiente B2 não configuradas",
      });
    }

    const { clientId, clientName, documentType } = req.body;
    const file = req.file;

    if (!file || !clientId || !clientName || !documentType) {
      return res.status(400).json({
        error: "Arquivo, clientId, clientName e documentType são obrigatórios",
      });
    }

    console.log(`📤 Iniciando upload de: ${file.originalname}`);

    const safeName = clientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const safeClient = `${clientId}_${safeName}`;
    const docType = (documentType || "documento").replace(/\s+/g, "_");
    const fileKey = `${safeClient}/${docType}_${file.originalname}`;

    const s3 = createB2Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype || "application/octet-stream",
      }),
    );

    const fileUrl = `${process.env.B2_ENDPOINT}/${bucketName}/${fileKey}`;

    console.log(`✅ Arquivo enviado para B2: ${fileKey}`);

    res.json({ success: true, fileUrl });
  } catch (error) {
    console.error("❌ Erro no upload B2:", error.message);
    res.status(500).json({
      error: error.message || "Erro ao processar upload",
    });
  }
});

// ========================================
// Firebase Admin Setup
// ========================================

let firebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  try {
    if (firebaseAdminInitialized) return true;

    const serviceAccountPath = path.join(
      __dirname,
      "credentials",
      "documentos-87058-firebase-adminsdk.json",
    );

    if (!fs.existsSync(serviceAccountPath)) {
      console.warn("[FIREBASE-ADMIN] ⚠️ Arquivo de credenciais não encontrado");
      return false;
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8"),
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseAdminInitialized = true;
    console.log("[FIREBASE-ADMIN] ✅ Firebase Admin SDK inicializado");
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
