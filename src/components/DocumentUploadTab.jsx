import React, { useState } from "react";
import { useGoogleDriveOAuth } from "../hooks/useGoogleDriveOAuth";

const DOCUMENT_TYPES = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "comprovante_renda", label: "Comprovante de Renda" },
  { value: "contrato", label: "Contrato" },
  { value: "outros", label: "Outros" },
];

export default function DocumentUploadTab({ clientName, onUploadSuccess }) {
  const { isSignedIn, isLoading, signIn, uploadFile } = useGoogleDriveOAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setMessage("");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage("");
    }
  };

  const handleSignIn = async () => {
    try {
      setMessage("🔐 Abrindo autenticação do Google...");
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

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      setMessage("⚠️ Selecione um arquivo e tipo de documento");
      setMessageType("warning");
      return;
    }

    if (!isSignedIn) {
      setMessage("🔐 Faça login no Google primeiro");
      setMessageType("warning");
      return;
    }

    setUploading(true);
    setMessage("📤 Enviando arquivo...");
    setMessageType("info");

    try {
      const result = await uploadFile(selectedFile, clientName, selectedType);

      setMessage(`✅ ${selectedFile.name} enviado com sucesso!`);
      setMessageType("success");

      if (onUploadSuccess) {
        onUploadSuccess({
          fileName: result.fileName || selectedFile.name,
          fileSize: result.fileSize || selectedFile.size,
          fileUrl: result.fileUrl,
          uploadedAt: result.uploadedAt,
        });
      }

      // Limpar
      setSelectedFile(null);
      setSelectedType("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro:", error);
      setMessage(`❌ Erro ao enviar: ${error.message}`);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  if (!clientName) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: 8,
          border: "2px dashed var(--border)",
        }}
      >
        <p style={{ fontSize: "1.2rem", color: "var(--text-dim)", margin: 0 }}>
          ⚠️ Digite o nome do cliente na aba "Dados Pessoais"
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: 8,
        }}
      >
        <p style={{ fontSize: "1.1rem", color: "var(--text-dim)" }}>
          ⏳ Inicializando Google Drive...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Info Header */}
      <div
        style={{
          padding: 16,
          backgroundColor: "#f0f8ff",
          borderRadius: 8,
          borderLeft: "4px solid var(--primary)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.95rem", color: "#333" }}>
          <strong>📁 {clientName}</strong> - Envie os documentos para Google Drive
        </p>
      </div>

      {/* Auth Status */}
      {!isSignedIn && (
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: 12, color: "var(--text-dim)" }}>
            🔐 Autentique com Google para começar
          </p>
          <button
            onClick={handleSignIn}
            disabled={uploading}
            style={{
              padding: "12px 28px",
              backgroundColor: "#1f2937",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#111827")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#1f2937")}
          >
            🔐 Conectar ao Google
          </button>
        </div>
      )}

      {/* Upload Area - Only show when authenticated */}
      {isSignedIn && (
        <>
          {/* File Type Selection */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: "500",
                fontSize: "0.95rem",
              }}
            >
              Tipo de Documento *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={uploading}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: "0.95rem",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <option value="">-- Selecione um tipo --</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              padding: 48,
              border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 8,
              backgroundColor: dragActive ? "rgba(var(--primary-rgb), 0.05)" : "var(--bg-secondary)",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            <input
              type="file"
              id="file-upload"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              style={{ display: "none" }}
              disabled={uploading}
            />

            <label
              htmlFor="file-upload"
              style={{ cursor: "pointer", display: "block" }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📄</div>
              <h3
                style={{
                  margin: "12px 0",
                  color: "var(--text)",
                  fontSize: "1.1rem",
                }}
              >
                {dragActive
                  ? "Solte o arquivo aqui"
                  : "Arraste um arquivo ou clique para selecionar"}
              </h3>
              <p style={{ color: "var(--text-dim)", margin: "8px 0 0 0", fontSize: "0.9rem" }}>
                PDF, Imagem, Word (máx 10MB)
              </p>
            </label>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#ecfdf5",
                borderLeft: "4px solid #10b981",
                borderRadius: 4,
              }}
            >
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#047857" }}>
                ✓ <strong>{selectedFile.name}</strong> (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              style={{
                padding: 12,
                backgroundColor:
                  messageType === "success"
                    ? "#ecfdf5"
                    : messageType === "error"
                    ? "#fef2f2"
                    : messageType === "warning"
                    ? "#fffbeb"
                    : "#eff6ff",
                borderLeft: `4px solid ${
                  messageType === "success"
                    ? "#10b981"
                    : messageType === "error"
                    ? "#ef4444"
                    : messageType === "warning"
                    ? "#f59e0b"
                    : "#3b82f6"
                }`,
                borderRadius: 4,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  color:
                    messageType === "success"
                      ? "#047857"
                      : messageType === "error"
                      ? "#7f1d1d"
                      : messageType === "warning"
                      ? "#92400e"
                      : "#1e40af",
                }}
              >
                {message}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedType || uploading}
            style={{
              padding: "12px 24px",
              backgroundColor:
                !selectedFile || !selectedType || uploading
                  ? "#d1d5db"
                  : "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: "1rem",
              fontWeight: "500",
              cursor:
                !selectedFile || !selectedType || uploading
                  ? "not-allowed"
                  : "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              if (!(!selectedFile || !selectedType || uploading)) {
                e.target.style.backgroundColor = "var(--primary-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(!selectedFile || !selectedType || uploading)) {
                e.target.style.backgroundColor = "var(--primary)";
              }
            }}
          >
            {uploading ? "⏳ Enviando..." : "📤 Enviar para Google Drive"}
          </button>
        </>
      )}
    </div>
  );
}
