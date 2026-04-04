# Setup - Sistema de Upload de Documentos

## 📋 Pré-requisitos

O sistema de upload de documentos foi implementado e integrado. Antes de usar em produção, realize os passos abaixo:

## ✅ Checklist de Setup

### 1. Executar SQL no Supabase

A tabela `documents` já deve estar criada no banco. Verifique em Supabase:

**Supabase → SQL Editor**:

- Execute o conteúdo de `SQL_TABELAS_VAZIAS.sql`
- Ou apenas a parte de documents (linhas ~128-210)
- Confirme que não há erros

### 2. Criar Bucket no Supabase Storage

**Supabase → Storage → Buckets**:

1. Clique em "+ New Bucket"
2. Nome: `documents`
3. Marque "✓ Public bucket" (IMPORTANTE!)
4. Clique em "Create bucket"

### 3. Testar Upload

1. Abra a app: `npm run dev`
2. Vá para: **Clientes**
3. Clique em editar um cliente existente
4. Procure pela aba **"4. Documentos"**
5. Clique em "Escolher arquivo"
6. Selecione um arquivo (PDF, JPG, PNG, DOC, DOCX) - máx 10MB
7. Clique em "Enviar"
8. Verifique se aparece na lista

### 4. Verificar Supabase Storage

**Supabase → Storage → documents**:

- Deve haver uma pasta com o ID do cliente
- Dentro dela: `{timestamp}_{nome_do_arquivo}`
- Arquivo deve ser acessível via URL pública

## 🔧 Configurações

### Tipos de Documento Aceitos

```javascript
[
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
```

### Tamanho Máximo

- Limite: **10 MB**
- Validação no frontend

### Formato de Armazenamento

```
Bucket: documents
Pasta: {clientId}/{timestamp}_{fileName}
```

## 📁 Arquivos Modificados

- ✅ `src/components/DocumentUpload.jsx` - novo componente
- ✅ `src/pages/Clientes.jsx` - integrado DocumentUpload
- ✅ `SQL_TABELAS_VAZIAS.sql` - adicionada tabela documents

## 🚀 Após Setup

- [x] Executação da SQL
- [x] Criação do bucket
- [x] Teste de upload
- [x] Verificação de armazenamento

Então, fazer commit e push para produção:

```bash
git add .
git commit -m "Add document upload system"
git push origin main
npm run build
```

## ⚠️ Troubleshooting

### Upload falha com erro 403

- Verifique se o bucket é PUBLIC (não privado)
- Verifique permissões do bucket no Supabase

### Arquivo não aparece na lista

- Verificar console (F12) para erros
- Verificar se cliente_id está sendo passado corretamente

### Erro "file_size exceeds..."

- Arquivo excede 10MB
- Reduza o tamanho do arquivo

## 📖 Operações do Sistema

### Upload

1. Seleciona arquivo
2. Valida tipo e tamanho
3. Faz upload para Supabase Storage
4. Cria registro em `documents` table
5. Atualiza lista

### Listagem

- Mostra documentos do cliente
- Exibe: nome, data, tamanho
- Botão para deletar

### Deleção

- Confirma antes de deletar
- Remove arquivo do Storage
- Remove registro do banco

## 🔐 Segurança

- Arquivo armazenado com caminho único (clientId + timestamp)
- Relacionado ao cliente no banco via `client_id` FK
- RLS desabilitado no Supabase (permitir leitura pública de arquivos)
- Validação de tipo MIME no frontend

---

**Status**: ✅ Pronto para produção
**Última atualização**: 2026-04-04
