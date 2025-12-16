import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api';
import { DatabaseService } from '../services/dbtask';
import { MenuPage } from './menu.page';
import { of } from 'rxjs'; 
import { HttpClientTestingModule } from '@angular/common/http/testing'; 
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; 

// =================================================================
// 1. MOCKS DE DATOS Y DEPENDENCIAS
// =================================================================

const mockSQLite = jasmine.createSpyObj('SQLite', ['create']); 

// --- Datos Mock ---
const mockCategorias = [
    { id: 1, nombre: 'Bebidas' },
    { id: 2, nombre: 'Comidas' }
];

const mockProductosBebidas = {
    productos: [
        { id: 101, nombre: 'Café', precio: 2.50 },
        { id: 102, nombre: 'Té', precio: 1.80 }
    ]
};

const mockProductoAñadir = { id: 201, nombre: 'Hamburguesa', precio: 8.00 };

// --- Mocks de Servicios ---

// Mock para DatabaseService
const mockDbService = jasmine.createSpyObj('DatabaseService', [
    'obtenerCarrito', 
    'guardarCarrito'
]);
// Configuramos el carrito vacío por defecto
mockDbService.obtenerCarrito.and.returnValue(Promise.resolve([]));
mockDbService.guardarCarrito.and.returnValue(Promise.resolve(true));

// Mock para ApiService
const mockApiService = jasmine.createSpyObj('ApiService', [
    'listarCategorias', 
    'obtenerCategoria'
]);
// Configuramos los mocks de API con Observables
mockApiService.listarCategorias.and.returnValue(of(mockCategorias));

// 🛑 CORRECCIÓN DE ERROR DE COMPILACIÓN: Añadir 'id: any'
mockApiService.obtenerCategoria.and.callFake((id: any) => {
    if (id === 1) return of(mockProductosBebidas);
    if (id === 2) return of({ productos: [{ id: 301, nombre: 'Pizza', precio: 10.00 }] });
    return of(mockProductosBebidas); // Default
});

// Mock para ModalController
const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present']);
const mockModalController = jasmine.createSpyObj('ModalController', ['create']);
mockModalController.create.and.returnValue(Promise.resolve(mockModal));

