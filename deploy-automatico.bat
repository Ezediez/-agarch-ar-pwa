@echo off
echo ==========================================
echo    AGARCH-AR - DEPLOY AUTOMATICO
echo ==========================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no encontrado. Instala Node.js primero.
    pause
    exit /b 1
)
echo ✅ Node.js OK

echo.
echo [2/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

echo.
echo [3/5] Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en build
    pause
    exit /b 1
)
echo ✅ Build completado

echo.
echo [4/5] Preparando archivos para deploy...
if exist upload-ready rmdir /s /q upload-ready
mkdir upload-ready
xcopy "dist-new\*" "upload-ready\" /E /H /C /I /Y
echo ✅ Archivos listos en upload-ready/

echo.
echo [5/5] Commit y Push automático...
git add .
git commit -m "Deploy automático - %date% %time%"
git push origin main
if %errorlevel% neq 0 (
    echo ⚠️  Push falló. Sube manualmente upload-ready/ a GitHub
    echo 📁 Carpeta lista: upload-ready/
) else (
    echo ✅ Push exitoso - Netlify detectará cambios automáticamente
)

echo.
echo ==========================================
echo    DEPLOY COMPLETADO
echo ==========================================
echo.
echo 📱 Tu app se actualizará en Netlify en 1-2 minutos
echo 🌐 URL: https://agarch-ar.com
echo.
pause
