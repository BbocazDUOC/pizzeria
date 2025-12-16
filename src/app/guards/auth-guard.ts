import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/dbtask';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const toastCtrl = inject(ToastController);
  const db = inject(DatabaseService);

  const session = await db.getSession(); // 👈 LO CORRECTO

  if (session) {
    return true; // deja pasar
  }

  const toast = await toastCtrl.create({
    message: 'Debes iniciar sesión para acceder',
    duration: 2000,
    color: 'danger'
  });
  toast.present();

  router.navigate(['/login']);
  return false;
};
