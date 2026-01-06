import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Student, AttendanceRecord, AttendanceStats, LeaveRequest } from '../models/attendance.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceHttpService {
  private apiUrl = environment.apiUrl;
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  public students$ = this.studentsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStudents();
  }

  // Student Management
  async loadStudents(): Promise<void> {
    try {
      const students = await firstValueFrom(
        this.http.get<Student[]>(`${this.apiUrl}/students`)
      );
      this.studentsSubject.next(students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }

  getStudents(): Student[] {
    return this.studentsSubject.value;
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    try {
      return await firstValueFrom(
        this.http.get<Student>(`${this.apiUrl}/students?id=${id}`)
      );
    } catch (error) {
      console.error('Error getting student:', error);
      return undefined;
    }
  }

  async getStudentByNis(nis: string): Promise<Student | undefined> {
    try {
      return await firstValueFrom(
        this.http.get<Student>(`${this.apiUrl}/students?nis=${nis}`)
      );
    } catch (error) {
      console.error('Error getting student by NIS:', error);
      return undefined;
    }
  }

  async getStudentByQrCode(qrCode: string): Promise<Student | undefined> {
    try {
      return await firstValueFrom(
        this.http.get<Student>(`${this.apiUrl}/students?qrCode=${qrCode}`)
      );
    } catch (error) {
      console.error('Error getting student by QR code:', error);
      return undefined;
    }
  }

  getStudentsByClass(className: string): Student[] {
    return this.studentsSubject.value.filter(s => s.class === className);
  }

  async addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
    try {
      const newStudent = await firstValueFrom(
        this.http.post<Student>(`${this.apiUrl}/students`, student)
      );
      await this.loadStudents();
      return newStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  }

  // Attendance Management
  async checkIn(qrCode: string, notes?: string): Promise<AttendanceRecord | null> {
    try {
      const record = await firstValueFrom(
        this.http.post<AttendanceRecord>(`${this.apiUrl}/attendance`, { qrCode, notes })
      );
      return record;
    } catch (error: any) {
      if (error.status === 409) {
        // Already checked in
        return error.error.record;
      }
      console.error('Error checking in:', error);
      return null;
    }
  }

  async checkOut(studentId: string): Promise<AttendanceRecord | null> {
    try {
      const checkOutTime = new Date().toISOString();
      const record = await firstValueFrom(
        this.http.put<AttendanceRecord>(`${this.apiUrl}/attendance`, { studentId, checkOutTime })
      );
      return record;
    } catch (error) {
      console.error('Error checking out:', error);
      return null;
    }
  }

  async markAttendance(studentId: string, status: AttendanceRecord['status'], notes?: string): Promise<AttendanceRecord> {
    try {
      const record = await firstValueFrom(
        this.http.post<AttendanceRecord>(`${this.apiUrl}/attendance`, { studentId, status, notes })
      );
      return record;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  // Reporting
  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    try {
      return await firstValueFrom(
        this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance?date=${date}`)
      );
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      return [];
    }
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    try {
      const allRecords = await firstValueFrom(
        this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance`)
      );
      return allRecords.filter(a => a.date >= startDate && a.date <= endDate);
    } catch (error) {
      console.error('Error getting attendance by date range:', error);
      return [];
    }
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    try {
      return await firstValueFrom(
        this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance?studentId=${studentId}`)
      );
    } catch (error) {
      console.error('Error getting attendance by student:', error);
      return [];
    }
  }

  async getAttendanceByClass(className: string, date: string): Promise<AttendanceRecord[]> {
    try {
      return await firstValueFrom(
        this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance?date=${date}&className=${className}`)
      );
    } catch (error) {
      console.error('Error getting attendance by class:', error);
      return [];
    }
  }

  async getAttendanceStats(date: string): Promise<AttendanceStats> {
    try {
      return await firstValueFrom(
        this.http.get<AttendanceStats>(`${this.apiUrl}/attendance?action=stats&date=${date}`)
      );
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      return {
        totalStudents: 0,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        belumAbsen: 0
      };
    }
  }

  getClasses(): string[] {
    const classes = new Set(this.studentsSubject.value.map(s => s.class));
    return Array.from(classes).sort();
  }

  async exportToCSV(date: string): Promise<string> {
    const attendance = await this.getAttendanceByDate(date);
    const headers = ['NIS', 'Nama', 'Kelas', 'Status', 'Waktu Check-in', 'Waktu Check-out', 'Catatan'];
    const rows = attendance.map(a => [
      a.studentNis,
      a.studentName,
      a.studentClass,
      a.status,
      new Date(a.checkInTime).toLocaleString('id-ID'),
      a.checkOutTime ? new Date(a.checkOutTime).toLocaleString('id-ID') : '-',
      a.notes || '-'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Leave Request Management
  async submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>): Promise<LeaveRequest> {
    try {
      const newRequest = await firstValueFrom(
        this.http.post<LeaveRequest>(`${this.apiUrl}/leave-requests`, request)
      );
      return newRequest;
    } catch (error) {
      console.error('Error submitting leave request:', error);
      throw error;
    }
  }

  async getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]> {
    try {
      return await firstValueFrom(
        this.http.get<LeaveRequest[]>(`${this.apiUrl}/leave-requests?studentId=${studentId}`)
      );
    } catch (error) {
      console.error('Error getting leave requests:', error);
      return [];
    }
  }

  async getLeaveRequestsByNis(nis: string): Promise<LeaveRequest[]> {
    try {
      return await firstValueFrom(
        this.http.get<LeaveRequest[]>(`${this.apiUrl}/leave-requests?nis=${nis}`)
      );
    } catch (error) {
      console.error('Error getting leave requests:', error);
      return [];
    }
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      return await firstValueFrom(
        this.http.get<LeaveRequest[]>(`${this.apiUrl}/leave-requests`)
      );
    } catch (error) {
      console.error('Error getting all leave requests:', error);
      return [];
    }
  }

  async updateLeaveRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<LeaveRequest | null> {
    try {
      return await firstValueFrom(
        this.http.put<LeaveRequest>(`${this.apiUrl}/leave-requests`, { id: requestId, status })
      );
    } catch (error) {
      console.error('Error updating leave request status:', error);
      return null;
    }
  }
}
