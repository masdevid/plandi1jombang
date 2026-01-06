import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { Student, getClassDisplayName } from '../../../models/attendance.model';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-students',
  imports: [CommonModule, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.css',
})
export class Students implements OnInit {
  students: Student[] = [];
  classes: string[] = [];
  selectedClass = 'all';
  selectedStudent: Student | null = null;
  qrCodeDataUrl = '';
  showQrModal = false;

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    this.loadStudents();
    this.classes = this.attendanceService.getClasses();
  }

  loadStudents() {
    this.students = this.attendanceService.getStudents();
  }

  get filteredStudents(): Student[] {
    if (this.selectedClass === 'all') {
      return this.students;
    }
    return this.students.filter(s => s.class === this.selectedClass);
  }

  async generateQRCode(student: Student) {
    try {
      this.selectedStudent = student;
      this.qrCodeDataUrl = await QRCode.toDataURL(student.qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#f97316',
          light: '#ffffff'
        }
      });
      this.showQrModal = true;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  downloadQRCode() {
    if (!this.selectedStudent || !this.qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = this.qrCodeDataUrl;
    link.download = `QR_${this.selectedStudent.nis}_${this.selectedStudent.name.replace(/\s+/g, '_')}.png`;
    link.click();
  }

  closeQrModal() {
    this.showQrModal = false;
    this.selectedStudent = null;
    this.qrCodeDataUrl = '';
  }

  getClassDisplayName(classCode: string): string {
    return getClassDisplayName(classCode);
  }

  async printAllQRCodes() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - SDN Plandi</title>
        <style>
          @media print {
            @page { margin: 0.5cm; }
            body { margin: 0; padding: 20px; }
          }
          .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .qr-card {
            border: 2px solid #f97316;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            page-break-inside: avoid;
          }
          .qr-card img { width: 150px; height: 150px; margin: 10px auto; }
          .qr-card h3 { font-size: 16px; margin: 10px 0 5px; color: #1e40af; }
          .qr-card p { font-size: 14px; margin: 3px 0; color: #64748b; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #f97316; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SDN Plandi - Student QR Codes</h1>
          <p>Generated on ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
        <div class="qr-grid">
    `;

    const students = this.selectedClass === 'all'
      ? this.students
      : this.students.filter(s => s.class === this.selectedClass);

    for (const student of students) {
      try {
        const qrDataUrl = await QRCode.toDataURL(student.qrCode, {
          width: 150,
          margin: 1,
          color: { dark: '#f97316', light: '#ffffff' }
        });

        htmlContent += `
          <div class="qr-card">
            <img src="${qrDataUrl}" alt="QR Code for ${student.name}">
            <h3>${student.name}</h3>
            <p>NIS: ${student.nis}</p>
            <p>${getClassDisplayName(student.class)}</p>
          </div>
        `;
      } catch (error) {
        console.error(`Error generating QR for ${student.name}:`, error);
      }
    }

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
