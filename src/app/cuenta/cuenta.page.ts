import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CuentaPage {

  constructor(
    private router: Router,
    private toastController: ToastController
  ) { }

  async logout() {
    // Limpiar el estado de login
    localStorage.removeItem('ingresado');

    // Mostrar mensaje
    const toast = await this.toastController.create({
      message: 'Has cerrado sesión',
      duration: 2000,
      color: 'success'
    });
    toast.present();

    // Redirigir al login
    this.router.navigate(['/login']);
  }
}
