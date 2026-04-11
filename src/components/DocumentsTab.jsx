import React, { useState, useEffect } from "react";
import { useLocalDocuments } from "../hooks/useLocalDocuments";

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

const DOCUMENT_TYPE_LABELS = {
  cpf: "CPF",
  rg: "RG",
  cnpj: "CNPJ",
  comprovante_renda: "Comprovante de Renda",
  contrato: "Contrato",
  endereco: "Endereço",
  outros: "Outros",
};

// Mapa de variáveis CSS por tipo de documento
const DOCUMENT_TYPE_COLORS = {
  cpf: "var(--color-doc-cpf)",
  rg: "var(--color-doc-rg)",
  cnpj: "var(--color-doc-cnpj)",
  comprovante_renda: "var(--color-doc-renda)",
  contrato: "var(--color-doc-contrato)",
  endereco: "var(--color-doc-endereco)",
  outros: "var(--color-doc-outros)",
};

// Mapa de ícones Font Awesome por tipo
const DOCUMENT_TYPE_ICONS = {
  cpf: "fa-id-card",
  rg: "fa-address-card",
  cnpj: "fa-building",
  comprovante_renda: "fa-money-bill",
  contrato: "fa-file-contract",
  endereco: "fa-home",
  outros: "fa-folder-open",
};

