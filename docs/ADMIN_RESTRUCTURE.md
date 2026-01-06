# Admin Portal Restructure - Implementation Guide

## Overview

Restructuring the application to move attendance-related features into the admin portal with authentication, while keeping the Parent Portal public with enhanced search functionality.

**Date**: 2026-01-07
**Status**: 🚧 In Progress

## Changes Summary

### ✅ Completed

1. **Database Schema Updated**
   - Added `scanned_by` and `scanner_name` fields to attendance table
   - Tracks which user scanned each attendance record

2. **Routes Reorganized**
   - Moved check-in, reports, and student data to `/admin/*` routes
   - All admin routes protected with `authGuard`
   - Portal Orang Tua moved to `/portal-orangtua` (public)

### 🚧 To Be Implemented

#### 1. Update Dashboard Quick Actions

**File**: [`src/app/pages/admin/dashboard/dashboard.html`](../src/app/pages/admin/dashboard/dashboard.html)

Update the quick action links (around line 240-283):

```html
<!-- Quick Actions -->
<div class="mt-8">
  <h3 class="text-xl font-bold text-gray-900 mb-4">Akses Cepat</h3>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Check-In -->
    <a routerLink="/admin/check-in" class="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div class="flex items-center space-x-4">
        <div class="bg-primary-100 p-3 rounded-lg">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
          </svg>
        </div>
        <div>
          <p class="font-bold text-gray-900">Scan Kehadiran</p>
          <p class="text-sm text-gray-600">QR Scanner & Manual</p>
        </div>
      </div>
    </a>

    <!-- Reports -->
    <a routerLink="/admin/laporan" class="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div class="flex items-center space-x-4">
        <div class="bg-blue-100 p-3 rounded-lg">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <p class="font-bold text-gray-900">Laporan Absensi</p>
          <p class="text-sm text-gray-600">Lihat & Export Data</p>
        </div>
      </div>
    </a>

    <!-- Student Data -->
    <a routerLink="/admin/siswa" class="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div class="flex items-center space-x-4">
        <div class="bg-purple-100 p-3 rounded-lg">
          <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <div>
          <p class="font-bold text-gray-900">Data Siswa</p>
          <p class="text-sm text-gray-600">Kelola & Generate QR</p>
        </div>
      </div>
    </a>
  </div>
</div>
```

#### 2. Update Check-In Component to Track Scanner

**File**: [`src/app/pages/absensi/check-in/check-in.ts`](../src/app/pages/absensi/check-in/check-in.ts)

Add authentication check and pass user info:

```typescript
import { AuthService } from '../../../services/auth.service';

export class CheckIn implements OnInit {
  // ... existing properties

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.updateDateTime();
    this.loadStats();
    setInterval(() => this.updateDateTime(), 1000);
  }

  async processCheckIn() {
    if (!this.qrCodeInput.trim()) {
      this.showMessage('Mohon scan atau masukkan kode QR', 'error');
      return;
    }

    // Get current user
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showMessage('Sesi login berakhir, mohon login kembali', 'error');
      this.router.navigate(['/admin/login']);
      return;
    }

    const result = this.attendanceService.checkIn(
      this.qrCodeInput.trim(),
      currentUser.id,
      currentUser.name
    );

    if (result) {
      this.lastCheckIn = result;
      const status = result.status === 'hadir' ? 'tepat waktu' : result.status;
      this.showMessage(`Check-in berhasil! Status: ${status}`, 'success');
      this.loadStats();
      this.qrCodeInput = '';
      this.playSound('success');
    } else {
      this.showMessage('QR Code tidak valid atau siswa tidak ditemukan', 'error');
      this.playSound('error');
    }
  }
}
```

#### 3. Update AttendanceService

**File**: [`src/app/services/attendance.service.ts`](../src/app/services/attendance.service.ts)

Update checkIn method to accept and store scanner info:

