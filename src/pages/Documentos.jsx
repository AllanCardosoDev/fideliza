import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../App";
import DocumentUploadLocal from "../components/DocumentUploadLocal";
import { useLocalDocuments } from "../hooks/useLocalDocuments";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/documentos.css";

const DOCUMENT_TYPE_ICONS = {
  cpf: "fa-id-card",
  rg: "fa-address-card",
  cnpj: "fa-building",
  comprovante_renda: "fa-money-bill",
  contrato: "fa-file-contract",
  endereco: "fa-home",
  outros: "fa-folder-open",
};

const DOCUMENT_TYPE_COLORS = {
  cpf: "var(--color-doc-cpf)",
  rg: "var(--color-doc-rg)",
  cnpj: "var(--color-doc-cnpj)",
  comprovante_renda: "var(--color-doc-renda)",
  contrato: "var(--color-doc-contrato)",
  endereco: "var(--color-doc-endereco)",
  outros: "var(--color-doc-outros)",
};

const DOCUMENT_TYPE_LABELS = {
  cpf: "CPF",
  rg: "RG",
  cnpj: "CNPJ",
  comprovante_renda: "Comprovante de Renda",
  contrato: "Contrato",
  endereco: "Endereço",
  outros: "Outros",
};

export default function Documentos() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { clients } = useContext(AppContext);
  const { loading, loadDocuments, downloadDocument, deleteDocument } =
    useLocalDocuments();

  const [documents, setDocuments] = useState([]);
  const [deleting, setDeleting] = useState(null);

  // Encontrar cliente
  const client = clients.find((c) => c.id === parseInt(clientId));

  // Carregar documentos
  useEffect(() => {
    if (clientId && client) {
      loadDocuments(parseInt(clientId)).then((docs) => {
        setDocuments(docs);
      });
    }
  }, [clientId, client, loadDocuments]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Tem certeza que deseja deletar ${doc.name}?`)) {
      return;
    }

    setDeleting(doc.id);
    try {
      await deleteDocument(parseInt(clientId), doc.type, doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      alert("Erro ao deletar: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (doc) => {
    downloadDocument(parseInt(clientId), doc.type, doc.id);
  };

  const handleUploadSuccess = async () => {
    const docs = await loadDocuments(parseInt(clientId));
    setDocuments(docs);
  };

  if (!client) {
    return (
      <div className="documentos-page">
        <div className="documentos-header">
          <button
            className="btn btn-outline"
            onClick={() => navigate("/clientes")}
          >
            ← Voltar
          </button>
        </div>
        <div className="error-message">
          <p>
            <i
              className="fas fa-exclamation-circle"
              style={{ marginRight: 6 }}
            ></i>
            Cliente não encontrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="documentos-page">
      {/* Header */}
      <div className="documentos-header">
        <div className="header-content">
          <button
            className="btn btn-outline"
            onClick={() => navigate("/clientes")}
          >
            ← Clientes
          </button>
          <h1>
            <i
              className="fas fa-file-lines"
              style={{ marginRight: 8, color: "var(--primary, #16a34a)" }}
            ></i>
            Documentos
          </h1>
          <p className="client-name">{client.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="documentos-container">
        {/* Upload Section */}
        <div className="upload-section">
          <DocumentUploadLocal
            clientId={client.id}
            clientName={client.name}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>

        {/* Documents List */}
        <div className="documents-section">
          <h2>
            <i
              className="fas fa-file-lines"
              style={{ marginRight: 8, color: "var(--primary, #16a34a)" }}
            ></i>
            Documentos Enviados
          </h2>

          {loading ? (
            <div className="loading">
              <p>
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ marginRight: 6 }}
                ></i>
                Carregando documentos...
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">
                <i className="fas fa-inbox"></i>
              </p>
              <p>Nenhum documento enviado ainda</p>
              <p className="text-dim">
                Use o formulário acima para enviar documentos
              </p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="document-card animate-in"
                  style={{ "--delay": idx }}
                >
                  <div className="document-icon">
                    <i
                      className={`fas ${DOCUMENT_TYPE_ICONS[doc.type] || "fa-file"}`}
                      style={{
                        color:
                          DOCUMENT_TYPE_COLORS[doc.type] ||
                          "var(--color-doc-outros)",
                      }}
                    ></i>
                  </div>
                  <div className="document-info">
                    <h3 className="document-name">{doc.name}</h3>
                    <p className="document-type">
                      {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                    </p>
                    <p className="document-meta">
                      {doc.sizeKB} KB •{" "}
                      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="document-actions">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="btn btn-sm btn-download"
                      title="Baixar documento"
                    >
                      <i
                        className="fas fa-download"
                        style={{ marginRight: 4 }}
                      ></i>
                      Baixar
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deleting === doc.id}
                      className="btn btn-sm btn-danger"
                      title="Deletar documento"
                    >
                      <i
                        className={`fas ${deleting === doc.id ? "fa-spinner fa-spin" : "fa-trash"}`}
                        style={{ marginRight: 4 }}
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
    </div>
  );
}
