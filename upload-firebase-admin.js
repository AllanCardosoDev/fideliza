/**
 * Firebase Upload Helper - Server-side
 * Usa Admin SDK para fazer upload com credenciais do servidor (mais seguro)
 */

import admin from "firebase-admin";

// Inicializar Admin SDK (usa GOOGLE_APPLICATION_CREDENTIALS ou variáveis de ambiente)
let adminApp = null;

export function initFirebaseAdmin() {
  try {
    if (!adminApp) {
      // Tentar usar arquivo de credenciais
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!credentialsPath || !credentialsPath.startsWith("/")) {
        console.warn(
          "[FIREBASE-ADMIN] Credenciais não encontradas. Admin SDK desativado.",
        );
        console.log(
          "  Para habilitar, defina GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/serviceAccountKey.json",
        );
        return null;
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(credentialsPath),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      });

      console.log("[FIREBASE-ADMIN] ✅ Admin SDK inicializado");
    }
    return adminApp;
  } catch (error) {
    console.error("[FIREBASE-ADMIN] Erro ao inicializar:", error.message);
    return null;
  }
}

/**
 * Upload de arquivo para Firebase Cloud Storage (server-side)
 * @param {Buffer} fileBuffer - Conteúdo do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} storagePath - Caminho no storage
 * @returns {Promise<string>} URL de download
 */
export async function uploadToFirebaseServer(
  fileBuffer,
  fileName,
  storagePath,
) {
  const app = initFirebaseAdmin();
  if (!app) {
    throw new Error(
      "Firebase Admin SDK não configurado. Credenciais não encontradas.",
    );
  }

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    // Upload do arquivo
    await file.save(fileBuffer, {
      metadata: {
        contentType: "application/octet-stream",
        cacheControl: "public, max-age=3600",
      },
    });

    console.log(`[FIREBASE-ADMIN] ✅ Upload completo: ${storagePath}`);

    // Gerar URL de download
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    return downloadUrl;
  } catch (error) {
    console.error("[FIREBASE-ADMIN] ❌ Erro no upload:", error.message);
    throw error;
  }
}

export default {
  initFirebaseAdmin,
  uploadToFirebaseServer,
};
