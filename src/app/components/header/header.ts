import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isMenuOpen = false;
  isAbsensiDropdownOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.isAbsensiDropdownOpen = false;
  }

  toggleAbsensiDropdown() {
    this.isAbsensiDropdownOpen = !this.isAbsensiDropdownOpen;
  }

  closeAbsensiDropdown() {
    this.isAbsensiDropdownOpen = false;
  }
}
