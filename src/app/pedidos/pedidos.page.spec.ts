import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PedidosPage } from './pedidos.page';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../services/api';
import { DatabaseService } from '../services/dbtask';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

// =================================================================
// 1. MOCKS DE DATOS
// =================================================================

const mockEmail = 'user@test.com';
const mockUsuarioDB = { email: mockEmail, usuario: 'testuser123', nombre: 'Test User' };

const mockPedidosApi = [
    { id: 2, cliente: 'testuser123', fecha: '2025-10-20', total: 15000 },
    { id: 1, cliente: 'testuser123', fecha: '2025-10-19', total: 5000 },
    { id: 3, cliente: 'testuser123', fecha: '2025-10-21', total: 20000 },
];
const mockPedidosOrdenados = [
    { id: 3, cliente: 'testuser123', fecha: '2025-10-21', total: 20000 },
    { id: 2, cliente: 'testuser123', fecha: '2025-10-20', total: 15000 },
    { id: 1, cliente: 'testuser123', fecha: '2025-10-19', total: 5000 },
];

// =================================================================
// 2. MOCKS DE DEPENDENCIAS INYECTADAS
// =================================================================

// Mock para ToastController
const mockToast = jasmine.createSpyObj('Toast', ['present']);
const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
mockToastController.create.and.returnValue(Promise.resolve(mockToast));

// Mock para DatabaseService
const mockDbService = jasmine.createSpyObj('DatabaseService', ['getSession', 'getUsuario']);

// Mock para ApiService
const mockApiService = jasmine.createSpyObj('ApiService', ['listarPedidosPorUsuario']);


