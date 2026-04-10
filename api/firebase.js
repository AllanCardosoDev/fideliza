/**
 * Vercel Serverless Function para Upload/Delete no Firebase
 * Endpoint: POST/DELETE /api/firebase
 */

import admin from "firebase-admin";
import { IncomingForm } from "formidable";
import { readFile } from "fs/promises";

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return true;

  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET || "documentos-87058.appspot.com",
      });
    }

    firebaseInitialized = true;
    return true;
  } catch (error) {
    console.error("[FIREBASE-VERCEL] ❌ Erro:", error.message);
    return false;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST - Upload
  if (req.method === "POST") {
    try {
      if (!initializeFirebase()) {
        return res.status(500).json({
          success: false,
          error: "Firebase não configurado",
        });
      }

      const form = new IncomingForm();
      const [fields, files] = await form.parse(req);

      const file = files.file?.[0];
      const clientId = fields.clientId?.[0];
      const clientName = fields.clientName?.[0];
      const documentType = fields.documentType?.[0];

      if (!file || !clientId || !clientName || !documentType) {
        return res.status(400).json({
          success: false,
          error: "Parâmetros obrigatórios faltando",
        });
      }

      const fileBuffer = await readFile(file.filepath);
      const storagePath = `documentos-clientes/${clientId}/${clientName.replace(/[^a-z0-9]/gi, "_")}/${documentType}/${Date.now()}_${file.originalFilename}`;

      const bucket = admin.storage().bucket();
      await bucket.file(storagePath).save(fileBuffer);

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      const docRef = await admin.firestore().collection("documentos").add({
        clientId,
        clientName,
        documentType,
        fileName: file.originalFilename,
        fileSize: file.size,
        fileType: file.mimetype,
        storagePath,
        downloadUrl,
        createdAt: new Date(),
        uploadedBy: "vercel",
      });

      return res.json({
        success: true,
        fileUrl: downloadUrl,
        docId: docRef.id,
        storagePath,
        fileName: file.originalFilename,
      });
    } catch (error) {
      console.error("[FIREBASE-UPLOAD] ❌", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Erro ao fazer upload",
      });
    }
  }

  // DELETE
  if (req.method === "DELETE") {
    try {
      if (!initializeFirebase()) {
        return res.status(500).json({
          success: false,
          error: "Firebase não configurado",
        });
      }

      const { docId, storagePath } = req.body;

      if (!docId || !storagePath) {
        return res.status(400).json({
          success: false,
          error: "docId e storagePath obrigatórios",
        });
      }

      const bucket = admin.storage().bucket();
      try {
        await bucket.file(storagePath).delete();
      } catch (err) {
        console.warn("[FIREBASE-DELETE] Arquivo já removido");
      }

      await admin.firestore().collection("documentos").doc(docId).delete();

      return res.json({
        success: true,
        message: "Documento deletado com sucesso",
      });
    } catch (error) {
      console.error("[FIREBASE-DELETE] ❌", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Erro ao deletar documento",
      });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
