import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

const DOCUMENT_TYPES = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "comprovante_renda", label: "Comprovante de Renda" },
  { value: "contrato", label: "Contrato" },
  { value: "outros", label: "Outros" },
];

const BUCKET_NAME = "documentos-clientes";

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

  // Carregar arquivos ao montar o componente ou quando clientId muda
  React.useEffect(() => {
    if (clientId && clientName) {
      loadFiles();
    }
  }, [clientId, clientName]);

  const loadFiles = async () => {
    if (!supabase || !clientId) return;

    try {
      setLoadingFiles(true);
      const safeName = clientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const folderPath = `${clientId}_${safeName}`;

      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        console.warn("Erro ao carregar arquivos:", error);
        setUploadedFiles([]);
        return;
      }

      if (files && files.length > 0) {
        const filesWithUrls = files
          .filter((f) => f.name && !f.id.endsWith("/")) // Remove pastas
          .map((f) => {
            const { data: publicData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(`${folderPath}/${f.name}`);

            return {
              name: f.name,
              size: f.metadata?.size || 0,
              updated: f.updated_at,
              url: publicData?.publicUrl,
            };
          });

        setUploadedFiles(filesWithUrls);
      } else {
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
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

    if (!supabase) {
      setMessage(
        "❌ Erro: Supabase não configurado. Verifique as variáveis de ambiente.",
      );
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("📤 Enviando arquivo para Supabase...");
    setMessageType("info");

    try {
      // Criar caminho: documentos-clientes/cliente_id_nome/documenttype_filename
      const safeName = clientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const folderPath = `${clientId}_${safeName}`;
      const docType = (selectedType || "documento").replace(/\s+/g, "_");

      // Remove espaços do nome do arquivo
      const cleanFileName = selectedFile.name.replace(/\s+/g, "_");
      const fileName = `${docType}_${cleanFileName}`;
      const filePath = `${folderPath}/${fileName}`;

      console.log("📁 Estrutura de upload:", { folderPath, filePath });

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Obter URL pública do arquivo
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const fileUrl = publicData?.publicUrl;

      setMessage(`✅ ${selectedFile.name} enviado com sucesso!`);
      setMessageType("success");

      // Recarregar lista de arquivos após sucesso
      await loadFiles();

      if (onUploadSuccess) {
        onUploadSuccess({
          fileName: cleanFileName,
          fileSize: selectedFile.size,
          documentType: selectedType,
          filePath: filePath,
          fileUrl: fileUrl,
          uploadedAt: new Date().toISOString(),
        });
      }

      setSelectedFile(null);
      setSelectedType("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro no upload:", error);

      let errorMsg = error.message;
      if (error.message.includes("Failed to fetch")) {
        errorMsg = "Erro de conexão com Supabase.";
      } else if (error.message.includes("bucket")) {
        errorMsg = "Bucket 'documentos-clientes' não existe ou sem acesso.";
      } else if (error.message.includes("duplicate")) {
        errorMsg = "Arquivo com este nome já existe.";
      }

      setMessage(`❌ Erro: ${errorMsg}`);
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
        <p style={{ fontSize: "1.1rem", color: "var(--text-dim)", margin: 0 }}>
          ⚠️ Digite o nome do cliente na aba "Dados Pessoais" primeiro
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Server Status */}
      <div
        style={{
          padding: 12,
          backgroundColor: "#eff6ff",
          borderLeft: "4px solid #3b82f6",
          borderRadius: 8,
        }}
      >
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e40af" }}>
          💡 Certifique-se de rodar: <code>npm run server</code> em outro
          terminal
        </p>
      </div>

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
        {uploading ? "⏳ Enviando..." : "📤 Enviar para Google Drive"}
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
            📄 Arquivos Armazenados
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
                <div style={{ flex: 1 }}>
                  <strong>{file.name}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {file.size > 0
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : "Arquivo"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={file.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "var(--primary)",
                      color: "white",
                      borderRadius: 4,
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    ⬇️ Baixar
                  </a>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#6b7280",
                      color: "white",
                      borderRadius: 4,
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    👁️ Ver
                  </a>
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
