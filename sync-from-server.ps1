# Скрипт для синхронизации файлов с сервера на локальную машину
# Использование: .\sync-from-server.ps1 [backup_name]
# Пример: .\sync-from-server.ps1 backup_2026-01-04_22-41-24

param(
    [string]$BackupName = "",
    [string]$ServerIP = "91.222.237.34",
    [string]$ServerUser = "root",
    [string]$ProjectPath = "F:\New site\deploy"
)

$ErrorActionPreference = "Stop"

# Цвета для вывода
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Yellow "🔄 Синхронизация файлов с сервера..."

# Определяем путь к бэкапу на сервере
if ($BackupName) {
    $BackupPath = "/opt/arenda-neba/backups/$BackupName"
    Write-ColorOutput Yellow "📦 Используем бэкап: $BackupName"
} else {
    $BackupPath = "/opt/arenda-neba"
    Write-ColorOutput Yellow "📦 Используем текущие файлы с сервера"
}

# Проверяем подключение к серверу
Write-ColorOutput Yellow "🔌 Проверяем подключение к серверу..."
try {
    $testConnection = ssh -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo 'OK'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Не удалось подключиться к серверу"
    }
    Write-ColorOutput Green "✅ Подключение установлено"
} catch {
    Write-ColorOutput Red "❌ Ошибка подключения к серверу: $_"
    Write-ColorOutput Yellow "💡 Убедитесь, что:"
    Write-ColorOutput Yellow "   - SSH доступен"
    Write-ColorOutput Yellow "   - IP адрес правильный: $ServerIP"
    Write-ColorOutput Yellow "   - У вас есть доступ к серверу"
    exit 1
}

# Создаем резервную копию текущих файлов
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupLocalDir = "F:\New site\backups\before_sync_$Timestamp"
Write-ColorOutput Yellow "💾 Создаем резервную копию локальных файлов в: $BackupLocalDir"
New-Item -ItemType Directory -Force -Path $BackupLocalDir | Out-Null

if (Test-Path "$ProjectPath\database.db") {
    Copy-Item "$ProjectPath\database.db" -Destination "$BackupLocalDir\database.db" -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$ProjectPath\public") {
    Copy-Item -Recurse "$ProjectPath\public" -Destination "$BackupLocalDir\public" -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$ProjectPath\server.js") {
    Copy-Item "$ProjectPath\server.js" -Destination "$BackupLocalDir\server.js" -Force -ErrorAction SilentlyContinue
}

Write-ColorOutput Green "✅ Резервная копия создана"

# Копируем файлы с сервера
Write-ColorOutput Yellow "📥 Копируем файлы с сервера..."

# База данных
Write-ColorOutput Yellow "  📊 Копируем database.db..."
try {
    if ($BackupName) {
        scp "$ServerUser@${ServerIP}:$BackupPath/database.db" "$ProjectPath\database.db" 2>&1 | Out-Null
    } else {
        scp "$ServerUser@${ServerIP}:$BackupPath/database.db" "$ProjectPath\database.db" 2>&1 | Out-Null
    }
    Write-ColorOutput Green "  ✅ database.db скопирован"
} catch {
    Write-ColorOutput Yellow "  ⚠️  database.db не найден или не скопирован"
}

# Папка public
Write-ColorOutput Yellow "  📁 Копируем папку public..."
try {
    if ($BackupName) {
        scp -r "$ServerUser@${ServerIP}:$BackupPath/public" "$ProjectPath\" 2>&1 | Out-Null
    } else {
        scp -r "$ServerUser@${ServerIP}:$BackupPath/public" "$ProjectPath\" 2>&1 | Out-Null
    }
    Write-ColorOutput Green "  ✅ Папка public скопирована"
} catch {
    Write-ColorOutput Yellow "  ⚠️  Папка public не найдена или не скопирована"
}

# server.js
Write-ColorOutput Yellow "  ⚙️  Копируем server.js..."
try {
    if ($BackupName) {
        scp "$ServerUser@${ServerIP}:$BackupPath/server.js" "$ProjectPath\server.js" 2>&1 | Out-Null
    } else {
        scp "$ServerUser@${ServerIP}:$BackupPath/server.js" "$ProjectPath\server.js" 2>&1 | Out-Null
    }
    Write-ColorOutput Green "  ✅ server.js скопирован"
} catch {
    Write-ColorOutput Yellow "  ⚠️  server.js не найден или не скопирован"
}

# package.json
Write-ColorOutput Yellow "  📦 Копируем package.json..."
try {
    if ($BackupName) {
        scp "$ServerUser@${ServerIP}:$BackupPath/package.json" "$ProjectPath\package.json" 2>&1 | Out-Null
    } else {
        scp "$ServerUser@${ServerIP}:$BackupPath/package.json" "$ProjectPath\package.json" 2>&1 | Out-Null
    }
    Write-ColorOutput Green "  ✅ package.json скопирован"
} catch {
    Write-ColorOutput Yellow "  ⚠️  package.json не найден или не скопирован"
}

# init-db.js
Write-ColorOutput Yellow "  🔧 Копируем init-db.js..."
try {
    if ($BackupName) {
        scp "$ServerUser@${ServerIP}:$BackupPath/init-db.js" "$ProjectPath\init-db.js" 2>&1 | Out-Null
    } else {
        scp "$ServerUser@${ServerIP}:$BackupPath/init-db.js" "$ProjectPath\init-db.js" 2>&1 | Out-Null
    }
    Write-ColorOutput Green "  ✅ init-db.js скопирован"
} catch {
    Write-ColorOutput Yellow "  ⚠️  init-db.js не найден или не скопирован"
}

# Проверяем результат
Write-ColorOutput Yellow "`n📋 Проверка скопированных файлов:"

if (Test-Path "$ProjectPath\database.db") {
    $dbSize = (Get-Item "$ProjectPath\database.db").Length
    Write-ColorOutput Green "  ✅ database.db ($([math]::Round($dbSize/1KB, 2)) KB)"
} else {
    Write-ColorOutput Red "  ❌ database.db не найден"
}

if (Test-Path "$ProjectPath\public") {
    $publicFiles = (Get-ChildItem "$ProjectPath\public" -Recurse -File).Count
    Write-ColorOutput Green "  ✅ public ($publicFiles файлов)"
} else {
    Write-ColorOutput Red "  ❌ public не найдена"
}

if (Test-Path "$ProjectPath\server.js") {
    Write-ColorOutput Green "  ✅ server.js"
} else {
    Write-ColorOutput Red "  ❌ server.js не найден"
}

Write-ColorOutput Green "`n✅ Синхронизация завершена!"
Write-ColorOutput Yellow "💾 Резервная копия локальных файлов: before_sync_$Timestamp"
