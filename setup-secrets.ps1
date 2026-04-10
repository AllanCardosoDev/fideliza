# Script PowerShell para configurar Secrets no Supabase
# Como usar: 
# 1. Abra PowerShell nesta pasta
# 2. Execute: .\setup-secrets.ps1
# 3. Cole sua Service Role Key quando solicitado

$SUPABASE_URL = "https://urysprfgdhfhkgzxkpru.supabase.co"

Write-Host ""
Write-Host "========================================"
Write-Host "   Configurar Secrets Supabase"
Write-Host "========================================"
Write-Host ""

Write-Host "Onde obter sua Service Role Key:" -ForegroundColor Yellow
Write-Host "1. Va a: https://app.supabase.com"
Write-Host "2. Selecione o projeto 'Fideliza'"
Write-Host "3. Va em: Settings > API"
Write-Host "4. Procure por 'Service Role Secret' (chave em azul)"
Write-Host "5. COPIE A CHAVE (comeca com 'eyJ...')"
Write-Host ""

$SERVICE_ROLE_KEY = Read-Host "Cole aqui sua Service Role Key"

if ([string]::IsNullOrWhiteSpace($SERVICE_ROLE_KEY)) {
    Write-Host ""
    Write-Host "ERRO: Nenhuma chave foi fornecida!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Validando chave..." -ForegroundColor Cyan

# Validar que a chave tem o formato correto (deve começar com eyJ)
if (-not $SERVICE_ROLE_KEY.StartsWith("eyJ")) {
    Write-Host "ERRO: A chave deve começar com 'eyJ...'" -ForegroundColor Red
    Write-Host "Voce pode ter copiado a chave errada." -ForegroundColor Red
    exit 1
}

# Ler credenciais
Write-Host "Carregando credenciais..." -ForegroundColor Cyan
$credsPath = Join-Path $PSScriptRoot "credentials\google-service-account.json"
if (-not (Test-Path $credsPath)) {
    Write-Host "ERRO: $credsPath nao encontrado!" -ForegroundColor Red
    exit 1
}

$googleCreds = Get-Content $credsPath -Raw
$googleCredsObj = $googleCreds | ConvertFrom-Json
Write-Host "OK - Credenciais carregadas: $($googleCredsObj.client_email)" -ForegroundColor Green

# Preparar dados
$secrets = @(
    @{
        name = "GOOGLE_SERVICE_ACCOUNT"
        value = $googleCreds
    },
    @{
        name = "GOOGLE_CLIENTES_FOLDER_ID"
        value = "1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf"
    }
)

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "apikey" = $SERVICE_ROLE_KEY
}

Write-Host ""
Write-Host "Enviando secrets..." -ForegroundColor Cyan
Write-Host ""

$success = 0
foreach ($secret in $secrets) {
    Write-Host "Configurando: $($secret.name)..." -ForegroundColor Yellow
    
    $body = @{
        name = $secret.name
        value = $secret.value
    } | ConvertTo-Json -Compress
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$SUPABASE_URL/rest/v1/secrets" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  OK - Sucesso" -ForegroundColor Green
        $success++
    } catch {
        Write-Host "  ERRO - $($_.Exception.Message)" -ForegroundColor Red
        
        # Se falhar, tentar atualizar em vez de criar
        try {
            $response = Invoke-WebRequest `
                -Uri "$SUPABASE_URL/rest/v1/secrets?name=eq.$($secret.name)" `
                -Method PATCH `
                -Headers $headers `
                -Body $body `
                -ErrorAction Stop
            
            Write-Host "  OK - Atualizado" -ForegroundColor Green
            $success++
        } catch {
            Write-Host "  ERRO - Falha ao atualizar tambem" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================"
if ($success -eq $secrets.Count) {
    Write-Host "SUCESSO! Todos os secrets foram configurados!" -ForegroundColor Green
    Write-Host "Agora teste o upload no app! (F5 para recarregar)" -ForegroundColor Green
} else {
    Write-Host "AVISO - Parcialmente configurado ($success/$($secrets.Count))" -ForegroundColor Yellow
    Write-Host "Tente manualmente no dashboard Supabase" -ForegroundColor Yellow
}
Write-Host "========================================"
Write-Host ""

Read-Host "Pressione ENTER para sair"