describe('MenuPage', () => {
    let component: MenuPage;
    let fixture: ComponentFixture<MenuPage>;

    beforeEach(async () => {
        const sqliteToken = 'SQLite';

        await TestBed.configureTestingModule({
            imports: [
                MenuPage, 
                HttpClientTestingModule 
            ],
            providers: [
                { provide: sqliteToken, useValue: mockSQLite }, 
                { provide: ApiService, useValue: mockApiService },
                { provide: DatabaseService, useValue: mockDbService },
                { provide: ModalController, useValue: mockModalController },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA] 
        }).compileComponents();

        fixture = TestBed.createComponent(MenuPage);
        component = fixture.componentInstance;
        
        // Limpiamos los spies antes de cada test
        mockApiService.listarCategorias.calls.reset();
        mockApiService.obtenerCategoria.calls.reset();
        mockModalController.create.calls.reset();
        mockDbService.obtenerCarrito.calls.reset();
        mockDbService.guardarCarrito.calls.reset();

        // Reconfiguramos el valor por defecto del carrito
        mockDbService.obtenerCarrito.and.returnValue(Promise.resolve([]));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // =================================================================
    // A. PRUEBAS DE INICIALIZACIÓN (ngOnInit y carga de categorías)
    // =================================================================
    
    describe('Inicialización', () => {
        
        it('ngOnInit debería llamar a cargarCategorias', () => {
            spyOn(component, 'cargarCategorias').and.callThrough(); 
            component.ngOnInit();
            expect(component.cargarCategorias).toHaveBeenCalled();
        });

        it('cargarCategorias debería obtener la lista y seleccionar la primera', fakeAsync(() => {
            component.cargarCategorias();

            tick(); // Resuelve el Observable de listarCategorias
            
            expect(mockApiService.listarCategorias).toHaveBeenCalled();
            expect(component.categorias).toEqual(mockCategorias);
            
            expect(component.activeCategory).toEqual(mockCategorias[0]);
            expect(mockApiService.obtenerCategoria).toHaveBeenCalledWith(mockCategorias[0].id);
            
            tick(); // Resuelve el Observable de obtenerCategoria 

            expect(component.productos).toEqual(mockProductosBebidas.productos);
            flushMicrotasks();
        }));
    });

    // =================================================================
    // B. PRUEBAS DE SELECCIÓN DE CATEGORÍA
    // =================================================================

    describe('selectCategory', () => {
        it('debería actualizar la categoría activa y cargar sus productos', fakeAsync(() => {
            const nuevaCategoria = mockCategorias[1]; // Comidas

            component.categorias = mockCategorias; 
            component.activeCategory = mockCategorias[0]; 
            
            component.selectCategory(nuevaCategoria);

            expect(component.activeCategory).toEqual(nuevaCategoria);

            expect(mockApiService.obtenerCategoria).toHaveBeenCalledWith(nuevaCategoria.id);

            tick(); 
            
            // Nota: El mock de API para ID=2 devuelve productos diferentes para probar bien el mock
            expect(component.productos).toEqual([{ id: 301, nombre: 'Pizza', precio: 10.00 }]);
            flushMicrotasks();
        }));
        
        it('no debería hacer nada si la categoría ya está activa', () => {
            const categoriaActiva = mockCategorias[0];
            component.activeCategory = categoriaActiva;
            
            component.selectCategory(categoriaActiva);
            
            expect(mockApiService.obtenerCategoria).not.toHaveBeenCalled();
        });
    });

    // =================================================================
    // C. PRUEBAS DE CARRITO (Modal y Lógica de DB)
    // =================================================================

    describe('abrirCarrito', () => {
        it('debería crear y presentar el CartModalPage con la configuración correcta', async () => {
            await component.abrirCarrito();

            expect(mockModalController.create).toHaveBeenCalledWith(jasmine.objectContaining({
                component: jasmine.any(Function), 
                cssClass: 'cart-modal',
                initialBreakpoint: 0.9,
                handle: true
            }));
            expect(mockModal.present).toHaveBeenCalled();
        });
    });

    describe('agregarAlCarrito', () => {
        
        it('debería añadir un nuevo producto al carrito si está vacío', async () => {
            await component.agregarAlCarrito(mockProductoAñadir);
            
            expect(mockDbService.obtenerCarrito).toHaveBeenCalled();
            
            expect(mockDbService.guardarCarrito).toHaveBeenCalledWith([
                { ...mockProductoAñadir, cantidad: 1 }
            ]);
        });
        
        it('debería incrementar la cantidad si el producto ya existe en el carrito', async () => {
            const carritoExistente = [{ ...mockProductoAñadir, cantidad: 2 }];
            mockDbService.obtenerCarrito.and.returnValue(Promise.resolve(carritoExistente));

            await component.agregarAlCarrito(mockProductoAñadir);

            expect(mockDbService.guardarCarrito).toHaveBeenCalledWith([
                { ...mockProductoAñadir, cantidad: 3 }
            ]);
        });
        
        it('debería añadir el producto si el carrito tiene otros elementos pero no el producto actual', async () => {
            const otroProducto = { id: 999, nombre: 'Agua', precio: 1.00, cantidad: 1 };
            mockDbService.obtenerCarrito.and.returnValue(Promise.resolve([otroProducto]));
            
            await component.agregarAlCarrito(mockProductoAñadir);
            
            expect(mockDbService.guardarCarrito).toHaveBeenCalledWith([
                otroProducto,
                { ...mockProductoAñadir, cantidad: 1 }
            ]);
        });
    });
});