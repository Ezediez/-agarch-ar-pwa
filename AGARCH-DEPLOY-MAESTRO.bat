@echo off
color 0A
title AGARCH-AR DEPLOY MAESTRO

:menu
cls
echo ==========================================
echo    🚀 AGARCH-AR DEPLOY MAESTRO 🚀
echo ==========================================
echo.
echo [1] 🔧 Configurar Git (solo primera vez)
echo [2] 🏗️  Build Rápido (solo preparar archivos)
echo [3] 🚀 Deploy Completo (build + git + push)
echo [4] 🔄 Actualizar Cache Bust
echo [5] ❌ Salir
echo.
set /p opcion="Elige una opción (1-5): "

if "%opcion%"=="1" goto config
if "%opcion%"=="2" goto build
if "%opcion%"=="3" goto deploy
if "%opcion%"=="4" goto cache
if "%opcion%"=="5" goto salir
goto menu

:config
echo.
echo 🔧 Configurando Git...
call git-config.bat
goto menu

:build
echo.
echo 🏗️ Build Rápido...
call build-rapido.bat
goto menu

:deploy
echo.
echo 🚀 Deploy Completo...
call actualizar-cache.bat
call deploy-automatico.bat
goto menu

:cache
echo.
echo 🔄 Actualizando Cache...
call actualizar-cache.bat
goto menu

:salir
echo.
echo 👋 ¡Hasta luego!
timeout /t 2 >nul
exit
