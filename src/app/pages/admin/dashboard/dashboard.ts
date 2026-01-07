import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, User } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { getClassDisplayName } from '../../../models/attendance.model';

interface DashboardStats {
  attendance: {
    total: number;
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpha: number;
  };
  totalStudents: number;
  pendingLeaveRequests: number;
  userRole: string;
  assignedClass: string | null;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  checkInTime: string;
  status: string;
}

interface LeaveRequest {
  id: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  user: User | null = null;
  stats: DashboardStats | null = null;
  recentAttendance: AttendanceRecord[] = [];
  pendingLeaveRequests: LeaveRequest[] = [];
  loading = true;
  today = new Date().toISOString().split('T')[0];

  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  async ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/admin/login']);
      return;
    }

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;

    try {
      const headers = this.authService.getAuthHeaders();

      // Load dashboard stats
      const statsResponse = await fetch(`/api/admin?resource=dashboard`, {
        headers
      });

      if (statsResponse.status === 401 || statsResponse.status === 403) {
        // Session expired or unauthorized
        this.loading = false;
        await this.authService.logout();
        this.router.navigate(['/admin/login']);
        return;
      }

      if (statsResponse.ok) {
        this.stats = await statsResponse.json();
      } else {
        this.notificationService.error('Gagal memuat statistik dashboard');
      }

      // Load recent attendance
      const attendanceResponse = await fetch(`/api/admin?resource=attendance&date=${this.today}`, {
        headers
      });

      if (attendanceResponse.ok) {
        const allAttendance = await attendanceResponse.json();
        this.recentAttendance = allAttendance.slice(0, 10);
      }

      // Load pending leave requests
      const leaveResponse = await fetch(`/api/admin?resource=leave-requests&status=pending`, {
        headers
      });

      if (leaveResponse.ok) {
        this.pendingLeaveRequests = await leaveResponse.json();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.notificationService.error('Koneksi ke server gagal, periksa internet Anda');
    } finally {
      this.loading = false;
    }
  }

  getClassDisplayName(classCode: string | null | undefined): string {
    if (!classCode) return "";
    return getClassDisplayName(classCode);
  }

  getAttendancePercentage(): number {
    if (!this.stats || this.stats.totalStudents === 0) return 0;
    const present = (this.stats.attendance.hadir || 0) + (this.stats.attendance.terlambat || 0);
    return Math.round((present / this.stats.totalStudents) * 100);
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  async approveLeaveRequest(id: string) {
    try {
      const headers = {
        ...this.authService.getAuthHeaders(),
        'Content-Type': 'application/json'
      };

      const response = await fetch(`/api/admin?resource=leave-requests`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, status: 'approved' })
      });

      if (response.status === 401 || response.status === 403) {
        await this.authService.logout();
        this.router.navigate(['/admin/login']);
        return;
      }

      if (response.ok) {
        await this.loadDashboardData();
        this.notificationService.success('Pengajuan izin telah disetujui');
      } else if (response.status === 403) {
        this.notificationService.error('Anda tidak memiliki akses untuk menyetujui pengajuan ini');
      } else {
        this.notificationService.error('Gagal menyetujui pengajuan izin');
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      this.notificationService.error('Koneksi ke server gagal');
    }
  }

  async rejectLeaveRequest(id: string) {
    try {
      const headers = {
        ...this.authService.getAuthHeaders(),
        'Content-Type': 'application/json'
      };

      const response = await fetch(`/api/admin?resource=leave-requests`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, status: 'rejected' })
      });

      if (response.status === 401 || response.status === 403) {
        await this.authService.logout();
        this.router.navigate(['/admin/login']);
        return;
      }

      if (response.ok) {
        await this.loadDashboardData();
        this.notificationService.success('Pengajuan izin telah ditolak');
      } else if (response.status === 403) {
        this.notificationService.error('Anda tidak memiliki akses untuk menolak pengajuan ini');
      } else {
        this.notificationService.error('Gagal menolak pengajuan izin');
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      this.notificationService.error('Koneksi ke server gagal');
    }
  }
}
