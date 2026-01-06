import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Program {
  title: string;
  description: string;
  features: string[];
  bgClass: string;
  imgClass: string;
  iconColor: string;
  icon: SafeHtml;
  placeholder: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  programs: Program[];

  constructor(private sanitizer: DomSanitizer) {
    this.programs = [
      {
        title: 'Program Literasi',
        description: 'Meningkatkan kemampuan membaca dan menulis melalui kegiatan membaca 15 menit sebelum pembelajaran, perpustakaan keliling, dan lomba literasi.',
        features: ['Reading Corner', 'Pojok Baca Kelas'],
        bgClass: 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-100',
        imgClass: 'bg-gradient-to-br from-primary-200 to-primary-100',
        iconColor: 'text-primary-600',
        icon: this.sanitizer.bypassSecurityTrustHtml('<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>'),
        placeholder: 'Image Placeholder'
      },
      {
        title: 'Pendidikan Karakter',
        description: 'Membentuk siswa yang berakhlak mulia melalui pembiasaan nilai-nilai luhur dalam kehidupan sehari-hari di sekolah.',
        features: ['Upacara & Apel Pagi', 'Kegiatan Keagamaan'],
        bgClass: 'bg-gradient-to-br from-green-50 to-white border-2 border-green-100',
        imgClass: 'bg-gradient-to-br from-green-200 to-green-100',
        iconColor: 'text-green-600',
        icon: this.sanitizer.bypassSecurityTrustHtml('<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'),
        placeholder: 'Image Placeholder'
      },
      {
        title: 'Smart Classroom',
        description: 'Pembelajaran berbasis teknologi dengan perangkat digital, multimedia interaktif, dan konten pembelajaran modern.',
        features: ['Proyektor Interaktif', 'E-Learning Platform'],
        bgClass: 'bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100',
        imgClass: 'bg-gradient-to-br from-purple-200 to-purple-100',
        iconColor: 'text-purple-600',
        icon: this.sanitizer.bypassSecurityTrustHtml('<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>'),
        placeholder: 'Image Placeholder'
      },
      {
        title: 'STEM Education',
        description: 'Mengintegrasikan Sains, Teknologi, Engineering, dan Matematika dalam pembelajaran yang menyenangkan dan aplikatif.',
        features: ['Lab Sains Modern', 'Robotika & Coding'],
        bgClass: 'bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100',
        imgClass: 'bg-gradient-to-br from-orange-200 to-orange-100',
        iconColor: 'text-orange-600',
        icon: this.sanitizer.bypassSecurityTrustHtml('<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>'),
        placeholder: 'Image Placeholder'
      }
    ];
  }
}
