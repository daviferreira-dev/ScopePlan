@echo off
set ROOT=%~dp0

echo Iniciando backend Flask (porta 5000)...
start "ScopePlan Backend" cmd /k "%ROOT%start_backend.bat"

timeout /t 2 /nobreak >nul

echo Iniciando frontend Vite (http://localhost:5173)...
cd /d "%ROOT%"
npm run dev
