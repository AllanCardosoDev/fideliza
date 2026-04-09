import React, { useState } from 'react';
import { api } from '../services/api';
import '../styles/document-upload.css';

const DOCUMENT_TYPES = [
  'RG',
  'CPF',
  'Comprovante de Renda',
  'Contrato',
  'Outros',
];

export default function DocumentUploadGoogle({ clientId, clientName }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType || !clientName) {
      setMessage('⚠️ Selecione um arquivo e tipo de documento');
      setMessageType('warning');
      return;
    }

    setUploading(true);
    setMessage('Enviando para Google Drive...');
    setMessageType('info');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', selectedType);
      formData.append('clientId', clientId);
      formData.append('clientName', clientName);

      const response = await api.post('/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage(`✅ Documento "${selectedFile.name}" enviado com sucesso!`);
        setMessageType('success');
        setSelectedFile(null);
        setSelectedType('');

        // Limpar input de arquivo
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(`❌ Erro: ${response.data.message}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setMessage(`❌ Erro ao enviar: ${error.message}`);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload-google">
      <div className="upload-container">
        <h3>📤 Enviar Documento para Google Drive</h3>

        {clientName && (
          <p className="client-info">📁 Cliente: <strong>{clientName}</strong></p>
        )}

        {/* Select Document Type */}
        <div className="form-group">
          <label htmlFor="doc-type">Tipo de Documento:</label>
          <select
            id="doc-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={uploading}
          >
            <option value="">-- Selecione --</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* File Input */}
        <div className="form-group">
          <label htmlFor="file-input">Arquivo:</label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            accept="image/*,.pdf,.doc,.docx"
          />
          {selectedFile && (
            <p className="file-info">📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)</p>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className={`upload-btn ${uploading ? 'loading' : ''}`}
        >
          {uploading ? '⏳ Enviando...' : '📤 Enviar para Google Drive'}
        </button>
      </div>
    </div>
  );
}
