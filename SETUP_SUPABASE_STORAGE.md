# Setup do Supabase Storage para Documentos

## 📋 Checklist

### 1️⃣ Criar o Bucket

1. Entra no [Supabase Console](https://app.supabase.com)
2. Vai para **Storage** → **Buckets**
3. Clica em **Create a new bucket**
4. Nome do bucket: `documentos-clientes`
5. **Desativa** "Public bucket" (vamos usar RLS)
6. Clica em **Create bucket**

### 2️⃣ Configurar RLS (Políticas de Acesso)

No bucket `documentos-clientes`, clica em **Policies**:

#### Política 1: Qualquer um pode fazer upload (sem autenticação)

```sql
CREATE POLICY "allow_public_upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documentos-clientes'
);
```

#### Política 2: Qualquer um pode ler os arquivos

```sql
CREATE POLICY "allow_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos-clientes');
```

### 3️⃣ Verificar Variáveis de Ambiente

No `.env.local`, verifique se tem:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJr...
```

Se não tiver, copie do Supabase Console → Settings → API

### 4️⃣ Testar o Upload

```bash
npm run dev
```

Depois:

1. Vai em **Clientes** → **Documentos**
2. Preenche o formulário
3. Seleciona um arquivo
4. Clica em **Enviar**

## 📁 Estrutura de Documentos

Os arquivos serão organizados assim:

```
documentos-clientes/
├── 1_allan_silva/
│   ├── rg_documento.pdf
│   └── cpf_documento.jpg
└── 2_joao_santos/
    ├── comprovante_renda_documento.pdf
    └── contrato_documento.docx
```

## ✅ Sucesso!

Se vir **"Enviado com sucesso"**, está funcionando! Os arquivos estarão no Supabase Storage.
