import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function DocumentUpload({
  clientId,
  clientType = "autonomo",
  onUploadSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const fileInputRef = useRef(null);

  // Documentos para Pessoa Física (PF/Autônomo)
  const DOCUMENT_TYPES_PF = [
    { label: "RG", required: true, recommended: true },
    { label: "CPF", required: true, recommended: true },
    { label: "CNH", required: false, recommended: true },
    { label: "Comprovante de Renda", required: true, recommended: true },
    { label: "Comprovante de Endereço", required: true, recommended: true },
    { label: "Extrato Bancário", required: false, recommended: true },
    { label: "Documento de Propriedade", required: false, recommended: false },
    { label: "Aval", required: false, recommended: false },
    { label: "Outros", required: false, recommended: false },
  ];

  // Documentos para Pessoa Jurídica (PJ/Empresa)
  const DOCUMENT_TYPES_PJ = [
    { label: "CNPJ", required: true, recommended: true },
    { label: "Inscrição Estadual", required: true, recommended: true },
    { label: "Contrato Social", required: true, recommended: true },
    {
      label: "Certificado de Condição de Microempreendedor",
      required: false,
      recommended: true,
    },
    { label: "Alvará de Funcionamento", required: true, recommended: true },
    {
      label: "Comprovante de Endereço Comercial",
      required: true,
      recommended: true,
    },
    { label: "Último Balanço Patrimonial", required: false, recommended: true },
    { label: "Extrato Bancário Empresa", required: false, recommended: true },
    {
      label: "Comprovante de Renda (Sócios)",
      required: false,
      recommended: true,
    },
    { label: "RG do(s) Sócio(s)", required: false, recommended: true },
    { label: "Outros", required: false, recommended: false },
  ];

  // Selecionar tipos baseado no client_type
  const DOCUMENT_TYPES =
    clientType === "empresa" ? DOCUMENT_TYPES_PJ : DOCUMENT_TYPES_PF;

  // Definir tipo padrão baseado no tipo de cliente
  useEffect(() => {
    if (selectedType === null) {
      setSelectedType(clientType === "empresa" ? "CNPJ" : "RG");
    }
  }, [clientType, selectedType]);

  // Buscar documentos do cliente
  useEffect(() => {
    if (clientId) {
      fetchDocuments();
    }
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (file.size > 10 * 1024 * 1024) {
      alert("❌ Arquivo muito grande (máximo: 10MB)");
      return;
    }

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
      alert("❌ Tipo não permitido. Use: PDF, JPG, PNG, DOC, DOCX");
      return;
    }

    try {
      setLoading(true);

      // 1. Upload para Supabase Storage
      const timestamp = Date.now();
      const fileName = `client_${clientId}_${timestamp}_${file.name}`;
      const path = `${clientId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(path);

      // 3. Salvar referência no banco de dados
      const { error: dbError } = await supabase.from("documents").insert([
        {
          client_id: clientId,
          document_type: selectedType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          employee_id: 1,
        },
      ]);

      if (dbError) throw dbError;

      alert("✅ Documento enviado com sucesso!");

      // Atualizar lista
      fetchDocuments();
      if (onUploadSuccess) onUploadSuccess();

      // Limpar input e reset tipo
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedType("RG");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("❌ Erro ao fazer upload do documento");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Tem certeza que deseja deletar este documento?")) return;

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      alert("✅ Documento deletado");
      fetchDocuments();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("❌ Erro ao deletar documento");
    }
  };

  // Calcular documentos pendentes (obrigatórios não entregues)
  const uploadedTypes = documents.map((d) => d.document_type);
  const pendingDocs = DOCUMENT_TYPES.filter(
    (doc) => doc.required && !uploadedTypes.includes(doc.label),
  );
  const recommendedDocs = DOCUMENT_TYPES.filter(
    (doc) =>
      !doc.required && doc.recommended && !uploadedTypes.includes(doc.label),
  );

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        marginTop: "20px",
      }}
    >
      {/* Indicador de Tipo (PF/PJ) */}
      <div style={{ marginBottom: "15px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "600",
            backgroundColor: clientType === "empresa" ? "#c62828" : "#1976d2",
            color: "white",
          }}
        >
          {clientType === "empresa"
            ? "🏢 Pessoa Jurídica (Empresa)"
            : "👤 Pessoa Física"}
        </span>
      </div>

      {/* Aviso de Documentos Pendentes */}
      {pendingDocs.length > 0 && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff3cd",
            borderLeft: "4px solid #ff9800",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          <strong>⚠️ Documentos Obrigatórios Pendentes:</strong>
          <div style={{ marginTop: "8px" }}>
            {pendingDocs.map((doc) => (
              <div key={doc.label} style={{ fontSize: "14px", color: "#333" }}>
                • {doc.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso de Documentos Recomendados */}
      {recommendedDocs.length > 0 && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            borderLeft: "4px solid #4CAF50",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          <strong>ℹ️ Documentos Recomendados Pendentes:</strong>
          <div style={{ marginTop: "8px" }}>
            {recommendedDocs.map((doc) => (
              <div key={doc.label} style={{ fontSize: "14px", color: "#333" }}>
                • {doc.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Upload */}
      <div style={{ marginBottom: "20px" }}>
        <h4>📤 Upload de Documentos</h4>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Tipo de Documento *
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          >
            {DOCUMENT_TYPES.map((doc) => (
              <option key={doc.label} value={doc.label}>
                {doc.label}
                {doc.required ? " (Obrigatório)" : ""}
                {doc.recommended && !doc.required ? " (Recomendado)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador do tipo selecionado */}
        {DOCUMENT_TYPES.find((d) => d.label === selectedType) && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
              fontSize: "13px",
            }}
          >
            {DOCUMENT_TYPES.find((d) => d.label === selectedType)?.required && (
              <span
                style={{
                  backgroundColor: "#ff5252",
                  color: "white",
                  padding: "3px 8px",
                  borderRadius: "3px",
                }}
              >
                🔴 Obrigatório
              </span>
            )}
            {DOCUMENT_TYPES.find((d) => d.label === selectedType)
              ?.recommended && (
              <span
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  padding: "3px 8px",
                  borderRadius: "3px",
                }}
              >
                ✓ Recomendado
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: loading ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "⏳ Enviando..." : "📤 Upload"}
          </button>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div>
        <h4>📁 Documentos Anexados ({documents.length})</h4>
        {documents.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  padding: "12px",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0066cc",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      📄 {doc.file_name}
                    </a>
                    <span
                      style={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}
                    >
                      {doc.document_type}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")} |{" "}
                    {(doc.file_size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  🗑️ Deletar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#999" }}>Nenhum documento anexado ainda</p>
        )}
      </div>
    </div>
  );
}
