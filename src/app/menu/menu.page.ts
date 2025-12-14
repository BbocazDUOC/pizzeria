import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class MenuPage {
  activeCategory: string = 'pizzas';

  constructor(private router: Router, private route: ActivatedRoute) {}

  selectCategory(cat: string) {
    this.activeCategory = cat;
    this.router.navigate([cat], { relativeTo: this.route });
  }
}
