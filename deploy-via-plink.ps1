# Deploy via PuTTY plink (-pw). Credentials: .ssh-deploy.local or env SSH_HOST / SSH_USER / SSH_PASSWORD
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
if (-not (Test-Path $plink)) {
  Write-Host "plink not found: $plink" -ForegroundColor Red
  exit 1
}

$bashRemote = 'bash -lc "cd /opt/arenda-neba; git fetch origin; git pull origin main; pm2 restart arenda-neba; pm2 save; pm2 status arenda-neba"'
& $plink -batch -ssh "$user@$serverHost" -pw $pw $bashRemote
