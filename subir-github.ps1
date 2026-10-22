# ============================================================
#  subir-github.ps1  — Sube delizia-web a GitHub via API REST
#  Uso: .\subir-github.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Subir Delizia Web a GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PASO 1: Crea un token en https://github.com/settings/tokens/new" -ForegroundColor Yellow
Write-Host "  - Nombre: delizia-push" -ForegroundColor White
Write-Host "  - Expiration: 30 days" -ForegroundColor White
Write-Host "  - Marca el scope: 'repo'" -ForegroundColor White
Write-Host "  - Clic 'Generate token' y copia el resultado (ghp_...)" -ForegroundColor White
Write-Host ""

$TOKEN = Read-Host "Pega tu token aqui"

if (-not $TOKEN -or $TOKEN.Trim().Length -lt 10) {
    Write-Host "Token invalido. Saliendo." -ForegroundColor Red
    exit 1
}
$TOKEN = $TOKEN.Trim()

$HEADERS = @{
    "Authorization"        = "Bearer $TOKEN"
    "Accept"               = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent"           = "DeliziaPush/1.0"
}

# --- Verificar quien eres ---
Write-Host ""
Write-Host "Verificando token..." -ForegroundColor Cyan
try {
    $me = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $HEADERS -Method GET
    Write-Host "Conectado como: $($me.login)" -ForegroundColor Green
} catch {
    Write-Host "Token invalido o sin permisos. Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Asegurate de marcar el scope 'repo' al crear el token." -ForegroundColor Yellow
    exit 1
}

# --- Listar repositorios ---
Write-Host ""
Write-Host "Tus repositorios:" -ForegroundColor Cyan
try {
    $repos = Invoke-RestMethod -Uri "https://api.github.com/user/repos?per_page=30&sort=updated" -Headers $HEADERS -Method GET
    $i = 1
    foreach ($r in $repos) {
        Write-Host "  [$i] $($r.full_name)" -ForegroundColor White
        $i++
    }
} catch {
    Write-Host "No se pudo listar repositorios: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
$seleccion = Read-Host "Escribe el numero del repositorio donde subir delizia-web"
$idx = [int]$seleccion - 1
if ($idx -lt 0 -or $idx -ge $repos.Count) {
    Write-Host "Seleccion invalida." -ForegroundColor Red
    exit 1
}

$REPO_FULL = $repos[$idx].full_name
Write-Host "Repositorio seleccionado: $REPO_FULL" -ForegroundColor Green

# --- Funcion para subir archivo ---
function Subir-Archivo($nombre, $esBinario) {
    Write-Host "  Subiendo $nombre..." -ForegroundColor White -NoNewline

    $fullPath = Join-Path $PSScriptRoot $nombre
    if (-not (Test-Path $fullPath)) {
        Write-Host " [NO ENCONTRADO - saltando]" -ForegroundColor Yellow
        return
    }

    if ($esBinario) {
        $bytes   = [System.IO.File]::ReadAllBytes($fullPath)
        $content = [System.Convert]::ToBase64String($bytes)
    } else {
        $text    = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
        $bytes   = [System.Text.Encoding]::UTF8.GetBytes($text)
        $content = [System.Convert]::ToBase64String($bytes)
    }

    $apiUrl = "https://api.github.com/repos/$REPO_FULL/contents/$nombre"

    $sha = $null
    try {
        $existing = Invoke-RestMethod -Uri $apiUrl -Headers $HEADERS -Method GET -ErrorAction SilentlyContinue
        $sha = $existing.sha
    } catch {}

    $body = @{ message = "feat: subir $nombre"; content = $content }
    if ($sha) { $body.sha = $sha }

    try {
        Invoke-RestMethod -Uri $apiUrl -Headers $HEADERS -Method PUT `
            -Body ($body | ConvertTo-Json -Depth 3) `
            -ContentType "application/json" | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# --- Subir todos los archivos ---
Write-Host ""
Write-Host "Subiendo archivos..." -ForegroundColor Cyan

$textos   = @("index.html", "login.html", "style.css", "app.js", "firebase-db.js", "README.md", ".gitignore")
$binarios = @("logo.jpg", "bg-login.jpg")

foreach ($f in $textos)   { Subir-Archivo $f $false }
foreach ($f in $binarios) { Subir-Archivo $f $true  }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Listo! Tu proyecto esta en:" -ForegroundColor Green
Write-Host "  https://github.com/$REPO_FULL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
