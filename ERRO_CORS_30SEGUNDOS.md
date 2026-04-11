# 🆘 ERRO CORS - SOLUÇÃO IMEDIATA

## Erro Encontrado

```
Response to preflight request doesn't pass access control check
```

## Cause

Cloud Storage não está ativado OU regras estão erradas

## Solução (5 min)

### 1. Abra

https://console.firebase.google.com/project/documentos-87058/storage

### 2. Se vir "Get Started":

Clique → "test mode" → "Done" → Aguarde 2 min

### 3. Vá para aba "Rules" e cole isto:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documentos-clientes/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Clique "Publish"

### 5. No navegador:

- Ctrl+Shift+Delete (limpar cache)
- Feche completamente
- Reabra http://localhost:5173/
- Teste upload novamente

---

✅ Deve funcionar agora!

---

**Se não funcionar**: Leia `RESOLVER_ERRO_CORS.md` ou `STATUS_ATUAL_UPLOAD.md`
