import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// --- IMPORTACIONES PARA LA BD ---
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

// 🔹 HTTP CLIENT
import { HttpClientModule } from '@angular/common/http';

import { environment } from './environments/environment';

import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    provideIonicAngular(),
    provideRouter(routes),

    // 🔹 SQLite
    SQLite,

    // 🔹 Ionic Storage
    importProvidersFrom(
      IonicStorageModule.forRoot({
        name: '__pizzadb',
        driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
      }),
      HttpClientModule // ✅ AÑADIDO AQUÍ
    ),

    // 🌀 LOTTIE
    provideLottieOptions({
      player: () => player
    })
  ],
});
