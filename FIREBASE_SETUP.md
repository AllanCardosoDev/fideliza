# 🔥 Configuração do Firebase para Upload de Documentos

## Status: ✅ Integração Pronta para Configuração

A integração com Firebase foi preparada! Agora você precisa:

1. **Criar um projeto no Firebase Console**
2. **Preencher as credenciais no `.env`**
3. **Configurar as Regras de Firestore**

---

## 📋 Passo 1: Criar Projeto no Firebase Console

### 1.1 - Acessar Firebase Console
- Vá para: https://console.firebase.google.com/
- Clique em **"Criar Projeto"**
  
### 1.2 - Nome e Configurações
```
Nome do Projeto: fidelizacred-docs
(ou o nome que você preferir)
```

### 1.3 - Ativar Google Analytics (opcional)
Você pode pular essa parte se preferir.

---

## 🔐 Passo 2: Copiar Credenciais para `.env`

Depois que o projeto for criado:

1. No painel do Firebase, vá para **⚙️ Configurações do Projeto**
2. Na aba **Geral**, localize a seção **"Seus aplicativos"**
3. Clique em **"</> Aplicativo da Web"** (ícone HTML cinzento)
4. Registre o aplicativo com o nome que quiser
5. Você verá um objeto `firebaseConfig` com valores como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxx...",  
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
  measurementId: "G-XXXXXXXXXX"
};
```

### 2.1 - Atualizar `.env`

Abra `fidelizacred-react/.env` e preencha:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 📁 Passo 3: Ativar Firestore Database

1. No Firebase Console, vá para **Cloud Firestore** (lado esquerdo)
2. Clique em **"Criar banco de dados"**
3. Escolha o modo: **Teste** (para começar)
   - ⚠️ Lembre-se que em produção você precisa de regras próprias!
4. Localização: Escolha a mais próxima de você
5. Clique em **"Criar"**

---

## 📦 Passo 4: Ativar Cloud Storage

1. No Firebase Console, vá para **Cloud Storage**
2. Clique em **"Começar"**
3. Escolha o modo: **Teste** (para começar)
4. Localização: Mesma da anterior (recomendado)
5. Clique em **"Criar"**

---

## 🔒 Passo 5: Configurar Regras de Segurança (Importante!)

### Para Firestore:

1. Vá para **Cloud Firestore** → **Regras**
2. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para usuários autenticados
    match /documentos/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publicar"**

### Para Storage:

1. Vá para **Cloud Storage** → **Regras**
2. Substitua o conteúdo por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir upload e leitura para usuários autenticados
    match /documentos-clientes/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publicar"**

---

## 🚀 Passo 6: Testar (Opcional por enquanto)

Se você quiser testar sem autenticação:

```javascript
// Firestore rules (modo teste - NÃO USE EM PRODUÇÃO!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

// Storage rules (modo teste - NÃO USE EM PRODUÇÃO!)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 📝 Resumo da Estrutura

Depois de configurado, seus documentos serão armazenados assim:

**Storage (Firebase)**:
```
documentos-clientes/
  ├── {clientId}/
  │   ├── {clientName}/
  │   │   ├── {documentType}/
  │   │   │   ├── 1707123456_rg.pdf
  │   │   │   └── 1707123457_cpf.pdf
```

**Firestore (Database)**:
```
documentos collection {
  clientId: "123"
  clientName: "João Silva"
  documentType: "identity"
  fileName: "rg.pdf"
  fileSize: 524288
  fileType: "application/pdf"
  storagePath: "documentos-clientes/123/joao_silva/identity/1707123456_rg.pdf"
  downloadUrl: "https://firebasestorage.googleapis.com/..."
  createdAt: Timestamp
  uploadedBy: "cliente"
}
```

---

## ✅ Checklist Final

- [ ] Projeto Firebase criado
- [ ] Credenciais copiadas para `.env`
- [ ] Firestore Database ativado
- [ ] Cloud Storage ativado
- [ ] Regras de segurança configuradas
- [ ] Testado o upload de documento

---

## 🔗 Referências

- [Firebase Console](https://console.firebase.google.com/)
- [Documentação Firestore](https://firebase.google.com/docs/firestore)
- [Documentação Cloud Storage](https://firebase.google.com/docs/storage)
- [Documentação JavaScript SDK](https://firebase.google.com/docs/reference/js)

---

## 💡 Após Configurar

1. Reinicie o servidor Vite: `npm run dev`
2. Navegue até a seção de documentos
3. Teste o upload de um arquivo
4. Verifique no Firebase Console se os arquivos aparecem em **Cloud Storage** e os metadados em **Firestore**

Good luck! 🚀
