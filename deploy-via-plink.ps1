# Deploy: PuTTY plink (-pw). Читает .ssh-deploy.local или env SSH_HOST / SSH_USER / SSH_PASSWORD
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$local = Join-Path $here '.ssh-deploy.local'

if (Test-Path $local) {
  Get-Content $local -Raw | ForEach-Object { $_ -split "`n" } | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^\s*#' -or $line -eq '') { return }
    if ($line -match '^\s*(\w+)\s*=\s*(.*)\s*$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), 'Process')
    }
  }
}

$serverHost = $env:SSH_HOST
$user = $env:SSH_USER
if (-not $user) { $user = 'root' }
$pw = $env:SSH_PASSWORD

if (-not $serverHost -or -not $pw) {
  Write-Host "Create .ssh-deploy.local (see .ssh-deploy.local.example) with SSH_HOST, SSH_USER, SSH_PASSWORD" -ForegroundColor Yellow
  Write-Host "or set env SSH_HOST, SSH_PASSWORD." -ForegroundColor Yellow
  exit 1
}

$plink = 'C:\Program Files\PuTTY\plink.exe'
$pscp = 'C:\Program Files\PuTTY\pscp.exe'
if (-not (Test-Path $plink)) {
  Write-Host "plink not found: $plink" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $pscp)) {
  Write-Host "pscp not found: $pscp" -ForegroundColor Red
  exit 1
}

$setupScript = Join-Path $here 'scripts\server-setup-git.sh'
if (-not (Test-Path $setupScript)) {
  Write-Host "Missing $setupScript" -ForegroundColor Red
  exit 1
}

Write-Host ">>> mkdir scripts on server" -ForegroundColor Cyan
& $plink -batch -ssh "$user@$serverHost" -pw $pw "mkdir -p /opt/arenda-neba/scripts"

Write-Host ">>> upload server-setup-git.sh" -ForegroundColor Cyan
& $pscp -batch -pw $pw $setupScript "${user}@${serverHost}:/opt/arenda-neba/scripts/server-setup-git.sh"

# plink -m: передать файл с командами на удалённую оболочку (без ломания кавычек)
$remoteCmdFile = [System.IO.Path]::GetTempFileName()
$remoteBash = @'
set -e
chmod +x /opt/arenda-neba/scripts/server-setup-git.sh
/opt/arenda-neba/scripts/server-setup-git.sh
cd /opt/arenda-neba
npm install --production --no-audit --no-fund 2>/dev/null || true
# sqlite3: после npm install на Linux часто нужна пересборка нативного модуля (иначе invalid ELF header → 502)
npm rebuild sqlite3 --build-from-source 2>/dev/null || npm install sqlite3 --build-from-source --no-audit --no-fund
pm2 restart arenda-neba
pm2 save
pm2 status arenda-neba
'@
[System.IO.File]::WriteAllText($remoteCmdFile, ($remoteBash -replace "`r`n", "`n"), [System.Text.UTF8Encoding]::new($false))

Write-Host ">>> git sync + npm + pm2" -ForegroundColor Cyan
try {
  & $plink -batch -ssh "$user@$serverHost" -pw $pw -m $remoteCmdFile
} finally {
  Remove-Item -Force $remoteCmdFile -ErrorAction SilentlyContinue
}
