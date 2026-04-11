# 🔐 Configuração do Google Drive OAuth - Guia Completo

## 📋 Visão Geral

Este documento descreve como configurar o **Google OAuth 2.0** para fazer upload de documentos diretamente no Google Drive a partir da aplicação Fidelizacred.

### O Que Você Vai Fazer

1. Criar um projeto no Google Cloud Console
2. Habilitar Google Drive API
3. Gerar credenciais OAuth 2.0
4. Criar uma API Key
5. Copiar as credenciais para `.env.local`

---

## 🚀 Passo 1: Acessar Google Cloud Console

1. Abra: **https://console.cloud.google.com/**
2. Faça login com sua conta Google
3. Se for a primeira vez, você será solicitado a criar um projeto

---

## 📦 Passo 2: Criar um Novo Projeto

1. Clique no **seletor de projeto** no topo da página
2. Clique em **"Novo Projeto"**
3. Preencha com:
   - **Nome do Projeto**: `Fidelizacred` (ou qualquer nome)
   - **ID do Projeto**: será preenchido automaticamente
4. Clique em **"Criar"**
5. Aguarde alguns segundos até o projeto ser criado

---

## ✅ Passo 3: Habilitar Google Drive API

1. No painel esquerdo, clique em **"APIs e Serviços"** → **"Biblioteca"**
2. Na barra de busca, digite: **"Google Drive API"**
3. Clique no resultado **"Google Drive API"**
4. Clique no botão azul **"Ativar"**
5. Aguarde a ativação (pode levar alguns segundos)

---

## 🔑 Passo 4: Criar Credenciais OAuth 2.0

### 4.1 Criar a Credencial

1. No painel esquerdo, clique em **"APIs e Serviços"** → **"Credenciais"**
2. No topo, clique em **"+ Criar Credenciais"**
3. Selecione **"ID Cliente OAuth"**
4. Uma janela pode aparecer com "Configurar tela de consentimento primeiro"
   - Se sim, clique em **"Configurar Tela de Consentimento"** e continue na seção 4.2
   - Se não, pule para 4.3

### 4.2 Configurar Tela de Consentimento (se necessário)

1. Selecione **"Externo"** (para desenvolvimento)
2. Clique em **"Criar"**
3. Preencha:
   - **Nome do Aplicativo**: `Fidelizacred`
   - **Email de suporte do usuário**: seu_email@gmail.com
   - **Informações de contato**: seu_email@gmail.com
4. Clique em **"Salvar e continuar"**
5. Na próxima página (Escopos), clique em **"Salvar e continuar"** (sem adicionar escopos)
6. Na próxima página (Usuários de teste), clique em **"Salvar e continuar"**
7. Revise e clique em **"Voltar ao Painel"**

### 4.3 Gerar Credencial OAuth

1. De volta à página de Credenciais, clique em **"+ Criar Credenciais"**
2. Selecione **"ID Cliente OAuth"**
3. Para o tipo de aplicativo, selecione: **"Aplicativo da Web"**
4. Preencha os detalhes:
   - **Nome**: `Fidelizacred Web App`
5. Em **"URIs de redirecionamento autorizados"**, clique em **"+ Adicionar URI"**
6. Adicione **estes dois URIs** (são necessários para desenvolvimento):
   ```
   http://localhost:5173
   http://localhost:5173/
   ```
7. Clique em **"Criar"**
8. Uma janela pop-up aparecerá com suas credenciais
   - **Guarde o "ID do Cliente"** (você precisará dele)
   - Clique no ícone de cópia ou copie manualmente
   - Armazene em um lugar seguro (pode fechar a aba e recuperar depois)

### 4.4 Recuperar o ID do Cliente Depois

Se você fechar a aba de credenciais:

1. Vá para **"APIs e Serviços"** → **"Credenciais"**
2. Procure pela seção **"IDs de Cliente OAuth 2.0"**
3. Clique na coluna **"ID do Cliente"** da credencial "Aplicativo da Web"
4. Copie o valor (algo como: `123456789-abc...apps.googleusercontent.com`)

---

## 🔑 Passo 5: Criar uma API Key

1. Na mesma página de **Credenciais**, clique em **"+ Criar Credenciais"**
2. Selecione **"Chave de API"**
3. Uma API Key será criada (algo como: `AIzaSyD...`)
4. Você pode:
   - Copiar direto nesta tela
   - Ou clicar em "Editar" para restringir o uso (recomendado para produção)

---

## 📋 Passo 6: Restringir a API Key (Recomendado)

