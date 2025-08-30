import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para copiar archivos
function copyFile(source, destination) {
  try {
    const sourcePath = path.join(__dirname, '..', source);
    const destPath = path.join(__dirname, '..', 'dist', destination);
    
    if (fs.existsSync(sourcePath)) {
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

console.log('🚀 Iniciando post-build script...');

// Crear directorio dist si no existe
const distPath = path.join(__dirname, '..', 'dist');
ensureDir(distPath);

// Copiar archivos de configuración para Netlify
const filesToCopy = [
  { source: 'public/_redirects', dest: '_redirects' },
  { source: 'public/headers', dest: 'headers' },
  { source: 'public/manifest.webmanifest', dest: 'manifest.webmanifest' },
  { source: 'public/pwa-192x192.png', dest: 'pwa-192x192.png' },
  { source: 'public/pwa-512x512.png', dest: 'pwa-512x512.png' },
  { source: 'public/sw-config.js', dest: 'sw-config.js' },
  { source: 'netlify.toml', dest: 'netlify.toml' }
];

console.log('📁 Copiando archivos de configuración...');

filesToCopy.forEach(({ source, dest }) => {
  copyFile(source, dest);
});

console.log('✅ Post-build script completado exitosamente!');
console.log('🎯 Archivos listos para deploy en Netlify');

