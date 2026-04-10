import React, { useState } from "react";
import {
  uploadDocumentToFirebase,
  getClientDocuments,
  deleteDocument,
} from "../lib/firebase";

const DOCUMENT_TYPES = [
  { value: "identity", label: "RG/Identidade" },
  { value: "cpf", label: "CPF" },
  { value: "proof_of_address", label: "Comprovante de Endereço" },
  { value: "bank_statement", label: "Extrato Bancário" },
  { value: "income_statement", label: "Declaração de Renda" },
  { value: "contract", label: "Contrato" },
  { value: "other", label: "Outro" },
];

export default function DocumentUploadTab({
  clientName,
  clientId,
  onUploadSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Carregar arquivos ao montar o componente ou quando clientId muda
  React.useEffect(() => {
    if (clientId && clientName) {
      loadFiles();
    }
  }, [clientId, clientName]);

  const loadFiles = async () => {
    if (!clientId) return;

    try {
      setLoadingFiles(true);

      const documents = await getClientDocuments(clientId);

      setUploadedFiles(
        documents.map((doc) => ({
          id: doc.id,
          name: doc.fileName,
          size: doc.fileSize || 0,
          updated: doc.createdAt,
          url: doc.downloadUrl,
          type: doc.documentType,
          storagePath: doc.storagePath,
        })),
      );
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      setUploadedFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

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
    if (!selectedFile || !selectedType) {
      setMessage("⚠️ Selecione um arquivo e tipo de documento");
      setMessageType("warning");
      return;
    }

    if (!clientId) {
      setMessage("⚠️ Salve o cliente primeiro antes de adicionar documentos");
      setMessageType("warning");
      return;
    }

    setUploading(true);
    setMessage("📤 Enviando documento para Firebase...");
    setMessageType("info");

    try {
      const result = await uploadDocumentToFirebase(selectedFile, {
        clientId: String(clientId),
        clientName: clientName || `cliente_${clientId}`,
        documentType: selectedType,
      });

      setMessage(`✅ ${selectedFile.name} enviado com sucesso!`);
      setMessageType("success");

      await loadFiles();

      if (onUploadSuccess) {
        onUploadSuccess({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          documentType: selectedType,
          fileUrl: result.fileUrl,
          uploadedAt: new Date().toISOString(),
        });
      }

      setSelectedFile(null);
      setSelectedType("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro no upload:", error);
      setMessage(`❌ Erro: ${error.message}`);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${file.name}"?`)) {
      return;
    }

    setDeletingId(file.id);
    setMessage("🗑️ Deletando arquivo...");
    setMessageType("info");

    try {
      await deleteDocument(file.id, file.storagePath);
      setMessage(`✅ Arquivo deletado com sucesso!`);
      setMessageType("success");

      await loadFiles();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      setMessage(`❌ Erro ao deletar: ${error.message}`);
      setMessageType("error");
    } finally {
      setDeletingId(null);
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
        <p style={{ fontSize: "1.1rem", color: "var(--text-dim)", margin: 0 }}>
          ⚠️ Digite o nome do cliente na aba "Dados Pessoais" primeiro
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Info Header */}
      <div
        style={{
          padding: 12,
          backgroundColor: "var(--bg-secondary)",
          borderRadius: 8,
          borderLeft: "4px solid var(--primary)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.95rem" }}>
          📁 Documentos de <strong>{clientName}</strong>
        </p>
      </div>

      {/* File Type Selection */}
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
          padding: 40,
          border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border)"}`,
          borderRadius: 8,
          backgroundColor: dragActive
            ? "rgba(59,130,246,0.05)"
            : "var(--bg-secondary)",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
      >
        <input
          type="file"
          id="file-upload-tab"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
          style={{ display: "none" }}
          disabled={uploading}
        />
        <label
          htmlFor="file-upload-tab"
          style={{ cursor: "pointer", display: "block" }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>📎</div>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--text)" }}>
            {dragActive
              ? "Solte o arquivo aqui"
              : "Arraste um arquivo ou clique"}
          </h4>
          <p
            style={{ color: "var(--text-dim)", margin: 0, fontSize: "0.85rem" }}
          >
            PDF, Word, Excel, Imagem (máx 10MB)
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#047857" }}>
            ✓ <strong>{selectedFile.name}</strong> (
            {(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
          <button
            onClick={() => setSelectedFile(null)}
            style={{
              background: "none",
              border: "none",
              color: "#047857",
              cursor: "pointer",
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
            padding: 10,
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
        disabled={!selectedFile || !selectedType || uploading}
        style={{
          padding: "12px 20px",
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
          width: "100%",
        }}
      >
        {uploading ? "⏳ Enviando..." : "📤 Enviar Documento"}
      </button>

      {/* Lista de Arquivos Enviados */}
      {loadingFiles ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <p style={{ color: "var(--text-dim)" }}>📂 Carregando arquivos...</p>
        </div>
      ) : uploadedFiles.length > 0 ? (
        <div
          style={{
            padding: 16,
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>
            📄 Arquivos Armazenados no Firebase
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: "var(--bg-primary)",
                  borderRadius: 4,
                  fontSize: "0.9rem",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong
                    title={file.name}
                    style={{
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {file.name}
                  </strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {file.size > 0
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : "Arquivo"}{" "}
                    • {file.type}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <a
                    href={file.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "var(--primary)",
                      color: "white",
                      borderRadius: 4,
                      textDecoration: "none",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      border: "none",
                      whiteSpace: "nowrap",
                    }}
                    title="Baixar arquivo"
                  >
                    ⬇️
                  </a>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#6b7280",
                      color: "white",
                      borderRadius: 4,
                      textDecoration: "none",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      border: "none",
                      whiteSpace: "nowrap",
                    }}
                    title="Visualizar arquivo"
                  >
                    👁️
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    disabled={deletingId === file.id}
                    style={{
                      padding: "6px 10px",
                      backgroundColor:
                        deletingId === file.id ? "#ccc" : "#ef4444",
                      color: "white",
                      borderRadius: 4,
                      border: "none",
                      fontSize: "0.8rem",
                      cursor:
                        deletingId === file.id ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                    title="Deletar arquivo"
                  >
                    {deletingId === file.id ? "🗑️..." : "🗑️"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 16,
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 8,
            textAlign: "center",
            border: "1px dashed var(--border)",
          }}
        >
          <p style={{ color: "var(--text-dim)", margin: 0 }}>
            📭 Nenhum arquivo enviado ainda
          </p>
        </div>
      )}
    </div>
  );
}
