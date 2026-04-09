import React, { useState, useEffect } from "react";
import { useGoogleDriveOAuth } from "../hooks/useGoogleDriveOAuth";

const DOCUMENT_TYPES = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "comprovante_renda", label: "Comprovante de Renda" },
  { value: "contrato", label: "Contrato" },
  { value: "outros", label: "Outros" },
];

export default function DocumentosGerenciador() {
  const { isSignedIn, isLoading, signIn, uploadFile, listClientDocuments } =
    useGoogleDriveOAuth();

  const [clientName, setClientName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

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

  const loadDocuments = async () => {
    if (!clientName.trim()) {
      setMessage("⚠️ Digite o nome do cliente para buscar documentos");
      setMessageType("warning");
      return;
    }

    if (!isSignedIn) {
      setMessage("🔐 Faça login no Google primeiro");
      setMessageType("warning");
      return;
    }

    setLoadingDocs(true);
    setMessage("⏳ Buscando documentos...");
    setMessageType("info");

    try {
      const docs = await listClientDocuments(clientName);
      setDocuments(docs || []);

      if (!docs || docs.length === 0) {
        setMessage("📭 Nenhum documento encontrado para este cliente");
        setMessageType("info");
      } else {
        setMessage(`✅ ${docs.length} documento(s) encontrado(s)`);
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage(`❌ Erro ao buscar documentos: ${error.message}`);
      setMessageType("error");
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      setMessage("⚠️ Selecione um arquivo e tipo de documento");
      setMessageType("warning");
      return;
    }

    if (!clientName.trim()) {
      setMessage("⚠️ Digite o nome do cliente");
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

      // Recarregar documentos
      setTimeout(() => {
        loadDocuments();
      }, 1000);

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

  if (isLoading) {
    return (
      <div
        style={{
          padding: "60px 20px",
          textAlign: "center",
          minHeight: "100vh",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <p style={{ fontSize: "1.1rem", color: "var(--text-dim)" }}>
          ⏳ Inicializando Google Drive...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "2rem" }}>📄 Documentos</h1>
        <p style={{ margin: 0, color: "var(--text-dim)" }}>
          Gerencie documentos dos clientes no Google Drive
        </p>
      </div>

      {/* Auth Status */}
      {!isSignedIn && (
        <div
          style={{
            padding: 24,
            backgroundColor: "#fef3c7",
            borderLeft: "4px solid #f59e0b",
            borderRadius: 8,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <p
            style={{ margin: "0 0 16px 0", fontSize: "1rem", color: "#92400e" }}
          >
            🔐 Autentique com Google para gerenciar documentos
          </p>
          <button
            onClick={handleSignIn}
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

      {isSignedIn && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginBottom: 40,
          }}
        >
          {/* Upload Panel */}
          <div
            style={{
              padding: 24,
              backgroundColor: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: "1.3rem" }}>
              📤 Enviar Documento
            </h2>

            {/* Client Name Input */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: "500",
                  fontSize: "0.95rem",
                }}
              >
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={uploading}
                placeholder="Ex: João Silva"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: "0.95rem",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Document Type Selection */}
            <div style={{ marginBottom: 20 }}>
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
                  boxSizing: "border-box",
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
                padding: 32,
                border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 8,
                backgroundColor: dragActive
                  ? "rgba(59, 130, 246, 0.05)"
                  : "var(--bg-primary)",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s",
                marginBottom: 20,
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
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📄</div>
                <h3
                  style={{
                    margin: "12px 0",
                    color: "var(--text)",
                    fontSize: "1rem",
                  }}
                >
                  {dragActive
                    ? "Solte o arquivo aqui"
                    : "Arraste um arquivo ou clique"}
                </h3>
                <p
                  style={{
                    color: "var(--text-dim)",
                    margin: "8px 0 0 0",
                    fontSize: "0.9rem",
                  }}
                >
                  PDF, Word, Imagem (máx 10MB)
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
                  marginBottom: 20,
                }}
              >
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#047857" }}>
                  ✓ <strong>{selectedFile.name}</strong> (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                !selectedType ||
                !clientName.trim() ||
                uploading
              }
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor:
                  !selectedFile ||
                  !selectedType ||
                  !clientName.trim() ||
                  uploading
                    ? "#d1d5db"
                    : "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: "1rem",
                fontWeight: "500",
                cursor:
                  !selectedFile ||
                  !selectedType ||
                  !clientName.trim() ||
                  uploading
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (
                  !(
                    !selectedFile ||
                    !selectedType ||
                    !clientName.trim() ||
                    uploading
                  )
                ) {
                  e.target.style.backgroundColor = "var(--primary-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !(
                    !selectedFile ||
                    !selectedType ||
                    !clientName.trim() ||
                    uploading
                  )
                ) {
                  e.target.style.backgroundColor = "var(--primary)";
                }
              }}
            >
              {uploading ? "⏳ Enviando..." : "📤 Enviar para Google Drive"}
            </button>
          </div>

          {/* Search Panel */}
          <div
            style={{
              padding: 24,
              backgroundColor: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: "1.3rem" }}>
              🔍 Buscar Documentos
            </h2>

            {/* Client Name Input for Search */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: "500",
                  fontSize: "0.95rem",
                }}
              >
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={loadingDocs}
                placeholder="Ex: João Silva"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: "0.95rem",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Search Button */}
            <button
              onClick={loadDocuments}
              disabled={!clientName.trim() || loadingDocs}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor:
                  !clientName.trim() || loadingDocs
                    ? "#d1d5db"
                    : "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: "1rem",
                fontWeight: "500",
                cursor:
                  !clientName.trim() || loadingDocs ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                marginBottom: 20,
              }}
            >
              {loadingDocs ? "⏳ Buscando..." : "🔍 Buscar Documentos"}
            </button>

            {/* Documents Found */}
            <div
              style={{
                padding: 16,
                backgroundColor: "var(--bg-primary)",
                borderRadius: 6,
                minHeight: 100,
              }}
            >
              {documents.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-dim)",
                    textAlign: "center",
                  }}
                >
                  📭 Nenhum documento
                </p>
              ) : (
                <div>
                  <p style={{ margin: "0 0 12px 0", fontWeight: "500" }}>
                    📑 {documents.length} documento(s) encontrado(s)
                  </p>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          backgroundColor: "var(--bg-secondary)",
                          borderRadius: 4,
                          marginBottom: 8,
                          fontSize: "0.85rem",
                          color: "var(--text-dim)",
                        }}
                      >
                        {doc.name.endsWith(".pdf") ? "📄" : "🖼️"} {doc.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div
          style={{
            padding: 16,
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
            marginBottom: 20,
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

      {isSignedIn && (
        <div
          style={{
            padding: 16,
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--text-dim)",
            fontSize: "0.9rem",
          }}
        >
          ✅ Conectado ao Google Drive | 📁 Pasta: /Documentos Clientes/
          {clientName || "..."}
        </div>
      )}
    </div>
  );
}
