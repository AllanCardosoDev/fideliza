/**
 * Firebase Admin Upload Route
 * Faz upload direto do servidor (evita CORS no cliente)
 */

import express from "express";
import multer from "multer";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Inicializar Firebase Admin
let adminInitialized = false;

function initializeFirebaseAdmin() {
  try {
    if (adminInitialized) return;

    const serviceAccountPath = path.join(
      __dirname,
      "credentials",
      "documentos-87058-firebase-adminsdk.json",
    );

    if (!fs.existsSync(serviceAccountPath)) {
      console.warn(
        "[FIREBASE-ADMIN] ⚠️ Arquivo de credenciais não encontrado em:",
        serviceAccountPath,
      );
      return false;
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8"),
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    adminInitialized = true;
    console.log(
      "[FIREBASE-ADMIN] ✅ Firebase Admin SDK inicializado com sucesso",
    );
    return true;
  } catch (error) {
    console.error("[FIREBASE-ADMIN] ❌ Erro ao inicializar:", error.message);
    return false;
  }
}

/**
 * POST /api/firebase/upload
 * Upload de documento para Firebase Cloud Storage (server-side)
 */
router.post("/api/firebase/upload", upload.single("file"), async (req, res) => {
  try {
    // Inicializar Firebase se ainda não foi
    if (!initializeFirebaseAdmin()) {
      return res.status(500).json({
        success: false,
        error: "Firebase Admin SDK não configurado",
        message:
          "Arquivo de credenciais não encontrado. Entre em contato com suporte.",
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
        error: "Dados incompletos",
        message: "clientId, clientName e documentType são obrigatórios",
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

    // Gerar URL de download
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

    console.log(
      `[FIREBASE-UPLOAD] ✅ Metadata salvo no Firestore: ${docRef.id}`,
    );

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

/**
 * DELETE /api/firebase/delete
 * Deletar documento (arquivo + metadata)
 */
router.delete("/api/firebase/delete", async (req, res) => {
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
      console.log(`[FIREBASE-DELETE] ✅ Arquivo deletado: ${storagePath}`);
    } catch (storageError) {
      console.warn(
        `[FIREBASE-DELETE] ⚠️ Erro ao deletar arquivo: ${storageError.message}`,
      );
    }

    // Deletar metadata do Firestore
    const firestore = admin.firestore();
    await firestore.collection("documentos").doc(docId).delete();

    console.log(`[FIREBASE-DELETE] ✅ Metadata deletado: ${docId}`);

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

export default router;
