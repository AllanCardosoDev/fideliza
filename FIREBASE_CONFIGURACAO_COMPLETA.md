# 🔧 Configuração Completa do Firebase para Upload de Documentos

## 📋 Status Atual da Integração

✅ **CONCLUDÍDO:**

- Firebase SDK instalado (`firebase@12.12.0`)
- Credenciais adicionadas ao `.env`
- Biblioteca `src/lib/firebase.js` criada com todas as funções
- Componente `src/components/DocumentUploadTab.jsx` integrado com Firebase
- Servidor rodando em `http://localhost:5174/`

⏳ **PENDENTE (MANUAL STEPS):**

- Ativar Firestore Database no Firebase Console
- Ativar Cloud Storage no Firebase Console
- Configurar regras de segurança

---

## 🚀 Passos para Configuração Completa (5-10 minutos)

### **PASSO 1: Acessar Firebase Console**

1. Abra: https://console.firebase.google.com/
2. Selecione o projeto: **documentos-87058**

---

### **PASSO 2: Ativar Firestore Database**

1. No menu esquerdo, clique em **"Build"** → **"Firestore Database"**
2. Clique em **"+ Create Database"**
3. Escolha o modo:
   - ✅ **"Start in test mode"** (para desenvolvimento)
   - ⚠️ Saiba que modo teste permite leitura/escrita sem autenticação
4. Selecione localização:
   - Prefira uma região próxima aos usuários (ex: `us-east1` ou `southamerica-east1` para Brasil)
5. Clique em **"Create"**

⏱️ _Aguarde 1-2 minutos para ativar..._

✅ **Conclusão**: Você verá a mensagem _"Firestore Database is now live"_

---

### **PASSO 3: Ativar Cloud Storage**

1. No menu esquerdo, clique em **"Build"** → **"Storage"**
2. Clique em **"Get Started"**
3. Modo de segurança:
   - ✅ Selecione **"Start in test mode"**
4. Selecione a mesma localização do Firestore
5. Clique em **"Done"**

⏱️ _Aguarde 1-2 minutos para ativar..._

✅ **Conclusão**: Aparecerá um bucket vazio pronto para usar

---

### **PASSO 4: Configurar Regras de Firestore (Modo Teste → Produção)**

⚠️ **IMPORTANTE**: As regras de "teste" não são seguras para produção!

#### Para **Teste/Desenvolvimento**:

1. Clique em **"Firestore Database"** → abra a aba **"Rules"**
2. Substitua o texto completo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Documentos: apenas autenticados podem criar/ler seus próprios
    match /documentos/{docId} {
      allow read, write: if request.auth != null;
    }

    // Modo teste (desenvolvimento apenas!)
    // Descomente se precisar de teste sem auth:
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

3. Clique **"Publish"**

---

### **PASSO 5: Configurar Regras de Cloud Storage (Modo Teste → Produção)**

1. Vá para **"Storage"** → abra a aba **"Rules"**
2. Substitua o texto por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Documentos: qualquer um pode ler (URLs públicas)
    // Mas apenas autenticados podem fazer upload
    match /documentos-clientes/{clientId}/{clientName}/{documentType}/{fileName} {
      allow read: if true;
      allow create, delete: if request.auth != null;
      allow update: if false;
    }
  }
}
```

3. Clique **"Publish"**

---

## 🧪 Testar a Integração

### **Se o servidor ainda não está rodando:**

```bash
cd "c:\Users\User\Desktop\financeiro\fidelizacred-react"
npm run dev
```

Ele vai abrir em `http://localhost:5174/`

### **No navegador:**

1. Navegue até **"Clientes"** (menu lateral)
2. Clique em **"+ Novo Cliente"** ou clique para editar um existente
3. Preencha os campos básicos e clique **"Próximo"**
4. Na aba **"4. Documentos"**:
   - Selecione um tipo de documento
   - Arraste um arquivo PDF/imagem ou clique para selecionar
   - Clique **"📤 Enviar Documento"**

✅ se tudo está certo:

- Mensagem "✅ ... enviado com sucesso!" aparece
- Arquivo aparece na lista "📄 Arquivos Armazenados no Firebase"
- Você pode fazer download (⬇️) ou visualizar (👁️)
- Pode deletar com 🗑️

❌ **Se receber erro:**

- **"Erro: Missing or insufficient permissions"**
  → Verifique as regras do Firestore/Storage e o modo teste

- **"Erro: documentos collection not found"**
  → Firestore não foi ativado. Volte ao Passo 2.

- **"Erro de inicialização do Firebase"**
  → Verifique se as variáveis de ambiente no `.env` estão corretas

---

## 📁 Estrutura de Dados no Firebase

### **Firestore - Coleção "documentos"**

Cada documento tem essa estrutura:

