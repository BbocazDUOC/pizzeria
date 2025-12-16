import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/dbtask'; 
import { ApiService } from 'src/app/services/api'; 
import { HttpErrorResponse } from '@angular/common/http'; 

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegisterPage implements OnInit {

  registerData = {
    usuario: '',
    nombre: '',
    apellido: '',
    email: '',
    edad: null as number | null,
    genero: '',
    password: '',
    repetirPassword: ''
  };

  constructor(
    private dbService: DatabaseService,
    private api: ApiService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Inicialización si es necesaria
  }

  async registrar() {
    const { usuario, nombre, apellido, email, edad, genero, password, repetirPassword } = this.registerData;

    // 1. Validaciones de formulario
    if (!usuario || !nombre || !apellido || !email || !edad || !genero || !password || !repetirPassword) {
      this.presentToast('Completa todos los campos', 'warning');
      return;
    }

    if (edad !== null && edad < 15) {
      this.presentToast('Debes ser mayor de 14 años para registrarte', 'warning');
      return;
    }

    if (password !== repetirPassword) {
      this.presentToast('Las contraseñas no coinciden', 'danger');
      return;
    }

    // 2. Preparar objeto para API (Asegúrate de incluir todos los campos necesarios para tu API)
    const payload = {
      nombre_usuario: usuario,
      nombre_real: nombre,
      lat: 0,
      lon: 0,
      // Si tu API requiere más campos (email, password), debes incluirlos aquí
    };

    // 3. Guardar localmente 
    const registroLocal = await this.dbService.registerUser(
      usuario, 
      nombre, 
      apellido, 
      email, 
      edad, 
      genero, 
      password
    );

    if (!registroLocal) {
      this.presentToast('El usuario ya existe localmente', 'danger');
      return;
    }

    // 4. Enviar a la API con manejo de errores a prueba de fallos
    this.api.crearUsuario(payload).subscribe({
      next: async (res) => {
        this.presentToast('Cuenta creada exitosamente. ¡Ingresa ahora!', 'success');
        this.router.navigate(['/login']);
        this.limpiarFormulario();
      },
      // 🛑 BLOQUE DE ERROR A PRUEBA DE FALLOS (Resuelve el [object Object])
      error: async (err: HttpErrorResponse) => {
        console.error('Error completo del API (objeto recibido):', err); 
        
        let mensajeError = 'Error de conexión o configuración. Servidor no disponible.';
        
        // 1. Si hay respuesta del servidor (status > 0)
        if (err && err.status !== 0) {
            
            // Intentamos acceder al cuerpo del error (err.error)
            if (err.error) {
                
                // Si err.error es un objeto y tiene una propiedad 'message' o 'error'
                if (typeof err.error === 'object' && (err.error.message || err.error.error)) {
                    mensajeError = err.error.message || err.error.error;
                } 
                
                // Si el error no es JSON limpio o es un objeto genérico, lo serializamos.
                // Esto es CRUCIAL para capturar contenido HTML o strings de error brutos.
                else {
                    try {
                        mensajeError = JSON.stringify(err.error);
                    } catch (e) {
                        mensajeError = String(err.error);
                    }
                }
            } 
            // Si el error no tiene cuerpo (ej. 404 Not Found)
            else {
                mensajeError = `Error HTTP ${err.status}: ${err.statusText}`;
            }
        } 
        // 2. Error de red o CORS (status = 0)
        else if (err.status === 0) {
            mensajeError = 'No se pudo conectar al servidor. Verifica la URL o tu red.';
        }

        // Si el mensaje sigue siendo ambiguo, damos una pista al desarrollador
        if (mensajeError === '{}' || mensajeError.includes('[object Object]')) {
             mensajeError = 'Error de formato: Revisa si la API devuelve JSON válido.';
        }

        // Mostrar al usuario el mensaje de error definitivo
        this.presentToast(`FALLO: ${mensajeError}`, 'danger');
      }
    });
  }

  limpiarFormulario() {
    this.registerData = {
      usuario: '',
      nombre: '',
      apellido: '',
      email: '',
      edad: null,
      genero: '',
      password: '',
      repetirPassword: ''
    };
  }

  async presentToast(msg: string, color: string) {
    const toast = await this.toastController.create({ message: msg, duration: 2500, color });
    toast.present();
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}