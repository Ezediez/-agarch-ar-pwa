const fs = require('fs');
const path = require('path');

// Función optimizada para copiar archivos
function copyFile(source, destination) {
  try {
    const sourcePath = path.join(__dirname, '..', source);
    const destPath = path.join(__dirname, '..', 'dist', destination);
    
    if (fs.existsSync(sourcePath)) {
      // Verificar si el archivo ya existe y es idéntico
      if (fs.existsSync(destPath)) {
        const sourceStats = fs.statSync(sourcePath);
        const destStats = fs.statSync(destPath);
        
        // Si son idénticos, no copiar
        if (sourceStats.mtime.getTime() === destStats.mtime.getTime() && 
            sourceStats.size === destStats.size) {
          return; // Skip copying identical files
        }
      }
      
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copiado: ${source} → ${destination}`);
    } else {
      console.log(`⚠️ Archivo no encontrado: ${source}`);
    }
  } catch (error) {
    console.error(`❌ Error copiando ${source}:`, error.message);
  }
}

// Función para crear directorio si no existe
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

console.log('🚀 Iniciando post-build script optimizado...');

// Crear directorio dist si no existe
const distPath = path.join(__dirname, '..', 'dist');
ensureDir(distPath);

// Archivos esenciales para Netlify (solo los necesarios)
const filesToCopy = [
  { source: 'public/_redirects', dest: '_redirects' },
  { source: 'public/headers', dest: 'headers' },
  { source: 'public/manifest.webmanifest', dest: 'manifest.webmanifest' },
  { source: 'public/pwa-192x192.png', dest: 'pwa-192x192.png' },
  { source: 'public/pwa-512x512.png', dest: 'pwa-512x512.png' }
];

console.log('📁 Copiando archivos esenciales...');

// Copiar archivos en paralelo para mejor performance
const copyPromises = filesToCopy.map(({ source, dest }) => {
  return new Promise((resolve) => {
    copyFile(source, dest);
    resolve();
  });
});

Promise.all(copyPromises).then(() => {
  console.log('✅ Post-build script completado exitosamente!');
  console.log('🎯 Archivos listos para deploy en Netlify');
  console.log('⚡ Build optimizado para reducir minutos de compilación');
});

