import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNote, IonList, IonLabel, IonItem, IonListHeader } from '@ionic/angular/standalone';

@Component({
  selector: 'app-bebidas',
  templateUrl: './bebidas.page.html',
  styleUrls: ['./bebidas.page.scss'],
  standalone: true,
  imports: [IonListHeader, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonLabel, IonItem, IonNote]
})
export class BebidasPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
