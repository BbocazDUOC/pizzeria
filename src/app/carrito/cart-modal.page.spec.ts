import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { DatabaseService } from '../services/dbtask';
import { Router } from '@angular/router';
import { CartModalPage } from './cart-modal.page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// =================================================================
// 1. MOCKS DE DATOS Y DEPENDENCIAS
// =================================================================

const mockCarrito = [
    { id: 1, nombre: 'Producto A', precio: 5000, cantidad: 2 },
    { id: 2, nombre: 'Producto B', precio: 1500, cantidad: 1 },
];

// Mock para DatabaseService
const mockDbService = jasmine.createSpyObj('DatabaseService', [
    'obtenerCarrito', 
    'guardarCarrito'
]);
mockDbService.obtenerCarrito.and.returnValue(Promise.resolve(mockCarrito));
mockDbService.guardarCarrito.and.returnValue(Promise.resolve(true));

// Mock para ModalController
const mockModalController = jasmine.createSpyObj('ModalController', ['dismiss']);

// Mock para Router
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

describe('CartModalPage', () => {
    let component: CartModalPage;
    let fixture: ComponentFixture<CartModalPage>;
    let dbService: DatabaseService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CartModalPage], // Componente Standalone
            providers: [
                { provide: DatabaseService, useValue: mockDbService },
                { provide: ModalController, useValue: mockModalController },
                { provide: Router, useValue: mockRouter }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(CartModalPage);
        component = fixture.componentInstance;
        dbService = TestBed.inject(DatabaseService);

        // Limpiar los mocks antes de cada test
        mockDbService.obtenerCarrito.calls.reset();
        mockDbService.guardarCarrito.calls.reset();
        mockRouter.navigate.calls.reset();
        mockModalController.dismiss.calls.reset();

        // Asegurar que el carrito se reinicie al estado base antes de cada test
        // Hacemos una copia para que la manipulación del test no afecte al mock global
        mockDbService.obtenerCarrito.and.returnValue(Promise.resolve(JSON.parse(JSON.stringify(mockCarrito))));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // =================================================================
    // A. PRUEBAS DE INICIALIZACIÓN Y CÁLCULO
    // =================================================================

    // ✅ ngOnInit debería cargar el carrito
    it('ngOnInit debería cargar el carrito', async () => {
        // Ejecutamos ngOnInit
        await component.ngOnInit();
        
        // Assert: Se debe haber llamado a obtenerCarrito
        expect(dbService.obtenerCarrito).toHaveBeenCalled();
        // Assert: El componente debe tener los datos del mock
        expect(component.carrito.length).toBe(2);
        expect(component.carrito[0].id).toBe(1);
    });

    // ✅ totalCarrito debería calcular el total correctamente
    it('totalCarrito debería calcular el total correctamente', async () => {
        // ARRANGE: Cargar el carrito
        await component.cargarCarrito();
        
        // CÁLCULO: (5000 * 2) + (1500 * 1) = 10000 + 1500 = 11500
        const total = component.totalCarrito();
        
        expect(total).toBe(11500);
    });

    // =================================================================
    // B. PRUEBAS DE MANIPULACIÓN DE CANTIDAD
    // =================================================================

    // ✅ aumentarCantidad debería incrementar la cantidad y guardar el carrito
    it('aumentarCantidad debería incrementar la cantidad y guardar el carrito', async () => {
        await component.cargarCarrito();
        const productoA = component.carrito[0]; // Producto A: cantidad 2

        component.aumentarCantidad(productoA);

        expect(productoA.cantidad).toBe(3);
        // Assert: Comprobamos que se llamó a guardarCarrito
        expect(dbService.guardarCarrito).toHaveBeenCalledWith(component.carrito);
    });

    // ✅ disminuirCantidad debería reducir la cantidad si es mayor a 1
    it('disminuirCantidad debería reducir la cantidad si es mayor a 1', async () => {
        await component.cargarCarrito();
        const productoA = component.carrito[0]; // Producto A: cantidad 2

        component.disminuirCantidad(productoA);

        expect(productoA.cantidad).toBe(1);
        expect(dbService.guardarCarrito).toHaveBeenCalled();
    });

    // ✅ disminuirCantidad debería eliminar el producto si la cantidad es 1
    it('disminuirCantidad debería eliminar el producto si la cantidad es 1', async () => {
        // ARRANGE: Cambiar la cantidad del producto B a 1 para la prueba
        await component.cargarCarrito();
        const productoB = component.carrito.find(p => p.id === 2); // Producto B: cantidad 1
        
        // Espiamos eliminarProducto para asegurar que se llama
        spyOn(component, 'eliminarProducto').and.callThrough();

        component.disminuirCantidad(productoB);

        // Assert: Debe llamar a eliminarProducto
        expect(component.eliminarProducto).toHaveBeenCalledWith(productoB);
        // Assert: El carrito debe tener solo 1 elemento (Producto A)
        expect(component.carrito.length).toBe(1); 
        // Assert: Se debe guardar el carrito
        expect(dbService.guardarCarrito).toHaveBeenCalled();
    });

    // ✅ vaciarCarrito debería dejar el carrito vacío
    it('vaciarCarrito debería dejar el carrito vacío', async () => {
        await component.cargarCarrito();
        expect(component.carrito.length).toBeGreaterThan(0); // Sanity check

        component.vaciarCarrito();

        expect(component.carrito.length).toBe(0);
        expect(dbService.guardarCarrito).toHaveBeenCalledWith([]);
    });

    // =================================================================
    // C. PRUEBAS DE NAVEGACIÓN Y MODAL
    // =================================================================

    // ✅ cerrarModal debería llamar a modalCtrl.dismiss
    it('cerrarModal debería llamar a modalCtrl.dismiss', () => {
        component.cerrarModal();
        expect(mockModalController.dismiss).toHaveBeenCalled();
    });

    // ✅ irAlPago debería cerrar el modal y navegar a /pago
    it('irAlPago debería cerrar el modal y navegar a /pago', async () => {
        await component.irAlPago();

        // 1. Debe cerrar el modal
        expect(mockModalController.dismiss).toHaveBeenCalled();
        // 2. Debe navegar a la ruta de pago
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/pago']);
    });
});