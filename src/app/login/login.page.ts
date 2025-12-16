import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/dbtask';
import { LottieComponent } from 'ngx-lottie';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    LottieComponent
  ]
})
export class LoginPage {

  credentials = {
    email: '',
    password: ''
  };

  loading = false;

  constructor(
    private db: DatabaseService,
    private router: Router,
    private toastController: ToastController
  ) {}

  login() {
    this.loading = true;

    this.db.dbState
      .pipe(take(1))
      .subscribe(async ready => {
        if (!ready) return;

        const ok = await this.db.loginUser(
          this.credentials.email,
          this.credentials.password
        );

        if (ok) {
          setTimeout(() => {
            this.router.navigateByUrl('/home', { replaceUrl: true });
          }, 1000);
        } else {
          this.loading = false;
          this.presentToast('Correo o contraseña incorrectos', 'danger');
        }
      });
  }

  irInvitado() {
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  irCrearCuenta() {
    this.router.navigate(['/register']);
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }
}
