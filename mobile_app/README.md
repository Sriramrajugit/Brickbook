# Ledger Mobile App

A Flutter mobile application for managing expenses, employees, attendance, and payroll.

## Features

- **Dashboard**: Account-level summaries with income, expenses, and balance
- **Accounts**: Manage multiple accounts/projects
- **Employees**: Employee management with salary information
- **Transactions**: Record income and expenses with categories
- **Attendance**: Daily attendance tracking with Present/Absent/Half Day status
- **Payroll**: Calculate payroll with attendance, advances, and net pay
- **Reports**: Financial reports with filtering

## Prerequisites

- Flutter SDK (3.0 or higher)
- Dart SDK
- Android Studio / VS Code with Flutter extensions
- PostgreSQL database (backend)
- Next.js API server running (from ../web)

## Setup

1. Install Flutter: https://docs.flutter.dev/get-started/install

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Configure API endpoint in `lib/services/api_service.dart`:
   ```dart
   static const String baseUrl = 'http://YOUR_IP:3000/api';
   ```

4. Run the app:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
  ├── main.dart              # App entry point
  ├── models/                # Data models
  │   ├── account.dart
  │   ├── employee.dart
  │   ├── transaction.dart
  │   ├── attendance.dart
  │   └── payroll.dart
  ├── screens/               # UI screens
  │   ├── dashboard_screen.dart
  │   ├── accounts_screen.dart
  │   ├── employees_screen.dart
  │   ├── transactions_screen.dart
  │   ├── attendance_screen.dart
  │   ├── payroll_screen.dart
  │   └── reports_screen.dart
  ├── services/              # API services
  │   └── api_service.dart
  └── widgets/               # Reusable widgets
      └── drawer_menu.dart
```

## Building for Release

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

## Notes

- The app connects to the Next.js API server (must be running)
- Update the API base URL in `api_service.dart` for production
- Future dates are not allowed for transactions and attendance
- Payroll periods are Monday-Saturday (26 working days per month)
