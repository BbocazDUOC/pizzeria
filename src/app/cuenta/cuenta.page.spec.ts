import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing'; 
import { CuentaPage } from './cuenta.page';
import { Router } from '@angular/router';
import { ToastController, ActionSheetController, Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/dbtask'; 
import { Camera, CameraSource } from '@capacitor/camera'; 

// =================================================================
// 1. MOCKS DE DATOS
// =================================================================

// Mock para el usuario de sesión (Usamos Deep Copy para el servicio getUsuario)
const MOCK_USER_DATA = {
    usuario: 'testuser',
    nombre: 'Test',
    apellido: 'User',
    email: 'test@example.com',
    edad: 30,
    genero: 'M',
    password: '123',
    foto: 'base64_foto_anterior'
};

// --- Mocks de Servicios ---

const mockSQLite = jasmine.createSpyObj('SQLite', ['create']); 

const mockDbService = jasmine.createSpyObj('DatabaseService', [
    'getSession', 
    'getUsuario', 
    'actualizarUsuario', 
    'closeSession'
]);
mockDbService.getSession.and.returnValue(Promise.resolve(MOCK_USER_DATA.email));
// DEBE devolver una copia para que la foto actualizada en el componente no afecte la fuente
mockDbService.getUsuario.and.returnValue(Promise.resolve({...MOCK_USER_DATA})); 
mockDbService.actualizarUsuario.and.returnValue(Promise.resolve(true));
mockDbService.closeSession.and.returnValue(Promise.resolve(true));

// Mock para Router
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

// Mock para ToastController
const mockToast = jasmine.createSpyObj('Toast', ['present']);
const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
mockToastController.create.and.returnValue(Promise.resolve(mockToast));

// Mock para ActionSheetController
const mockActionSheet = jasmine.createSpyObj('ActionSheet', ['present']);
const mockActionSheetController = jasmine.createSpyObj('ActionSheetController', ['create']);
mockActionSheetController.create.and.returnValue(Promise.resolve(mockActionSheet));

// Mock para Platform
const mockPlatform = jasmine.createSpyObj('Platform', ['is']);
mockPlatform.is.and.returnValue(true);


// Mock para Capacitor Camera
const mockCamera = jasmine.createSpyObj('Camera', ['getPhoto']);
const NEW_PHOTO_DATA = { dataUrl: 'base64_new_photo_resolved', format: 'jpeg', webPath: 'base64_new_photo_resolved' };
mockCamera.getPhoto.and.returnValue(Promise.resolve(NEW_PHOTO_DATA as any));

// =================================================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// =================================================================

describe('CuentaPage', () => {
    let component: CuentaPage;
    let fixture: ComponentFixture<CuentaPage>;

    beforeEach(async () => {
        const sqliteToken = 'SQLite'; 

        await TestBed.configureTestingModule({
            imports: [CuentaPage],
            providers: [
                { provide: sqliteToken, useValue: mockSQLite }, 
                { provide: DatabaseService, useValue: mockDbService },
                { provide: Router, useValue: mockRouter },
                { provide: ToastController, useValue: mockToastController },
                { provide: ActionSheetController, useValue: mockActionSheetController },
                { provide: Platform, useValue: mockPlatform },
                { provide: Camera, useValue: mockCamera } 
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CuentaPage);
        component = fixture.componentInstance;

        // Limpieza de Spies (siempre al inicio)
        mockDbService.getSession.calls.reset();
        mockDbService.getUsuario.calls.reset();
        mockDbService.actualizarUsuario.calls.reset();
        mockRouter.navigate.calls.reset();
        mockToastController.create.calls.reset();
        mockCamera.getPhoto.calls.reset();
        mockToast.present.calls.reset(); 
        
        // Reconfiguración de valores
        mockDbService.getSession.and.returnValue(Promise.resolve(MOCK_USER_DATA.email));
        mockDbService.getUsuario.and.returnValue(Promise.resolve({...MOCK_USER_DATA})); 
        mockDbService.actualizarUsuario.and.returnValue(Promise.resolve(true));
        mockCamera.getPhoto.and.returnValue(Promise.resolve(NEW_PHOTO_DATA as any));
    });

    // =================================================================
    // A. PRUEBAS DE INICIALIZACIÓN (ngOnInit)
    // =================================================================

    describe('ngOnInit', () => {
        it('debería cargar los datos del usuario si existe una sesión activa', async () => {
            await component.ngOnInit();
            expect(mockDbService.getSession).toHaveBeenCalled();
            expect(mockDbService.getUsuario).toHaveBeenCalledWith(MOCK_USER_DATA.email);
            expect(component.usuario.nombre).toBe(MOCK_USER_DATA.nombre);
        });

        it('debería mostrar un toast de error si no se pueden cargar los datos del usuario', async () => {
            mockDbService.getUsuario.and.returnValue(Promise.resolve(null));
            await component.ngOnInit();
            expect(mockDbService.getUsuario).toHaveBeenCalled();
            expect(mockToastController.create).toHaveBeenCalled(); 
            expect(mockToast.present).toHaveBeenCalled(); 
        });

        it('no debería cargar datos si no hay sesión activa', async () => {
            mockDbService.getSession.and.returnValue(Promise.resolve(null));
            await component.ngOnInit();
            expect(mockDbService.getSession).toHaveBeenCalled();
            expect(mockDbService.getUsuario).not.toHaveBeenCalled();
            expect(component.usuario.email).toBe(''); 
        });
    });

    // =================================================================
    // B. PRUEBAS DE CAMBIO DE FOTO (ActionSheet y Camera)
    // =================================================================

    describe('cambiarFoto', () => {
        it('debería presentar el ActionSheet con las opciones correctas', async () => {
            await component.cambiarFoto();
            expect(mockActionSheetController.create).toHaveBeenCalled();
            expect(mockActionSheet.present).toHaveBeenCalled();
        });
    });

    describe('seleccionarFoto', () => {
        // Inicializamos el componente ANTES de cada test del describe (usando async)
        beforeEach(async () => {
            await component.ngOnInit();
            // Limpiamos los calls después de ngOnInit 
            mockCamera.getPhoto.calls.reset(); 
            mockDbService.actualizarUsuario.calls.reset(); 
            mockToastController.create.calls.reset();
            mockToast.present.calls.reset();
        });

        // 1. CORRECCIÓN: Uso de fakeAsync para evitar el Timeout en esta comprobación de parámetros
        it('debería llamar a Camera.getPhoto con CameraSource.Photos si opcion es "elegir"', fakeAsync(() => { 
            component.seleccionarFoto('elegir');
            
            // Forzar la resolución de la promesa.
            tick(); 
            
            expect(mockCamera.getPhoto).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    source: CameraSource.Photos 
                })
            );
            flushMicrotasks();
        }));

        it('debería llamar a Camera.getPhoto con CameraSource.Camera si opcion es "sacar"', fakeAsync(() => {
            component.seleccionarFoto('sacar');
            
            tick(); 

            expect(mockCamera.getPhoto).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    source: CameraSource.Camera 
                })
            );
            flushMicrotasks();
        }));

        // 2. CORRECCIÓN: Uso de fakeAsync y aserciones estrictas para la foto y DB
        it('debería actualizar la foto, actualizar el usuario en DB y mostrar toast de éxito', fakeAsync(() => { 
            
            component.seleccionarFoto('elegir'); // ACT

            // 1. Resuelve getPhoto (Promesa de la cámara)
            tick(); 

            // ASSERT 1: Foto del componente actualizada (FALLO anterior corregido aquí)
            expect(component.usuario.foto).toBe(NEW_PHOTO_DATA.dataUrl);
            
            // 2. Resuelve actualizarUsuario (Promesa de la DB)
            tick(); 

            // ASSERT 2: La DB fue llamada con el objeto actualizado
            expect(mockDbService.actualizarUsuario).toHaveBeenCalledWith(
                jasmine.objectContaining({ foto: NEW_PHOTO_DATA.dataUrl })
            );
            
            // 3. Resuelve toastController.create (Promesa del Toast)
            tick();

            // ASSERT 3: Toast presentado
            expect(mockToastController.create).toHaveBeenCalled(); 
            expect(mockToast.present).toHaveBeenCalled();
            
            flushMicrotasks();
        }));

        it('debería mostrar un toast de error si falla la selección de la foto', fakeAsync(() => {
            // ARRANGE: Simular que la cámara lanza un error
            mockCamera.getPhoto.and.returnValue(Promise.reject(new Error('Permiso denegado')));

            component.seleccionarFoto('elegir');

            // Simular resolución de la promesa fallida.
            tick(); 

            // ASSERT:
            expect(mockToastController.create).toHaveBeenCalled();
            expect(mockDbService.actualizarUsuario).not.toHaveBeenCalled();
            
            flushMicrotasks();
        }));
        
    });

    // =================================================================
    // C. PRUEBAS DE GUARDAR CAMBIOS (Actualizar perfil)
    // =================================================================

    describe('guardarCambios', () => {
        beforeEach(async () => {
            await component.ngOnInit();
            mockDbService.actualizarUsuario.calls.reset();
            mockToastController.create.calls.reset();
            mockDbService.actualizarUsuario.and.returnValue(Promise.resolve(true)); 
        });

        it('debería actualizar el usuario y mostrar toast de éxito si los datos son válidos', async () => {
            await component.guardarCambios();
            expect(mockDbService.actualizarUsuario).toHaveBeenCalledWith(component.usuario);
            expect(mockToastController.create).toHaveBeenCalled();
            expect((mockToastController.create as jasmine.Spy).calls.argsFor(0)[0].message).toContain('Perfil actualizado');
        });

        it('debería mostrar toast de advertencia si faltan nombre o apellido', async () => {
            component.usuario.nombre = ''; 
            await component.guardarCambios();
            expect(mockDbService.actualizarUsuario).not.toHaveBeenCalled();
            expect(mockToastController.create).toHaveBeenCalled();
            expect((mockToastController.create as jasmine.Spy).calls.argsFor(0)[0].message).toContain('obligatorios');
        });

        it('debería mostrar toast de error si la actualización en DB falla', async () => {
            mockDbService.actualizarUsuario.and.returnValue(Promise.resolve(false));
            await component.guardarCambios();
            expect(mockDbService.actualizarUsuario).toHaveBeenCalled();
            expect(mockToastController.create).toHaveBeenCalled();
            expect((mockToastController.create as jasmine.Spy).calls.argsFor(0)[0].message).toContain('Error al guardar');
        });
    });
});