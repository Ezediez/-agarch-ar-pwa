@echo off
echo ==========================================
echo    AGARCH-AR - BUILD RAPIDO
echo ==========================================
echo.

echo [1/3] Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en build
    pause
    exit /b 1
)
echo ✅ Build completado

echo.
echo [2/3] Preparando archivos...
if exist upload-ready rmdir /s /q upload-ready
mkdir upload-ready
xcopy "dist-new\*" "upload-ready\" /E /H /C /I /Y
echo ✅ Archivos listos en upload-ready/

echo.
echo [3/3] Listo para subir manualmente
echo 📁 Carpeta: upload-ready/
echo 🌐 Sube estos archivos a GitHub
echo.
pause