```json
{
  "id": "documento123abc",
  "clientId": "5",
  "clientName": "João Silva",
  "documentType": "cpf",
  "fileName": "cpf_joao.pdf",
  "fileSize": 245680,
  "fileType": "application/pdf",
  "storagePath": "documentos-clientes/5/joao_silva/cpf/1712800000000_cpf_joao.pdf",
  "downloadUrl": "https://firebasestorage.googleapis.com/v0/b/...",
  "createdAt": "2026-04-10T17:30:45.123Z",
  "uploadedBy": "cliente",
  "updatedAt": "2026-04-10T17:30:45.123Z"
}
```

### **Cloud Storage - Estrutura de Pastas**

```
gs://documentos-87058.appspot.com/
└── documentos-clientes/
    └── {clientId}/
        └── {clientName}/
            └── {documentType}/
                └── {timestamp}_{fileName}
```

**Exemplo:**

```
gs://documentos-87058.appspot.com/documentos-clientes/5/joao_silva/cpf/1712800000000_cpf.pdf
```

---

## 🔐 Segurança em Produção

### ⚠️ Antes de ir para PRODUÇÃO:

1. **Desative modo teste** nas regras do Firestore e Storage
2. **Implementar autenticação real** (Firebase Auth ou Supabase)
3. **Adicionar validação** de limite de tamanho de arquivo
4. **Encriptar dados sensíveis** se armazenar informações pessoais

**Exemplo de regra mais restritiva:**

```javascript
// Firestore
match /documentos/{docId} {
  allow read: if request.auth != null &&
     resource.data.clientId == request.auth.uid;
  allow create: if request.auth != null &&
     request.resource.data.clientId == request.auth.uid;
  allow delete: if request.auth != null &&
     resource.data.clientId == request.auth.uid;
}
```

---

## 📌 Variáveis de Ambiente (já configuradas)

Seu `.env` tem:

```env
VITE_FIREBASE_API_KEY=AIzaSyCaxbu2jy7EzCkHaKceqCCF_i70UEZJkRU
VITE_FIREBASE_AUTH_DOMAIN=documentos-87058.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=documentos-87058
VITE_FIREBASE_STORAGE_BUCKET=documentos-87058.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1092254914143
VITE_FIREBASE_APP_ID=1:1092254914143:web:1a1757c881bb3dc7b56dea
VITE_FIREBASE_MEASUREMENT_ID=G-2HKQZ3N02H
```

---

## 🛠️ Funções Disponíveis (src/lib/firebase.js)

### **Upload de Documento**

```javascript
import { uploadDocumentToFirebase } from "../lib/firebase";

const result = await uploadDocumentToFirebase(file, {
  clientId: "5",
  clientName: "João Silva",
  documentType: "cpf",
});
// Returns: { success, fileUrl, docId, storagePath }
```

### **Buscar Documentos do Cliente**

```javascript
import { getClientDocuments } from "../lib/firebase";

const documents = await getClientDocuments("5");
// Returns: Array de documentos
```

### **Buscar Documento Específico**

```javascript
import { getDocumentById } from "../lib/firebase";

const doc = await getDocumentById("documento123abc");
```

### **Atualizar Documento**

```javascript
import { updateDocument } from "../lib/firebase";

await updateDocument("documento123abc", {
  status: "verified",
  approvedBy: "admin123",
});
```

### **Deletar Documento**

```javascript
import { deleteDocument } from "../lib/firebase";

await deleteDocument(
  "documento123abc",
  "documentos-clientes/5/joao_silva/cpf/1712800000000_cpf.pdf",
);
```

---

## ✅ Checklist de Implementação

- [ ] Firestore Database ativado
- [ ] Cloud Storage ativado
- [ ] Regras de Firestore configuradas
- [ ] Regras de Cloud Storage configuradas
- [ ] Servidor rodando em http://localhost:5174/
- [ ] Consegue fazer login/acessar Clientes
- [ ] Consegue criar novo cliente
- [ ] Consegue fazer upload de arquivo na aba Documentos
- [ ] Arquivo aparece na lista
- [ ] Consegue baixar/visualizar arquivo
- [ ] Consegue deletar arquivo

---

## 🆘 Troubleshooting

| Problema                         | Solução                                           |
| -------------------------------- | ------------------------------------------------- |
| **"Fuego não inicializa"**       | Verifique as credenciais no `.env`                |
| **"Firestore retorna 403"**      | Ative Firestore e ajuste as regras de teste       |
| **"Storage retorna 403"**        | Ative Cloud Storage e ajuste as regras            |
| **Arquivo não aparece na lista** | Aguarde alguns segundos (query pode ter latência) |
| **Não consegue deletar arquivo** | Verifique se tem permissão nas regras do Storage  |

---

## 📞 Contato para Suporte

Se encontrar problemas com Firebase:

1. Verifique o console (F12) para ver mensagens de erro
2. Consulte [Firebase Docs](https://firebase.google.com/docs)
3. Verifique status do projeto em [Firebase Console](https://console.firebase.google.com/)

**Data da última atualização**: 10/04/2026
