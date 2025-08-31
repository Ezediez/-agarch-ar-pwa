# 🚀 INSTRUCCIONES PARA DEPLOY EN NETLIFY - AGARCH-AR

## 📋 **PROBLEMA IDENTIFICADO Y SOLUCIONADO**

**Problema Principal**: La app PWA fallaba en rutas específicas como `/discover` generando errores 404 en Netlify.

**Causa Raíz**: 
- Falta de archivos de configuración específicos para Netlify
- Service worker mal configurado para SPA
- Rutas no manejadas correctamente por el hosting

## 🔧 **ARCHIVOS CREADOS/CONFIGURADOS**

### 1. **`public/_redirects`**
- Maneja todas las rutas SPA para que Netlify las redirija a `index.html`
- Incluye rutas específicas: `/discover`, `/chat`, `/profile`, etc.

### 2. **`public/headers`**
- Configura headers HTTP correctos para PWA
- Optimiza cache para diferentes tipos de archivos

### 3. **`netlify.toml`**
- Configuración completa del proyecto para Netlify
- Define build commands, redirects y headers
- Configuración específica para PWA

### 4. **`scripts/postbuild.js`**
- Script que se ejecuta después del build
- Copia archivos necesarios a la carpeta `dist/`
- Asegura que Netlify tenga todos los archivos de configuración

### 5. **`public/sw-config.js`**
- Configuración optimizada del service worker
- Maneja correctamente las rutas SPA
- Cache inteligente para diferentes tipos de contenido

## 🚀 **PASOS PARA DEPLOY**

### **Paso 1: Build Local**
```bash
npm run build:netlify
```

### **Paso 2: Verificar Archivos en `dist/`**
Asegúrate de que la carpeta `dist/` contenga:
- ✅ `index.html`
- ✅ `_redirects`
- ✅ `headers`
- ✅ `manifest.webmanifest`
- ✅ `sw.js`
- ✅ `assets/` (con JS y CSS)

### **Paso 3: Deploy en Netlify**
1. Ve a tu proyecto en Netlify
2. Arrastra la carpeta `dist/` al área de deploy
3. **IMPORTANTE**: Espera a que termine el deploy
4. Verifica que no haya errores

### **Paso 4: Configurar Dominio Personalizado**
1. En Netlify, ve a "Domain management"
2. Añade tu dominio: `agarch-ar.com`
3. Configura DNS según las instrucciones de Netlify

## 🔍 **VERIFICACIÓN POST-DEPLOY**

### **Test 1: Ruta Principal**
- ✅ `https://agarch-ar.com/` → Debe cargar la app

### **Test 2: Ruta Discover (CRÍTICA)**
- ✅ `https://agarch-ar.com/discover` → Debe cargar sin error 404

### **Test 3: Otras Rutas**
- ✅ `https://agarch-ar.com/chat`
- ✅ `https://agarch-ar.com/profile`
- ✅ `https://agarch-ar.com/settings`

### **Test 4: PWA**
- ✅ Instalar como app
- ✅ Navegación entre rutas sin recargar
- ✅ Funcionamiento offline básico

## 🚨 **SI SIGUE FALLANDO**

### **Opción 1: Clear Cache**
1. En Netlify, ve a "Deploys"
2. Haz un "Clear cache and deploy"

### **Opción 2: Forzar Rebuild**
1. En Netlify, ve a "Deploys"
2. Haz click en "Trigger deploy"
3. Selecciona "Clear cache and deploy"

### **Opción 3: Verificar Build Command**
Asegúrate de que en Netlify esté configurado:
```bash
Build command: npm run build:netlify
Publish directory: dist
```

## 📱 **TESTING EN MÓVIL**

### **Android (TCL)**
1. Abre Chrome
2. Ve a `https://agarch-ar.com`
3. Instala como PWA
4. Testea navegación entre rutas

### **iOS**
1. Abre Safari
2. Ve a `https://agarch-ar.com`
3. Añade a pantalla de inicio
4. Testea navegación

## 🔧 **CONFIGURACIÓN ADICIONAL**

### **Variables de Entorno en Netlify**
Si tu app necesita variables de entorno:
1. Ve a "Site settings" → "Environment variables"
2. Añade las variables necesarias
3. Re-deploy

### **Headers Personalizados**
Si necesitas headers específicos:
1. Edita `public/headers`
2. Re-deploy

## 📞 **SOPORTE**

Si después de seguir estos pasos sigue fallando:
1. Revisa la consola del navegador
2. Verifica los logs de Netlify
3. Comprueba que todos los archivos estén en `dist/`

---

**🎯 OBJETIVO**: Que `/discover` y todas las rutas funcionen correctamente sin errores 404.

**⏰ TIEMPO ESTIMADO**: 15-30 minutos para deploy completo.



