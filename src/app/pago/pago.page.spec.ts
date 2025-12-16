import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing'; // Añadimos flushMicrotasks
import { PagoPage } from './pago.page';
import { Router } from '@angular/router';
import { ToastController, NavController } from '@ionic/angular';
import { DatabaseService } from '../services/dbtask';
import { ApiService } from '../services/api';
import { Geolocation } from '@capacitor/geolocation';
import { of, throwError } from 'rxjs';
import * as L from 'leaflet';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

// =================================================================
// 1. MOCKS DE DATOS
// =================================================================

const mockCarrito = [
  { id: 101, nombre: 'Burger Clásica', precio: 5000, cantidad: 2 },
  { id: 102, nombre: 'Papas Fritas', precio: 1500, cantidad: 1 }
];
const totalEsperado = 5000 * 2 + 1500 * 1; // 11500

const mockUsuario = { usuario: 'testuser', email: 'test@example.com' };

// =================================================================
// 2. MOCKS DE DEPENDENCIAS INYECTADAS
// =================================================================

// --- Mock Geolocation (Capacitor) ---
const mockPosition = {
  coords: { latitude: -33.5, longitude: -70.7, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
  timestamp: Date.now()
};
const mockGeolocation = {
  getCurrentPosition: jasmine.createSpy('getCurrentPosition').and.returnValue(Promise.resolve(mockPosition)),
  watchPosition: jasmine.createSpy('watchPosition'),
  clearWatch: jasmine.createSpy('clearWatch')
};

// --- Mock Leaflet (L) ---
const mockMap: any = {
  setView: jasmine.createSpy('setView'),
  on: jasmine.createSpy('on').and.callFake((event, handler) => {
    if (event === 'click') {
      (mockMap as any).clickHandler = handler;
    }
  }),
  remove: jasmine.createSpy('remove')
};

const mockTileLayer: any = {
  addTo: jasmine.createSpy('addTo'),
};
mockTileLayer.addTo.and.returnValue(mockTileLayer);

const mockMarker: any = {
  addTo: jasmine.createSpy('addTo'),
  setLatLng: jasmine.createSpy('setLatLng'),
  remove: jasmine.createSpy('remove')
};

// Declaración de spies para los métodos estáticos de Leaflet
(L.map as any) = jasmine.createSpy('L.map').and.returnValue(mockMap);
(L.tileLayer as any) = jasmine.createSpy('L.tileLayer').and.returnValue(mockTileLayer);
(L.marker as any) = jasmine.createSpy('L.marker').and.returnValue(mockMarker);


// --- Mock Services ---
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
const mockToast = jasmine.createSpyObj('Toast', ['present']);
const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
mockToastController.create.and.returnValue(Promise.resolve(mockToast));
const mockNavController = jasmine.createSpyObj('NavController', ['navigateForward', 'navigateRoot']);

const mockDbService = jasmine.createSpyObj('DatabaseService', [
  'obtenerCarrito',
  'getSession',
  'getUsuario',
  'vaciarCarrito',
  'dbState'
]);
mockDbService.dbState = of(true);

const mockApiService = jasmine.createSpyObj('ApiService', ['crearPedido']);


describe('PagoPage', () => {
  let component: PagoPage;
  let fixture: ComponentFixture<PagoPage>;
  let dbService: jasmine.SpyObj<DatabaseService>;
  let router: jasmine.SpyObj<Router>;
  let apiService: jasmine.SpyObj<ApiService>;

  // Configuración del TestBed
  beforeEach(async () => {
    // Limpiamos los spies globales de Leaflet antes de cada prueba
    (L.map as jasmine.Spy).calls.reset();
    (L.marker as jasmine.Spy).calls.reset();
    mockMarker.setLatLng.calls.reset();
    mockMap.remove.calls.reset();

    await TestBed.configureTestingModule({
      imports: [PagoPage, CommonModule, RouterTestingModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ToastController, useValue: mockToastController },
        { provide: NavController, useValue: mockNavController },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: ApiService, useValue: mockApiService },
        { provide: Geolocation, useValue: mockGeolocation },
        CurrencyPipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PagoPage);
    component = fixture.componentInstance;
    dbService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Restaurar/Limpiar mocks de servicios
    dbService.obtenerCarrito.calls.reset();
    dbService.getSession.calls.reset();
    dbService.getUsuario.calls.reset();
    dbService.vaciarCarrito.calls.reset();
    mockRouter.navigate.calls.reset();
    mockApiService.crearPedido.calls.reset();
    mockGeolocation.getCurrentPosition.calls.reset();
    mockNavController.navigateForward.calls.reset();

    // Configuración de mocks por defecto
    dbService.obtenerCarrito.and.returnValue(Promise.resolve(mockCarrito));
    dbService.getSession.and.returnValue(Promise.resolve(mockUsuario.email));
    dbService.getUsuario.and.returnValue(Promise.resolve(mockUsuario));
    apiService.crearPedido.and.returnValue(of({ success: true, pedido_id: 1 }));
  });

  // ===============================================
  // A. PRUEBAS DE INICIALIZACIÓN Y CICLO DE VIDA (CORREGIDAS)
  // ===============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit debería cargar el carrito', async () => {
    await component.ngOnInit();
    expect(dbService.obtenerCarrito).toHaveBeenCalled();
    expect(component.carrito).toEqual(mockCarrito);
  });

  it('ngAfterViewInit debería iniciar el mapa después de un timeout', fakeAsync(() => {
    spyOn(component, 'iniciarMapa').and.callThrough();
    component.ngAfterViewInit();
    expect(component.iniciarMapa).not.toHaveBeenCalled();
    tick(500); // Simula el setTimeout(0) o un pequeño retraso
    expect(component.iniciarMapa).toHaveBeenCalled();
    expect(L.map).toHaveBeenCalledWith('mapaId');
    flushMicrotasks();
  }));

  // CORRECCIÓN: Usa fakeAsync para asegurar que iniciarMapa se complete y component.mapa exista
  it('ngOnDestroy debería remover el mapa si existe', fakeAsync(() => {
    component.iniciarMapa();
    tick(0); // Asegura que el mapa se cree

    component.ngOnDestroy();
    expect(mockMap.remove).toHaveBeenCalled();
    flushMicrotasks();
  }));


  // ===============================================
  // B. PRUEBAS DE LÓGICA DEL CARRITO (CORREGIDAS)
  // ===============================================

  it('totalCarrito debería calcular el total correctamente', () => {
    component.carrito = mockCarrito;
    expect(component.totalCarrito()).toBe(totalEsperado);
  });

  // ===============================================
  // C. PRUEBAS DE GEOLOCALIZACIÓN Y MAPA (CORREGIDAS)
  // ===============================================

  describe('Ubicación y Mapa', () => {
    beforeEach(() => {
      // Inicializamos el mapa y el marcador antes de cada prueba de mapa
      component.iniciarMapa();
      mockMarker.setLatLng.calls.reset();
    });

    it('obtenerUbicacion (GPS) debería establecer el marcador y actualizar el mapa', async () => {
      await component.obtenerUbicacion();

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      expect(mockMap.setView).toHaveBeenCalledWith([mockPosition.coords.latitude, mockPosition.coords.longitude], 16);
      expect(component.ubicacion!.lat).toBe(mockPosition.coords.latitude);
    });

    it('establecerMarcador debería crear un nuevo marcador o mover el existente', () => {
      const lat = -33.0;
      const lng = -71.0;

      component.establecerMarcador(lat + 1, lng + 1);

      expect(mockMarker.setLatLng).toHaveBeenCalledWith([lat + 1, lng + 1]);
    });

    it('hacer clic en el mapa debería establecer el marcador', () => {
      const lat = -33.1;
      const lng = -70.1;

      const mockEvent: L.LeafletMouseEvent = {
        latlng: { lat, lng }
      } as L.LeafletMouseEvent;

      (mockMap as any).clickHandler(mockEvent);

      expect(mockMarker.setLatLng).toHaveBeenCalledWith([lat, lng]);
      expect(component.ubicacion!.lat).toBe(lat);
    });
  });

  // ===============================================
  // D. PRUEBAS DE PROCESAMIENTO DE PAGO (CORREGIDAS)
  // ===============================================

  describe('confirmarPago', () => {

    beforeEach(() => {
      component.carrito = mockCarrito;
      component.ubicacion = { lat: 10, lng: 10, timestamp: Date.now() };
      component.isProcessing = false;

      dbService.getSession.and.returnValue(Promise.resolve(mockUsuario.email));
      dbService.getUsuario.and.returnValue(Promise.resolve(mockUsuario));
      apiService.crearPedido.and.returnValue(of({ success: true, pedido_id: 1 }));
    });

    // --- VALIDACIONES ---
    it('debería retornar si el carrito está vacío', async () => {
      component.carrito = [];
      await component.confirmarPago();
      expect(mockToastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: 'warning' })
      );
      expect(apiService.crearPedido).not.toHaveBeenCalled();
      expect(component.isProcessing).toBe(false);
    });

    it('debería retornar si no se ha establecido la ubicación', async () => {
      component.ubicacion = null;
      await component.confirmarPago();
      expect(mockToastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: 'warning' })
      );
      expect(apiService.crearPedido).not.toHaveBeenCalled();
      expect(component.isProcessing).toBe(false);
    });

    it('debería retornar si no hay sesión activa', async () => {
      dbService.getSession.and.returnValue(Promise.resolve(null));
      await component.confirmarPago();
      expect(mockToastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: 'danger' })
      );
      expect(component.isProcessing).toBe(false);
    });

    // --- FLUJO DE ÉXITO ---
    it('debería llamar a la API, vaciar carrito y navegar a /pedidos en caso de éxito', fakeAsync(() => {

      component.confirmarPago();
      expect(component.isProcessing).toBe(true);
      tick(0);

      const expectedPayload = {
        nombre_cliente: mockUsuario.usuario,
        productos_ids: [101, 101, 102]
      };
      expect(apiService.crearPedido).toHaveBeenCalledWith(expectedPayload);

      // Simula el tiempo que tarda la llamada a la API y el vaciado del carrito
      tick(10); // Un pequeño tick para resolver promesas/observables

      expect(dbService.vaciarCarrito).toHaveBeenCalled();
      expect(mockToastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: 'success' })
      );
      expect(component.carrito).toEqual([]);
      expect(component.isProcessing).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/home/pedidos']);
      flushMicrotasks();
    }));

    // --- FLUJO DE ERROR ---
    it('debería manejar el error de la API y desactivar el loading', fakeAsync(() => {
      apiService.crearPedido.and.returnValue(throwError(() => ({ status: 500 })));

      component.confirmarPago();
      expect(component.isProcessing).toBe(true);

      tick(0);

      expect(apiService.crearPedido).toHaveBeenCalled();
      expect(mockToastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: 'danger' })
      );
      expect(component.isProcessing).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
      flushMicrotasks();
    }));
  });
});