export default function DocumentsTab({ clientId, clientName }) {
  const {
    loading,
    uploading,
    loadDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  } = useLocalDocuments();

  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [deleting, setDeleting] = useState(null);

  // Carregar documentos ao montar
  useEffect(() => {
    if (clientId) {
      loadDocuments(clientId).then(setDocuments);
    }
  }, [clientId, loadDocuments]);

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
    if (!selectedType) {
      setMessage("Selecione um tipo de documento");
      setMessageType("warning");
      return;
    }
    if (!selectedFile) {
      setMessage("Selecione um arquivo");
      setMessageType("warning");
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setMessage("Arquivo muito grande (máx 50MB)");
      setMessageType("warning");
      return;
    }

    setMessage("Enviando arquivo...");
    setMessageType("info");

    try {
      await uploadDocument(clientId, clientName, selectedType, selectedFile);
      setMessage(`✅ ${selectedFile.name} enviado com sucesso!`);
      setMessageType("success");
      setSelectedFile(null);
      setSelectedType("");

      const docs = await loadDocuments(clientId);
      setDocuments(docs);

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
      setMessageType("error");
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Tem certeza que deseja deletar ${doc.name}?`)) {
      return;
    }

    setDeleting(doc.id);
    try {
      await deleteDocument(clientId, doc.type, doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      alert("Erro ao deletar: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (doc) => {
    downloadDocument(clientId, doc.type, doc.id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* SEÇÃO 1: ARMAZENAMENTO */}
      <div>
        <h4 style={{ marginBottom: 8, fontSize: "1rem", fontWeight: 600 }}>
          <i
            className="fas fa-database"
            style={{ marginRight: 8, color: "var(--primary, #16a34a)" }}
          ></i>
          Armazenamento de Documentos
        </h4>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-secondary, #666)",
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Os documentos são armazenados de forma segura no servidor da
          aplicação, organizados por tipo de documento. Você pode enviar
          múltiplos arquivos (PDF, Word, Excel, Imagens), fazer download a
          qualquer momento e deletar quando necessário.
        </p>
      </div>

      {/* SEÇÃO 2: UPLOAD */}
      <div>
        <h4 style={{ marginBottom: 12, fontSize: "1rem", fontWeight: 600 }}>
          <i
            className="fas fa-cloud-arrow-up"
            style={{ marginRight: 8, color: "var(--primary, #16a34a)" }}
          ></i>
          Enviar Novo Documento
        </h4>

        {/* Seletor de Tipo */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Tipo de Documento *
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
              gap: 8,
            }}
          >
            {DOCUMENT_TYPES.map((docType) => (
              <button
                key={docType.value}
                type="button"
                onClick={() => setSelectedType(docType.value)}
                style={{
                  padding: "12px 8px",
                  border: `2px solid ${selectedType === docType.value ? "var(--primary, #16a34a)" : "#e0e0e0"}`,
                  borderRadius: 8,
                  background:
                    selectedType === docType.value ? "#f0fdf4" : "white",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color:
                    selectedType === docType.value
                      ? "var(--primary, #16a34a)"
                      : "#666",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>
                  <i
                    className={`fas ${docType.faIcon}`}
                    style={{ color: `var(${docType.cssVar})` }}
                  ></i>
                </div>
                {docType.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drag & Drop */}
        <div
          style={{
            border: `2px dashed ${dragActive ? "var(--primary, #16a34a)" : "#d0d0d0"}`,
            borderRadius: 8,
            padding: 20,
            textAlign: "center",
            backgroundColor: dragActive ? "#f0fdf4" : "#f9fafb",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: 12,
          }}
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
            style={{ display: "none" }}
            disabled={uploading}
          />
          <label
            htmlFor="file-input"
            style={{
              cursor: "pointer",
              display: "block",
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: 8,
                color: "#16a34a",
              }}
            >
              <i className="fas fa-cloud-arrow-up"></i>
            </div>
            {selectedFile ? (
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    color: "var(--text-primary, #333)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fas fa-check"
                    style={{ color: "var(--primary, #16a34a)" }}
                  ></i>
                  {selectedFile.name}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.85rem",
                    color: "#666",
                  }}
                >
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 500,
                    color: "var(--text-primary, #333)",
                  }}
                >
                  Arraste o arquivo aqui ou clique para selecionar
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.85rem",
                    color: "#999",
                  }}
                >
                  PDF, Word, Excel, Imagem (máx 50MB)
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Mensagem */}
        {message && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              marginBottom: 12,
              fontSize: "0.9rem",
              fontWeight: 500,
              backgroundColor:
                messageType === "success"
                  ? "#d1fae5"
                  : messageType === "error"
                    ? "#fee2e2"
                    : messageType === "warning"
                      ? "#fef3c7"
                      : "#dbeafe",
              color:
                messageType === "success"
                  ? "#065f46"
                  : messageType === "error"
                    ? "#991b1b"
                    : messageType === "warning"
                      ? "#92400e"
                      : "#1e40af",
              border: `1px solid ${messageType === "success" ? "#a7f3d0" : messageType === "error" ? "#fecaca" : messageType === "warning" ? "#fcd34d" : "#93c5fd"}`,
            }}
          >
            {message}
          </div>
        )}

        {/* Botão Enviar */}
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !selectedType}
          style={{
            padding: "10px 20px",
            fontSize: "0.9rem",
            fontWeight: 600,
            backgroundColor:
              uploading || !selectedFile || !selectedType
                ? "#ccc"
                : "var(--primary, #16a34a)",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor:
              uploading || !selectedFile || !selectedType
                ? "not-allowed"
                : "pointer",
            opacity: uploading || !selectedFile || !selectedType ? 0.6 : 1,
          }}
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

      {/* SEÇÃO 3: DOCUMENTOS SALVOS */}
      <div>
        <h4 style={{ marginBottom: 12, fontSize: "1rem", fontWeight: 600 }}>
          <i
            className="fas fa-file-lines"
            style={{ marginRight: 8, color: "var(--primary, #16a34a)" }}
          ></i>
          Documentos Armazenados ({documents.length})
        </h4>

        {loading ? (
          <p style={{ textAlign: "center", color: "#999" }}>
            <>
              <i
                className="fas fa-spinner fa-spin"
                style={{ marginRight: 6 }}
              ></i>{" "}
              Carregando documentos...
            </>
          </p>
        ) : documents.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              backgroundColor: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              color: "#999",
            }}
          >
            <p style={{ margin: 0 }}>
              <i className="fas fa-inbox" style={{ marginRight: 6 }}></i>Nenhum
              documento armazenado ainda
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  padding: 12,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  backgroundColor: "white",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.5rem",
                      color: DOCUMENT_TYPE_COLORS[doc.type] || "#6b7280",
                      minWidth: "24px",
                      textAlign: "center",
                    }}
                  >
                    <i
                      className={`fas ${DOCUMENT_TYPE_ICONS[doc.type] || "fa-file"}`}
                    ></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-primary, #333)",
                        wordBreak: "break-word",
                      }}
                    >
                      {doc.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "0.8rem",
                        color: "var(--primary, #16a34a)",
                        fontWeight: 500,
                      }}
                    >
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 0",
                    borderTop: "1px solid #f0f0f0",
                    marginBottom: 8,
                    fontSize: "0.75rem",
                    color: "#999",
                  }}
                >
                  <span>{doc.sizeKB} KB</span>
                  <span style={{ margin: "0 4px" }}>•</span>
                  <span>
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => handleDownload(doc)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      border: "1px solid #93c5fd",
                      borderRadius: 4,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i className="fas fa-download"></i> Baixar
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      backgroundColor:
                        deleting === doc.id ? "#fecaca" : "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #fecaca",
                      borderRadius: 4,
                      cursor: deleting === doc.id ? "not-allowed" : "pointer",
                      opacity: deleting === doc.id ? 0.7 : 1,
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i
                      className={`fas ${deleting === doc.id ? "fa-spinner fa-spin" : "fa-trash"}`}
                    ></i>
                    {deleting === doc.id ? "Deletando..." : "Deletar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
