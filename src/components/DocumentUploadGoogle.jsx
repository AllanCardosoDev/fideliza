import React, { useState, useCallback } from "react";
import { useGoogleDriveOAuth } from "../hooks/useGoogleDriveOAuth";
import "../styles/document-upload.css";

const DOCUMENT_TYPES = [
  "RG",
  "CPF",
  "Comprovante de Renda",
  "Contrato",
  "Outros",
];

export default function DocumentUploadGoogle({
  clientId,
  clientName,
  onUploadSuccess,
}) {
  const {
    isSignedIn,
    isLoading,
    error: authError,
    signIn,
    uploadFile,
  } = useGoogleDriveOAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMessage("");
    }
  };

  const handleSignIn = async () => {
    try {
      setMessage("🔐 Abrindo Google para autenticação...");
      setMessageType("info");
      await signIn();
      setMessage("✅ Autenticado com sucesso!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`❌ Erro ao autenticar: ${error.message}`);
      setMessageType("error");
    }
  };

  const handleUpload = useCallback(async () => {
    if (!isSignedIn) {
      setMessage("⚠️ Você precisa fazer login no Google primeiro");
      setMessageType("warning");
      return;
    }

    if (!selectedFile || !selectedType || !clientName) {
      setMessage("⚠️ Selecione um arquivo e tipo de documento");
      setMessageType("warning");
      return;
    }

    setUploading(true);
    setMessage("📤 Enviando para Google Drive...");
    setMessageType("info");

    try {
      const result = await uploadFile(selectedFile, clientName, selectedType);

      setMessage(`✅ Documento "${selectedFile.name}" enviado com sucesso!`);
      setMessageType("success");
      setSelectedFile(null);
      setSelectedType("");

      // Limpar input de arquivo
      const fileInput = document.getElementById("file-input");
      if (fileInput) fileInput.value = "";

      // Callback para atualizar lista de documentos com detalhes
      if (onUploadSuccess) {
        setTimeout(
          () =>
            onUploadSuccess({
              fileName: result.fileName || selectedFile.name,
              fileSize: result.fileSize || selectedFile.size,
              fileUrl: result.fileUrl,
              uploadedAt: result.uploadedAt,
            }),
          1500,
        );
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setMessage(`❌ Erro ao enviar: ${error.message}`);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  }, [
    isSignedIn,
    selectedFile,
    selectedType,
    clientName,
    uploadFile,
    onUploadSuccess,
  ]);

  return (
    <div className="document-upload-google">
      <div className="upload-container">
        <h3>📤 Enviar Documento para Google Drive</h3>

        {clientName && (
          <p className="client-info">
            📁 Cliente: <strong>{clientName}</strong>
          </p>
        )}

        {/* Estado de carregamento inicial */}
        {isLoading && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            <p>⏳ Inicializando Google Drive...</p>
          </div>
        )}

        {/* Erro ao inicializar */}
        {authError && !isSignedIn && !isLoading && (
          <div className="message message-error">
            ❌ {authError}
          </div>
        )}

        {!isLoading && !isSignedIn && !authError && (
          <div className="message message-warning">
            🔐 Você precisa autenticar com Google para enviar documentos
          </div>
        )}

        {/* Botão de Login (se não estiver logado) */}
        {!isLoading && !isSignedIn && (
          <button
            onClick={handleSignIn}
            className="upload-btn"
            disabled={isLoading}
          >
            🔐 Autenticar com Google
          </button>
        )}

        {/* Forma de envio (só aparece se estiver logado) */}
        {!isLoading && isSignedIn && (
          <>
            {/* Select Document Type */}
            <div className="form-group">
              <label htmlFor="doc-type">Tipo de Documento:</label>
              <select
                id="doc-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Selecione --</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* File Input */}
            <div className="form-group">
              <label htmlFor="file-input">Arquivo:</label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept="image/*,.pdf,.doc,.docx"
              />
              {selectedFile && (
                <p className="file-info">
                  📄 {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(1)}KB)
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`message message-${messageType}`}>{message}</div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className={`upload-btn ${uploading ? "loading" : ""}`}
            >
              {uploading ? "⏳ Enviando..." : "📤 Enviar para Google Drive"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
