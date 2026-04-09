import { useState } from "react";
import axios from "axios";

/**
 * Hook customizado para gerenciar uploads de documentos para Google Drive
 * @param {number} clientId - ID do cliente
 * @param {string} clientName - Nome do cliente
 * @returns {Object} - Estado e funções de upload
 */
export function useGoogleDriveUpload(clientId, clientName) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFile = async (file, documentType) => {
    if (!file || !documentType || !clientName) {
      setMessage("⚠️ Arquivo, tipo e cliente são obrigatórios");
      setMessageType("warning");
      return false;
    }

    setUploading(true);
    setProgress(0);
    setMessage("Preparando upload...");
    setMessageType("info");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("clientId", clientId);
      formData.append("clientName", clientName);

      const response = await axios.post(`/api/documents/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setMessage(`✅ "${file.name}" enviado com sucesso para Google Drive!`);
        setMessageType("success");
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: documentType,
            url: response.data.data.fileUrl,
            uploadedAt: new Date(),
          },
        ]);
        setProgress(0);
        return true;
      } else {
        setMessage(`❌ Erro: ${response.data.message}`);
        setMessageType("error");
        return false;
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ Erro: ${errorMessage}`);
      setMessageType("error");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  return {
    uploading,
    progress,
    message,
    messageType,
    uploadedFiles,
    uploadFile,
    clearMessage,
  };
}
