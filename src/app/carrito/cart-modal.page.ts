import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos IonButton e IonIcon si se usan en el HTML, pero IonicModule ya los provee.
import { IonicModule, ModalController } from '@ionic/angular'; 
import { Router } from '@angular/router'; // 🛑 Aseguramos la importación del Router
import { DatabaseService } from '../services/dbtask';
import { addOutline, removeOutline, trashOutline } from 'ionicons/icons';
// 🛑 Importamos RouterModule para que el router funcione en el componente Standalone
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-cart-modal',
  templateUrl: './cart-modal.page.html',
  styleUrls: ['./cart-modal.page.scss'],
  standalone: true,
  // 🛑 AGREGAMOS RouterModule para que el Router sea reconocido por el componente Standalone
  imports: [IonicModule, CommonModule, RouterModule]
})
export class CartModalPage implements OnInit {

  // 🛑 ELIMINAMOS la declaración incorrecta del router aquí: private router: Router,
  
  carrito: any[] = [];
  iconAdd = addOutline;
  iconRemove = removeOutline;
  iconTrash = trashOutline;
  

  // 🛑 CORRECCIÓN CLAVE: Inyectamos el Router en el constructor
  constructor(
    private modalCtrl: ModalController, 
    private dbService: DatabaseService,
    private router: Router // 🛑 ¡INYECCIÓN CORRECTA!
  ) {}

  ngOnInit() {
    this.cargarCarrito();
  }

  async cargarCarrito() {
    this.carrito = await this.dbService.obtenerCarrito();
  }

  // ---------------- Cambiar cantidad ----------------
  aumentarCantidad(producto: any) {
    producto.cantidad += 1;
    this.dbService.guardarCarrito(this.carrito);
  }

  disminuirCantidad(producto: any) {
    if(producto.cantidad > 1) {
      producto.cantidad -= 1;
      this.dbService.guardarCarrito(this.carrito);
    } else {
      this.eliminarProducto(producto);
    }
  }

  // ---------------- Eliminar producto ----------------
  eliminarProducto(producto: any) {
    this.carrito = this.carrito.filter(p => p.id !== producto.id);
    this.dbService.guardarCarrito(this.carrito);
  }

  // ---------------- Vaciar carrito ----------------
  vaciarCarrito() {
    this.carrito = [];
    this.dbService.guardarCarrito(this.carrito);
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  // ---------------- Calcular total ----------------
  totalCarrito(): number {
    return this.carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  // 🛑 FUNCIÓN SOLICITADA PARA IR A PAGO
  async irAlPago() {
    // 1. Opcional: Cerrar el modal antes de navegar
    await this.modalCtrl.dismiss();
    
    // 2. Navegar a la ruta de pago (asumiendo que tu ruta es '/pago')
    // ⚠️ Si la ruta de pago es anidada (ej: dentro de las pestañas), usa la ruta correcta (ej: '/home/pago')
    this.router.navigate(['/pago']); 
  }
  
  // irCrearCuenta (Dejamos esta función por si la necesitas, aunque la de Pago es la solicitada)
  irCrearCuenta() {
    this.router.navigate(['/register']);
  }
}