1. Clique em **"Editar"** na sua API Key (ícone de lápis)
2. Em **"Restrições de aplicativo"**, selecione:
   - **"HTTP referrers (sites)"**
3. Clique em **"Adicionar um item"** e adicione:
   ```
   localhost:5173
   ```
4. Em **"Restrições de API"**, selecione:
   - **"Restringir chave"**
5. Procure por **"Google Drive API"** e selecione
6. Clique em **"Salvar"**

---

## 📝 Passo 7: Configurar o Arquivo `.env.local`

1. Abra o arquivo `.env.local` na raiz do projeto (ou crie um novo):

   ```bash
   c:\Users\User\Desktop\financeiro\fidelizacred-react\.env.local
   ```

2. Copie este template e preencha com suas credenciais:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://urysprfgdhfhkgzxkpru.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_supabase_aqui

# Google Drive OAuth
VITE_GOOGLE_CLIENT_ID=seu_id_cliente_oauth_aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua_api_key_aqui
VITE_GOOGLE_DRIVE_FOLDER_ID=1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf
```

3. Substitua:
   - `seu_id_cliente_oauth_aqui.apps.googleusercontent.com` → Cola o ID do Cliente OAuth que você copiou
   - `sua_api_key_aqui` → Cola a API Key que você copiou
   - Mantenha `VITE_GOOGLE_DRIVE_FOLDER_ID` como está (é a pasta pré-configurada)

4. **Salve o arquivo** (Ctrl+S)

---

## ✅ Passo 8: Testar a Configuração

1. Abra o terminal na pasta do projeto:

   ```bash
   cd c:\Users\User\Desktop\financeiro\fidelizacred-react
   npm run dev
   ```

2. Acesse: **http://localhost:5173**

3. Navegue para: **Clientes** → Selecione um cliente → Aba **"Documentos"**

4. Você deve ver um botão **"Login com Google"** em vermelho

5. Clique e faça login com sua conta Google

6. Após autenticar, o botão desaparecerá e você poderá:
   - Selecionar tipo de documento
   - Arrastar ou selecionar um arquivo
   - Clicar em **"📤 Enviar para Google Drive"**

---

## 🐛 Troubleshooting

### Problema: "Erro ao carregar Google Drive - gapi is not defined"

**Solução**:

- Verifique se o script de carregamento do Google API está funcionando
- Abra o console do navegador (F12) e veja se há erros
- Confirme que `VITE_GOOGLE_CLIENT_ID` está correto no `.env.local`

### Problema: "Erro ao conectar com Google Drive"

**Solução**:

- Confirme que o `VITE_GOOGLE_CLIENT_ID` está correto
- Verifique que você adicionou `http://localhost:5173` nos URIs autorizados
- Limpe o cache do navegador (Ctrl+Shift+Delete)

### Problema: "Falha ao buscar - 403 Forbidden"

**Solução**:

- Confirme que a Google Drive API está ativada
- Verifique se a API Key está correta em `VITE_GOOGLE_API_KEY`
- Confira se a API Key tem acesso a Google Drive API

### Problema: "Arquivo não aparece no Google Drive"

**Solução**:

- Confirme que você está logado em **http://localhost:5173** com a mesma conta Google que tem acesso à pasta
- Verifique se `VITE_GOOGLE_DRIVE_FOLDER_ID` é o ID correto da pasta compartilhada
- Abra Google Drive e procure pela pasta **"Documentos Clientes"**

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA faça commit do `.env.local`** em repositórios públicos
2. O arquivo `.env.local` contém credenciais sensíveis
3. **Já está configurado no `.gitignore`**, não deve aparecer no git
4. Para produção, use variáveis de ambiente do servidor (Vercel, Netlify, etc)

### Antes de enviar para produção:

1. Mude o OAuth para usar um **Serviço de Contrato** no lugar de OAuth público
2. Ou implemente **autenticação backend** para gerar tokens
3. Adicione **restrições de taxa de solicitação** na API Key

---

## 📚 Recursos Adicionais

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

---

## ✅ Checklist Final

- [ ] Projeto criado no Google Cloud Console
- [ ] Google Drive API ativada
- [ ] OAuth 2.0 Client ID criado
- [ ] `http://localhost:5173` adicionado nos URIs autorizados
- [ ] API Key criada
- [ ] `.env.local` preenchido com as credenciais
- [ ] Servidor rodando (`npm run dev`)
- [ ] Botão "Login com Google" visível na aba Documentos
- [ ] Upload funciona e arquivo aparece no Google Drive

---

**Se tiver dúvidas, deixe uma mensagem!** 🚀
