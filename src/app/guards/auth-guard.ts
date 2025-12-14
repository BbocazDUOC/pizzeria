import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const estaLogueado = localStorage.getItem('ingresado');  // Leemos el estado de login

  if (estaLogueado === 'true') {
    return true;  // Deja pasar si el usuario está logeado
  } else {
    // Si no está logeado, muestra el toast y redirige al login
    const toast = await toastCtrl.create({
      message: 'Debes iniciar sesión para acceder a Pedidos',
      duration: 2000,
      color: 'danger'
    });
    toast.present();

    router.navigate(['/login']);
    return false;
  }
};
