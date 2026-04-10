# ⚠️ IMPORTANTE: Estratégia de Deployment para Vercel

## Problema: Vercel Serverless vs Express Server

Existem **2 opções**:

### OPÇÃO 1: Vercel Estático + Backend Separado (RECOMENDADO)

**O quê funciona:**

- Frontend React compilado hospedado no Vercel (gratuito, rápido)
- Backend Node.js/Express em outro lugar (Hostinger, Render, Railway, etc.)

**Como funciona:**

1. Vercel: Faz build do Vite, hospeda em CDN
2. Backend: Roda em servidor tradicional com Express + Firebase
3. Requisições: Frontend → Backend via URL (ex: `api.seu-dominio.com/api/firebase/upload`)

**Vantagens:**

- ✅ Simples de configurar
- ✅ Vercel gratuito para frontend
- ✅ Backend em qualquer servidor
- ✅ Escalável

**Desvantagens:**

- ❌ CORS mais complexo
- ❌ Backend precisa estar em outro lugar

---

### OPÇÃO 2: Vercel com Serverless Functions (COMPLEXO)

**O quê é:**

- Tudo no Vercel (frontend + backend serverless)
- Sem servidor separado

**Problema:**

- Vercel serverless tem limite de 10-15 segundos
- Upload grande vai dar timeout
- Caro se usar muito

---

## RECOMENDAÇÃO: OPÇÃO 1 (Vercel Estático)

### Passo 1: Limpar vercel.json

Seu `vercel.json` atual está correto ✅

### Passo 2: Configurar Backend Separado

**Escolha uma plataforma:**

- **Hostinger** (tradicional) - Você já tem conta
- **Render** (free) - https://render.com
- **Railway** (free) - https://railway.app
- **Replit** (free) - https://replit.com

**Para este guia, vou usar Hostinger (que você já tem).**

### Passo 3: Configurar Frontend para Apontar para Backend

Você precisa atualizar o `.env` do Vercel para apontar para seu backend:

```env
# Vercel - Environment Variables
VITE_API_URL=https://seu-dominio-hostinger.com
```

Depois, no código React, use:

```javascript
// Em src/lib/firebase.js (já faz isso?)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function uploadDocumentToFirebase(file, metadata) {
  const res = await fetch(`${API_URL}/api/firebase/upload`, {
    method: "POST",
    body: formData,
  });
  // ...
}
```

### Passo 4: Deploy

**Frontend (Vercel):**

```bash
git push origin main
# Vercel faz deploy automaticamente
```

**Backend (Hostinger):**

- Faça upload via FTP (confira DEPLOY_HOSTINGER.md)
- Ou via SSH: `cd /dominio && git pull`
- Execute: `npm install && pm2 start server.js`

---

## VERIFICAR SE SEU CÓDIGO JÁ FAZ ISSO

Abra `src/lib/firebase.js` e procure por:

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
```

Se estiver lá, ótimo! Se não, adicione.

---

## PRÓXIMOS PASSOS

1. ✅ Vercel.json já está correto (remover functions)
2. ⏳ Verificar se `src/lib/firebase.js` usa `VITE_API_URL`
3. ⏳ Fazer deploy do backend em Hostinger
4. ⏳ Configurar `VITE_API_URL` no Vercel Environment Variables

---

**Qual é sua preferência?**

- Quer usar **Vercel + Hostinger** (recomendado)?
- Ou quer tentar **tudo no Vercel** (complexo)?
