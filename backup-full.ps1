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

# 7. Bekap vseh JS fajlov i skriptov
Write-Host "7. Bekap JS fajlov i skriptov..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path "." -Filter "*.js" -File | Where-Object { $_.Name -ne "webpack.config.js" }
foreach ($file in $jsFiles) {
    Copy-Item $file.FullName "$backupDir\$($file.Name)" -Force
}
$jsCount = $jsFiles.Count
Write-Host "   [OK] Skopirovano $jsCount JS fajlov" -ForegroundColor Green

# 8. Bekap vseh shell skriptov
Write-Host "8. Bekap shell skriptov..." -ForegroundColor Yellow
$shFiles = Get-ChildItem -Path "." -Filter "*.sh" -File
foreach ($file in $shFiles) {
    Copy-Item $file.FullName "$backupDir\$($file.Name)" -Force
}
$shCount = $shFiles.Count
Write-Host "   [OK] Skopirovano $shCount shell skriptov" -ForegroundColor Green

# 9. Bekap dokumentacii (MD fajly)
Write-Host "9. Bekap dokumentacii..." -ForegroundColor Yellow
$mdFiles = Get-ChildItem -Path "." -Filter "*.md" -File
foreach ($file in $mdFiles) {
    Copy-Item $file.FullName "$backupDir\$($file.Name)" -Force
}
$mdCount = $mdFiles.Count
Write-Host "   [OK] Skopirovano $mdCount dokumentov" -ForegroundColor Green

# 10. Bekap .gitignore i drugih konfigov
Write-Host "10. Bekap konfigov..." -ForegroundColor Yellow
$configFiles = @(".gitignore", ".env.example", ".npmrc")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir\$file" -Force
        Write-Host "   [OK] $file skopirovan" -ForegroundColor Green
    }
}

# 11. Informaciya o bekape
Write-Host "11. Sozdanie informacii o bekape..." -ForegroundColor Yellow
$readmeContent = "========================================`n"
$readmeContent += "FULL PROJECT BACKUP`n"
$readmeContent += "========================================`n"
$readmeContent += "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$readmeContent += "Directory: $ProjectDir`n"
$readmeContent += "Computer: $env:COMPUTERNAME`n"
$readmeContent += "User: $env:USERNAME`n`n"
$readmeContent += "CONTENTS:`n"
$readmeContent += "-----------`n"

if (Test-Path "$backupDir\database.db") {
    $dbSize = (Get-Item "$backupDir\database.db").Length
    $dbSizeMB = [math]::Round($dbSize/1MB, 2)
    $readmeContent += "[OK] database.db ($dbSizeMB MB)`n"
} else {
    $readmeContent += "[ERROR] database.db (not found)`n"
}

if (Test-Path "$backupDir\database.db.backup") {
    $readmeContent += "[OK] database.db.backup`n"
}

if (Test-Path "$backupDir\uploads") {
    $uploadCount = (Get-ChildItem "$backupDir\uploads" -Recurse -File).Count
    $uploadSize = (Get-ChildItem "$backupDir\uploads" -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $uploadSizeMB = [math]::Round($uploadSize/1MB, 2)
    $readmeContent += "[OK] uploads/ ($uploadCount files, $uploadSizeMB MB)`n"
} else {
    $readmeContent += "[ERROR] uploads/ (not found)`n"
}

if (Test-Path "$backupDir\public") {
    $publicCount = (Get-ChildItem "$backupDir\public" -Recurse -File).Count
    $readmeContent += "[OK] public/ ($publicCount files)`n"
} else {
    $readmeContent += "[ERROR] public/ (not found)`n"
}

if (Test-Path "$backupDir\.env") {
    $readmeContent += "[OK] .env`n"
} else {
    $readmeContent += "[SKIP] .env (not found, skipped)`n"
}

if (Test-Path "$backupDir\package.json") {
    $readmeContent += "[OK] package.json`n"
}
if (Test-Path "$backupDir\package-lock.json") {
    $readmeContent += "[OK] package-lock.json`n"
}
if (Test-Path "$backupDir\server.js") {
    $readmeContent += "[OK] server.js`n"
}

$readmeContent += "`n[OK] JS files: $jsCount`n"
$readmeContent += "[OK] Shell scripts: $shCount`n"
$readmeContent += "[OK] Documentation: $mdCount`n"

$readmeContent += "`nRESTORE INSTRUCTIONS:`n"
$readmeContent += "-------------------`n"
$readmeContent += "1. Copy database.db to project root`n"
$readmeContent += "2. Copy uploads/ to project root`n"
$readmeContent += "3. Copy public/ to project root`n"
$readmeContent += "4. Other files are already in place`n"
$readmeContent += "5. Run: npm install`n"
$readmeContent += "6. Run: npm start`n"
$readmeContent += "`n========================================`n"

$readmeContent | Out-File -FilePath "$backupDir\BACKUP_INFO.txt" -Encoding UTF8
Write-Host "   [OK] Informaciya sozdana" -ForegroundColor Green

# 12. Sozdanie arhiva (esli ukazan flag)
if ($Archive) {
    Write-Host ""
    Write-Host "12. Sozdanie ZIP arhiva..." -ForegroundColor Yellow
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
