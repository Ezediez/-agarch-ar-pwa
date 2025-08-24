# 🚀 CONFIGURACIÓN ANDROID STUDIO PARA AGARCH-AR

## 📱 **PASOS PARA CONVERTIR EN APP NATIVA**

### **1. INSTALAR DEPENDENCIAS NECESARIAS**
```bash
npm install
npm run build
```

### **2. CONFIGURAR ANDROID STUDIO**

#### **A. Crear Proyecto Android**
1. Abrir Android Studio
2. File → New → New Project
3. Seleccionar "Empty Views Activity"
4. Nombre: `AGARCH-AR`
5. Package name: `com.agarchar.app`
6. Language: Kotlin
7. Minimum SDK: API 21 (Android 5.0)

#### **B. Configurar WebView**
```kotlin
// MainActivity.kt
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                url?.let { view?.loadUrl(it) }
                return true
            }
        }
        
        // Cargar la PWA
        webView.loadUrl("https://agarch-ar.com")
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

#### **C. Layout XML**
```xml
<!-- activity_main.xml -->
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>
```

#### **D. Permisos en AndroidManifest.xml**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/Theme.AGARCHAR"
    android:usesCleartextTraffic="true">
    
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:configChanges="orientation|screenSize"
        android:screenOrientation="portrait">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

### **3. CONFIGURAR ICONOS Y SPLASH SCREEN**

#### **A. Generar Iconos**
1. Usar Android Asset Studio
2. Importar `pwa-512x512.png`
3. Generar todos los tamaños necesarios

#### **B. Splash Screen**
```xml
<!-- styles.xml -->
<style name="Theme.AGARCHAR" parent="Theme.MaterialComponents.DayNight.NoActionBar">
    <item name="android:windowBackground">@drawable/splash_background</item>
    <item name="android:statusBarColor">@color/black</item>
    <item name="android:navigationBarColor">@color/black</item>
</style>
```

### **4. CONFIGURAR BUILD GRADLE**

#### **A. app/build.gradle**
```gradle
android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.agarchar.app"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
```

### **5. FUNCIONALIDADES NATIVAS A IMPLEMENTAR**

#### **A. Notificaciones Push**
- Firebase Cloud Messaging
- Notificaciones locales para matches

#### **B. Geolocalización**
- GPS nativo para mejor precisión
- Permisos de ubicación

#### **C. Cámara y Galería**
- Acceso nativo a cámara
- Selección de fotos

#### **D. Offline Mode**
- Cache de datos críticos
- Sincronización cuando hay conexión

### **6. TESTING Y DEPLOY**

#### **A. Testing**
1. Probar en diferentes dispositivos
2. Verificar funcionalidad offline
3. Test de rendimiento

#### **B. Google Play Store**
1. Crear cuenta de desarrollador ($25)
2. Preparar assets (screenshots, descripción)
3. Subir APK/AAB
4. Configurar ficha de app

## 🔧 **ARCHIVOS NECESARIOS**

- `pwa-512x512.png` (icono principal)
- `pwa-192x192.png` (icono pequeño)
- Configuración de Supabase
- Certificados de firma

## 📋 **CHECKLIST FINAL**

- [ ] PWA funcionando offline
- [ ] App nativa compilando
- [ ] Iconos y splash screen
- [ ] Permisos configurados
- [ ] Testing en dispositivos
- [ ] APK firmado
- [ ] Ficha de Play Store
- [ ] Publicación en store
