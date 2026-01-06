import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Student, AttendanceRecord, AttendanceDatabase, AttendanceStats, LeaveRequest } from '../models/attendance.model';
import attendanceData from '../data/attendance-db.json';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private dbSubject = new BehaviorSubject<AttendanceDatabase>(attendanceData as AttendanceDatabase);
  public db$ = this.dbSubject.asObservable();

  private get db(): AttendanceDatabase {
    return this.dbSubject.value;
  }

  private updateDb(db: AttendanceDatabase) {
    db.lastUpdated = new Date().toISOString();
    this.dbSubject.next(db);
    // In production, this would save to a backend API
    console.log('Database updated:', db);
  }

  // Student Management
  getStudents(): Student[] {
    return this.db.students;
  }

  getStudentById(id: string): Student | undefined {
    return this.db.students.find(s => s.id === id);
  }

  getStudentByQrCode(qrCode: string): Student | undefined {
    return this.db.students.find(s => s.qrCode === qrCode);
  }

  getStudentsByClass(className: string): Student[] {
    return this.db.students.filter(s => s.class === className);
  }

  addStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
    const newStudent: Student = {
      ...student,
      id: `std${String(this.db.students.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };

    const updatedDb = {
      ...this.db,
      students: [...this.db.students, newStudent]
    };
    this.updateDb(updatedDb);
    return newStudent;
  }

  // Attendance Management
  checkIn(qrCode: string, notes?: string): AttendanceRecord | null {
    const student = this.getStudentByQrCode(qrCode);
    if (!student || !student.active) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const existingRecord = this.db.attendance.find(
      a => a.studentId === student.id && a.date === today
    );

    if (existingRecord) {
      console.log('Student already checked in today');
      return existingRecord;
    }

    const now = new Date();
    const checkInTime = now.toISOString();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Determine status based on time (late if after 7:15 AM)
    const isLate = hours > 7 || (hours === 7 && minutes > 15);

    const newRecord: AttendanceRecord = {
      id: `att${String(this.db.attendance.length + 1).padStart(6, '0')}`,
      studentId: student.id,
      studentName: student.name,
      studentNis: student.nis,
      studentClass: student.class,
      checkInTime,
      date: today,
      status: isLate ? 'terlambat' : 'hadir',
      notes
    };

    const updatedDb = {
      ...this.db,
      attendance: [...this.db.attendance, newRecord]
    };
    this.updateDb(updatedDb);
    return newRecord;
  }

  checkOut(studentId: string): AttendanceRecord | null {
    const today = new Date().toISOString().split('T')[0];
    const recordIndex = this.db.attendance.findIndex(
      a => a.studentId === studentId && a.date === today
    );

    if (recordIndex === -1) {
      return null;
    }

    const updatedAttendance = [...this.db.attendance];
    updatedAttendance[recordIndex] = {
      ...updatedAttendance[recordIndex],
      checkOutTime: new Date().toISOString()
    };

    const updatedDb = {
      ...this.db,
      attendance: updatedAttendance
    };
    this.updateDb(updatedDb);
    return updatedAttendance[recordIndex];
  }

  markAttendance(studentId: string, status: AttendanceRecord['status'], notes?: string): AttendanceRecord {
    const student = this.getStudentById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const existingRecordIndex = this.db.attendance.findIndex(
      a => a.studentId === studentId && a.date === today
    );

    if (existingRecordIndex !== -1) {
      const updatedAttendance = [...this.db.attendance];
      updatedAttendance[existingRecordIndex] = {
        ...updatedAttendance[existingRecordIndex],
        status,
        notes
      };

      const updatedDb = {
        ...this.db,
        attendance: updatedAttendance
      };
      this.updateDb(updatedDb);
      return updatedAttendance[existingRecordIndex];
    }

    const newRecord: AttendanceRecord = {
      id: `att${String(this.db.attendance.length + 1).padStart(6, '0')}`,
      studentId: student.id,
      studentName: student.name,
      studentNis: student.nis,
      studentClass: student.class,
      checkInTime: new Date().toISOString(),
      date: today,
      status,
      notes
    };

    const updatedDb = {
      ...this.db,
      attendance: [...this.db.attendance, newRecord]
    };
    this.updateDb(updatedDb);
    return newRecord;
  }

  // Reporting
  getAttendanceByDate(date: string): AttendanceRecord[] {
    return this.db.attendance.filter(a => a.date === date);
  }

  getAttendanceByDateRange(startDate: string, endDate: string): AttendanceRecord[] {
    return this.db.attendance.filter(a => a.date >= startDate && a.date <= endDate);
  }

  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    return this.db.attendance.filter(a => a.studentId === studentId);
  }

  getAttendanceByClass(className: string, date: string): AttendanceRecord[] {
    return this.db.attendance.filter(a => a.studentClass === className && a.date === date);
  }

  getAttendanceStats(date: string): AttendanceStats {
    const attendance = this.getAttendanceByDate(date);
    const totalStudents = this.db.students.filter(s => s.active).length;

    const stats: AttendanceStats = {
      totalStudents,
      hadir: attendance.filter(a => a.status === 'hadir').length,
      terlambat: attendance.filter(a => a.status === 'terlambat').length,
      izin: attendance.filter(a => a.status === 'izin').length,
      sakit: attendance.filter(a => a.status === 'sakit').length,
      alpha: attendance.filter(a => a.status === 'alpha').length,
      belumAbsen: totalStudents - attendance.length
    };

    return stats;
  }

  getClasses(): string[] {
    const classes = new Set(this.db.students.map(s => s.class));
    return Array.from(classes).sort();
  }

  exportToCSV(date: string): string {
    const attendance = this.getAttendanceByDate(date);
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
  submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>): LeaveRequest {
    const newRequest: LeaveRequest = {
      ...request,
      id: `lr${String(this.db.leaveRequests.length + 1).padStart(6, '0')}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    const updatedDb = {
      ...this.db,
      leaveRequests: [...this.db.leaveRequests, newRequest]
    };
    this.updateDb(updatedDb);

    // Auto-create attendance records for approved leave dates
    this.createLeaveAttendanceRecords(newRequest);

    return newRequest;
  }

  private createLeaveAttendanceRecords(leaveRequest: LeaveRequest) {
    const student = this.getStudentById(leaveRequest.studentId);
    if (!student) return;

    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if attendance record already exists
      const existingRecord = this.db.attendance.find(
        a => a.studentId === student.id && a.date === dateStr
      );

      if (!existingRecord) {
        this.markAttendance(student.id, leaveRequest.leaveType, leaveRequest.reason);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getLeaveRequestsByStudent(studentId: string): LeaveRequest[] {
    return this.db.leaveRequests.filter(lr => lr.studentId === studentId).sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getLeaveRequestsByNis(nis: string): LeaveRequest[] {
    return this.db.leaveRequests.filter(lr => lr.studentNis === nis).sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getAllLeaveRequests(): LeaveRequest[] {
    return this.db.leaveRequests.sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  updateLeaveRequestStatus(requestId: string, status: 'approved' | 'rejected'): LeaveRequest | null {
    const requestIndex = this.db.leaveRequests.findIndex(lr => lr.id === requestId);
    if (requestIndex === -1) return null;

    const updatedRequests = [...this.db.leaveRequests];
    updatedRequests[requestIndex] = {
      ...updatedRequests[requestIndex],
      status
    };

    const updatedDb = {
      ...this.db,
      leaveRequests: updatedRequests
    };
    this.updateDb(updatedDb);
    return updatedRequests[requestIndex];
  }

  getStudentByNis(nis: string): Student | undefined {
    return this.db.students.find(s => s.nis === nis);
  }
}
