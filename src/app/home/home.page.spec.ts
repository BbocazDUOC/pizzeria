import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing'; // 1. LA SOLUCIÓN DEFINITIVA
import { IonicModule, NavController } from '@ionic/angular';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Espía para verificar la navegación
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Espía para que Ionic no se queje
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateForward', 'back']);

    await TestBed.configureTestingModule({
      imports: [
        HomePage, // Tu componente Standalone
        IonicModule.forRoot(), // Inicializa Ionic completamente
        RouterTestingModule // 2. Esto inyecta ActivatedRoute, Location, etc. automáticamente
      ],
      providers: [
        // Sobrescribimos el Router real con nuestro espía
        { provide: Router, useValue: routerSpy },
        // Mantenemos el NavController falso
        { provide: NavController, useValue: navControllerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería navegar a /home/menu al llamar a goMenu()', () => {
    component.goMenu();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home/menu']);
  });

  it('debería navegar a /home/pedidos al llamar a goPedidos()', () => {
    component.goPedidos();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home/pedidos']);
  });

  it('debería navegar a /home/cuenta al llamar a goCuenta()', () => {
    component.goCuenta();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home/cuenta']);
  });
});