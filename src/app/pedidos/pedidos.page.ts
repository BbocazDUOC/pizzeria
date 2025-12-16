import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonicModule, 
  ToastController,
  // 💡 CORRECCIÓN: Importamos la interfaz correcta para recarga en Ionic
  ViewWillEnter 
} from '@ionic/angular';

// Importación de Servicios
import { ApiService } from '../services/api'; // Asegúrate de que la ruta sea correcta
import { DatabaseService } from '../services/dbtask'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
// Implementamos la interfaz ViewWillEnter
export class PedidosPage implements OnInit, ViewWillEnter {
  
  // Lista donde se guardarán los pedidos recibidos de la API
  pedidos: any[] = [];
  
  // Campo que guardará el nombre de usuario (el identificador único)
  nombre_usuario: string = '';

  constructor(
    private api: ApiService,
    private db: DatabaseService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    // Se deja vacío. El código de carga va en ionViewWillEnter.
  }

  /**
   * MÉTODO CLAVE: Se ejecuta CADA VEZ que la página se hace visible
   * (al entrar por primera vez y al regresar de otra vista).
   */
  ionViewWillEnter() {
    this.cargarPedidos();
  }

  /**
   * Proceso principal para obtener los pedidos del usuario activo.
   */
  async cargarPedidos() {
    // 1️⃣ Sacamos la sesión activa (el email) del DatabaseService
    const email = await this.db.getSession();
    
    if (!email) {
      this.pedidos = [];
      this.mostrarToast('Debe iniciar sesión para ver sus pedidos.', 'warning');
      return;
    }

    // 2️⃣ Obtenemos los datos del usuario completo desde la DB usando el email
    const usuario = await this.db.getUsuario(email);
    
    if (!usuario || !usuario.usuario) {
      this.pedidos = [];
      this.mostrarToast('Error: No se pudo obtener el nombre de usuario de la sesión activa.', 'danger');
      return;
    }

    // 3️⃣ Asignamos el nombre de usuario (el campo 'usuario' que es único)
    this.nombre_usuario = usuario.usuario;

    // 4️⃣ Pedimos los pedidos a la API, usando el nombre de usuario único
    this.api.listarPedidosPorUsuario(this.nombre_usuario).subscribe({
      next: (res: any) => {
        
        // 5️⃣ Ordenar los pedidos del más nuevo al más viejo (DESC) por ID
        this.pedidos = res.sort((a: any, b: any) => {
          return b.id - a.id;
        });

        if (this.pedidos.length === 0) {
            this.mostrarToast('Aún no tienes pedidos registrados.', 'tertiary');
        }
      },
      error: async (err) => {
        console.error('Error cargando pedidos:', err);
        this.pedidos = [];
        this.mostrarToast('Error cargando pedidos. Intente más tarde.', 'danger');
      }
    });
  }
  
  /**
   * Función de utilidad para mostrar notificaciones.
   */
  async mostrarToast(mensaje: string, color: string, duration: number = 2000) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duration,
      color: color
    });
    await toast.present();
  }
}