import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { AttendanceRecord, AttendanceStats } from '../../../models/attendance.model';

@Component({
  selector: 'app-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report implements OnInit {
  selectedDate = '';
  selectedClass = 'all';
  classes: string[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  stats: AttendanceStats | null = null;

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.classes = this.attendanceService.getClasses();
    this.loadReport();
  }

  loadReport() {
    if (this.selectedClass === 'all') {
      this.attendanceRecords = this.attendanceService.getAttendanceByDate(this.selectedDate);
    } else {
      this.attendanceRecords = this.attendanceService.getAttendanceByClass(this.selectedClass, this.selectedDate);
    }
    this.stats = this.attendanceService.getAttendanceStats(this.selectedDate);
  }

  exportCSV() {
    const csv = this.attendanceService.exportToCSV(this.selectedDate);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${this.selectedDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  printReport() {
    window.print();
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('id-ID');
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'hadir': 'bg-green-100 text-green-800',
      'terlambat': 'bg-yellow-100 text-yellow-800',
      'izin': 'bg-purple-100 text-purple-800',
      'sakit': 'bg-orange-100 text-orange-800',
      'alpha': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
