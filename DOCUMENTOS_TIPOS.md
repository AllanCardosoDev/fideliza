# 📄 Sistema de Upload de Documentos - Versão 2.0 (PF + PJ)

## 🎯 Mudanças Implementadas

O sistema de upload de documentos foi adaptado para **Pessoa Física (PF)** e **Pessoa Jurídica (PJ)**, com tipos de documentos específicos para cada categoria.

## 📋 Tipos de Documentos Disponíveis

### 👤 **Pessoa Física (Autônomo, MEI, etc)**

#### 🔴 Obrigatórios + Recomendados

- **RG** - Registro Geral (documento de identidade)
- **CPF** - Cadastro de Pessoa Física
- **Comprovante de Renda** - Necessário para análise de crédito
- **Comprovante de Endereço** - Validação de endereço

#### 🟢 Recomendados (Complementares)

- **CNH** - Carteira Nacional de Habilitação
- **Extrato Bancário** - Para análise financeira

#### ⚪ Opcionais

- **Documento de Propriedade** - Para empréstimos com garantia
- **Aval** - Informações do avalista
- **Outros** - Documentos adicionais

---

### 🏢 **Pessoa Jurídica (Empresa)**

#### 🔴 Obrigatórios + Recomendados

- **CNPJ** - Cadastro Nacional de Pessoa Jurídica
- **Inscrição Estadual** - Registro estadual da empresa
- **Contrato Social** - Documento de constituição da empresa
- **Alvará de Funcionamento** - Licença municipal de operação
- **Comprovante de Endereço Comercial** - Validação do endereço comercial

#### 🟢 Recomendados (Complementares)

- **Certificado de Condição de Microempreendedor** - Se aplicável (MEI)
- **Último Balanço Patrimonial** - Demonstrativo financeiro
- **Extrato Bancário Empresa** - Análise de fluxo de caixa
- **Comprovante de Renda (Sócios)** - Renda complementar
- **RG do(s) Sócio(s)** - Identificação dos proprietários

#### ⚪ Opcionais

- **Outros** - Documentos adicionais

## 🚀 Como Funciona

### 1. **Indicador de Tipo (Automático)**

```
👤 Pessoa Física           OU      🏢 Pessoa Jurídica (Empresa)
```

_Aparece automaticamente no topo baseado no tipo de cliente_

### 2. **Escolher Tipo de Documento**

Os tipos mudam automaticamente conforme o tipo de cliente:

**Para PF:**

```
┌─────────────────────────────────┐
│ Tipo de Documento *             │
├─────────────────────────────────┤
│ RG (Obrigatório)                │
│ CPF (Obrigatório)               │
│ CNH (Recomendado)               │
│ ...                             │
└─────────────────────────────────┘
```

**Para PJ:**

```
┌─────────────────────────────────┐
│ Tipo de Documento *             │
├─────────────────────────────────┤
│ CNPJ (Obrigatório)              │
│ Inscrição Estadual (Obrigatório)│
│ Contrato Social (Obrigatório)   │
│ ...                             │
└─────────────────────────────────┘
```

### 3. **Ver Indicadores**

Após selecionar o tipo, aparecem badges:

- 🔴 **Obrigatório** ← vermelho
- ✓ **Recomendado** ← verde

### 4. **Enviar Arquivo**

- Clique em "📤 Upload"
- Selecione arquivo (PDF, JPG, PNG, DOC, DOCX)
- Máximo 10MB

### 5. **Documentos Pendentes**

O sistema **automaticamente** mostra:

#### ⚠️ Documentos Obrigatórios Pendentes (Amarelo)

**Exemplo PF:**

```
⚠️ Documentos Obrigatórios Pendentes:
• RG
• CPF
• Comprovante de Renda
```

**Exemplo PJ:**

```
⚠️ Documentos Obrigatórios Pendentes:
• CNPJ
• Contrato Social
• Alvará de Funcionamento
```

_(Desaparece quando todos são entregues)_

#### ℹ️ Documentos Recomendados Pendentes (Verde)

**Exemplo PF:**

```
ℹ️ Documentos Recomendados Pendentes:
• CNH
• Extrato Bancário
```

**Exemplo PJ:**

```
ℹ️ Documentos Recomendados Pendentes:
• Balanço Patrimonial
• Extrato Bancário Empresa
• RG dos Sócios
```

### 6. **Listar Documentos Entregues**

```
📁 Documentos Anexados (3)

📄 rg.pdf          ┌────────┐
2024-04-04 | 2.5MB│  RG    │  [🗑️ Deletar]
                   └────────┘

📄 cpf.pdf         ┌────────┐
2024-04-04 | 1.2MB│  CPF   │  [🗑️ Deletar]
                   └────────┘
```

## 🔄 Detecção Automática

O sistema **detecta automaticamente** o tipo de cliente e adapta os documentos:

| Se o cliente é... | Mostra tipos... | Padrão inicial |
| ----------------- | --------------- | -------------- |
| **PF/Autônomo**   | Pessoa Física   | RG             |
| **Empresa**       | Pessoa Jurídica | CNPJ           |

