# 🔥 Configuración de Firebase Storage - AGARCH-AR

## ❌ Problema Actual
Firebase Storage no está habilitado en el proyecto, causando errores CORS al intentar subir fotos.

## ✅ Solución

### 1. Habilitar Firebase Storage
1. Ve a: https://console.firebase.google.com/project/sample-firebase-ai-app-b9230/storage
2. Haz clic en **"Get Started"**
3. Selecciona **"Start in test mode"** (por ahora)
4. Elige la región más cercana (us-central1 o us-east1)
5. Haz clic en **"Done"**

### 2. Configurar Dominios Autorizados
1. Ve a: https://console.firebase.google.com/project/sample-firebase-ai-app-b9230/authentication/settings
2. En **"Authorized domains"**, asegúrate de que esté:
   - `agarch-ar.com`
   - `localhost` (para desarrollo)
   - `sample-firebase-ai-app-b9230.web.app`

### 3. Desplegar Reglas de Storage
Una vez habilitado Storage, ejecuta:
```bash
firebase deploy --only storage
```

### 4. Verificar Configuración
- Las reglas de Storage ya están creadas en `storage.rules`
- El código de upload ya está optimizado
- Los errores ahora mostrarán mensajes más claros

## 🚀 Después de Habilitar Storage
1. Las fotos de perfil funcionarán correctamente
2. La subida de videos funcionará
3. Los posts con imágenes funcionarán
4. No más errores CORS

## 📱 Pruebas
- Subir foto de perfil
- Subir fotos a la galería
- Crear post con imagen
- Subir video de perfil
