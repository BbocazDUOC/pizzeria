import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    children: [
      {
        path: 'menu',
        loadComponent: () => import('./menu/menu.page').then(m => m.MenuPage),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pedidos/pedidos.page').then(m => m.PedidosPage),
        canActivate: [authGuard]
      },
      {
        path: 'cuenta',
        loadComponent: () => import('./cuenta/cuenta.page').then(m => m.CuentaPage),
        canActivate: [authGuard]
      },
      {
        path: '',
        redirectTo: 'menu',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'pago',
    loadComponent: () => import('./pago/pago.page').then( m => m.PagoPage),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./error404/error404.page').then( m => m.Error404Page)
  },
];