# Convert word CRNN to TF.js (Windows)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$OutDir = Join-Path $ProjectRoot "public\dhcd\word_tfjs_model"

Set-Location $ScriptDir

if (-not (Test-Path "model_word.h5")) {
  Write-Host "Run train.py first"
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
tensorflowjs_converter --input_format keras model_word.h5 $OutDir
Copy-Item charlist.json $ProjectRoot\public\dhcd\ -Force
Write-Host "Model: $OutDir, charlist: public/dhcd/charlist.json"
