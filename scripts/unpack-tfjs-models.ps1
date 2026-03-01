# Unpack Colab-converted TF.js models into public/dhcd/
# Usage: .\scripts\unpack-tfjs-models.ps1 -ZipPath "C:\Downloads\dhcd_tfjs_all.zip"

param(
    [Parameter(Mandatory=$true)]
    [string]$ZipPath
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dhcd = Join-Path $root "public\dhcd"

if (-not (Test-Path $ZipPath)) {
    Write-Error "Zip not found: $ZipPath"
}

$temp = Join-Path $env:TEMP "dhcd_tfjs_unpack"
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
Expand-Archive -Path $ZipPath -DestinationPath $temp -Force

$tfjsChar = Join-Path $temp "tfjs_char"
$tfjsWord = Join-Path $temp "tfjs_word"
$outChar = Join-Path $dhcd "tfjs_model"
$outWord = Join-Path $dhcd "word_tfjs_model"

if (-not (Test-Path $tfjsChar)) { Write-Error "Zip missing tfjs_char/ folder" }
if (-not (Test-Path $tfjsWord)) { Write-Error "Zip missing tfjs_word/ folder" }

New-Item -ItemType Directory -Force -Path $outChar | Out-Null
New-Item -ItemType Directory -Force -Path $outWord | Out-Null

Copy-Item -Path (Join-Path $tfjsChar "*") -Destination $outChar -Force
Copy-Item -Path (Join-Path $tfjsWord "*") -Destination $outWord -Force

Remove-Item -Recurse -Force $temp

Write-Host "Done. Models placed in public/dhcd/tfjs_model/ and public/dhcd/word_tfjs_model/"
Write-Host "Test at http://localhost:3000/draw"
