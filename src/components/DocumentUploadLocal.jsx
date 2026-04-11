import React, { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/document-upload-local.css";

const DOCUMENT_TYPES = [
  {
    value: "cpf",
    label: "CPF",
    faIcon: "fa-id-card",
    cssVar: "--color-doc-cpf",
  },
  {
    value: "rg",
    label: "RG",
    faIcon: "fa-address-card",
    cssVar: "--color-doc-rg",
  },
  {
    value: "cnpj",
    label: "CNPJ",
    faIcon: "fa-building",
    cssVar: "--color-doc-cnpj",
  },
  {
    value: "comprovante_renda",
    label: "Comprovante de Renda",
    faIcon: "fa-money-bill",
    cssVar: "--color-doc-renda",
  },
  {
    value: "contrato",
    label: "Contrato",
    faIcon: "fa-file-contract",
    cssVar: "--color-doc-contrato",
  },
  {
    value: "endereco",
    label: "Comprovante de Endereço",
    faIcon: "fa-home",
    cssVar: "--color-doc-endereco",
  },
  {
    value: "outros",
    label: "Outros",
    faIcon: "fa-folder-open",
    cssVar: "--color-doc-outros",
  },
];

export default function DocumentUploadLocal({
  clientId,
  clientName,
  onUploadSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const getDocumentTypeInfo = (value) => {
    return DOCUMENT_TYPES.find((dt) => dt.value === value);
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
    // Validações
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

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setMessage("⚠️ Arquivo muito grande (máx 50MB)");
      setMessageType("warning");
      return;
    }

    setUploading(true);
    setMessage("⏳ Enviando arquivo...");
    setMessageType("info");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("clientId", clientId);
      formData.append("clientName", clientName);
      formData.append("documentType", selectedType);

      const res = await fetch(`${API_URL}/api/documentos/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setMessage(
        `✅ Upload concluído: ${selectedFile.name} enviado com sucesso!`,
      );
      setMessageType("success");

      // Limpar formulário
      setSelectedFile(null);
      setSelectedType("");

      // Chamar callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`❌ Erro no upload: ${error.message}`);
      setMessageType("error");
      console.error("Erro no upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const typeInfo = getDocumentTypeInfo(selectedType);

  return (
    <div className="document-upload-local">
      <div className="upload-card">
        <h2>
          <i
            className="fas fa-cloud-arrow-up"
            style={{ marginRight: 8, color: "var(--primary, #16a34a)" }}
          ></i>
          Enviar Documento
        </h2>

        {/* Document Type Selector */}
        <div className="form-group">
          <label htmlFor="doc-type">Tipo de Documento *</label>
          <div className="doc-type-grid">
            {DOCUMENT_TYPES.map((docType) => (
              <button
                key={docType.value}
                type="button"
                className={`doc-type-btn ${
                  selectedType === docType.value ? "active" : ""
                }`}
                onClick={() => setSelectedType(docType.value)}
              >
                <span className="doc-icon">
                  <i
                    className={`fas ${docType.faIcon}`}
                    style={{ color: `var(${docType.cssVar})` }}
                  ></i>
                </span>
                <span className="doc-label">{docType.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Input */}
        <div className="form-group">
          <label>Arquivo * {selectedFile && `✓`}</label>
          <div
            className={`file-upload-zone ${dragActive ? "active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="file-input"
              disabled={uploading}
            />
            <label htmlFor="file-input" className="file-input-label">
              <div className="upload-icon">
                <i
                  className="fas fa-cloud-arrow-up"
                  style={{ color: "#16a34a" }}
                ></i>
              </div>
              <p className="upload-text">
                {selectedFile ? (
                  <>
                    <strong>
                      <i
                        className="fas fa-check"
                        style={{ marginRight: 4 }}
                      ></i>
                      {selectedFile.name}
                    </strong>
                    <br />
                    <small>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                      <span
                        className="change-file"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("file-input").click();
                        }}
                      >
                        {" "}
                        (Alterar)
                      </span>
                    </small>
                  </>
                ) : (
                  <>
                    Arraste o arquivo aqui ou
                    <br />
                    <strong>clique para selecionar</strong>
                  </>
                )}
              </p>
              <small className="text-dim">
                PDF, Word, Excel, Imagem (máx 50MB)
              </small>
            </label>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`message message-${messageType}`}>{message}</div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !selectedType}
            className="btn btn-primary btn-lg"
          >
            {uploading ? (
              <>
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ marginRight: 6 }}
                ></i>
                Enviando...
              </>
            ) : (
              <>
                <i
                  className="fas fa-cloud-arrow-up"
                  style={{ marginRight: 6 }}
                ></i>
                Enviar Documento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
