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
    await this.storage.create();

    this.plt.ready().then(() => {
      if (this.plt.is('capacitor') || this.plt.is('cordova')) {
        this.isWeb = false;
        this.createNativeDatabase();
      } else {
        this.isWeb = true;
        this.seedWebDatabase();
        this.dbState.next(true);
      }
    });
  }

  // ------------------- SESIÓN (NUEVO) -------------------
  // Guardamos el email del usuario logueado actualmente
  async createSession(email: string) {
    await this.storage.set('session_active', email);
  }

  async getSession(): Promise<string | null> {
    return await this.storage.get('session_active');
  }

  async closeSession() {
    await this.storage.remove('session_active');
  }

  // ------------------- NATIVE (SQLite) -------------------
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
          usuario TEXT,
          nombre TEXT,
          apellido TEXT,
          email TEXT UNIQUE,
          edad INTEGER,
          genero TEXT,
          password TEXT
        )
      `, []);
      this.dbState.next(true);
    } catch (e) {
      console.error('Error tablas nativas', e);
    }
  }

  // ------------------- WEB (Ionic Storage) -------------------
  private async seedWebDatabase() {
    const users = await this.storage.get('users');
    if (!users) await this.storage.set('users', []);
  }

  // ------------------- CRUD USUARIOS -------------------

  async registerUser(usuario: string, nombre: string, apellido: string, email: string, edad: number, genero: string, pass: string): Promise<boolean> {
    if (this.isWeb) {
      const users = (await this.storage.get('users')) || [];
      const existe = users.find((u: any) => u.email === email);
      if (existe) return false;

      users.push({ usuario, nombre, apellido, email, edad, genero, password: pass });
      await this.storage.set('users', users);
      return true;

    } else {
      if (!this.databaseObj) return false;
      try {
        await this.databaseObj.executeSql(
          `INSERT INTO users (usuario, nombre, apellido, email, edad, genero, password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [usuario, nombre, apellido, email, edad, genero, pass]
        );
        return true;
      } catch (e) {
        console.error('Error registro nativo', e);
        return false;
      }
    }
  }

  async loginUser(email: string, pass: string): Promise<boolean> {
    let access = false;
    if (this.isWeb) {
      const users = (await this.storage.get('users')) || [];
      const user = users.find((u: any) => u.email === email && u.password === pass);
      access = !!user;
    } else {
      if (!this.databaseObj) return false;
      try {
        const res = await this.databaseObj.executeSql(
          'SELECT * FROM users WHERE email = ? AND password = ?', [email, pass]
        );
        access = res.rows.length > 0;
      } catch (e) {
        return false;
      }
    }

    // SI EL LOGIN ES CORRECTO, CREAMOS LA SESIÓN AUTOMÁTICAMENTE
    if (access) {
      await this.createSession(email);
    }
    return access;
  }

  async getUsuario(email: string): Promise<any> {
    if (this.isWeb) {
      const users = (await this.storage.get('users')) || [];
      return users.find((u: any) => u.email === email) || null;
    } else {
      if (!this.databaseObj) return null;
      try {
        const res = await this.databaseObj.executeSql('SELECT * FROM users WHERE email = ?', [email]);
        if (res.rows.length > 0) {
          return res.rows.item(0);
        }
        return null;
      } catch (e) {
        return null;
      }
    }
  }

  async actualizarUsuario(usuarioObj: any): Promise<boolean> {
    if (this.isWeb) {
      const users = (await this.storage.get('users')) || [];
      // Buscamos por EMAIL porque es único y no se edita en el perfil
      const index = users.findIndex((u: any) => u.email === usuarioObj.email);
      if (index === -1) return false;

      // Actualizamos campos
      users[index].usuario = usuarioObj.usuario;
      users[index].nombre = usuarioObj.nombre;
      users[index].apellido = usuarioObj.apellido;
      users[index].edad = usuarioObj.edad;
      users[index].genero = usuarioObj.genero;
      // No tocamos la password si no viene en el objeto

      await this.storage.set('users', users);
      return true;

    } else {
      if (!this.databaseObj) return false;
      try {
        const query = `UPDATE users SET usuario=?, nombre=?, apellido=?, edad=?, genero=? WHERE email=?`;
        await this.databaseObj.executeSql(query, [
          usuarioObj.usuario,
          usuarioObj.nombre,
          usuarioObj.apellido,
          usuarioObj.edad,
          usuarioObj.genero,
          usuarioObj.email // El WHERE
        ]);
        return true;
      } catch (e) {
        console.error('Error actualizando nativo', e);
        return false;
      }
    }
  }

  // ------------------- CARRITO -------------------

  async guardarCarrito(carrito: any[]) {
    await this.storage.set('carrito', carrito);
  }

  async obtenerCarrito(): Promise<any[]> {
    return (await this.storage.get('carrito')) || [];
  }

  async vaciarCarrito() {
    await this.storage.remove('carrito');
  }
}