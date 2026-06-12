# Testa, builda e faz deploy para o 
# Uso: .\deploy.ps1 -message "feat: descricao da feature"
param(
    [Parameter(Mandatory)][string]$message
)

$root = $PSScriptRoot
$python = "$root\env\Scripts\python.exe"

function Step($label) { Write-Host "`n=== $label ===" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "ERRO: $msg" -ForegroundColor Red; exit 1 }

Step "Testes backend"
Set-Location "$root\backend"
& $python -m pytest -q
if ($LASTEXITCODE -ne 0) { Fail "Testes falharam. Abortando deploy." }

Step "Type check frontend"
Set-Location $root
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Fail "Erros de TypeScript. Abortando deploy." }

Step "Build frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Fail "Build falhou. Abortando deploy." }

Step "Commit e push"
Set-Location $root
git add .
git commit -m $message
git push heroku main

if ($LASTEXITCODE -ne 0) { Fail "Push falhou. Verifique o remote 'heroku'." }
Write-Host "`nDeploy concluido!" -ForegroundColor Green
