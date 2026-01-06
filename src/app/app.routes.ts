import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'tentang',
    loadComponent: () => import('./pages/tentang/tentang').then(m => m.Tentang)
  },
  {
    path: 'program',
    loadComponent: () => import('./pages/program/program').then(m => m.Program)
  },
  {
    path: 'kontak',
    loadComponent: () => import('./pages/kontak/kontak').then(m => m.Kontak)
  },
  {
    path: 'portal-orangtua',
    loadComponent: () => import('./pages/absensi/parent-portal/parent-portal').then(m => m.ParentPortal)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/login/login').then(m => m.Login)
  },
  {
    path: 'login',
    redirectTo: 'admin/login',
    pathMatch: 'full'
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'admin/check-in',
    loadComponent: () => import('./pages/absensi/check-in/check-in').then(m => m.CheckIn),
    canActivate: [authGuard]
  },
  {
    path: 'admin/laporan',
    loadComponent: () => import('./pages/absensi/report/report').then(m => m.Report),
    canActivate: [authGuard]
  },
  {
    path: 'admin/siswa',
    loadComponent: () => import('./pages/absensi/students/students').then(m => m.Students),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  // Redirect old public routes to admin (with auth required)
  {
    path: 'absensi/check-in',
    redirectTo: 'admin/check-in',
    pathMatch: 'full'
  },
  {
    path: 'absensi/laporan',
    redirectTo: 'admin/laporan',
    pathMatch: 'full'
  },
  {
    path: 'absensi/siswa',
    redirectTo: 'admin/siswa',
    pathMatch: 'full'
  },
  {
    path: 'absensi/portal-orangtua',
    redirectTo: 'portal-orangtua',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
