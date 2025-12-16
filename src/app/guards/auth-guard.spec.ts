import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/dbtask';
import { authGuard } from './auth-guard';

// =================================================================
// 1. MOCKS DE DEPENDENCIAS INYECTADAS
// =================================================================

// Mock para DatabaseService
const mockDbService = jasmine.createSpyObj('DatabaseService', ['getSession']);

// Mock para Router
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

// Mock para ToastController
const mockToast = jasmine.createSpyObj('Toast', ['present']);
const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
mockToastController.create.and.returnValue(Promise.resolve(mockToast));


describe('authGuard', () => {
    // Definición de las instancias (opcional, pero ayuda a la claridad)
    let dbService: jasmine.SpyObj<DatabaseService>;
    let router: jasmine.SpyObj<Router>;
    let toastController: jasmine.SpyObj<ToastController>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: ToastController, useValue: mockToastController },
                { provide: DatabaseService, useValue: mockDbService },
            ],
        });
        
        // Inyectamos y asignamos las referencias con sus tipos mockeados
        dbService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;

        // Limpieza de Spies antes de cada test
        dbService.getSession.calls.reset();
        router.navigate.calls.reset();
        toastController.create.calls.reset();
        mockToast.present.calls.reset();
    });

    // =================================================================
    // 2. CASOS DE PRUEBA
    // =================================================================

    it('debería retornar true y permitir el acceso si existe una sesión activa', async () => {
        // ARRANGE: Simular una sesión activa (ej. un email)
        dbService.getSession.and.returnValue(Promise.resolve('usuario@dominio.com'));

        // ACT: Ejecutar el guard en el contexto de inyección simulado
        const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

        // ASSERT:
        expect(dbService.getSession).toHaveBeenCalled();
        expect(result).toBe(true);
        
        // Verificación de efectos secundarios NO deseados
        expect(router.navigate).not.toHaveBeenCalled();
        expect(toastController.create).not.toHaveBeenCalled();
    });

    it('debería retornar false, navegar a /login y mostrar un toast si NO hay sesión activa', async () => {
        // ARRANGE: Simular que no hay sesión activa (ej. null)
        dbService.getSession.and.returnValue(Promise.resolve(null));

        // ACT: Ejecutar el guard
        const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

        // ASSERT:
        expect(dbService.getSession).toHaveBeenCalled();
        expect(result).toBe(false);

        // 1. Verificar que se creó y se mostró el toast de error
        expect(toastController.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ 
                message: jasmine.any(String), // Más flexible que la cadena literal
                color: 'danger',
                duration: 2000
            })
        );
        expect(mockToast.present).toHaveBeenCalled();

        // 2. Verificar que se llamó a la navegación a /login
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});