```typescript
checkIn(qrCode: string, scannedBy?: string, scannerName?: string): AttendanceRecord | null {
  const student = this.students.find(s => s.qrCode === qrCode && s.active);

  if (!student) {
    return null;
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Check if already checked in today
  const existingRecord = this.getAttendanceRecords().find(
    r => r.studentId === student.id && r.date === today
  );

  if (existingRecord) {
    return existingRecord; // Already checked in
  }

  // Determine status based on time (example: late if after 7:30 AM)
  const checkInTime = now.getHours() * 60 + now.getMinutes();
  const lateTime = 7 * 60 + 30; // 7:30 AM
  const status: 'hadir' | 'terlambat' = checkInTime > lateTime ? 'terlambat' : 'hadir';

  const record: AttendanceRecord = {
    id: `att${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    studentNis: student.nis,
    studentClass: student.class,
    checkInTime: now.toISOString(),
    date: today,
    status,
    scannedBy,      // NEW
    scannerName,    // NEW
  };

  // Save to localStorage
  const records = this.getAttendanceRecords();
  records.push(record);
  localStorage.setItem('attendanceRecords', JSON.stringify(records));

  return record;
}
```

#### 4. Update Parent Portal with Real-time Search

**File**: [`src/app/pages/absensi/parent-portal/parent-portal.ts`](../src/app/pages/absensi/parent-portal/parent-portal.ts)

Complete rewrite with search functionality:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

interface SearchResult {
  id: string;
  nis: string;
  name: string;
  class: string;
  gender?: string;
}

@Component({
  selector: 'app-parent-portal',
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-portal.html',
  styleUrl: './parent-portal.css'
})
export class ParentPortal implements OnInit {
  searchQuery = '';
  searchResults: SearchResult[] = [];
  selectedStudent: SearchResult | null = null;
  attendanceRecords: any[] = [];
  isSearching = false;
  showResults = false;

  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged() // Only emit if value changed
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;

    if (query.length >= 2) {
      this.isSearching = true;
      this.showResults = true;
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
      this.showResults = false;
      this.isSearching = false;
    }
  }

  async performSearch(query: string) {
    try {
      const response = await fetch(`/api/students`);
      if (!response.ok) throw new Error('Search failed');

      const allStudents = await response.json();

      // Filter by NIS or Name
      this.searchResults = allStudents.filter((student: any) =>
        student.nis.includes(query) ||
        student.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10); // Limit to 10 results

      this.isSearching = false;
    } catch (error) {
      console.error('Search error:', error);
      this.isSearching = false;
      this.searchResults = [];
    }
  }

  async selectStudent(student: SearchResult) {
    this.selectedStudent = student;
    this.showResults = false;
    this.searchQuery = `${student.name} (${student.nis})`;

    // Load attendance records
    await this.loadAttendanceRecords(student.id);
  }

  async loadAttendanceRecords(studentId: string) {
    try {
      const response = await fetch(`/api/attendance?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to load attendance');

      this.attendanceRecords = await response.json();
    } catch (error) {
      console.error('Error loading attendance:', error);
      this.attendanceRecords = [];
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.selectedStudent = null;
    this.attendanceRecords = [];
    this.showResults = false;
  }

  getAttendanceStats() {
    if (!this.attendanceRecords.length) return null;

    return {
      total: this.attendanceRecords.length,
      hadir: this.attendanceRecords.filter(r => r.status === 'hadir').length,
      terlambat: this.attendanceRecords.filter(r => r.status === 'terlambat').length,
      izin: this.attendanceRecords.filter(r => r.status === 'izin').length,
      sakit: this.attendanceRecords.filter(r => r.status === 'sakit').length,
      alpha: this.attendanceRecords.filter(r => r.status === 'alpha').length,
    };
  }
}
```

**File**: [`src/app/pages/absensi/parent-portal/parent-portal.html`](../src/app/pages/absensi/parent-portal/parent-portal.html)

Create new template:

```html
<div class="min-h-screen bg-gray-50 py-12">
  <div class="container mx-auto px-4 max-w-4xl">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-display font-bold text-gray-900 mb-2">Portal Orang Tua</h1>
      <p class="text-lg text-gray-600">Pantau kehadiran anak Anda secara real-time</p>
    </div>

    <!-- Search Box -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-8 relative">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Cari Siswa (NIS atau Nama)
      </label>

      <div class="relative">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearchInput($event)"
          placeholder="Ketik NIS atau nama siswa..."
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
          autocomplete="off"
        />

        @if (searchQuery) {
          <button
            (click)="clearSearch()"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        }
      </div>

      <!-- Search Results Dropdown -->
      @if (showResults) {
        <div class="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto">
          @if (isSearching) {
            <div class="p-4 text-center text-gray-500">
              <div class="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
              <p class="mt-2">Mencari...</p>
            </div>
          } @else if (searchResults.length === 0) {
            <div class="p-4 text-center text-gray-500">
              Tidak ada hasil yang ditemukan
            </div>
          } @else {
            @for (student of searchResults; track student.id) {
              <button
                (click)="selectStudent(student)"
                class="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                <p class="font-semibold text-gray-900">{{ student.name }}</p>
                <p class="text-sm text-gray-600">NIS: {{ student.nis }} • Kelas: {{ student.class }}</p>
              </button>
            }
          }
        </div>
      }
    </div>

    <!-- Student Info & Attendance -->
    @if (selectedStudent) {
      <!-- Student Card -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Informasi Siswa</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-600">Nama</p>
            <p class="font-semibold text-gray-900">{{ selectedStudent.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">NIS</p>
            <p class="font-semibold text-gray-900">{{ selectedStudent.nis }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Kelas</p>
            <p class="font-semibold text-gray-900">{{ selectedStudent.class }}</p>
          </div>
          @if (selectedStudent.gender) {
            <div>
              <p class="text-sm text-gray-600">Jenis Kelamin</p>
              <p class="font-semibold text-gray-900">{{ selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Attendance Stats -->
      @if (getAttendanceStats(); as stats) {
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Statistik Kehadiran</h2>
          <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
              <p class="text-sm text-gray-600">Total</p>
            </div>
            <div class="text-center p-3 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ stats.hadir }}</p>
              <p class="text-sm text-gray-600">Hadir</p>
            </div>
            <div class="text-center p-3 bg-yellow-50 rounded-lg">
              <p class="text-2xl font-bold text-yellow-600">{{ stats.terlambat }}</p>
              <p class="text-sm text-gray-600">Terlambat</p>
            </div>
            <div class="text-center p-3 bg-blue-50 rounded-lg">
              <p class="text-2xl font-bold text-blue-600">{{ stats.izin }}</p>
              <p class="text-sm text-gray-600">Izin</p>
            </div>
            <div class="text-center p-3 bg-orange-50 rounded-lg">
              <p class="text-2xl font-bold text-orange-600">{{ stats.sakit }}</p>
              <p class="text-sm text-gray-600">Sakit</p>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ stats.alpha }}</p>
              <p class="text-sm text-gray-600">Alpha</p>
            </div>
          </div>
        </div>
      }

      <!-- Attendance Records -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Riwayat Kehadiran</h2>

        @if (attendanceRecords.length === 0) {
          <p class="text-center text-gray-500 py-8">Belum ada riwayat kehadiran</p>
        } @else {
          <div class="space-y-3">
            @for (record of attendanceRecords; track record.id) {
              <div class="p-4 border-2 border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-gray-900">{{ record.date }}</p>
                    <p class="text-sm text-gray-600">
                      Check-in: {{ record.checkInTime | date:'HH:mm' }}
                      @if (record.scannerName) {
                        <span class="text-gray-400">• Oleh: {{ record.scannerName }}</span>
                      }
                    </p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-sm font-semibold"
                        [ngClass]="{
                          'bg-green-100 text-green-800': record.status === 'hadir',
                          'bg-yellow-100 text-yellow-800': record.status === 'terlambat',
                          'bg-blue-100 text-blue-800': record.status === 'izin',
                          'bg-orange-100 text-orange-800': record.status === 'sakit',
                          'bg-red-100 text-red-800': record.status === 'alpha'
                        }">
                    {{ record.status }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <!-- Empty State -->
      <div class="bg-white rounded-xl shadow-lg p-12 text-center">
        <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3 class="text-xl font-bold text-gray-700 mb-2">Cari Siswa</h3>
        <p class="text-gray-500">Gunakan kotak pencarian di atas untuk menemukan siswa</p>
      </div>
    }
  </div>
</div>
```

## Implementation Checklist

- [x] Update database schema (attendance table)
- [x] Update TypeScript interfaces
- [x] Update routes configuration
- [ ] Update Dashboard quick action links
- [ ] Update Check-In component with auth tracking
- [ ] Update AttendanceService with scanner info
- [ ] Implement Parent Portal search functionality
- [ ] Test all auth-protected routes
- [ ] Test Parent Portal search
- [ ] Update API endpoints to save scanner info
- [ ] Create database migration script

## API Changes Needed

### Update Attendance API

**File**: `api/attendance.ts`

Add scanned_by and scanner_name to INSERT:

```typescript
await sql`
  INSERT INTO attendance (
    id, student_id, student_name, student_nis, student_class,
    check_in_time, date, status, scanned_by, scanner_name, created_at
  )
  VALUES (
    ${id}, ${studentId}, ${studentName}, ${studentNis}, ${studentClass},
    ${checkInTime}, ${date}, ${status}, ${scannedBy}, ${scannerName}, ${createdAt}
  )
`;
```

## Testing Steps

1. **Build Application**
   ```bash
   pnpm build
   ```

2. **Test Admin Routes (Requires Auth)**
   - `/admin/login` - Login page
   - `/admin/dashboard` - Dashboard
   - `/admin/check-in` - Check-in (should redirect if not logged in)
   - `/admin/laporan` - Reports (should redirect if not logged in)
   - `/admin/siswa` - Students (should redirect if not logged in)

3. **Test Public Routes**
   - `/portal-orangtua` - Parent portal (no auth required)

4. **Test Parent Portal Search**
   - Type 2+ characters
   - Should show loading state
   - Results appear after 300ms delay
   - Select a student
   - View attendance records

## Migration for Production

```sql
-- Add scanner tracking columns
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS scanned_by TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS scanner_name TEXT;
ALTER TABLE attendance ADD CONSTRAINT fk_scanned_by FOREIGN KEY (scanned_by) REFERENCES users(id);
```

---

**Last Updated**: 2026-01-07
**Status**: Implementation Guide Created
**Next Steps**: Implement components according to this guide
