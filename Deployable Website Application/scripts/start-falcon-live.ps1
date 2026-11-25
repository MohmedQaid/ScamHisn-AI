<#
Puts the self-hosted judge model (Falcon-H1) on the internet for the deployed site.

  1. Starts llama.cpp's server with the model, locked with a key.
  2. Opens a Cloudflare quick tunnel to it (no account needed).
  3. Writes the three values Render needs to ".env.render-falcon" next to ".env".

Run:   powershell -ExecutionPolicy Bypass -File scripts\start-falcon-live.ps1
Stop:  powershell -ExecutionPolicy Bypass -File scripts\start-falcon-live.ps1 -Stop

The tunnel address is new every time the tunnel starts, so after each start copy
LOCAL_LLM_BASE_URL from ".env.render-falcon" into Render's Environment page again.
The PC must stay on, and awake, for as long as the site should use the model.
#>
param(
  [string]$LlamaServer = "$HOME\tools\llama-cuda\bin\llama-server.exe",
  [string]$Model = "$HOME\models\falcon-h1\Falcon-H1-7B-Instruct-Q4_K_M.gguf",
  [string]$Alias = 'falcon-h1-7b-instruct',
  [int]$Port = 8080,
  [switch]$Stop
)

$ErrorActionPreference = 'Stop'
$appDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $appDir '.env'
$outFile = Join-Path $appDir '.env.render-falcon'
$logDir = Join-Path $env:LOCALAPPDATA 'ScamHisn'
New-Item -ItemType Directory -Force $logDir | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Stop-Running {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -Confirm:$false -ErrorAction SilentlyContinue
  }
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -Confirm:$false -ErrorAction SilentlyContinue
}

if ($Stop) {
  Stop-Running
  'Falcon and the tunnel are stopped.'
  exit 0
}

$cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cloudflared) { $cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
foreach ($need in $LlamaServer, $Model, $cloudflared, $envFile) {
  if (-not (Test-Path $need)) { throw "Not found: $need" }
}

# --- the key: reuse the one in .env, or make one and store it there (never printed)
$lines = [System.IO.File]::ReadAllLines($envFile, $utf8)
function Get-EnvValue([string]$name) {
  foreach ($l in $lines) { if ($l -match "^$name=(.*)$") { return $Matches[1].Trim() } }
  return ''
}
function Set-EnvValue([string]$name, [string]$value) {
  $found = $false
  $script:lines = $script:lines | ForEach-Object { if ($_ -match "^$name=") { $found = $true; "$name=$value" } else { $_ } }
  if (-not $found) { $script:lines += "$name=$value" }
}
$key = Get-EnvValue 'LOCAL_LLM_API_KEY'
if (-not $key) {
  $bytes = New-Object byte[] 24
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $key = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
  Set-EnvValue 'LOCAL_LLM_API_KEY' $key
}
# the app on this PC talks to the model directly
Set-EnvValue 'LOCAL_LLM_BASE_URL' "http://127.0.0.1:$Port/v1"
Set-EnvValue 'LOCAL_LLM_MODEL' $Alias
[System.IO.File]::WriteAllLines($envFile, $lines, $utf8)

Stop-Running
Start-Sleep -Seconds 1

# --- the model server, reachable only from this PC; the tunnel is the only way in
$llamaArgs = "-m `"$Model`" --host 127.0.0.1 --port $Port -ngl 99 -c 8192 --alias $Alias --jinja -np 2 --api-key $key"
Start-Process -FilePath $LlamaServer -ArgumentList $llamaArgs -WindowStyle Minimized `
  -RedirectStandardOutput (Join-Path $logDir 'llama.out.log') -RedirectStandardError (Join-Path $logDir 'llama.err.log')
'Loading the model...'
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 "http://127.0.0.1:$Port/health"
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
}
if (-not $ready) { throw "The model server did not come up. See $logDir\llama.err.log" }
'Model server is up.'

# --- the tunnel
$tunnelLog = Join-Path $logDir 'tunnel.log'
$url = $null
# Cloudflare's sign-up call for a quick tunnel sometimes times out; try a few times
for ($attempt = 1; $attempt -le 4 -and -not $url; $attempt++) {
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -Confirm:$false -ErrorAction SilentlyContinue
  if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Confirm:$false }
  "Opening the tunnel (attempt $attempt)..."
  Start-Process -FilePath $cloudflared -ArgumentList "tunnel --no-autoupdate --url http://127.0.0.1:$Port" -WindowStyle Minimized `
    -RedirectStandardOutput (Join-Path $logDir 'tunnel.out.log') -RedirectStandardError $tunnelLog
  for ($i = 0; $i -lt 30 -and -not $url; $i++) {
    Start-Sleep -Seconds 2
    if (-not (Test-Path $tunnelLog)) { continue }
    $m = Select-String -Path $tunnelLog -Pattern 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
    if ($m) { $url = $m.Matches[0].Value }
    elseif (Select-String -Path $tunnelLog -Pattern 'failed to request quick Tunnel' -Quiet) { break }
  }
}
if (-not $url) { throw "The tunnel did not report an address after four attempts. See $tunnelLog" }

[System.IO.File]::WriteAllLines($outFile, @(
  '# Paste these three into Render > your service > Environment, then save (Render redeploys).',
  '# The address changes every time the tunnel is restarted. Keep this file private.',
  "LOCAL_LLM_BASE_URL=$url/v1",
  "LOCAL_LLM_MODEL=$Alias",
  "LOCAL_LLM_API_KEY=$key"
), $utf8)

# --- everything Render needs in one file, ready for Environment > "Add from .env"
$renderFile = Join-Path $appDir '.env.render.local'
$render = @(
  '# Complete settings for Render. In the service: Environment > Add from .env > paste all of this.',
  '# Contains secret keys: send it privately, never commit it. LOCAL_LLM_BASE_URL changes when the tunnel restarts.',
  'NODE_ENV=production',
  'PLAYWRIGHT_HEADLESS=true',
  'MAX_CONCURRENT_SCANS=2',
  'CORS_ALLOW_EXTENSIONS=true',
  'CORS_ALLOWED_ORIGINS=*',
  'AI_PIPELINE=auto'
)
foreach ($name in 'GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEYS', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL') {
  $v = Get-EnvValue $name
  if ($v) { $render += "$name=$v" }
}
$render += "LOCAL_LLM_BASE_URL=$url/v1", "LOCAL_LLM_MODEL=$Alias", "LOCAL_LLM_API_KEY=$key"
[System.IO.File]::WriteAllLines($renderFile, $render, $utf8)

"Tunnel address: $url"
"Falcon values only:        $outFile"
"Complete file for Render:  $renderFile"
