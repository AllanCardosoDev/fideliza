import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../App";
import DocumentUploadGoogle from "../components/DocumentUploadGoogle";
import { api } from "../services/api";
import "../styles/documentos.css";

export default function Documentos() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { clients } = useContext(AppContext);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Encontrar cliente
  const client = clients.find((c) => c.id === parseInt(clientId));

  // Carregar documentos
  useEffect(() => {
    if (!clientId) return;
    loadDocuments();
  }, [clientId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Aqui você faria uma chamada para a API
      // const response = await api.get(`/documents/client/${clientId}`);
      // setDocuments(response.data.data || []);

      // Por enquanto, deixa vazia
      setDocuments([]);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDeleted = async (documentId) => {
    if (!window.confirm("Tem certeza que deseja deletar este documento?")) {
      return;
    }

    setDeletingId(documentId);
    try {
      // await api.delete(`/documents/${documentId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      alert("Erro ao deletar documento");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    loadDocuments();
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
          <p>❌ Cliente não encontrado</p>
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
          <h1>📄 Documentos</h1>
          <p className="client-name">{client.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="documentos-container">
        {/* Upload Section */}
        <div className="upload-section">
          <DocumentUploadGoogle clientId={client.id} clientName={client.name} />
        </div>

        {/* Documents List */}
        <div className="documents-section">
          <h2>📑 Documentos Enviados</h2>

          {loading ? (
            <div className="loading">
              <p>⏳ Carregando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <p>📭 Nenhum documento enviado ainda</p>
              <p className="text-dim">
                Use o formulário acima para enviar documentos para Google Drive
              </p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-icon">
                    {doc.file_name.endsWith(".pdf") ? "📄" : "🖼️"}
                  </div>
                  <div className="document-info">
                    <h3 className="document-name">{doc.file_name}</h3>
                    <p className="document-type">{doc.document_type}</p>
                    <p className="document-date">
                      {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="document-size">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="document-actions">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                      title="Abrir no Google Drive"
                    >
                      🔗
                    </a>
                    <button
                      onClick={() => handleDocumentDeleted(doc.id)}
                      disabled={deletingId === doc.id}
                      className="btn btn-sm btn-danger"
                      title="Deletar documento"
                    >
                      {deletingId === doc.id ? "⏳" : "🗑️"}
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
