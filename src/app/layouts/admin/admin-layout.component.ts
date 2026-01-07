import { Component, OnInit, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  sidenavOpened = signal(true);
  currentUser = computed(() => this.authService.currentUser());
  pendingLeaveRequestsCount = signal(0);

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'qr_code_scanner', label: 'Check-In', route: '/admin/check-in' },
    { icon: 'people', label: 'Siswa', route: '/admin/siswa' },
    { icon: 'assignment', label: 'Laporan', route: '/admin/laporan' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingLeaveRequests();
  }

  async loadPendingLeaveRequests(): Promise<void> {
    try {
      const response = await fetch('/api/leave-requests?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          this.pendingLeaveRequestsCount.set(data.length);
        }
      }
    } catch (error) {
      console.error('Error loading pending leave requests:', error);
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  get userInitials(): string {
    const user = this.currentUser();
    if (!user?.full_name) return 'U';

    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.full_name.substring(0, 2).toUpperCase();
  }

  get userRole(): string {
    const user = this.currentUser();
    return user?.role === 'admin' ? 'Administrator' : 'Wali Kelas';
  }

  shouldShowNavItem(item: NavItem): boolean {
    if (!item.adminOnly) return true;
    return this.currentUser()?.role === 'admin';
  }
}
