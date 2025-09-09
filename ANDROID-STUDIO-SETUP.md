# 📱 **ANDROID STUDIO - CONFIGURACIÓN PLAY STORE**

## ✅ **CONFIGURACIÓN COMPLETADA:**

### **🔧 ARCHIVOS ACTUALIZADOS:**
- `app/build.gradle.kts` - Configuración de producción
- `app/src/main/AndroidManifest.xml` - Permisos y configuración
- `app/src/main/res/xml/network_security_config.xml` - Seguridad HTTPS
- `app/src/main/java/com/agarchar/agarch_ar/MainActivity.kt` - WebView optimizado

### **📋 DATOS DE LA APP:**
- **Application ID:** `com.agarch.ar`
- **Version Code:** 2
- **Version Name:** 2.0.0
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 34 (Android 14)
- **URL:** https://agarch-ar.com

### **🔐 PERMISOS CONFIGURADOS:**
- Internet y conectividad
- Cámara y micrófono (opcional)
- Almacenamiento de archivos
- Ubicación (para funcionalidades de proximidad)
- Notificaciones y vibración

### **🚀 CARACTERÍSTICAS:**
- WebView optimizado para PWA
- Deep links configurados
- Orientación portrait
- Hardware acceleration habilitado
- Seguridad HTTPS obligatoria

---

## 📋 **PASOS PARA GENERAR APK/AAB:**

### **1. PREPARAR KEYSTORE:**
```bash
# Generar keystore para firma
keytool -genkey -v -keystore agarch-ar-release.keystore -alias agarch-ar -keyalg RSA -keysize 2048 -validity 10000
```

### **2. CONFIGURAR SIGNING:**
Agregar al `app/build.gradle.kts`:
```kotlin
android {
    signingConfigs {
        release {
            storeFile = file("../agarch-ar-release.keystore")
            storePassword = "TU_PASSWORD"
            keyAlias = "agarch-ar"
            keyPassword = "TU_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ... resto de configuración
        }
    }
}
```

### **3. GENERAR BUILD:**
```bash
# AAB para Play Store (recomendado)
./gradlew bundleRelease

# APK para distribución directa
./gradlew assembleRelease
```

### **4. ARCHIVOS GENERADOS:**
- **AAB:** `app/build/outputs/bundle/release/app-release.aab`
- **APK:** `app/build/outputs/apk/release/app-release.apk`

---

## 🏪 **PREPARACIÓN PLAY STORE:**

### **📝 INFORMACIÓN REQUERIDA:**
- **Título:** AGARCH-AR - Red Social
- **Descripción corta:** Conéctate con personas afines cerca tuyo
- **Descripción completa:** [Ver manifest.webmanifest]
- **Categoría:** Social
- **Clasificación de contenido:** 17+ (Interacción entre usuarios)

### **🖼️ ASSETS REQUERIDOS:**
- **Icono:** 512x512px (ya disponible: `/public/pwa-512x512.png`)
- **Banner:** 1024x500px
- **Screenshots:** Mínimo 2, máximo 8
- **Video promocional:** Opcional

### **🔒 POLÍTICAS:**
- Política de privacidad: Requerida
- Términos de servicio: Requeridos
- Permisos justificados: Documentar uso de cámara, ubicación, etc.

---

## ⚠️ **CONSIDERACIONES IMPORTANTES:**

### **🔐 SEGURIDAD:**
- Solo HTTPS permitido
- Validación de certificados SSL
- Deep links verificados

### **📱 COMPATIBILIDAD:**
- Android 7.0+ (API 24)
- Orientación portrait fija
- Soporte para diferentes densidades de pantalla

### **🚀 PERFORMANCE:**
- Hardware acceleration habilitado
- Large heap para WebView
- Optimizaciones de red

### **📊 ANALYTICS:**
- Firebase integrado en PWA
- Métricas de uso disponibles
- Crashlytics recomendado

---

## ✅ **CHECKLIST PRE-PUBLICACIÓN:**

- [ ] Generar keystore de producción
- [ ] Configurar signing config
- [ ] Generar AAB firmado
- [ ] Probar en dispositivos físicos
- [ ] Verificar permisos funcionando
- [ ] Validar deep links
- [ ] Crear assets para Play Store
- [ ] Documentar políticas de privacidad
- [ ] Configurar Play Console
- [ ] Subir build para testing interno

---

**🎯 ESTADO ACTUAL:** ✅ Configuración completa, listo para generar builds
