# 🗺️ GUÍA DE INTEGRACIÓN GOOGLE MAPS

## 📋 ESTADO ACTUAL:
- ❌ Google Maps API no está integrada
- ✅ Geolocalización del navegador funcionando
- ✅ Campos de ubicación (latitud, longitud) en base de datos

## 🔧 PASOS PARA INTEGRAR GOOGLE MAPS:

### 1. **Obtener API Key de Google Maps:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear/seleccionar proyecto
3. Habilitar APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (opcional)
4. Crear credenciales (API Key)
5. Configurar restricciones de dominio

### 2. **Agregar Variables de Entorno:**
```bash
# En .env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 3. **Instalar Dependencias:**
```bash
npm install @googlemaps/js-api-loader
```

### 4. **Componente de Mapa (Opcional):**
```jsx
// src/components/GoogleMap.jsx
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapComponent = ({ lat, lng, onLocationSelect }) => {
  const mapStyles = {
    height: "400px",
    width: "100%"
  };
  
  const defaultCenter = {
    lat: lat || -34.6118, // Buenos Aires por defecto
    lng: lng || -58.3960
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={13}
        center={defaultCenter}
        onClick={(e) => onLocationSelect(e.latLng.lat(), e.latLng.lng())}
      >
        <Marker position={defaultCenter} />
      </GoogleMap>
    </LoadScript>
  );
};
```

### 5. **Geocodificación Inversa (Opcional):**
```jsx
// Convertir coordenadas a direcciones legibles
const reverseGeocode = async (lat, lng) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
  );
  const data = await response.json();
  return data.results[0]?.formatted_address;
};
```

## 🎯 FUNCIONALIDADES ACTUALES SIN GOOGLE MAPS:

### ✅ **Lo que YA funciona:**
1. **Geolocalización automática** - `useAutoLocationUpdate.js`
2. **Configuración manual** - `LocationSettings.jsx`
3. **Búsqueda por distancia** - Función `get_nearby_profiles`
4. **Almacenamiento de coordenadas** - Campos `latitud`, `longitud`

### 🔄 **Alternativas sin Google Maps:**
1. **OpenStreetMap** - Gratis, sin límites
2. **Mapbox** - Más económico que Google
3. **Solo coordenadas** - Funciona perfecto para búsquedas

## 💰 COSTOS GOOGLE MAPS:
- **Maps JavaScript API**: $7 por 1000 cargas
- **Geocoding API**: $5 por 1000 solicitudes
- **Places API**: $17 por 1000 solicitudes
- **Crédito gratuito**: $200/mes

## 📊 RECOMENDACIÓN:

### **Para MVP/Pruebas:**
- ✅ Mantener sistema actual (solo geolocalización)
- ✅ Funciona perfecto para búsquedas por distancia
- ✅ Sin costos adicionales

### **Para Producción Avanzada:**
- 🔄 Considerar Google Maps si necesitas:
  - Visualización de mapas interactivos
  - Búsqueda de lugares
  - Direcciones detalladas
  - Autocompletado de direcciones

## 🚀 PRIORIDAD ACTUAL:
1. **ALTA**: Ejecutar `fix-search-system-complete.sql`
2. **MEDIA**: Probar búsquedas por distancia
3. **BAJA**: Integrar Google Maps (opcional)

El sistema actual es completamente funcional sin Google Maps API.
