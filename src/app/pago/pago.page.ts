import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, registerLocaleData } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 

// Importaciones de Ionic
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonFooter, 
  IonButton,
  IonBackButton, 
  IonButtons,
  ToastController,
  IonText 
} from '@ionic/angular/standalone'; 

// Servicios de Datos y API
import { DatabaseService } from '../services/dbtask'; 
import { ApiService } from '../services/api'; 

// Geolocalización y Mapa
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';

// LOTTIE IMPORTS
import { LottieComponent } from 'ngx-lottie'; // Usamos el componente directo

// REGISTRO DE LOCALIZACIÓN (CLP)
import localeCl from '@angular/common/locales/es-CL'; 
registerLocaleData(localeCl, 'es-CL'); 

// CONFIGURACIÓN DE ÍCONOS DE LEAFLET
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/img/burger.webp',
  iconUrl: 'assets/img/burger.webp',
  shadowUrl: 'assets/img/burger.webp',
});

@Component({
  selector: 'app-pago',
  templateUrl: './pago.page.html',
  styleUrls: ['./pago.page.scss'], 
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonFooter, IonButton,
    IonBackButton, IonButtons, CurrencyPipe,
    LottieComponent, // Componente Lottie
    IonText 
  ]
})
export class PagoPage implements OnInit, AfterViewInit, OnDestroy {
  
  carrito: any[] = [];
  ubicacion: { lat: number, lng: number, timestamp: number } | null = null;
  ubicacionTexto: string = 'Ubicación no capturada. Haz clic en el mapa o usa GPS.'; 
  
  private map: L.Map | undefined; 
  private marker: L.Marker | undefined;
  
  // VARIABLE CLAVE: Controla tanto el botón como el overlay Lottie
  isProcessing: boolean = false; 
  
  constructor(
    private dbService: DatabaseService, 
    private toastCtrl: ToastController,
    private router: Router,
    private apiService: ApiService
  ) { }

  // ===============================================
  // CICLO DE VIDA
  // ===============================================

  async ngOnInit() {
    await this.cargarResumenCarrito();
  }

  ngAfterViewInit() {
    setTimeout(() => {
        this.iniciarMapa();
    }, 500);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
  
  // ===============================================
  // LÓGICA DEL MAPA Y GEOLOCALIZACIÓN
  // ===============================================

  iniciarMapa() {
    const mapElement = document.getElementById('mapaId');
    if (mapElement) {
        const defaultLat = -33.4489; 
        const defaultLng = -70.6693;
        const defaultZoom = 13;

        this.map = L.map('mapaId').setView([defaultLat, defaultLng], defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);
        
        this.map.on('click', (e: L.LeafletMouseEvent) => {
            this.establecerMarcador(e.latlng.lat, e.latlng.lng);
            this.mostrarToast('Ubicación seleccionada manualmente.', 'tertiary');
        });
    }
  }

  establecerMarcador(lat: number, lng: number) {
      if (this.marker) {
          this.marker.setLatLng([lat, lng]);
      } else {
          this.marker = L.marker([lat, lng]).addTo(this.map!);
      }
      this.ubicacion = { lat, lng, timestamp: Date.now() };
      this.ubicacionTexto = `Latitud: ${lat.toFixed(6)}, Longitud: ${lng.toFixed(6)}`;
  }
  
  async obtenerUbicacion() {
    try {
      const position = await Geolocation.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.establecerMarcador(lat, lng);
      this.map!.setView([lat, lng], 16);
      
      this.mostrarToast('Ubicación GPS obtenida con éxito!', 'success');

    } catch (error) {
      this.ubicacionTexto = 'Error al obtener la ubicación. Revisa permisos.';
      this.mostrarToast('Error al obtener la ubicación. Revisa permisos.', 'danger');
    }
  }
  
  // ===============================================
  // CARRITO Y PROCESAMIENTO DE PAGO
  // ===============================================

  async cargarResumenCarrito() {
    this.carrito = await this.dbService.obtenerCarrito();
  }
  
  totalCarrito(): number {
    return this.carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  async mostrarToast(mensaje: string, color: string, duration = 3000) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duration,
      color: color
    });
    await toast.present();
  }

  /**
   * Confirma y procesa el pago, enviando el pedido a la API.
   */
  async confirmarPago() {
    if (this.isProcessing || this.carrito.length === 0 || !this.ubicacion) {
        this.mostrarToast('Revisa el pedido y la ubicación antes de pagar.', 'warning');
        return;
    }

    this.isProcessing = true; // ACTIVA EL OVERLAY LOTTIE
    
    try {
        const emailSesion = await this.dbService.getSession();
        
        if (!emailSesion) {
            this.mostrarToast('Error: No hay sesión activa. Por favor, inicia sesión.', 'danger');
            this.isProcessing = false;
            return;
        }

        const usuarioDB = await this.dbService.getUsuario(emailSesion); 

        if (!usuarioDB || !usuarioDB.usuario) {
            this.mostrarToast('Error: No se pudo encontrar el nombre de usuario asociado al email.', 'danger');
            this.isProcessing = false;
            return;
        }

        const nombreCliente = usuarioDB.usuario; 
        
        const productosIds: number[] = [];
        this.carrito.forEach(p => {
            for (let i = 0; i < p.cantidad; i++) {
                productosIds.push(p.id); 
            }
        });

        const pedidoPayload = {
            nombre_cliente: nombreCliente,
            productos_ids: productosIds,
        };
        
        console.log('Enviando Payload a API:', pedidoPayload); 

        this.apiService.crearPedido(pedidoPayload).subscribe({
            next: async (response) => {
                // Éxito:
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simula un tiempo de animación/procesamiento exitoso
                
                await this.dbService.vaciarCarrito();
                this.carrito = [];
                this.mostrarToast('¡Pedido realizado con éxito! Redirigiendo...', 'success');
                this.isProcessing = false; 
                this.router.navigate(['/home/pedidos']); 
            },
            error: (err) => {
                let mensajeError = 'Error al crear el pedido. Verifique la conexión o el usuario.';
                if (err.status === 422) {
                    mensajeError = 'Error 422: Verifique que el usuario exista y los IDs de productos sean correctos.';
                }
                
                this.mostrarToast(mensajeError, 'danger', 7000); 
                this.isProcessing = false; 
            },
            complete: () => {
                // Si la respuesta es exitosa pero pasa por complete antes de la navegación, ya se ha seteado a false.
            }
        });

    } catch (error) {
        console.error('Error general durante el proceso de pago:', error);
        this.mostrarToast('Ocurrió un error inesperado. Intente nuevamente.', 'danger');
        this.isProcessing = false; 
    }
  }
}