import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'estado',
  },
  {
    path: 'estado',
    title: 'Estado — Panel de verificación IaC',
    loadComponent: () =>
      import('./features/status/status-page').then((module) => module.StatusPage),
  },
  {
    path: 'registros',
    title: 'Registros — Panel de verificación IaC',
    loadComponent: () =>
      import('./features/records/records-page').then((module) => module.RecordsPage),
  },
  {
    path: '**',
    title: 'Página no encontrada — Panel de verificación IaC',
    loadComponent: () =>
      import('./shared/not-found/not-found-page').then((module) => module.NotFoundPage),
  },
];
