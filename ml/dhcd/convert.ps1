# Convert Keras model to TF.js format for browser use (Windows).
# Run from ml/dhcd/: .\convert.ps1
# Output: public/dhcd/tfjs_model/

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$OutDir = Join-Path $ProjectRoot "public\dhcd\tfjs_model"

Set-Location $ScriptDir

if (-not (Test-Path "model_char.h5")) {
  Write-Host "Run train.py first to generate model_char.h5"
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
tensorflowjs_converter --input_format keras model_char.h5 $OutDir
Write-Host "TF.js model saved to $OutDir"
Get-ChildItem $OutDir
