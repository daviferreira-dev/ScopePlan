# Roda testes backend (pytest) + type check frontend (tsc)
$root = $PSScriptRoot
$python = "$root\env\Scripts\python.exe"
$failed = $false

Write-Host "`n=== Backend: Pytest ===" -ForegroundColor Cyan
Set-Location "$root\backend"
& $python -m pytest -v
if ($LASTEXITCODE -ne 0) { $failed = $true; Write-Host "Testes backend falharam." -ForegroundColor Red }

Write-Host "`n=== Frontend: TypeScript ===" -ForegroundColor Cyan
Set-Location $root
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { $failed = $true; Write-Host "Erros de TypeScript." -ForegroundColor Red }

Set-Location $root
if ($failed) { Write-Host "`nFalhou. Corrija os erros acima." -ForegroundColor Red; exit 1 }
Write-Host "`nTudo OK. Pronto para deploy." -ForegroundColor Green
