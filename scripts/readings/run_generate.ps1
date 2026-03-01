# Generate readings audio for all Kashmir Shaivism texts
# Requires: Sabdakrida (port 8010), CHUTES_API_KEY in .env.local or env

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

# Load .env.local if present
$envFile = Join-Path $root ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

Set-Location $root
python scripts/readings/generate_audio.py --all
