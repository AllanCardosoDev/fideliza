@echo off
REM Script para configurar secrets no Supabase via curl
REM Você precisará da Service Role Key do Supabase

setlocal enabledelayedexpansion

REM Configurações
set SUPABASE_URL=https://urysprfgdhfhkgzxkpru.supabase.co
set PROJECT_ID=urysprfgdhfhkgzxkpru

echo.
echo ====================================
echo   Configurar Secrets Supabase
echo ====================================
echo.
echo Seu Service Role Key pode ser obtido em:
echo 1. Vá a: https://app.supabase.com
echo 2. Selecione o projeto "Fideliza"
echo 3. Vá em: Settings (inferior left) - API
echo 4. Procure por "service_role" ou "Service Role Secret"
echo 5. COPIE a chave (longa, começa com eyJ...)
echo.

set /p SERVICE_ROLE_KEY="Cole aqui sua Service Role Key e pressione ENTER: "

if "!SERVICE_ROLE_KEY!"=="" (
    echo Erro: Nenhuma chave foi fornecida!
    pause
    exit /b 1
)

echo.
echo Configurando secrets...
echo.

REM Validar que estamos na pasta correta
if not exist "credentials\google-service-account.json" (
    echo Erro: credentials/google-service-account.json nao encontrado!
    pause
    exit /b 1
)

REM Ler o arquivo JSON (nota: em Batch é complicado, vamos usar PowerShell)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "^
  $creds = Get-Content 'credentials\google-service-account.json' -Raw; ^
  $credsJson = $creds | ConvertFrom-Json; ^
  $credsString = $creds.Replace([char]10, '').Replace([char]13, ''); ^
  ^
  $body1 = @{ name = 'GOOGLE_SERVICE_ACCOUNT'; value = $credsString } | ConvertTo-Json -Compress; ^
  $body2 = @{ name = 'GOOGLE_CLIENTES_FOLDER_ID'; value = '1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf' } | ConvertTo-Json -Compress; ^
  ^
  Write-Host 'Enviando secret 1...'; ^
  $r1 = Invoke-WebRequest -Uri 'https://urysprfgdhfhkgzxkpru.supabase.co/rest/v1/secrets' ^
    -Method POST ^
    -Headers @{ 'Content-Type' = 'application/json'; 'Authorization' = 'Bearer !SERVICE_ROLE_KEY!'; 'apikey' = '!SERVICE_ROLE_KEY!' } ^
    -Body `$body1 -ErrorAction SilentlyContinue; ^
  if (`$r1.StatusCode -eq 201 -or `$r1.StatusCode -eq 200) { Write-Host 'OK'; } else { Write-Host 'FALHA'; }; ^
  ^
  Write-Host 'Enviando secret 2...'; ^
  $r2 = Invoke-WebRequest -Uri 'https://urysprfgdhfhkgzxkpru.supabase.co/rest/v1/secrets' ^
    -Method POST ^
    -Headers @{ 'Content-Type' = 'application/json'; 'Authorization' = 'Bearer !SERVICE_ROLE_KEY!'; 'apikey' = '!SERVICE_ROLE_KEY!' } ^
    -Body `$body2 -ErrorAction SilentlyContinue; ^
  if (`$r2.StatusCode -eq 201 -or `$r2.StatusCode -eq 200) { Write-Host 'OK'; } else { Write-Host 'FALHA'; }; ^
  "

echo.
echo ====================================
echo   Pronto!
echo ====================================
echo.
pause
