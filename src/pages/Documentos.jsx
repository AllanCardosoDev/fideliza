import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../App";
import DocumentUploadGoogle from "../components/DocumentUploadGoogle";
import { useGoogleDriveOAuth } from "../hooks/useGoogleDriveOAuth";
import "../styles/documentos.css";

export default function Documentos() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { clients } = useContext(AppContext);
  const { isSignedIn, listClientDocuments, deleteFile } = useGoogleDriveOAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Encontrar cliente
  const client = clients.find((c) => c.id === parseInt(clientId));

  // Carregar documentos quando signIn mudar ou clientId mudar
  useEffect(() => {
    if (!clientId || !isSignedIn) {
      setLoading(false);
      return;
    }
    loadDocuments();
  }, [clientId, isSignedIn]);

  const loadDocuments = async () => {
    if (!client) return;

    try {
      setLoading(true);
      const docs = await listClientDocuments(client.name);
      setDocuments(docs || []);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      setDocuments([]);
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
      await deleteFile(documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      alert("Erro ao deletar documento");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = () => {
    // Recarregar documentos após upload
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
          <DocumentUploadGoogle
            clientId={client.id}
            clientName={client.name}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>

        {/* Documents List */}
        <div className="documents-section">
          <h2>📑 Documentos Enviados</h2>

          {!isSignedIn ? (
            <div className="empty-state">
              <p>🔐 Faça login no Google para ver seus documentos</p>
            </div>
          ) : loading ? (
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
                    {doc.name.endsWith(".pdf") ? "📄" : "🖼️"}
                  </div>
                  <div className="document-info">
                    <h3 className="document-name">{doc.name}</h3>
                    {doc.createdTime && (
                      <p className="document-date">
                        {new Date(doc.createdTime).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {doc.size && (
                      <p className="document-size">
                        {(doc.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <div className="document-actions">
                    {doc.webViewLink && (
                      <a
                        href={doc.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline"
                        title="Abrir no Google Drive"
                      >
                        🔗
                      </a>
                    )}
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
