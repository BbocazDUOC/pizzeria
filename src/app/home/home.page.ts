import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; 
import { Router, RouterModule } from '@angular/router';
// 🛑 IMPORTACIÓN CORREGIDA
import { IonicModule } from '@ionic/angular'; 
import { addIcons } from 'ionicons';
import {
  fastFoodOutline,
  receiptOutline,
  personOutline,
} from 'ionicons/icons';


addIcons({
  'fast-food-outline': fastFoodOutline,
  'receipt-outline': receiptOutline,
  'person-outline': personOutline
});

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  // 🛑 SOLUCIÓN: Usar el módulo principal (IonicModule)
  // ya que los componentes individuales no son Standalone en tu versión
  imports: [
    IonicModule, // Importa todos los componentes de Ionic (IonPage, IonTabBar, etc.)
    RouterModule // Necesario para que <ion-router-outlet> funcione
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage {

  constructor(private router: Router) {}

  goMenu() {
    this.router.navigate(['/home/menu']);
  }

  goPedidos() {
    this.router.navigate(['/home/pedidos']);
  }

  goCuenta() {
    this.router.navigate(['/home/cuenta']);
  }
}