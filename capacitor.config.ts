import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'pizzeria',
  webDir: 'www',
  
  // 🛑 CORRECCIÓN AÑADIDA PARA SOLUCIONAR EL ERROR DE MIXED CONTENT
  server: {
    androidScheme: 'http', // Usa el esquema HTTP para evitar el bloqueo HTTPS
    cleartext: true        // Permite la comunicación no segura (HTTP)
  }
};

export default config;