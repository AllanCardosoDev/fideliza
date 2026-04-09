import React, { useState } from "react";

const DOCUMENT_TYPES = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "comprovante_renda", label: "Comprovante de Renda" },
  { value: "contrato", label: "Contrato" },
  { value: "outros", label: "Outros" },
];

export default function DocumentosGerenciador() {
  const [clientName, setClientName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

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

  const handleUpload = async () => {
    if (!clientName.trim()) {
      setMessage("⚠️ Digite o nome do cliente");
      setMessageType("warning");
      return;
    }

    if (!selectedType) {
      setMessage("⚠️ Selecione um tipo de documento");
      setMessageType("warning");
      return;
    }

    if (!selectedFile) {
      setMessage("⚠️ Selecione um arquivo");
      setMessageType("warning");
      return;
    }

    setUploading(true);
    setMessage("⏳ Enviando arquivo...");
    setMessageType("info");

    try {
      // Simular envio de arquivo
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newFile = {
        id: Date.now(),
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(1),
        type: selectedFile.type || "application/octet-stream",
        documentType: selectedType,
        client: clientName,
        date: new Date().toLocaleDateString("pt-BR"),
      };

      setUploadedFiles([...uploadedFiles, newFile]);
      setMessage(`✅ ${selectedFile.name} enviado com sucesso!`);
      setMessageType("success");

      // Limpar formulário
      setSelectedFile(null);
      setClientName("");
      setSelectedType("");

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`❌ Erro ao enviar: ${error.message}`);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId));
    setMessage("🗑️ Arquivo removido");
    setMessageType("info");
    setTimeout(() => setMessage(""), 2000);
  };


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "1.8rem" }}>📄 Documentos</h1>
        <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Envie e gerencie documentos dos clientes
        </p>
      </div>

      {/* Upload Section */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 24,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>📤 Enviar Documento</h3>

        {/* Fields Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Client Name */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: "500",
                fontSize: "0.9rem",
              }}
            >
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
              disabled={uploading}
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

          {/* Document Type */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: "500",
                fontSize: "0.9rem",
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
              <option value="">-- Selecione --</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            padding: 40,
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
            id="file-upload-docs"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
            style={{ display: "none" }}
            disabled={uploading}
          />

          <label
            htmlFor="file-upload-docs"
            style={{ cursor: "pointer", display: "block" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📎</div>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--text)", fontSize: "1.1rem" }}>
              {dragActive ? "Solte aqui" : "Arraste o arquivo ou clique"}
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-dim)" }}>
              PDF, Word, Excel, Imagem (até 10MB)
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#047857" }}>
              ✓ <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                background: "none",
                border: "none",
                color: "#047857",
                cursor: "pointer",
                fontSize: "1rem",
                padding: 0,
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
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
              marginBottom: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
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
          disabled={!selectedFile || !clientName.trim() || !selectedType || uploading}
          style={{
            width: "100%",
            padding: "12px 20px",
            backgroundColor:
              !selectedFile || !clientName.trim() || !selectedType || uploading
                ? "#d1d5db"
                : "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: "1rem",
            fontWeight: "500",
            cursor:
              !selectedFile || !clientName.trim() || !selectedType || uploading
                ? "not-allowed"
                : "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            if (!(!selectedFile || !clientName.trim() || !selectedType || uploading)) {
              e.target.style.backgroundColor = "var(--primary-hover)";
            }
          }}
          onMouseLeave={(e) => {
            if (!(!selectedFile || !clientName.trim() || !selectedType || uploading)) {
              e.target.style.backgroundColor = "var(--primary)";
            }
          }}
        >
          {uploading ? "⏳ Enviando..." : "📤 Enviar Documento"}
        </button>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 24,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            📑 Documentos Enviados ({uploadedFiles.length})
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem" }}>📄</span>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    title="Remover"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      padding: 0,
                    }}
                  >
                    🗑️
                  </button>
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      color: "var(--text)",
                      wordBreak: "break-word",
                    }}
                  >
                    {file.name}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.75rem",
                      color: "var(--text-dim)",
                    }}
                  >
                    {file.size} KB
                  </p>
                </div>
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 8,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      color: "var(--text-dim)",
                    }}
                  >
                    <strong>{file.client}</strong>
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "0.75rem",
                      color: "var(--text-dim)",
                    }}
                  >
                    {DOCUMENT_TYPES.find((t) => t.value === file.documentType)?.label || file.documentType} - {file.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
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
    </div>
  );
}
