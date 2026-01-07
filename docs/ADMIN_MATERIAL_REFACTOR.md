# Admin Pages Material Design Refactor

**Date**: 2026-01-08
**Status**: In Progress

## Overview

Refactoring admin pages to use Angular Material components for a modern, consistent UI/UX with enhanced features including side navigation, notifications, search, and dialogs.

## Completed Tasks ✅

### 1. Angular Material Setup
- ✅ Installed Angular Material, CDK, and Animations packages
- ✅ Updated Angular core packages to v21.0.7
- ✅ Configured `provideAnimationsAsync()` in app.config.ts
- ✅ Created custom Material theme (`theme.scss`) based on school branding (#f97316 orange)
- ✅ Imported Material Icons font
- ✅ Added custom theme overrides for cards, buttons, and form fields

### 2. Admin Layout with Material Sidenav
- ✅ Created `AdminLayoutComponent` with Material sidenav
- ✅ Implemented persistent sidebar with navigation items
- ✅ Added top toolbar with menu toggle, notifications, and user menu
- ✅ Configured badge display for pending leave requests
- ✅ Added user avatar with initials
- ✅ Implemented role-based navigation filtering
- ✅ Styled with orange gradient header matching school branding

**Files Created**:
- `src/app/layouts/admin/admin-layout.component.ts`
- `src/app/layouts/admin/admin-layout.component.html`
- `src/app/layouts/admin/admin-layout.component.css`

### 3. Routing Configuration
- ✅ Updated `app.routes.ts` to use AdminLayoutComponent as parent
- ✅ Configured child routes for all admin pages
- ✅ Added leave-requests route

### 4. Notification Service
- ✅ Created `NotificationService` using MatSnackBar
- ✅ Implemented methods: `success()`, `error()`, `warning()`, `info()`, `show()`
- ✅ Added custom snackbar styling with color coding
- ✅ Configured snackbar positioning (top-end)

**File Created**:
- `src/app/services/notification.service.ts`

### 5. Auth Service Enhancement
- ✅ Added signal-based API alongside existing BehaviorSubject
- ✅ Implemented `currentUser` computed signal
- ✅ Updated User interface to match API response fields (`full_name`, `assigned_class`)
- ✅ Maintained backward compatibility with existing code

## Pending Tasks 🚧

### 6. Refactor Login Page with Material Forms
- [ ] Replace custom form inputs with MatFormField + MatInput
- [ ] Add MatButton for submit button
- [ ] Integrate MatProgressSpinner for loading state
- [ ] Use NotificationService instead of alert()
- [ ] Add Material card layout
- [ ] Implement form validation with Material error messages

### 7. Refactor Dashboard with Material Components
- [ ] Replace custom cards with MatCard
- [ ] Implement MatTable for attendance records list
- [ ] Add MatChip for status badges
- [ ] Create stats cards using MatCard with icons
- [ ] Add MatProgressBar for attendance rate
- [ ] Implement MatExpansionPanel for leave requests
- [ ] Use MatDialog for approval confirmations

### 8. Create Leave Requests Page
- [ ] Build dedicated leave requests management page
- [ ] Implement MatTable with sorting and filtering
- [ ] Add MatPaginator for large datasets
- [ ] Create approve/reject dialog with MatDialog
- [ ] Show student details in expansion panel
- [ ] Add status chips with MatChip
- [ ] Implement date range filtering

### 9. Admin Search Functionality
- [ ] Add global search in toolbar
- [ ] Implement MatAutocomplete for search suggestions
- [ ] Search across students, attendance, leave requests
- [ ] Show search results in dialog or navigate to filtered view
- [ ] Add keyboard shortcuts (Ctrl+K)

### 10. Additional Admin Pages
**Check-In Page**:
- [ ] Refactor QR scanner UI with Material
- [ ] Add recent scans table with MatTable
- [ ] Implement manual check-in form with Material inputs

**Students Page**:
- [ ] Create MatTable with sorting, filtering, pagination
- [ ] Add student detail dialog
- [ ] Implement bulk actions (export, print)
- [ ] Add search and filter chips

**Reports Page**:
- [ ] Create report filters with Material date pickers
- [ ] Implement data visualization (charts)
- [ ] Add export options dialog
- [ ] Create printable report layout

### 11. Material Dialogs for Actions
- [ ] Create reusable confirmation dialog component
- [ ] Implement student detail dialog
- [ ] Create leave request approval dialog
- [ ] Add bulk action confirmation dialogs

## Material Components Being Used

### Layout & Navigation
- `MatSidenavModule` - Side navigation panel
- `MatToolbarModule` - Top toolbar
- `MatListModule` - Navigation list items
- `MatDividerModule` - Visual separators

### Buttons & Indicators
- `MatButtonModule` - Buttons with Material styling
- `MatIconModule` - Material Icons
- `MatBadgeModule` - Notification badges
- `MatChipsModule` - Status chips (planned)
- `MatProgressSpinnerModule` - Loading spinners (planned)
- `MatProgressBarModule` - Progress indicators (planned)

### Forms & Inputs
- `MatFormFieldModule` - Form field wrapper (planned)
- `MatInputModule` - Text inputs (planned)
- `MatSelectModule` - Dropdowns (planned)
- `MatDatepickerModule` - Date pickers (planned)
- `MatAutocompleteModule` - Search autocomplete (planned)

### Data Display
- `MatTableModule` - Data tables (planned)
- `MatPaginatorModule` - Table pagination (planned)
- `MatSortModule` - Table sorting (planned)
- `MatCardModule` - Content cards (planned)
- `MatExpansionModule` - Expandable panels (planned)

### Popups & Overlays
- `MatDialogModule` - Modal dialogs (planned)
- `MatMenuModule` - Dropdown menus ✓
- `MatTooltipModule` - Tooltips ✓
- `MatSnackBarModule` - Toast notifications ✓

## Design System

### Color Palette
- **Primary**: Orange (#f97316) - School branding
- **Accent**: Blue (#2563eb) - Interactive elements
- **Warn**: Red (#dc2626) - Errors and warnings
- **Success**: Green (#10b981) - Success states
- **Warning**: Amber (#f59e0b) - Warnings

### Typography
- **Font Family**: Inter (body), Poppins (headings)
- **Material Typography**: Configured with custom fonts

### Spacing & Layout
- **Card Padding**: 24px
- **Section Spacing**: 24px
- **Grid Gaps**: 16px-24px
- **Border Radius**: 12px for cards, 8px for buttons

## Next Steps

1. **Immediate Priority**: Refactor login page with Material forms
2. **High Priority**: Refactor dashboard with Material components
3. **Medium Priority**: Create leave requests page and search functionality
4. **Lower Priority**: Refactor other admin pages (check-in, students, reports)

## File Structure

```
src/app/
├── layouts/
│   └── admin/
│       ├── admin-layout.component.ts
│       ├── admin-layout.component.html
│       └── admin-layout.component.css
├── pages/
│   ├── admin/
│   │   ├── dashboard/          # To be refactored
│   │   ├── login/              # To be refactored
│   │   └── leave-requests/     # To be created
│   └── absensi/
│       ├── check-in/           # To be refactored
│       ├── students/           # To be refactored
│       └── report/             # To be refactored
├── services/
│   ├── auth.service.ts         # Enhanced with signals
│   └── notification.service.ts # New service
└── app.config.ts               # Updated with animations

src/
├── theme.scss                   # Material theme
└── styles.css                   # Global styles
```

## Benefits of Material Design Migration

### User Experience
- ✨ Consistent, modern UI across all admin pages
- 📱 Better mobile responsiveness
- ♿ Improved accessibility (ARIA labels, keyboard navigation)
- 🎨 Cohesive design language

### Developer Experience
- 🔧 Pre-built, tested components
- 📦 Reduced custom CSS maintenance
- 🚀 Faster development for new features
- 📚 Excellent documentation and community support

### Performance
- ⚡ Optimized components
- 🎯 Better change detection with signals
- 💨 Lazy loading support
- 📊 Virtual scrolling for large datasets

## Breaking Changes

### User Interface Changes
- Navigation moved to persistent sidebar
- Actions use Material buttons instead of custom styles
- Form inputs have Material floating labels
- Notifications use snackbar instead of alert()

### Code Changes
- Auth service now provides signal-based API
- Components need to import Material modules
- Some CSS classes replaced with Material equivalents

### Migration Path
- Old pages work alongside new Material pages
- Gradual migration page by page
- Backward compatible auth service
- No database or API changes required

---

**Last Updated**: 2026-01-08
**Status**: Foundation complete, refactoring individual pages in progress
**Next**: Refactor login page with Material forms
