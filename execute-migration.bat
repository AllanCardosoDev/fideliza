@echo off
REM Script para executar migração via HTTP
REM Requer: servidor rodando em http://localhost:3000

REM Aguardar o servidor estar pronto
echo.
echo ========================================
echo Executando Migração SQL automaticamente
echo ========================================
echo.

set TIMEOUT=2
echo Aguardando %TIMEOUT% segundos para o servidor estar pronto...
timeout /t %TIMEOUT%

REM Chamar endpoint de migração via curl
echo.
echo Enviando requisição para http://localhost:3000/api/migrations/run-first-installment-day
echo.

curl -X POST http://localhost:3000/api/migrations/run-first-installment-day ^
  -H "Content-Type: application/json" ^
  --silent --show-error

echo.
echo.
echo ========================================
if  %ERRORLEVEL% EQU 0 (
  echo ✓ Migração concluída!
) else (
  echo ✗ Erro ao executar migração
)
echo ========================================
echo.
pause
