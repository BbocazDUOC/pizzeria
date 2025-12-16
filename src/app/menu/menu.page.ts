// menu.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ApiService } from '../services/api';
import { CartModalPage } from '../carrito/cart-modal.page';
import { cartOutline } from 'ionicons/icons';
import { DatabaseService } from '../services/dbtask'; // <-- aquí importa tu servicio

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuPage implements OnInit {

  categorias: any[] = [];
  activeCategory: any = null;
  productos: any[] = [];
  carritoIcon = cartOutline;

  constructor(
    private api: ApiService, 
    private modalCtrl: ModalController,
    private dbService: DatabaseService // <-- inyectamos el servicio
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.api.listarCategorias().subscribe((res: any[]) => {
      this.categorias = res;
      if (res.length > 0) this.selectCategory(res[0]);
    });
  }

  selectCategory(cat: any) {
    this.activeCategory = cat;
    this.api.obtenerCategoria(cat.id).subscribe((res: any) => {
      this.productos = res.productos;
    });
  }

  async abrirCarrito() {
    const modal = await this.modalCtrl.create({
      component: CartModalPage,
      cssClass: 'cart-modal',
      breakpoints: [0, 0.9],        // 0 = cerrado, 0.9 = 90% de pantalla
      initialBreakpoint: 0.9,      // empieza a 90%
      handle: true                  // agrega la barra de arrastre
    });

    await modal.present();
  }

  // ---------------- Agregar producto al carrito ----------------
  agregarAlCarrito(producto: any) {
    this.dbService.obtenerCarrito().then((carrito: any[]) => {
      const index = carrito.findIndex(p => p.id === producto.id);
      if(index > -1) {
        carrito[index].cantidad += 1;
      } else {
        carrito.push({ ...producto, cantidad: 1 });
      }
      this.dbService.guardarCarrito(carrito);
      console.log('Producto agregado al carrito:', producto.nombre);
    });
  }
}
