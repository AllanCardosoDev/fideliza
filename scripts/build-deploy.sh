#!/bin/bash
# =============================================================
# Script de build para deploy na Hostinger
# Uso: bash scripts/build-deploy.sh
# =============================================================

set -e

echo "🔍 Verificando pré-requisitos..."

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "❌ Node.js não encontrado. Instale em https://nodejs.org"
  exit 1
fi

# Check npm
if ! command -v npm &>/dev/null; then
  echo "❌ npm não encontrado."
  exit 1
fi

# Check .env.local
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
  echo "⚠️  Nenhum arquivo .env.local ou .env encontrado."
  echo "   Copie .env.example para .env.local e preencha as variáveis antes de continuar."
  read -p "   Continuar mesmo assim? (s/N) " confirm
  if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
    exit 1
  fi
fi

echo "📦 Instalando dependências..."
npm install

echo "🏗️  Gerando build de produção..."
npm run build

echo ""
echo "✅ Build concluído! Pasta 'dist/' criada com sucesso."
echo ""
echo "📋 Checklist de deploy na Hostinger:"
echo "   [ ] Fazer login no painel Hostinger"
echo "   [ ] Acessar Gerenciador de Arquivos ou conectar via FTP/SFTP"
echo "   [ ] Navegar até a pasta raiz do domínio (public_html)"
echo "   [ ] Apagar arquivos antigos (se houver)"
echo "   [ ] Fazer upload do CONTEÚDO da pasta 'dist/' (não a pasta em si)"
echo "   [ ] Verificar se o arquivo .htaccess foi enviado junto"
echo "   [ ] Acessar o domínio no navegador e confirmar que está funcionando"
echo ""
echo "💡 Dica: use 'npm run preview' para testar o build localmente antes do upload."
