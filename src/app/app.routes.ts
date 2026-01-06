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
    path: 'absensi/check-in',
    loadComponent: () => import('./pages/absensi/check-in/check-in').then(m => m.CheckIn)
  },
  {
    path: 'absensi/laporan',
    loadComponent: () => import('./pages/absensi/report/report').then(m => m.Report)
  },
  {
    path: 'absensi/siswa',
    loadComponent: () => import('./pages/absensi/students/students').then(m => m.Students)
  },
  {
    path: 'absensi/portal-orangtua',
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
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
