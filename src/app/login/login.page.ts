import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/dbtask';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {

  credentials = { email: '', password: '' };

  constructor(
    private router: Router,
    private dbService: DatabaseService,
    private toastController: ToastController
  ) { }

  async login() {
    if (!this.credentials.email || !this.credentials.password) {
      this.presentToast('Ingresa tus datos', 'warning');
      return;
    }

    const valido = await this.dbService.loginUser(this.credentials.email, this.credentials.password);

    if (valido) {
      // Guardamos el estado de login en localStorage
      localStorage.setItem('ingresado', 'true');
      this.presentToast('¡Bienvenido!', 'success');
      this.router.navigate(['/home']);
      this.credentials = { email: '', password: '' };
    } else {
      this.presentToast('Usuario o contraseña incorrectos', 'danger');
    }
  }

  irInvitado() { 
    // Accede como invitado sin login
    this.router.navigate(['/home']);
  }

  irCrearCuenta() { 
    this.router.navigate(['/register']); 
  }

  async presentToast(msg: string, color: string) {
    const toast = await this.toastController.create({ message: msg, duration: 2000, color: color });
    toast.present();
  }
}
