@echo off
echo Deteniendo servidores Python en puerto 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /f /pid %%a 2>nul
timeout /t 1 /nobreak >nul

echo Iniciando servidor desde la carpeta correcta...
cd /d "%~dp0\03 de Junio de 2026\11 de junio v1"
echo.
echo Servidor corriendo en: http://localhost:8080/GestorUrbano_M06_1.html
echo Presiona Ctrl+C para detener
echo.
python -m http.server 8080