describe('PedidosPage', () => {
    let component: PedidosPage;
    let fixture: ComponentFixture<PedidosPage>;
    let apiService: jasmine.SpyObj<ApiService>;
    let dbService: jasmine.SpyObj<DatabaseService>;
    let toastController: jasmine.SpyObj<ToastController>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PedidosPage, CommonModule],
            providers: [
                { provide: ApiService, useValue: mockApiService },
                { provide: DatabaseService, useValue: mockDbService },
                { provide: ToastController, useValue: mockToastController },
                // Nota: No se necesita HttpClientTestingModule aquí si mockApiService simula todas las llamadas.
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PedidosPage);
        component = fixture.componentInstance;
        
        // Asignación de spies
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        dbService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
        toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
        
        // Limpiar llamadas antes de cada test
        dbService.getSession.calls.reset();
        dbService.getUsuario.calls.reset();
        apiService.listarPedidosPorUsuario.calls.reset();
        toastController.create.calls.reset();
        mockToast.present.calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    
    // ===============================================
    // A. PRUEBAS DE CICLO DE VIDA (ionViewWillEnter)
    // ===============================================

    it('ionViewWillEnter debería llamar a cargarPedidos', () => {
        // Espiar el método clave
        spyOn(component, 'cargarPedidos');
        component.ionViewWillEnter();
        expect(component.cargarPedidos).toHaveBeenCalled();
    });

    // ===============================================
    // B. PRUEBAS DE SESIÓN Y AUTENTICACIÓN
    // ===============================================

    it('cargarPedidos debería fallar si no hay sesión activa (email)', fakeAsync(async () => {
        // ARRANGE: Simular que getSession retorna null
        dbService.getSession.and.returnValue(Promise.resolve(null));

        // ACT
        await component.cargarPedidos();
        tick(); // Resuelve la promesa de getSession

        // ASSERT
        expect(dbService.getSession).toHaveBeenCalled();
        expect(component.pedidos.length).toBe(0);
        expect(apiService.listarPedidosPorUsuario).not.toHaveBeenCalled();
        
        // Verificar Toast de advertencia
        expect(toastController.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Debe iniciar sesión para ver sus pedidos.', color: 'warning' })
        );
    }));

    it('cargarPedidos debería fallar si el usuario no se encuentra o no tiene "usuario"', fakeAsync(async () => {
        // ARRANGE: Sesión OK, pero getUsuario falla
        dbService.getSession.and.returnValue(Promise.resolve(mockEmail));
        dbService.getUsuario.and.returnValue(Promise.resolve(null)); // Usuario nulo

        // ACT
        await component.cargarPedidos();
        tick(); // Resuelve ambas promesas

        // ASSERT
        expect(dbService.getUsuario).toHaveBeenCalledWith(mockEmail);
        expect(component.pedidos.length).toBe(0);
        expect(apiService.listarPedidosPorUsuario).not.toHaveBeenCalled();

        // Verificar Toast de error
        expect(toastController.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: jasmine.stringContaining('Error: No se pudo obtener el nombre de usuario'), color: 'danger' })
        );
    }));

    // ===============================================
    // C. PRUEBAS DE CARGA EXITOSA DE LA API
    // ===============================================

    it('cargarPedidos debería obtener, ordenar y asignar los pedidos si la sesión es válida', fakeAsync(async () => {
        // ARRANGE: Simulación de éxito completo
        dbService.getSession.and.returnValue(Promise.resolve(mockEmail));
        dbService.getUsuario.and.returnValue(Promise.resolve(mockUsuarioDB));
        apiService.listarPedidosPorUsuario.and.returnValue(of(mockPedidosApi)); // Retorna los pedidos sin ordenar

        // ACT
        await component.cargarPedidos();
        tick(); // Resuelve las promesas
        
        // Simula la suscripción del Observable
        fixture.detectChanges(); 
        
        // ASSERT 1: Flujo de obtención de usuario
        expect(component.nombre_usuario).toBe(mockUsuarioDB.usuario);
        expect(apiService.listarPedidosPorUsuario).toHaveBeenCalledWith(mockUsuarioDB.usuario);
        
        // ASSERT 2: Ordenación y asignación de datos
        // El test verifica que el componente ordenó los datos (ID 3, 2, 1)
        expect(component.pedidos).toEqual(mockPedidosOrdenados);
        
        // ASSERT 3: No se muestra toast de lista vacía
        expect(toastController.create).not.toHaveBeenCalled(); 
    }));
    
    it('debería mostrar un toast si la API devuelve una lista vacía', fakeAsync(async () => {
        // ARRANGE
        dbService.getSession.and.returnValue(Promise.resolve(mockEmail));
        dbService.getUsuario.and.returnValue(Promise.resolve(mockUsuarioDB));
        apiService.listarPedidosPorUsuario.and.returnValue(of([])); // Lista vacía

        // ACT
        await component.cargarPedidos();
        tick(); 
        fixture.detectChanges();

        // ASSERT
        expect(component.pedidos.length).toBe(0);
        expect(toastController.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Aún no tienes pedidos registrados.', color: 'tertiary' })
        );
    }));

    // ===============================================
    // D. PRUEBAS DE MANEJO DE ERRORES DE LA API
    // ===============================================

    it('debería vaciar la lista y mostrar un toast de error si la API falla', fakeAsync(async () => {
        // ARRANGE: Simular un error HTTP (ej: 500 Internal Server Error)
        dbService.getSession.and.returnValue(Promise.resolve(mockEmail));
        dbService.getUsuario.and.returnValue(Promise.resolve(mockUsuarioDB));
        apiService.listarPedidosPorUsuario.and.returnValue(throwError(() => ({ status: 500, error: 'API down' })));

        // Aseguramos que la lista tenga datos antes de la llamada (para probar que se limpia)
        component.pedidos = mockPedidosOrdenados; 

        // ACT
        await component.cargarPedidos();
        tick(); // Resuelve las promesas
        
        // Simula la suscripción del Observable (ejecuta el error)
        fixture.detectChanges(); 

        // ASSERT
        expect(apiService.listarPedidosPorUsuario).toHaveBeenCalled();
        expect(component.pedidos.length).toBe(0); // La lista debe vaciarse
        
        // Verificar Toast de error
        expect(toastController.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: jasmine.stringContaining('Error cargando pedidos'), color: 'danger' })
        );
    }));
});