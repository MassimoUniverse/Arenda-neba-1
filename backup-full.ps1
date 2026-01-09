# Full Project Backup Script for Windows
# Sozdaet polnyj bekap proekta: baza dannyh, uploads, public, konfigi

param(
    [string]$ProjectDir = "F:\New site\deploy",
    [switch]$Archive = $false
)

# Proverka direktorii proekta
if (-not (Test-Path $ProjectDir)) {
    Write-Host "ERROR: Direktoriya ne najdena: $ProjectDir" -ForegroundColor Red
    exit 1
}

Set-Location $ProjectDir

# Sozdanie direktorii dlya bekapa
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup_$timestamp"

Write-Host ""
Write-Host "=== POLNYJ BEKAP PROEKTA ===" -ForegroundColor Cyan
Write-Host "Direktoriya: $ProjectDir" -ForegroundColor Cyan
Write-Host "Sozdanie bekapa: $backupDir" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 1. Bekap bazy dannyh
Write-Host "1. Bekap bazy dannyh..." -ForegroundColor Yellow
if (Test-Path "database.db") {
    Copy-Item "database.db" "$backupDir\database.db"
    $dbSize = (Get-Item "database.db").Length
    $dbSizeMB = [math]::Round($dbSize/1MB, 2)
    Write-Host "   [OK] database.db skopirovan ($dbSizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] database.db ne najden" -ForegroundColor Red
}

# 2. Bekap uploads
Write-Host "2. Bekap papki uploads/..." -ForegroundColor Yellow
if (Test-Path "uploads") {
    Copy-Item "uploads" "$backupDir\uploads" -Recurse
    $uploadCount = (Get-ChildItem "uploads" -Recurse -File).Count
    Write-Host "   [OK] uploads/ skopirovan ($uploadCount fajlov)" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] uploads/ ne najden" -ForegroundColor Red
}

# 3. Bekap public
Write-Host "3. Bekap papki public/..." -ForegroundColor Yellow
if (Test-Path "public") {
    Copy-Item "public" "$backupDir\public" -Recurse
    $publicCount = (Get-ChildItem "public" -Recurse -File).Count
    Write-Host "   [OK] public/ skopirovan ($publicCount fajlov)" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] public/ ne najden" -ForegroundColor Red
}

# 4. Bekap .env
Write-Host "4. Bekap .env fajla..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Copy-Item ".env" "$backupDir\.env"
    Write-Host "   [OK] .env skopirovan" -ForegroundColor Green
} else {
    Write-Host "   [SKIP] .env ne najden (propuschen)" -ForegroundColor Gray
}

# 5. Bekap package.json i package-lock.json
Write-Host "5. Bekap package fajlov..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Copy-Item "package.json" "$backupDir\package.json"
    Write-Host "   [OK] package.json skopirovan" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Copy-Item "package-lock.json" "$backupDir\package-lock.json"
    Write-Host "   [OK] package-lock.json skopirovan" -ForegroundColor Green
}

# 6. Bekap server.js
Write-Host "6. Bekap server.js..." -ForegroundColor Yellow
if (Test-Path "server.js") {
    Copy-Item "server.js" "$backupDir\server.js"
    Write-Host "   [OK] server.js skopirovan" -ForegroundColor Green
}

# 7. Informaciya o bekape
$readmeContent = @"
BACKUP INFORMATION
==================
Data sozdaniya: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Direktoriya: $ProjectDir
Hostname: $env:COMPUTERNAME

SODERZHIMOE:
-----------
"@

if (Test-Path "$backupDir\database.db") {
    $dbSize = (Get-Item "$backupDir\database.db").Length
    $dbSizeMB = [math]::Round($dbSize/1MB, 2)
    $readmeContent += "`n- database.db ($dbSizeMB MB)"
}
if (Test-Path "$backupDir\uploads") {
    $uploadCount = (Get-ChildItem "$backupDir\uploads" -Recurse -File).Count
    $readmeContent += "`n- uploads/ ($uploadCount fajlov)"
}
if (Test-Path "$backupDir\public") {
    $publicCount = (Get-ChildItem "$backupDir\public" -Recurse -File).Count
    $readmeContent += "`n- public/ ($publicCount fajlov)"
}
if (Test-Path "$backupDir\.env") {
    $readmeContent += "`n- .env"
}
if (Test-Path "$backupDir\package.json") {
    $readmeContent += "`n- package.json"
}
if (Test-Path "$backupDir\package-lock.json") {
    $readmeContent += "`n- package-lock.json"
}
if (Test-Path "$backupDir\server.js") {
    $readmeContent += "`n- server.js"
}

$readmeContent | Out-File -FilePath "$backupDir\BACKUP_INFO.txt" -Encoding UTF8

# 8. Sozdanie arhiva (esli ukazan flag)
if ($Archive) {
    Write-Host ""
    Write-Host "7. Sozdanie ZIP arhiva..." -ForegroundColor Yellow
    $zipFile = "$backupDir.zip"
    
    # Udalyaem staryj arhiv esli sushhestvuet
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
    }
    
    # Sozdaem arhiv
    Compress-Archive -Path $backupDir -DestinationPath $zipFile -CompressionLevel Optimal
    
    if (Test-Path $zipFile) {
        $zipSize = (Get-Item $zipFile).Length
        $zipSizeMB = [math]::Round($zipSize/1MB, 2)
        Write-Host "   [OK] Arhiv sozdan: $zipFile ($zipSizeMB MB)" -ForegroundColor Green
        
        # Udalyaem vremennuyu direktoriyu
        Remove-Item $backupDir -Recurse -Force
        Write-Host "   [INFO] Vremennaya direktoriya udalena" -ForegroundColor Gray
    } else {
        Write-Host "   [ERROR] Oshibka sozdaniya arhiva" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== BEKAP ZAVERSHEN ===" -ForegroundColor Green
if ($Archive) {
    Write-Host "Arhiv: $zipFile" -ForegroundColor Cyan
} else {
    Write-Host "Direktoriya: $backupDir" -ForegroundColor Cyan
}
Write-Host ""
