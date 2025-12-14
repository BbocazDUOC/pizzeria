import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  fastFoodOutline, 
  receiptOutline, 
  personOutline, 
  pizzaOutline,       // icono de pizza
  wineOutline         // ejemplo de bebida, puedes cambiarlo
} from 'ionicons/icons';
import { RouterModule } from '@angular/router'

// Registramos los iconos para poder usarlos en el template
addIcons({
  'fast-food-outline': fastFoodOutline,
  'receipt-outline': receiptOutline,
  'person-outline': personOutline,
  'pizza-outline': pizzaOutline,
  'wine-outline': wineOutline
});

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule],
})
export class HomePage {
  constructor() {}
}
