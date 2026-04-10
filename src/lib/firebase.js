import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Configuração do Firebase (preenchida de .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializar Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("[FIREBASE] ✅ Firebase inicializado com sucesso");
} catch (error) {
  console.error("[FIREBASE] ❌ Erro ao inicializar Firebase:", error);
  throw error;
}

// Serviços Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Upload de documento para Firebase Storage via servidor (evita CORS)
 * @param {File} file - Arquivo a fazer upload
 * @param {Object} metadata - Metadados do documento {clientId, clientName, documentType}
 * @returns {Promise<Object>} {success, fileUrl, docId}
 */
export async function uploadDocumentToFirebase(file, metadata) {
  try {
    if (!file) {
      throw new Error("Arquivo não fornecido");
    }

    const { clientId, clientName, documentType } = metadata;

    if (!clientId || !clientName || !documentType) {
      throw new Error("Metadados incompletos");
    }

    console.log("[FIREBASE] Iniciando upload via servidor...");
    console.log(
      `[FIREBASE] Arquivo: ${file.name}, Tamanho: ${file.size} bytes`,
    );

    // Preparar FormData para envio
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", String(clientId));
    formData.append("clientName", clientName);
    formData.append("documentType", documentType);

    // Fazer upload via servidor (evita CORS!)
    const response = await fetch("/api/firebase/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro desconhecido");
    }

    console.log(`[FIREBASE] ✅ Upload concluído via servidor`);
    console.log(`[FIREBASE] URL: ${result.fileUrl}`);
    console.log(
      `[FIREBASE] ✅ Documento registrado no Firestore: ${result.docId}`,
    );

    return {
      success: true,
      fileUrl: result.fileUrl,
      docId: result.docId,
      storagePath: result.storagePath,
    };
  } catch (error) {
    console.error("[FIREBASE] ❌ Erro:", error.message);
    throw error;
  }
}

/**
 * Buscar documentos de um cliente no Firestore
 * @param {string} clientId - ID do cliente
 * @returns {Promise<Array>} Lista de documentos
 */
export async function getClientDocuments(clientId) {
  try {
    console.log(`[FIREBASE] Buscando documentos do cliente: ${clientId}`);

    const q = query(
      collection(db, "documentos"),
      where("clientId", "==", clientId),
    );

    const querySnapshot = await getDocs(q);
    const documents = [];

    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`[FIREBASE] ✅ ${documents.length} documento(s) encontrado(s)`);
    return documents;
  } catch (error) {
    console.error("[FIREBASE] ❌ Erro ao buscar documentos:", error.message);
    throw error;
  }
}

/**
 * Obter um documento específico pelo ID
 * @param {string} docId - ID do documento
 * @returns {Promise<Object>} Dados do documento
 */
export async function getDocumentById(docId) {
  try {
    const docRef = doc(db, "documentos", docId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      throw new Error("Documento não encontrado");
    }

    return {
      id: docSnapshot.id,
      ...docSnapshot.data(),
    };
  } catch (error) {
    console.error("[FIREBASE] ❌ Erro ao buscar documento:", error.message);
    throw error;
  }
}

/**
 * Atualizar status de um documento
 * @param {string} docId - ID do documento
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<void>}
 */
export async function updateDocument(docId, updates) {
  try {
    const docRef = doc(db, "documentos", docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });

    console.log(`[FIREBASE] ✅ Documento atualizado: ${docId}`);
  } catch (error) {
    console.error("[FIREBASE] ❌ Erro ao atualizar documento:", error.message);
    throw error;
  }
}

/**
 * Deletar um documento (arquivo e metadata) via servidor
 * @param {string} docId - ID do documento no Firestore
 * @param {string} storagePath - Caminho do arquivo no Storage
 * @returns {Promise<void>}
 */
export async function deleteDocument(docId, storagePath) {
  try {
    console.log(`[FIREBASE] Deletando documento: ${docId}`);

    // Deletar via servidor
    const response = await fetch("/api/firebase/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        docId,
        storagePath,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro ao deletar documento");
    }

    console.log(`[FIREBASE] ✅ Documento deletado: ${docId}`);
  } catch (error) {
    console.error("[FIREBASE] ❌ Erro ao deletar documento:", error.message);
    throw error;
  }
}

export default {
  uploadDocumentToFirebase,
  getClientDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
