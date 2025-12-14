import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/dbtask';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegisterPage {

  registerData = { email: '', password: '' };

  constructor(
    private dbService: DatabaseService,
    private router: Router,
    private toastController: ToastController
  ) { }

  async registrar() {
    if (!this.registerData.email || !this.registerData.password) {
      this.presentToast('Completa todos los campos', 'warning');
      return;
    }

    const exito = await this.dbService.registerUser(this.registerData.email, this.registerData.password);

    if (exito) {
      this.presentToast('Cuenta creada exitosamente', 'success');
      this.router.navigate(['/home']);
      this.registerData = { email: '', password: '' };
    } else {
      this.presentToast('El correo ya existe o hubo un error', 'danger');
    }
  }

  volverLogin() { this.router.navigate(['/login']); }

  async presentToast(msg: string, color: string) {
    const toast = await this.toastController.create({ message: msg, duration: 2000, color: color });
    toast.present();
  }
}