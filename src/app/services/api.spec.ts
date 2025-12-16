import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from './api';

const API_URL = 'http://127.0.0.1:8000';

// ===================== MOCKS =====================
const MOCK_USUARIO = {
  nombre_usuario: 'testuser',
  nombre: 'Test',
  email: 'test@example.com'
};
const MOCK_USUARIOS = [MOCK_USUARIO];

const MOCK_CATEGORIA = { id: 1, nombre: 'Pizza' };
const MOCK_CATEGORIAS = [MOCK_CATEGORIA];

const MOCK_PRODUCTO = { id: 1, nombre: 'Margarita' };
const MOCK_PRODUCTOS = [MOCK_PRODUCTO];

const MOCK_PEDIDO = { id: 1, usuario: 'testuser', total: 5000 };
const MOCK_PEDIDOS = [MOCK_PEDIDO];

// ===================== STORAGE MOCK =====================
const storageInstanceSpy = jasmine.createSpyObj('StorageInstance', ['set', 'get', 'remove']);
storageInstanceSpy.set.and.returnValue(Promise.resolve());
storageInstanceSpy.get.and.returnValue(Promise.resolve(null));
storageInstanceSpy.remove.and.returnValue(Promise.resolve());

const mockStorage = jasmine.createSpyObj('Storage', ['create']);
mockStorage.create.and.returnValue(Promise.resolve(storageInstanceSpy));

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: Storage, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===================== USUARIOS =====================
  it('crearUsuario POST', () => {
    service.crearUsuario(MOCK_USUARIO).subscribe(res => {
      expect(res).toEqual(MOCK_USUARIO);
    });

    const req = httpMock.expectOne(`${API_URL}/usuarios/`);
    expect(req.request.method).toBe('POST');
    req.flush(MOCK_USUARIO);
  });

  it('listarUsuarios GET', () => {
    service.listarUsuarios().subscribe(res => {
      expect(res).toEqual(MOCK_USUARIOS);
    });

    const req = httpMock.expectOne(`${API_URL}/usuarios/`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_USUARIOS);
  });

  it('obtenerUsuario GET', () => {
    service.obtenerUsuario('testuser').subscribe(res => {
      expect(res).toEqual(MOCK_USUARIO);
    });

    const req = httpMock.expectOne(`${API_URL}/usuarios/testuser`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_USUARIO);
  });

  it('actualizarUsuario PUT', () => {
    service.actualizarUsuario('testuser', MOCK_USUARIO).subscribe(res => {
      expect(res).toEqual(MOCK_USUARIO);
    });

    const req = httpMock.expectOne(`${API_URL}/usuarios/testuser`);
    expect(req.request.method).toBe('PUT');
    req.flush(MOCK_USUARIO);
  });

  it('eliminarUsuario DELETE', () => {
    service.eliminarUsuario('testuser').subscribe(res => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${API_URL}/usuarios/testuser`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ===================== CATEGORIAS =====================
  it('listarCategorias GET', () => {
    service.listarCategorias().subscribe(res => {
      expect(res).toEqual(MOCK_CATEGORIAS);
    });

    const req = httpMock.expectOne(`${API_URL}/categorias/`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_CATEGORIAS);
  });

  // ===================== PRODUCTOS =====================
  it('listarProductos GET', () => {
    service.listarProductos().subscribe(res => {
      expect(res).toEqual(MOCK_PRODUCTOS);
    });

    const req = httpMock.expectOne(`${API_URL}/productos/`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_PRODUCTOS);
  });

  // ===================== PEDIDOS =====================
  it('listarPedidos GET', () => {
    service.listarPedidos().subscribe(res => {
      expect(res).toEqual(MOCK_PEDIDOS);
    });

    const req = httpMock.expectOne(`${API_URL}/pedidos/`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_PEDIDOS);
  });

  // ===================== STORAGE =====================
  it('guardarLocal usa storage.set', async () => {
    await service.guardarLocal('key', 123);
    expect(storageInstanceSpy.set).toHaveBeenCalledWith('key', 123);
  });

  it('obtenerLocal usa storage.get', async () => {
    storageInstanceSpy.get.and.returnValue(Promise.resolve(123));
    const res = await service.obtenerLocal('key');
    expect(res).toBe(123);
  });

  it('eliminarLocal usa storage.remove', async () => {
    await service.eliminarLocal('key');
    expect(storageInstanceSpy.remove).toHaveBeenCalledWith('key');
  });
});
