@echo off
echo ==========================================
echo    PREPARAR PARA GITHUB DESKTOP
echo ==========================================
echo.

echo [1/4] Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en build
    pause
    exit /b 1
)
echo ✅ Build completado

echo.
echo [2/4] Actualizando cache bust...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%-%HH%-%Min%"
powershell -Command "(Get-Content netlify.toml) -replace 'CACHE_BUST = \"[^\"]*\"', 'CACHE_BUST = \"%timestamp%\"' | Set-Content netlify.toml"
echo ✅ Cache actualizado

echo.
echo [3/4] Preparando archivos para deploy...
if exist upload-ready rmdir /s /q upload-ready
mkdir upload-ready
xcopy "dist-new\*" "upload-ready\" /E /H /C /I /Y
echo ✅ Archivos listos

echo.
echo [4/4] Abriendo GitHub Desktop...
echo ✅ Todo listo para commit
echo.
echo 📱 AHORA:
echo 1. Abre GitHub Desktop
echo 2. Verás todos los cambios
echo 3. Escribe mensaje de commit
echo 4. Click "Commit to main"
echo 5. Click "Push origin"
echo.
start "" "C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
echo.
pause
