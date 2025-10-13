@echo off
echo ==========================================
echo    ACTUALIZAR CACHE BUST
echo ==========================================
echo.

echo [1/2] Generando nuevo timestamp...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%-%HH%-%Min%"

echo ✅ Nuevo timestamp: %timestamp%

echo.
echo [2/2] Actualizando netlify.toml...
powershell -Command "(Get-Content netlify.toml) -replace 'CACHE_BUST = \"[^\"]*\"', 'CACHE_BUST = \"%timestamp%\"' | Set-Content netlify.toml"
echo ✅ Cache bust actualizado

echo.
echo ==========================================
echo    CACHE ACTUALIZADO
echo ==========================================
echo.
echo 🚀 Usa deploy-automatico.bat para deploy
echo.
pause
