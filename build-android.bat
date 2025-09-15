@echo off
echo 🚀 COMPILANDO APK PARA ANDROID...
echo.

REM Verificar que Android SDK esté instalado
if not exist "%ANDROID_HOME%" (
    echo ❌ ANDROID_HOME no está configurado
    echo Por favor instala Android Studio y configura ANDROID_HOME
    pause
    exit /b 1
)

echo ✅ Android SDK encontrado en: %ANDROID_HOME%
echo.

REM Limpiar build anterior
echo 🧹 Limpiando build anterior...
call gradlew clean
if %errorlevel% neq 0 (
    echo ❌ Error al limpiar
    pause
    exit /b 1
)

REM Compilar APK de debug
echo 🔨 Compilando APK de debug...
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ Error al compilar APK
    pause
    exit /b 1
)

REM Compilar APK de release
echo 🔨 Compilando APK de release...
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ❌ Error al compilar APK de release
    pause
    exit /b 1
)

echo.
echo ✅ ¡APK COMPILADO EXITOSAMENTE!
echo.
echo 📱 Archivos generados:
echo    - Debug: app\build\outputs\apk\debug\app-debug.apk
echo    - Release: app\build\outputs\apk\release\app-release.apk
echo.
echo 🚀 Listo para instalar en dispositivos Android
echo.
pause
