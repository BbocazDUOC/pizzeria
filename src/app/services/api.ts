import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

// Recuerda:
  // - Para Emulador Android: 'http://10.0.2.2:8000'
  // - Para Web (ionic serve): 'http://127.0.0.1:8000'
  // - Para Celular Físico: 'http://tu_ip_pc:8000'
export class ApiService {
  private apiUrl = 'http://127.0.0.1:8000'; // Cambia si tu API tiene otra URL
  private _storage: Storage | null = null;

  constructor(private http: HttpClient, private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // ---------------- USUARIOS ----------------
  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/`, usuario);
  }

  listarUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/`);
  }

  actualizarUsuario(nombre_usuario: string, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${nombre_usuario}`, usuario);
  }

  eliminarUsuario(nombre_usuario: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${nombre_usuario}`);
  }

  obtenerUsuario(nombre_usuario: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/${nombre_usuario}`);
  }

  // ---------------- CATEGORIAS ----------------
  crearCategoria(categoria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categorias/`, categoria);
  }

  listarCategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categorias/`);
  }

  obtenerCategoria(categoriaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/categorias/${categoriaId}`);
  }

  // ---------------- PRODUCTOS ----------------
  crearProducto(producto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/productos/`, producto);
  }

  listarProductos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos/`);
  }

  listarProductosPorCategoria(categoriaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos/categoria/${categoriaId}`);
  }

  // ---------------- PEDIDOS ----------------
  crearPedido(pedido: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pedidos/`, pedido);
  }

  listarPedidos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pedidos/`);
  }

  listarPedidosPorUsuario(nombre_usuario: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/pedidos/usuario/${nombre_usuario}`);
  }

  eliminarPedido(pedido_id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pedidos/${pedido_id}`);
  }

  // ---------------- LOCAL STORAGE ----------------
  async guardarLocal(key: string, data: any) {
    await this._storage?.set(key, data);
  }

  async obtenerLocal(key: string) {
    return await this._storage?.get(key);
  }

  async eliminarLocal(key: string) {
    await this._storage?.remove(key);
  }
}
