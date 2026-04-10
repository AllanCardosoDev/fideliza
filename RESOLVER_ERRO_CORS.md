# 🔧 Solucionando Erro CORS no Firebase Cloud Storage

## ❌ Erro Encontrado

```
Access to XMLHttpRequest... has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
It does not have HTTP ok status.
```

**Este erro significa:** Cloud Storage não está ativado ou as regras estão rejeitando a requisição.

---

## ✅ Solução - 3 Passos (5 minutos)

### **PASSO 1: Verificar se Cloud Storage está REALMENTE ativado**

1. Abra: **https://console.firebase.google.com/**
2. Selecione: **documentos-87058**
3. Menu esquerdo → **"Build"** → **"Storage"**

**Se vir:**

- ✅ Um bucket com nome `documentos-87058.firebasestorage.app` → **Já está ativado**
- ❌ Um botão "Get Started" → **Precisa ativar** (complete o Passo 2)

---

### **PASSO 2: Se NÃO estiver ativado - Ativar Cloud Storage**

1. Clique em **"Get Started"**
2. Escolha: **"Start in test mode"** ← Importante!
3. Localização: **Deixe padrão** (ou escolha igual ao Firestore)
4. Clique em **"Done"**

⏳ _Aguarde 2-3 minutos para ativar..._

✅ Quando aparecer um bucket vazio, está pronto.

---

### **PASSO 3: Verificar e CORRIGIR as Regras de Cloud Storage**

1. Em **Storage**, abra a aba **"Rules"**
2. Você verá regras como:

   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **SUBSTITUA** por estas regras (que funcionam melhor):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir leitura pública (download)
    match /documentos-clientes/{allPaths=**} {
      allow read: if true;
    }

    // Permitir upload desde localhost e produção
    match /documentos-clientes/{clientId}/{clientName}/{documentType}/{fileName} {
      allow create: if true;
      allow delete: if true;
    }
  }
}
```

4. Clique em **"Publish"**

---

## 🧪 Testar Imediatamente

Após publicar as regras:

1. **Feche completamente o navegador**
2. **Reabra**: http://localhost:5173/
3. **Navegue**: Clientes → Editar cliente → Aba 4 (Documentos)
4. **Tente upload** novamente

✅ Deve funcionar agora!

---

## ⚠️ Se Ainda Não Funcionar...

### **Opção A: Regras Mais Permissivas (Teste)**

Se ainda der erro, use regras COMPLETAMENTE permissivas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ CUIDADO:** Isso permite leitura/escrita para QUALQUER PESSOA. Use apenas para teste!

### **Opção B: Verificar Firestore também**

As regras do Firestore também podem estar bloqueando. Use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🔍 Debug - Ver o que está acontecendo

Abra **DevTools do navegador** (F12):

1. Abra a aba **"Network"**
2. Tente fazer upload novamente
3. Procure por requisições para `firebasestorage.googleapis.com`
4. Clique na requisição que falhou
5. Veja a aba **"Response"** para ver qual erro exato o Firebase está retornando

---

## 📋 Checklist Rápido

- [ ] Abri https://console.firebase.google.com/
- [ ] Selecionei projeto `documentos-87058`
- [ ] Fui em Storage
- [ ] ✅ Confirmo que Cloud Storage está ativado (vejo o bucket)
- [ ] Abri a aba "Rules"
- [ ] Copiei as regras fornecidas neste arquivo
- [ ] Cliquei "Publish"
- [ ] Reabri o navegador completamente
- [ ] Tentei fazer upload novamente
- [ ] ✅ Funcionou!

---

## 🆘 Soluções Comuns por Erro Específico

| Erro                               | Solução                              |
| ---------------------------------- | ------------------------------------ |
| **CORS preflight failed**          | Ative Cloud Storage + Publish regras |
| **403 Permission denied**          | Regras estão muito restritivas       |
| **Storage bucket not found**       | Cloud Storage não ativado            |
| **ERR_FAILED (sem mais detalhes)** | Verifique console Firefox/Chrome     |

---

## 🚀 Próximo (Após Funcionar)

Depois de confirmar que o upload funciona:

1. ✅ Tudo está funcionando
2. **Para PRODUÇÃO**, ajuste as regras para mais restritivas:
   ```javascript
   allow create: if request.auth != null;
   ```

---

**Status**: 🔴 Bloqueado por Cloud Storage configuration  
**Tempo para resolver**: ~5 minutos
