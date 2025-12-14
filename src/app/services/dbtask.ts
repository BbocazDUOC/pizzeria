import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private databaseObj: SQLiteObject | null = null;
  private isWeb: boolean = false;
  
  // Observable para saber si la BD está lista
  public dbState = new BehaviorSubject<boolean>(false);

  constructor(
    private plt: Platform, 
    private sqlite: SQLite,
    private storage: Storage 
  ) {
    this.init();
  }

  async init() {
    // 1. Inicializar el Storage (para Web)
    await this.storage.create();

    // 2. Detectar plataforma
    this.plt.ready().then(() => {
      if (this.plt.is('capacitor') || this.plt.is('cordova')) {
        // Estamos en Celular -> Usar SQLite
        this.isWeb = false;
        this.createNativeDatabase();
      } else {
        // Estamos en Web (Chrome/Serve) -> Usar Storage
        this.isWeb = true;
        this.seedWebDatabase(); // Crear usuario de prueba en Web
        this.dbState.next(true);
      }
    });
  }

  // ==========================================
  // LÓGICA NATIVA (CELULAR - SQLITE)
  // ==========================================
  private createNativeDatabase() {
    this.sqlite.create({
      name: 'pizzaproject.db',
      location: 'default'
    }).then((db: SQLiteObject) => {
      this.databaseObj = db;
      this.createNativeTables();
    }).catch(e => console.error('Error creando BD Nativa', e));
  }

  private async createNativeTables() {
    try {
      await this.databaseObj?.executeSql(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password TEXT
        )
      `, []);
      
      // Crear usuario prueba si no existe
      const res = await this.databaseObj?.executeSql('SELECT * FROM users', []);
      if (res.rows.length === 0) {
        await this.databaseObj?.executeSql(
          'INSERT INTO users (email, password) VALUES (?, ?)', 
          ['ejemplo@gmail.com', '1234']
        );
      }
      
      this.dbState.next(true);
    } catch (e) {
      console.error('Error tablas nativas', e);
    }
  }

  // ==========================================
  // LÓGICA WEB (NAVEGADOR - IONIC STORAGE)
  // ==========================================
  private async seedWebDatabase() {
    const users = await this.storage.get('users');
    if (!users) {
      // Si no hay usuarios en la web, creamos el de prueba
      const initialUsers = [{ email: 'ejemplo@gmail.com', password: '1234' }];
      await this.storage.set('users', initialUsers);
      console.log('Web Database inicializada con usuario de prueba.');
    }
  }

  // ==========================================
  // MÉTODOS PÚBLICOS (HÍBRIDOS)
  // ==========================================

  async registerUser(email: string, pass: string): Promise<boolean> {
    if (this.isWeb) {
      // --- VERSIÓN WEB ---
      const users = (await this.storage.get('users')) || [];
      // Verificar si ya existe
      const existe = users.find((u: any) => u.email === email);
      if (existe) return false;

      // Guardar nuevo
      users.push({ email, password: pass });
      await this.storage.set('users', users);
      return true;

    } else {
      // --- VERSIÓN MÓVIL (SQL) ---
      if (!this.databaseObj) return false;
      try {
        await this.databaseObj.executeSql(
          'INSERT INTO users (email, password) VALUES (?, ?)', 
          [email, pass]
        );
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  async loginUser(email: string, pass: string): Promise<boolean> {
    if (this.isWeb) {
      // --- VERSIÓN WEB ---
      const users = (await this.storage.get('users')) || [];
      const user = users.find((u: any) => u.email === email && u.password === pass);
      return !!user; // Devuelve true si lo encontró

    } else {
      // --- VERSIÓN MÓVIL (SQL) ---
      if (!this.databaseObj) return false;
      try {
        const res = await this.databaseObj.executeSql(
          'SELECT * FROM users WHERE email = ? AND password = ?', 
          [email, pass]
        );
        return res.rows.length > 0;
      } catch (e) {
        return false;
      }
    }
  }
}