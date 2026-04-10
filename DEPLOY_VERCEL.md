# 🚀 GUIA DEPLOYMENT VERCEL

## 1. PREPARAR PROJETO

```bash
# Commit suas mudanças
git add .
git commit -m "feat: preparar para deployment Vercel"
git push origin main
```

## 2. CONECTAR VERCEL

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **Import Project**
3. Selecione seu repositório GitHub
4. Framework: **Vite**
5. Clique em **Import**

## 3. CONFIGURAR VARIÁVEIS DE AMBIENTE

No Vercel (Project Settings → Environment Variables), adicione:

```
# Supabase
VITE_SUPABASE_URL=https://urysprfgdhfhkgzxkpru.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase
FIREBASE_PROJECT_ID=documentos-87058
FIREBASE_PRIVATE_KEY_ID=e4da8be629048cd3a49ee449c3f1fab951f7dcea
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhk...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-7t6zq@documentos-87058.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=117159999999999999999
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-7t6zq%40documentos-87058.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=documentos-87058.appspot.com

# Ambiente
NODE_ENV=production
```

**IMPORTANTE**: Para `FIREBASE_PRIVATE_KEY`, copie a chave do Firebase Console e substitua quebras de linha reais com `\n` literal.

Exemplo:

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQE...
...resto...
-----END PRIVATE KEY-----
```

Vira:

```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQE...\n...resto...\n-----END PRIVATE KEY-----\n
```

## 4. FAZER DEPLOY

Depois de configurar as variáveis, clique em **Deploy**

Vercel buildará automaticamente:

- Instala dependências (`npm install`)
- Build React (`npm run build`)
- Cria serverless functions em `/api`

## 5. TESTE

Acesse seu domínio Vercel (exemplo: `seu-projeto.vercel.app`)

Você verá a landing page → clique em `/simular` → teste upload de arquivo

## 6. VERIFICAR LOGS

```bash
# Acompanhe logs em tempo real
vercel logs --follow
```

## 7. PRODUÇÃO (Custom Domain)

1. No Vercel Dashboard → **Domains**
2. Adicione seu domínio customizado
3. Aponte DNS conforme instrições do Vercel

## 🐛 TROUBLESHOOTING

### Tela Preta

- Verifique se variáveis de ambiente foram salvas
- Reconstrua: Dashboard → **Redeploy**
- Veja logs: `vercel logs --follow`

### Erro 500 em Upload

- Valide as variáveis `FIREBASE_*`
- Certifique-se que `FIREBASE_PRIVATE_KEY` tem `\n` corretos
- Verifique permissões do Firebase Bucket

### Function Timeout

- Vercel tem limite de 10s (gratuito) ou 15s (pro)
- Uploads maiores podem falhar
- Considere limitar tamanho de arquivo

## 📊 MONITORAMENTO

Verifique no Vercel Analytics:

- Build success/failure
- API usage (serverless functions)
- Response times

## 🔄 UPDATES

Para atualizar código:

```bash
git push origin main
# Vercel fará deploy automaticamente (redeploy)
```

Para rediployr manualmente:

- Dashboard → Seu projeto → **Redeploy** → **Redeploy**

---

**Resumo de diferenças Vercel vs Hostinger:**

- Vercel: Deployment automático via GitHub, serverless functions, gerenciado
- Hostinger: Manual via FTP/SSH, servidor tradicional Node.js, mais controle

Ambos funcionam! Escolha conforme preferência.
