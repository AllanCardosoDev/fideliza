# 📤 Upload para Google Drive - Guia Completo

## 🎯 Visão Geral

O sistema de upload foi refatorado para **um único servidor Node.js** que funciona tanto em desenvolvimento quanto em produção (Hostinger).

- ✅ **Sem OAuth** do Google
- ✅ **Sem autenticação de usuário** necessária
- ✅ **Sem Supabase**
- ✅ **Um único processo** (sem 2 terminais)
- ✅ **Pronto para Hostinger**

---

## 🚀 Em Desenvolvimento

### Terminal 1: Servidor (porta 3000)

```bash
npm run build
npm start
```

Saída esperada:

```
╔════════════════════════════════════════════════╗
║  🚀 Fidelizacred - Servidor Integrado         ║
║  Rodando em http://localhost:3000             ║
║  App: React + Express                        ║
║  Upload: Google Drive (Service Account)      ║
║  Credenciais: credentials/google-service... ║
╚════════════════════════════════════════════════╝
```

Acesse: **http://localhost:3000**

---

## 🔧 Tecnologia

### Servidor (`server.js`)

- **Express.js** - Framework HTTP
- **Multer** - Processamento de upload
- **JWT** - Autenticação com Google
- **node-fetch** - Requisições HTTP
- **jsonwebtoken** - Geração de JWT tokens

### Fluxo de Upload

```
1. Usuário seleciona arquivo no frontend
   ↓
2. Frontend envia para POST /api/upload
   ↓
3. Servidor carrega credenciais do Google (Service Account)
   ↓
4. Gera JWT token usando private key
   ↓
5. Autentica no Google Drive API
   ↓
6. Cria pasta: client_name_id
   ↓
7. Faz upload do arquivo
   ↓
8. Retorna URLs para o frontend
```

---

## 📁 Deploy no Hostinger

### 1. Build a aplicação

```bash
npm run build
```

Cria pasta `dist/` com a app React compilada.

### 2. Estrutura de arquivos no Hostinger

```
fidelizacred-react/
├── dist/              # App React compilado
├── credentials/       # Chaves Google
├── node_modules/      # Dependências
├── server.js          # Servidor integrado
├── package.json
└── package-lock.json
```

### 3. Instalar dependências no Hostinger

```bash
npm install
```

### 4. Rodar o servidor

```bash
npm start
```

Ou configure como **daemon/PM2**:

```bash
npm install -g pm2
pm2 start server.js --name "fidelizacred"
pm2 startup
pm2 save
```

---

## ⚙️ Variáveis de Ambiente

Criar `.env` no Hostinger:

```env
PORT=3000
NODE_ENV=production
```

O servidor automaticamente:

- Carrega credenciais de `credentials/google-service-account.json`
- Usa `process.env.PORT` ou porta 3000
- Descobre a pasta `dist/` automaticamente

---

## 📝 Endpoints API

### Health Check

```
GET /api/health
```

Resposta:

```json
{
  "status": "OK",
  "timestamp": "2026-04-09T10:30:45.123Z"
}
```

### Upload de Arquivo

```
POST /api/upload
Content-Type: multipart/form-data

Campos obrigatórios:
- file: <arquivo>
- clientId: "123"
- clientName: "João Silva"
- documentType: "rg"
```

Resposta:

```json
{
  "success": true,
  "fileId": "1abc123...",
  "fileUrl": "https://drive.google.com/file/d/1abc123.../view",
  "folderUrl": "https://drive.google.com/drive/folders/1xyz..."
}
```

---

## 🔐 Segurança

### Credenciais Google

O arquivo `credentials/google-service-account.json`:

- ✅ Carregado apenas no servidor
- ✅ NUNCA enviado para o frontend
- ✅ Private key seguro no servidor
- ❌ NUNCA commitado no git

### Proteção

```javascript
// .gitignore
credentials/
.env
.env.local
```

---

## ⚠️ Troubleshooting

### Erro: "Credenciais Google não configuradas"

**Causa**: Arquivo `credentials/google-service-account.json` não encontrado.

**Solução**:

1. Verify arquivo existe: `ls credentials/google-service-account.json`
2. Verificar conteúdo é JSON válido
3. Confirmar permissões: `chmod 600 credentials/google-service-account.json`

### Erro: "Failed to get access token"

**Causa**: Service Account não tem permissões no Google Drive.

**Solução**:

1. Compartilhar pasta "Documentos Clientes" com email do Service Account
2. Verificar permissão é "Editor"

### Erro: "404 Not found - Build the app first"

**Causa**: Pasta `dist/` não existe.

**Solução**:

```bash
npm run build
npm start
```

### Erro: "Port already in use"

**Causa**: Porta 3000 já está sendo usada.

**Solução**:

```bash
PORT=3001 npm start
```

---

## 📊 Logs

O servidor exibe logs detalhados:

```
✅ Credenciais Google carregadas
📤 Iniciando upload de: rg_documento.pdf
✅ Token JWT obtido
✅ Pasta do cliente encontrada
✅ Arquivo enviado: 1abc123...
```

Erros:

```
❌ Erro: service account email not found
```

---

## 🔄 Atualizar Servidor

Em produção (Hostinger):

```bash
# Parar servidor
pm2 stop fidelizacred

# Atualizar código
git pull

# Reinstalar dependências
npm install

# Build app
npm run build

# Reiniciar
pm2 start server.js --name "fidelizacred"
```

---

## ✅ Checklist Hostinger

- [ ] Node.js instalado (v16+)
- [ ] Arquivo `credentials/google-service-account.json` presente
- [ ] `npm install` executado
- [ ] `npm run build` executado
- [ ] `npm start` rodando
- [ ] Acesso a `https://seu-dominio.com`
- [ ] Upload funcionando
- [ ] Arquivos aparecem no Google Drive

---

## 🚀 Próximos Passos

1. **Deploy no Hostinger**: Copiar projeto e rodar `npm start`
2. **Configure PM2**: Para auto-restart em caso de crash
3. **HTTPS**: Hostinger fornece SSL automaticamente
4. **Monitoramento**: Verificar logs com `pm2 logs`

---

**Criado em**: 2026-04-09
**Versão**: 1.0 - Servidor Integrado
