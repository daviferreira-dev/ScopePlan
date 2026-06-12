# Inicia backend (nova janela) + frontend (janela atual)
$root = $PSScriptRoot
$python = "$root\env\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "ERRO: virtualenv nao encontrado em $root\env" -ForegroundColor Red
    Write-Host "Rode: python -m venv env" -ForegroundColor Yellow
    exit 1
}

Write-Host "Iniciando backend Flask na porta 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", `
    "Set-Location '$root\backend'; & '$python' run.py"

Start-Sleep -Seconds 2

Write-Host "Iniciando frontend Vite em http://localhost:5173" -ForegroundColor Green
Set-Location $root
npm run dev
