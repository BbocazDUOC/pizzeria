import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastController, NavController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/dbtask';
import { ApiService } from 'src/app/services/api';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterPage } from './register.page';
import { of, throwError } from 'rxjs';

// ======================================================
// MOCKS
// ======================================================

// SQLite
const sqliteToken = 'SQLite';
const mockSQLite = jasmine.createSpyObj('SQLite', ['create']);

// DatabaseService
const mockDbService = jasmine.createSpyObj('DatabaseService', ['registerUser']);
mockDbService.registerUser.and.returnValue(Promise.resolve(true));

// ApiService
const mockApiService = jasmine.createSpyObj('ApiService', ['crearUsuario']);
mockApiService.crearUsuario.and.returnValue(of({ success: true }));

// ✅ SOLO NavController (NO Router)
const mockNavController = jasmine.createSpyObj('NavController', [
  'navigateRoot'
]);

// ToastController
const mockToast = jasmine.createSpyObj('Toast', ['present']);
const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
mockToastController.create.and.returnValue(Promise.resolve(mockToast));

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  const VALID_REGISTER_DATA = {
    usuario: 'testuser',
    nombre: 'Test',
    apellido: 'User',
    email: 'test@example.com',
    edad: 25,
    genero: 'M',
    password: 'Password123',
    repetirPassword: 'Password123'
  };

  const EXPECTED_API_PAYLOAD = {
    nombre_usuario: 'testuser',
    nombre_real: 'Test',
    lat: 0,
    lon: 0
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        { provide: sqliteToken, useValue: mockSQLite },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: ApiService, useValue: mockApiService },
        { provide: NavController, useValue: mockNavController },
        { provide: ToastController, useValue: mockToastController },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;

    component.registerData = { ...VALID_REGISTER_DATA };

    mockDbService.registerUser.calls.reset();
    mockApiService.crearUsuario.calls.reset();
    mockNavController.navigateRoot.calls.reset();
    mockToastController.create.calls.reset();
    mockToast.present.calls.reset();
  });

  // ======================================================
  // A. BÁSICO
  // ======================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('volverLogin debería navegar a /login', () => {
    component.volverLogin();
    expect(mockNavController.navigateRoot).toHaveBeenCalledWith('/login');
  });

  it('limpiarFormulario debería resetear registerData', () => {
    component.limpiarFormulario();

    expect(component.registerData).toEqual(jasmine.objectContaining({
      usuario: '',
      nombre: '',
      apellido: '',
      email: '',
      edad: null
    }));
  });

  // ======================================================
  // B. VALIDACIONES
  // ======================================================

  it('debería mostrar toast si falta un campo obligatorio', async () => {
    component.registerData.usuario = '';

    await component.registrar();
    await fixture.whenStable();

    expect(mockToastController.create).toHaveBeenCalled();
    expect(mockDbService.registerUser).not.toHaveBeenCalled();
    expect(mockApiService.crearUsuario).not.toHaveBeenCalled();
  });

  it('debería mostrar toast si la edad es menor a 15', async () => {
    component.registerData.edad = 14;

    await component.registrar();
    await fixture.whenStable();

    expect(mockToastController.create).toHaveBeenCalled();
    expect(mockDbService.registerUser).not.toHaveBeenCalled();
  });

  it('debería mostrar toast si las contraseñas no coinciden', async () => {
    component.registerData.repetirPassword = 'otra';

    await component.registrar();
    await fixture.whenStable();

    expect(mockToastController.create).toHaveBeenCalled();
    expect(mockDbService.registerUser).not.toHaveBeenCalled();
  });

  // ======================================================
  // C. REGISTRO LOCAL + API
  // ======================================================

  it('debería registrar local y luego llamar a la API', async () => {
    await component.registrar();
    await fixture.whenStable();

    expect(mockDbService.registerUser).toHaveBeenCalled();
    expect(mockApiService.crearUsuario).toHaveBeenCalledWith(EXPECTED_API_PAYLOAD);
  });

  it('debería navegar y limpiar formulario si la API es exitosa', async () => {
    await component.registrar();
    await fixture.whenStable();

    expect(mockNavController.navigateRoot).toHaveBeenCalledWith('/login');
    expect(component.registerData.nombre).toBe('');
  });

  it('debería manejar error HTTP 400', async () => {
    const apiError = new HttpErrorResponse({
      error: { message: 'Usuario ya existe' },
      status: 400
    });

    mockApiService.crearUsuario.and.returnValue(throwError(() => apiError));

    await component.registrar();
    await fixture.whenStable();

    expect(mockToastController.create).toHaveBeenCalled();
  });

  it('debería manejar error de red', async () => {
    mockApiService.crearUsuario.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );

    await component.registrar();
    await fixture.whenStable();

    expect(mockToastController.create).toHaveBeenCalled();
  });
});
