import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'; // <-- fakeAsync/tick AÑADIDO
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/dbtask';
import { LoginPage } from './login.page';
import { of } from 'rxjs';

// =================================================================
// 1. MOCKS DE DEPENDENCIAS (Jasmine Spies)
// =================================================================

const SQLite_TOKEN = 'SQLite'; 
const mockSQLite = jasmine.createSpyObj('SQLite', ['create']); 

// Mock para DatabaseService
const mockDbService = jasmine.createSpyObj('DatabaseService', ['dbState', 'loginUser', 'init']);
// 🛑 CORRECCIÓN: dbState DEBE ser reasignado a un Observable.
(mockDbService as any).dbState = of(true); 
mockDbService.loginUser.and.returnValue(Promise.resolve(false));

// Mock para Router
const mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

// Mock para ToastController
const mockToast = jasmine.createSpyObj('Toast', ['present']);
const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
mockToastController.create.and.returnValue(Promise.resolve(mockToast));

describe('LoginPage', () => {
    let component: LoginPage;
    let fixture: ComponentFixture<LoginPage>;

    beforeEach(async () => {
        // Aseguramos que el mockDbService.dbState emita true por defecto
        (mockDbService as any).dbState = of(true); 

        await TestBed.configureTestingModule({
            imports: [LoginPage], // Componente standalone
            providers: [
                { provide: SQLite_TOKEN, useValue: mockSQLite }, 
                { provide: DatabaseService, useValue: mockDbService },
                { provide: Router, useValue: mockRouter },
                { provide: ToastController, useValue: mockToastController },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginPage);
        component = fixture.componentInstance;
        
        // Limpiamos los spies antes de cada test
        mockDbService.loginUser.calls.reset();
        mockRouter.navigateByUrl.calls.reset();
        mockRouter.navigate.calls.reset();
        mockToastController.create.calls.reset();
    });

    // =================================================================
    // 2. CASOS DE PRUEBA DE INICIALIZACIÓN Y NAVEGACIÓN
    // =================================================================

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('irInvitado debería navegar a /home con replaceUrl: true', () => {
        component.irInvitado();
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
    });

    it('irCrearCuenta debería navegar a /register', () => {
        component.irCrearCuenta();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });

    // =================================================================
    // 3. CASOS DE PRUEBA DEL MÉTODO login()
    // =================================================================

    describe('login', () => {
        
        it('debería establecer loading a true, llamar a loginUser y mostrar toast en caso de fallo', async () => {
            // ARRANGE: Aseguramos el fallo
            mockDbService.loginUser.and.returnValue(Promise.resolve(false));
            
            // ACT
            component.login();
            
            expect(component.loading).toBe(true);
            
            // Esperamos la resolución de la promesa de loginUser
            await fixture.whenStable();
            
            expect(mockDbService.loginUser).toHaveBeenCalled();
            expect(mockToastController.create).toHaveBeenCalled();
            expect(mockToast.present).toHaveBeenCalled();
            expect(component.loading).toBe(false); 
        });

        // ✅ CORRECCIÓN: Se eliminó 'done' del argumento y se utiliza solo async/await con jasmine.clock
        it('debería establecer loading a true, llamar a loginUser y navegar a /home en caso de éxito', async () => {
            // ARRANGE: Simular éxito
            mockDbService.loginUser.and.returnValue(Promise.resolve(true));
            
            jasmine.clock().install();

            // ACT
            component.login();
            
            expect(component.loading).toBe(true);
            
            await fixture.whenStable();

            // Avanzamos el reloj 1000ms para simular el setTimeout
            jasmine.clock().tick(1001); 

            // ASSERT 2: Navegación
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
            
            jasmine.clock().uninstall();
        });

        // ✅ CORRECCIÓN: Se reasigna dbState para que emita false.
        it('no debería ejecutar loginUser si dbState no está listo', async () => {
            // ARRANGE: Simular que la DB no está lista
            (mockDbService as any).dbState = of(false); 

            // ACT
            component.login();

            await fixture.whenStable(); 

            // ASSERT
            expect(mockDbService.loginUser).not.toHaveBeenCalled();
            expect(component.loading).toBe(true); 
        });
    });

    // =================================================================
    // 4. CASOS DE PRUEBA DEL MÉTODO presentToast()
    // =================================================================

    describe('presentToast', () => {
        it('debería crear y presentar un toast con los parámetros correctos', async () => {
            const message = 'Mensaje de prueba';
            const color = 'success';

            await component.presentToast(message, color);

            // ASSERT
            expect(mockToastController.create).toHaveBeenCalledWith(jasmine.objectContaining({
                message: message,
                duration: 2000,
                color: color
            }));
            expect(mockToast.present).toHaveBeenCalled();
        });
    });
});