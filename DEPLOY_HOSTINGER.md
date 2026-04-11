# 🚀 GUIA DEPLOYMENT HOSTINGER

## 1. REQUISITOS NO HOSTINGER

- **Node.js 18+** (deve estar disponível no Hostinger)
- **npm ou yarn**
- Domínio apontado para Hostinger

## 2. PREPARAR O PROJETO LOCALMENTE

```bash
# Na sua máquina (não no Hostinger)
npm run build
```

Isso cria a pasta `dist/` com a aplicação compilada.

## 3. FAZER UPLOAD PARA HOSTINGER

### Via FTP/cPanel (Arquivo Manager)

1. Acesse o cPanel do seu Hostinger
2. Abra **File Manager**
3. Navegue até a pasta do domínio (geralmente `public_html/` ou similar)
4. Envie os arquivos via FTP:
   ```
   /dist/          → raiz do domínio
   /src/           → senão necessário, público
   /package.json   → CRÍTICO
   /package-lock.json → CRÍTICO
   /server.js      → CRÍTICO
   /.env           → CRÍTICO (criar no Hostinger, não enviar via FTP)
   ```

**NÃO ENVIE**:

- `/node_modules/` (será instalado no servidor)
- `/credentials/` (usar variáveis de ambiente)
- `/.git/`

## 4. CRIAR .ENV NO HOSTINGER

Via **cPanel Terminal** ou **SSH**:

```bash
cd /path/to/seu/domínio
nano .env
```

Copie e cole:

```env
# ========================================
# Supabase (Banco de Dados)
# ========================================
VITE_SUPABASE_URL=https://urysprfgdhfhkgzxkpru.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeXNwcmZnZGhmaGtnenhrcHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzEzNTQsImV4cCI6MjA5MTI0NzM1NH0.hDUjAnrKTqGO4pAaGVxU4cRhu5yUViLhVbll-KPwNQw

# ========================================
# Firebase (Upload e Storage)
# ========================================
FIREBASE_PROJECT_ID=documentos-87058
FIREBASE_PRIVATE_KEY_ID=e4da8be629048cd3a49ee449c3f1fab951f7dcea
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-7t6zq@documentos-87058.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=117159999999999999999
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-7t6zq%40documentos-87058.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=documentos-87058.appspot.com

# ========================================
# Ambiente
# ========================================
NODE_ENV=production
PORT=3000
```

**IMPORTANTE**: Obtenha as credenciais do Firebase do seu console (Firebase > Projetos > Documentos > Service Accounts > Download JSON)

Salve com `CTRL+X`, depois `Y`, depois `ENTER`.

## 5. INSTALAR DEPENDÊNCIAS NO HOSTINGER

Via **Terminal/SSH**:

```bash
cd /path/to/seu/domínio
npm install --production
```

## 6. INICIAR O SERVIDOR

### Opção A: Diretamente (Teste)

```bash
node server.js
```

Você verá:

```
╔════════════════════════════════════════════════╗
║  🚀 Fidelizacred - Servidor Integrado         ║
║  Rodando em http://localhost:3000             ║
╚════════════════════════════════════════════════╝
```

### Opção B: Com PM2 (Recomendado - Produção)

```bash
npm install -g pm2
pm2 start server.js --name "fidelizacred"
pm2 save
pm2 startup
```

Isso garante que o servidor reinicia automaticamente se cair.

## 7. CONFIGURAR NGINX/APACHE REVERSE PROXY

### Via Hostinger cPanel

1. Acesse **Domains**
2. Clique em seu domínio
3. Em **Proxy**, aponte para `http://127.0.0.1:3000`

Ou via `.htaccess` na raiz:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Proxy para Node.js
  RewriteCond %{HTTP:Upgrade} websocket [NC]
  RewriteCond %{HTTP:Connection} upgrade [NC]
  RewriteRule ^/?(.*) "http://127.0.0.1:3000/$1" [P,L]

  RewriteRule ^/?(.*) "http://127.0.0.1:3000/$1" [P,L]
</IfModule>
```

## 8. TESTE O DEPLOYMENT

1. Acesse `https://seu-dominio.com`
2. Você verá a landing page
3. Teste upload via `/simular`

## 9. TROUBLESHOOTING

### Tela Preta

- Verifique se o `.env` está criado
- Verifique `npm install --production` foi executado
- Veja logs: `pm2 logs fidelizacred`

### Erro 503 / Service Unavailable

- Node.js pode não estar rodando
- Execute: `pm2 start server.js`
- Verifique: `pm2 status`

### Erro de Credenciais Firebase

- Valide as variáveis no `.env`
- A `FIREBASE_PRIVATE_KEY` precisa estar com quebras de linha como `\n`

### Upload não funciona

- Verifique CORS na resposta: `curl -H "Origin: https://seu-dominio.com" https://seu-dominio.com/api/firebase/upload`
- Veja logs do servidor: `pm2 logs fidelizacred`

## 10. MANUTENÇÃO

### Atualizar Código

```bash
# Via FTP: sobrescreva os arquivos
# Via git (se FTP com git estiver disponível):
git pull origin main
npm install --production
pm2 restart fidelizacred
```

### Monitorar Servidor

```bash
pm2 monit
```

### Ver Logs em Tempo Real

```bash
pm2 logs fidelizacred --lines 50 --follow
```

## ⚠️ NOTAS IMPORTANTES

1. **NUNCA faça upload do arquivo `credentials/` ou `.env` original**
   - Sempre crie `.env` diretamente no servidor Hostinger

2. **Porta 3000** será usada internamente
   - O domínio será acessado na porta 80/443 (HTTPS)

3. **Firebase Admin SDK** requer NODE_ENV=production para otimizações

4. **Backups**: Configure backup automático no cPanel regularmente

---

**Teste localmente antes de fazer deploy:**

```bash
npm run build
NODE_ENV=production node server.js
# Depois acesse http://localhost:3000
```
