import { useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useLocalDocuments() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Listar documentos
  const loadDocuments = useCallback(async (clientId) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/documentos/${clientId}`);
      const data = await res.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data.documentos || [];
    } catch (err) {
      setError(err.message);
      console.error("Erro ao carregar documentos:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload
  const uploadDocument = useCallback(
    async (clientId, clientName, documentType, file) => {
      try {
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", String(clientId)); // Garantir que é string
        formData.append("clientName", String(clientName));
        formData.append("documentType", String(documentType));

        console.log("📤 FormData preparado:", {
          clientId: String(clientId),
          clientName: String(clientName),
          documentType: String(documentType),
          fileName: file.name,
          fileSize: file.size,
        });

        const res = await fetch(`${API_URL}/api/documentos/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Erro ao fazer upload");
        }

        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  // Download
  const downloadDocument = useCallback((clientId, tipo, fileId) => {
    const downloadUrl = `${API_URL}/api/documentos/${clientId}/${tipo}/${fileId}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileId.split("_").slice(1).join("_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Deletar
  const deleteDocument = useCallback(async (clientId, tipo, fileId) => {
    try {
      setError(null);

      const res = await fetch(
        `${API_URL}/api/documentos/${clientId}/${tipo}/${fileId}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao deletar");
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    loading,
    uploading,
    error,
    loadDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  };
}
