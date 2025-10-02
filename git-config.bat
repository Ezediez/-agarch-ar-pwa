@echo off
echo ==========================================
echo    CONFIGURACION GIT AUTOMATICA
echo ==========================================
echo.

echo [1/3] Configurando usuario Git...
git config --global user.name "Ezediez"
git config --global user.email "ezequieldiez@hotmail.com"
echo ✅ Usuario configurado

echo.
echo [2/3] Configurando credenciales...
git config --global credential.helper manager-core
echo ✅ Credenciales configuradas

echo.
echo [3/3] Verificando configuración...
echo Usuario: 
git config --global user.name
echo Email: 
git config --global user.email
echo.

echo ==========================================
echo    CONFIGURACION COMPLETADA
echo ==========================================
echo.
echo ✅ Git configurado correctamente
echo 🚀 Ahora puedes usar deploy-automatico.bat
echo.
pause
