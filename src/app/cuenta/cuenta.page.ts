import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ActionSheetController, Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/dbtask'; 
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CuentaPage implements OnInit {

  usuario: any = {
    usuario: '',
    nombre: '',
    apellido: '',
    email: '',
    edad: 0,
    genero: '',
    password: '',
    foto: '' // Foto en base64
  };

  constructor(
    private dbService: DatabaseService,
    private toastController: ToastController,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private platform: Platform
  ) {}

  async ngOnInit() {
    const emailSesion = await this.dbService.getSession();
    if (emailSesion) {
      const datosUsuario = await this.dbService.getUsuario(emailSesion);
      if (datosUsuario) this.usuario = datosUsuario;
      else this.presentToast('Error al cargar datos del usuario', 'danger');
    }
  }

  // --- Acción para cambiar foto ---
  async cambiarFoto() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Cambiar foto',
      buttons: [
        {
          text: 'Elegir foto',
          icon: 'image-outline',
          handler: () => this.seleccionarFoto('elegir')
        },
        {
          text: 'Sacar foto',
          icon: 'camera-outline',
          handler: () => this.seleccionarFoto('sacar')
        },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  // --- Seleccionar o sacar foto según opción ---
  async seleccionarFoto(opcion: 'elegir' | 'sacar') {
    try {
      const source = opcion === 'sacar' 
        ? CameraSource.Camera 
        : CameraSource.Photos;

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source
      });

      if (image && image.dataUrl) {
        this.usuario.foto = image.dataUrl;
        await this.dbService.actualizarUsuario(this.usuario);
        this.presentToast('Foto actualizada', 'success');
      }
    } catch (err) {
      this.presentToast('Error al seleccionar foto', 'danger');
    }
  }

  async guardarCambios() {
    if (!this.usuario.nombre || !this.usuario.apellido) {
      this.presentToast('Nombre y Apellido son obligatorios', 'warning');
      return;
    }

    const success = await this.dbService.actualizarUsuario(this.usuario);
    if (success) this.presentToast('Perfil actualizado correctamente', 'success');
    else this.presentToast('Error al guardar cambios', 'danger');
  }

  async logout() {
    await this.dbService.closeSession();
    this.router.navigate(['/login']);
  }

  async presentToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}
