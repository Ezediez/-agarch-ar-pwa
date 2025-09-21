#!/usr/bin/env node

/**
 * Script para forzar un nuevo deploy en Netlify con cache limpio
 * Este script actualiza el timestamp en el package.json para forzar un nuevo build
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Forzando nuevo deploy con cache limpio...');

// Leer package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Actualizar timestamp
const timestamp = new Date().toISOString();
packageJson.deployTimestamp = timestamp;
packageJson.version = `${packageJson.version}-${Date.now()}`;

// Escribir package.json actualizado
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('✅ package.json actualizado con timestamp:', timestamp);
console.log('✅ Versión actualizada a:', packageJson.version);
console.log('');
console.log('🚀 Próximos pasos:');
console.log('1. git add package.json');
console.log('2. git commit -m "Force deploy: clear cache"');
console.log('3. git push origin main');
console.log('');
console.log('📝 O alternativamente en Netlify Dashboard:');
console.log('1. Ve a tu sitio en Netlify');
console.log('2. Deploys → "Trigger deploy"');
console.log('3. Selecciona "Clear cache and deploy site"');
console.log('4. Espera 4-5 minutos');
console.log('');
console.log('🎯 Esto forzará un nuevo build y limpiará el cache');
