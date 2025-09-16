# 🔥 CONFIGURACIÓN FIREBASE PARA CHAT

## 📋 **PASOS PARA CONFIGURAR FIREBASE**

### **1. Variables de Entorno en Netlify**
Verificar que estas variables estén configuradas en Netlify:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### **2. Reglas de Firestore**
Ir a Firebase Console → Firestore → Rules y pegar:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuarios: pueden leerse (si estás logueado) y solo el dueño puede escribirse.
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }

    // Conversaciones: solo miembros pueden ver/crear/borrar
    match /conversations/{conversationId} {
      allow read, delete: if request.auth != null
        && request.auth.uid in resource.data.members;

      allow create: if request.auth != null
        && request.auth.uid in request.resource.data.members;

      // Mensajes: solo miembros pueden leer/crear; solo autor puede editar/borrar
      match /messages/{messageId} {
        function isMember() {
          return request.auth != null &&
                 request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.members;
        }
        allow read: if isMember();
        allow create: if isMember() && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if isMember() && request.auth.uid == resource.data.authorId;
      }
    }
  }
}
```

### **3. Reglas de Storage**
Ir a Firebase Console → Storage → Rules y pegar:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{uid}/{conversationId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### **4. Configuración de Autenticación**
En Firebase Console → Authentication → Sign-in method:
- ✅ Habilitar "Email/Password"
- ✅ En "Authorized domains" agregar:
  - `agarch-ar.com`
  - `localhost`

### **5. Estructura de Datos**

#### **Usuarios (`/users/{uid}`)**
```javascript
{
  alias: "string",
  avatarUrl: "string", 
  tier: "basic" | "vip",
  // ... otros campos del perfil
}
```

#### **Conversaciones (`/conversations/{id}`)**
```javascript
{
  members: ["uidA", "uidB"],
  lastMessage: "string",
  lastSenderId: "uid",
  updatedAt: timestamp
}
```

#### **Mensajes (`/conversations/{id}/messages/{id}`)**
```javascript
{
  authorId: "uid",
  text: "string",
  media: [{
    type: "image" | "video" | "audio",
    url: "string",
    durationSec?: number
  }],
  createdAt: timestamp,
  type: "text" | "media"
}
```

### **6. Límites por Plan**

#### **Plan Básico:**
- Texto: 100 caracteres
- Fotos: 1 por mensaje
- Videos: 1 por mensaje (15s máximo)
- Audio: 60 segundos

#### **Plan VIP:**
- Texto: 5000 caracteres
- Fotos: 3 por mensaje
- Videos: 2 por mensaje (15s máximo)
- Audio: 180 segundos

### **7. Rutas de Chat**
- `/chats` - Lista de conversaciones
- `/chat/:id` - Vista de chat específico

### **8. Funcionalidades Implementadas**
✅ Lista de chats estilo WhatsApp
✅ Envío de mensajes de texto
✅ Subida de fotos desde galería/cámara
✅ Subida de videos (15s máximo)
✅ Grabación de audio con límites por plan
✅ Interfaz responsive y moderna
✅ Seguridad con reglas de Firestore/Storage
✅ Sin rastros de Supabase

## 🚀 **LISTO PARA DEPLOY**
El código está listo y el build es exitoso. Solo falta configurar Firebase y hacer el deploy manual en Netlify.
