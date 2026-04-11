# 🚀 Guia de Setup para Desenvolvimento Local

## 📋 Pré-requisitos

- ✅ Node.js 18+ e npm instalados
- ✅ Git instalado
- ✅ Conta no Supabase (gratuito)
- ✅ Visual Studio Code (opcional)

---

## 🔧 Passo 1: Clonar o Repositório

```bash
git clone https://github.com/AllanCardosoDev/fideliza.git
cd fideliza
```

---

## 📦 Passo 2: Instalar Dependências

```bash
npm install
```

**Tempo esperado:** 2-5 minutos (primeira vez)

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo `.env.local`

```bash
cp .env.example .env.local
```

### 3.2 Preencher as credenciais do Supabase

Abra `.env.local` e adicione:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=seu_token_aqui
```

**Como obter essas credenciais:**

1. Acesse: https://app.supabase.com
2. Faça login (crie conta se necessário)
3. Crie um novo projeto ou use existente
4. Vá em **Settings** → **API**
5. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

---

## 🗄️ Passo 4: Configurar Banco de Dados

### 4.1 Acessar o Supabase SQL Editor

1. No Supabase, vá para **SQL Editor**
2. Cole o conteúdo de `SQL_TABELAS_VAZIAS.sql`
3. Clique em **Run**

**Resultado:** Todas as tabelas serão criadas:

- ✅ employees
- ✅ clients
- ✅ loans
- ✅ documents
- ✅ payments
- ✅ Índices e constraints

### 4.2 Desabilitar RLS (desenvolvimento)

Execute no SQL Editor:

```sql
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.documents TO authenticated;
GRANT SELECT ON public.documents TO authenticated;
GRANT DELETE ON public.documents TO authenticated;
```

---

## 📁 Passo 5: Criar Bucket de Armazenamento

1. No Supabase, vá para **Storage** → **Buckets**
2. Clique em **+ New Bucket**
3. Preencha:
   - **Nome:** `documents`
   - **Privacidade:** Public bucket ✓
4. Clique em **Create Bucket**

---

## 🎯 Passo 6: Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Saída esperada:**

```
  VITE v8.0.3  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Acesse: **http://localhost:5173**

---

## 🧪 Passo 7: Testar a Aplicação

### 7.1 Login Padrão

Use qualquer credencial para fazer login (autenticação local para desenvolvimento):

```
Usuário: admin
Senha: qualquer coisa
```

> Nota: Em produção, será integrado com Supabase Auth

### 7.2 Testar Upload de Documentos

1. Vá para **Clientes**
2. Clique em editar um cliente
3. Abra a aba **"4. Documentos"**
4. Selecione um arquivo (PDF, JPG, PNG, DOC, DOCX - máx 10MB)
5. Clique em **Enviar**

Você deve ver:

- ✅ Arquivo sendo enviado
- ✅ Documento salvo na lista
- ✅ Arquivo visível no Supabase Storage

---

## 📦 Passo 8: Build para Produção

```bash
npm run build
```

**Resultado:** Pasta `dist/` contendo:

- `index.html` - página principal
- `assets/` - JavaScript, CSS, imagens otimizadas

**Tamanho:** ~2-3 MB (gzipped)

---

## 🗂️ Estrutura do Projeto

```
fideliza/
├── src/
│   ├── components/        # Componentes React
│   │   ├── DocumentUpload.jsx
│   │   ├── LoginScreen.jsx
│   │   └── ...
│   ├── pages/            # Páginas/rotas
│   │   ├── Dashboard.jsx
│   │   ├── Clientes.jsx
│   │   ├── Emprestimos.jsx
│   │   └── ...
│   ├── services/         # APIs Supabase
│   │   ├── supabaseClient.js
│   │   └── api.js
│   ├── utils/           # Funções auxiliares
│   │   ├── helpers.js
│   │   ├── protocolHelpers.js
│   │   └── finance.js
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Entrada da app
├── public/              # Assets estáticos
├── dist/                # Build de produção
├── package.json         # Dependências
├── vite.config.js       # Configuração Vite
├── .env.example         # Template de variáveis
└── README.md            # Este arquivo
```

---

## ⚡ Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Verificar eslint
npm run lint
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'supabase'"

```bash
npm install
```

### Erro: "VITE_SUPABASE_URL is undefined"

- Verifique se `.env.local` existe
- Reinicie o servidor: `npm run dev`
- Limpe cache: `Ctrl+Shift+R` no navegador

### Upload falha com erro 403

- Verifique se bucket `documents` está como **Public**
- Verifique se RLS está desabilitado (execute SQL acima)

### Branco ao acessar http://localhost:5173/

- Abra Console (F12)
- Procure por erros
- Limpe cache: `npm run dev` e `Ctrl+Shift+R`

---

## 📚 Recursos

- [Documentação Vite](https://vitejs.dev/)
- [Documentação React](https://react.dev/)
- [Documentação Supabase](https://supabase.com/docs)
- [React Router](https://reactrouter.com/)

---

## 🤝 Próximos Passos

1. ✅ Configurar banco de dados
2. ✅ Testar upload de documentos
3. ⏭️ Personalizar layouts e estilos
4. ⏭️ Adicionar mais funcionalidades
5. ⏭️ Deploy em produção (Hostinger)

---

## 📞 Suporte

Se tiver dúvidas:

1. Verifique este guia
2. Veja a documentação em `DEPLOYMENT_HOSTINGER.md`
3. Consulte `DOCUMENTO_UPLOAD_DEBUG.md` para problemas de upload

---

**Sucesso! 🎉**
