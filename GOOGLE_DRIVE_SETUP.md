# 📤 Integração Google Drive - Guia de Implementação

## ✅ Configuração Concluída

Todo os arquivos necessários foram criados para integração com Google Drive.

---

## 📁 Arquivos Criados

### Frontend (React)

- `src/components/DocumentUploadGoogle.jsx` - Componente de upload
- `src/hooks/useGoogleDriveUpload.js` - Hook customizado
- `src/styles/document-upload.css` - Estilos
- `.env.local` - Variáveis de ambiente
- `credentials/google-service-account.json` - Credenciais

### Backend (Node.js)

- `src/services/googleDriveService.js` - Serviço Google Drive
- `src/services/documentController.server.js` - Controller de exemplo

---

## 🚀 Como Usar

### 1️⃣ Importar o Componente no React

```jsx
import DocumentUploadGoogle from "@/components/DocumentUploadGoogle";

// Em uma página (ex: Clientes.jsx)
<DocumentUploadGoogle clientId={client.id} clientName={client.name} />;
```

### 2️⃣ Configurar o Backend (Express)

Adicione ao seu servidor Express (`server.js` ou similar):

```javascript
import express from "express";
import multer from "multer";
import {
  uploadDocumentController,
  getClientDocuments,
  deleteDocument,
} from "./src/services/documentController.server.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Rotas
app.post(
  "/api/documents/upload",
  upload.single("file"),
  uploadDocumentController,
);

app.get("/api/documents/client/:clientId", getClientDocuments);

app.delete("/api/documents/:documentId", deleteDocument);
```

### 3️⃣ Instalar Dependências no Backend

```bash
npm install google-auth-library multer
```

---

## 📋 Estrutura de Pastas no Google Drive

Será criada automaticamente:

```
📁 Documentos Clientes
  └─ 📁 Nome do Cliente (criada automaticamente)
     ├─ documento1.pdf
     ├─ documento2.jpg
     └─ documento3.png
```

---

## 🔐 Segurança

✅ `.env.local` protegido (adicionado ao `.gitignore`)
✅ `credentials/` protegido (adicionado ao `.gitignore`)
✅ Service Account com permissões limitadas
✅ Validação no frontend e backend

---

## 🎯 Tipos de Documentos Suportados

- RG
- CPF
- Comprovante de Renda
- Contrato
- Outros

---

## 📊 Banco de Dados - Tabela `documents`

Os metadados são salvos em Supabase:

```sql
id            - ID do documento
client_id     - ID do cliente
document_type - Tipo (RG, CPF, etc)
file_name     - Nome do arquivo
file_url      - URL no Google Drive
file_size     - Tamanho em bytes
mime_type     - Tipo MIME
uploaded_at   - Data de upload
```

---

## 🧪 Testar Upload

1. Vá para a página de Clientes
2. Selecione um cliente
3. Clique em "Enviar Documento para Google Drive"
4. Escolha tipo e arquivo
5. Clique em "Enviar"

---

## ⚠️ Troubleshooting

### Erro: "Credenciais não encontradas"

```
✅ Verifique se credentials/google-service-account.json existe
✅ Verifique a pasta não está no .gitignore mal escrita
```

### Erro: "Pasta não tem acesso"

```
✅ Volte ao Google Drive
✅ Clique em "Compartilhar" novamente na pasta "Documentos Clientes"
✅ Verifique se o email está correto
```

### Erro de CORS

```
O backend deve estar rodando na mesma porta ou ter CORS configurado
```

---

## 📚 Variáveis de Ambiente

Seu `.env.local` já tem:

```env
VITE_GOOGLE_DRIVE_FOLDER_ID=1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=fideliza-drive@fifth-sol-492819-s6.iam.gserviceaccount.com
```

---

## 🔄 Próximas Etapas

1. **Implementar Backend** - Use `documentController.server.js`
2. **Adicionar Rota** - configure as 3 rotas listadas acima
3. **Integrar Componente** - Importe em Clientes.jsx ou crie página de Documentos
4. **Testar** - Teste o upload completo

---

## ✨ Funcionalidades Incluídas

✅ Upload de arquivos para Google Drive
✅ Organização automática por cliente
✅ Salvar metadados em Supabase
✅ Feedback visual (carregamento, sucesso/erro)
✅ Suporte múltiplos tipos de arquivo
✅ Interface responsiva

---

## 📞 Dúvidas?

Consulte os comentários nos arquivos:

- `DocumentUploadGoogle.jsx` - Componente
- `googleDriveService.js` - Serviço
- `documentController.server.js` - Backend
