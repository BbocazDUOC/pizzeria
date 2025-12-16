import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { LottieComponent } from 'ngx-lottie';
import { DatabaseService } from 'src/app/services/dbtask';

@Component({
  selector: 'app-error404',
  templateUrl: './error404.page.html',
  styleUrls: ['./error404.page.scss'],
  standalone: true,
  imports: [IonicModule, LottieComponent]
})
export class Error404Page {

  constructor(
    private db: DatabaseService,
    private router: Router
  ) {}

  async volverInicio() {
    const session = await this.db.getSession();

    if (session) {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