Nenhuma ação manual necessária! A mudança acontece automaticamente.

## 🔧 Funcionalidades

### ✅ Feito

- [x] Seletor de tipo de documento
- [x] Indicadores visuais (Obrigatório/Recomendado)
- [x] Lista de documentos obrigatórios pendentes
- [x] Lista de documentos recomendados pendentes
- [x] Campo de tipo salvo no banco de dados
- [x] Badge com tipo na listagem
- [x] Upload de até 10MB
- [x] Validação de tipos (PDF, JPG, PNG, DOC, DOCX)
- [x] Deleção de documentos
- [x] Integração na aba "Documentos" (Tab 4)

### 🔄 Em Desenvolvimento

- [ ] Aprovação/Rejeição de documentos
- [ ] Comentários no documento
- [ ] Versioning (histórico de uploads)
- [ ] Análise automática de documentos

## 📊 Estrutura do Banco de Dados

### Tabela: `documents`

```sql
id                BIGINT PRIMARY KEY
client_id         BIGINT (FK) — Cliente associado
document_type     TEXT — Tipo (RG, CPF, etc.)
file_name         TEXT — Nome original do arquivo
file_url          TEXT — URL pública no Supabase Storage
file_size         INTEGER — Tamanho em bytes
mime_type         TEXT — Tipo MIME (application/pdf, etc.)
uploaded_at       TIMESTAMPTZ — Data de upload
employee_id       BIGINT — Funcionário que fez upload
status            TEXT — 'active', 'rejected', etc.
notes             TEXT — Observações sobre aprovação
```

### Exemplo de Registro

```json
{
  "id": 123,
  "client_id": 456,
  "document_type": "RG",
  "file_name": "rg.pdf",
  "file_url": "https://supabase.../documents/456/1712...",
  "file_size": 2560000,
  "mime_type": "application/pdf",
  "uploaded_at": "2024-04-04T10:30:00Z",
  "employee_id": 1
}
```

## 🎨 Cores e Indicadores

| Status         | Cor                       | Significado                      |
| -------------- | ------------------------- | -------------------------------- |
| 👤 PF          | #1976d2 (Azul)            | Pessoa Física - RG/CPF           |
| 🏢 PJ          | #c62828 (Vermelho escuro) | Pessoa Jurídica - CNPJ/Empresa   |
| 🔴 Obrigatório | #ff5252 (Vermelho)        | Necessário para continuar        |
| ✓ Recomendado  | #4CAF50 (Verde)           | Aumenta confiança na análise     |
| 📋 Tipo do Doc | #e3f2fd (Azul claro)      | Identificação visual             |
| ⚠️ Aviso       | #fff3cd (Amarelo)         | Documentos obrigatórios faltando |
| ℹ️ Info        | #e8f5e9 (Verde claro)     | Sugestão de melhorias            |

## 📋 Checklist do Usuário

### 👤 Pessoa Física

Antes de solicitar empréstimo, verifique:

- [ ] RG enviado
- [ ] CPF enviado
- [ ] Comprovante de Renda enviado
- [ ] Comprovante de Endereço enviado
- [ ] CNH enviado (recomendado)
- [ ] Extrato Bancário enviado (recomendado)

### 🏢 Pessoa Jurídica

Antes de solicitar empréstimo, verifique:

- [ ] CNPJ enviado
- [ ] Inscrição Estadual enviada
- [ ] Contrato Social enviado
- [ ] Alvará de Funcionamento enviado
- [ ] Comprovante de Endereço Comercial enviado
- [ ] Certificado MEI enviado (recomendado)
- [ ] Balanço Patrimonial enviado (recomendado)
- [ ] Extrato Bancário enviado (recomendado)

## 🚀 Para Começar Agora

1. Abra **Clientes → Editar Cliente**
2. Clique na aba **"4. Documentos"**
3. **Tipo de cliente aparece automaticamente** (👤 ou 🏢)
4. Selecione o tipo de documento no dropdown
5. Clique em **📤 Upload**
6. Escolha o arquivo
7. Pronto! O documento foi salvo

## 🔧 Adaptação do Sistema

**Quando você cria/edita um cliente:**

- Sistema detecta o `client_type` (autonomo, empresa, etc)
- Se for **PJ** (empresa): Mostra documentos de empresa
- Se for **PF**: Mostra documentos de pessoa física
- Lista de documentos obrigatórios/recomendados muda automaticamente
- Dropdown de seleção se adapta

**Exemplos de tipos de cliente:**

- `autonomo` → Pessoa Física
- `empresa` → Pessoa Jurídica
- (Outros tipos são tratados como Pessoa Física)

## 📞 Suporte

Se os documentos não aparecem ou estão errados:

1. **Verificar tipo de cliente**: Abra em editar, veja qual é o tipo
2. Abra DevTools (F12)
3. Verifique console para erros
4. Certifique-se que o Supabase Storage bucket "documents" existe
5. Bucket deve ser PUBLIC (não privado)

---

**Status**: ✅ Pronto para produção  
**Última atualização**: 2026-04-04  
**Versão**: 2.1 (Com suporte PF + PJ)
