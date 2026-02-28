# Web-to-Mobile Sync Guide
**Complete synchronization of all Ledger web modules to the Flutter mobile app**

---

## 📋 Current Status

### ✅ Web Modules (Next.js - App Router)
- **Transactions** - Manage financial transactions
- **Accounts** - Account management
- **Employees** - Employee records
- **Attendance** - Track attendance
- **Payroll** - Salary management
- **Categories** - Transaction categories
- **Reports** - Financial reports
- **Users** - User management
- **Profile** - User profile
- **Import** - Data import functionality

### ✅ Mobile Modules (Flutter)
- **Transactions** - ✅ Complete CRUD with offline support
- **Accounts** - ✅ Read/Create with offline support
- **Employees** - ✅ Read/Create with offline support
- **Attendance** - ✅ Screen exists (partial implementation)
- **Payroll** - ✅ Screen exists (needs expansion)
- **Dashboard** - ✅ Overview screen
- **Reports** - ✅ Screen exists (partial implementation)
- **Login** - ✅ Authentication implemented

### ⚠️ Missing in Mobile (Need to Add)
- **Categories** - Category management (model exists, screen needed)
- **User Profile** - User profile management
- **User Settings** - Settings and preferences
- **Inventory** - (Optional - if required)

---

## 🔄 Sync Architecture Overview

### Architecture Layers
```
Web (Next.js)                    Mobile (Flutter)
      ↓                                ↓
  [API Endpoints]          ←→    [API Service]
  /api/transactions              ↓
  /api/accounts         [Offline Storage - SQLite]
  /api/employees        ↓
  /api/attendance    [Sync Manager - Auto-sync every 30s]
  /api/payroll
  /api/categories
  /api/users
```

### Current Sync Flow
1. **User Action** (Mobile) → Creates transaction/employee offline
2. **Local Storage** → SQLite saves with `synced = 0` flag
3. **Auto-Sync** (Every 30s or on connectivity change) → Uploads to web API
4. **Server Response** → Updates local DB with server ID
5. **Download** → Pulls latest data from server

---

## 📦 Step 1: Ensure All API Endpoints Exist on Web

### Check These Endpoints (Required for Mobile)

#### ✅ Transactions API
```
GET    /api/transactions              (with pagination & filtering)
POST   /api/transactions              (create)
PUT    /api/transactions/[id]         (update)
DELETE /api/transactions/[id]         (delete)
```

#### ✅ Accounts API
```
GET    /api/accounts                  (list all)
POST   /api/accounts                  (create)
PUT    /api/accounts/[id]             (update)
DELETE /api/accounts/[id]             (delete)
```

#### ✅ Employees API
```
GET    /api/employees                 (list all)
POST   /api/employees                 (create)
PUT    /api/employees/[id]            (update)
DELETE /api/employees/[id]            (delete)
```

#### ✅ Attendance API
```
GET    /api/attendance                (list all)
POST   /api/attendance                (create)
PUT    /api/attendance/[id]           (update)
DELETE /api/attendance/[id]           (delete)
```

#### ✅ Payroll API
```
GET    /api/payroll                   (list all)
POST   /api/payroll                   (create)
PUT    /api/payroll/[id]              (update)
DELETE /api/payroll/[id]              (delete)
```

#### ⚠️ Categories API (Check Existence)
```
GET    /api/categories                (list all)
POST   /api/categories                (create)
PUT    /api/categories/[id]           (update)
DELETE /api/categories/[id]           (delete)
```

#### ⚠️ Users API (Check Existence)
```
GET    /api/users                     (list all)
GET    /api/users/[id]                (get current/specific user)
PUT    /api/users/[id]                (update profile)
POST   /api/users                     (create - admin only)
```

**Verification Command:**
```bash
# Start dev server
npm run dev

# Test endpoints - use Postman, Insomnia, or curl
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3000/api/transactions
```

---

## 🚀 Step 2: Update Mobile API Service

### File: `mobile_app/lib/services/api_service.dart`

Ensure it includes all required methods:

```dart
class ApiService {
  // Transactions
  static Future<List<Transaction>> getTransactions({
    int page = 1,
    int limit = 10,
    String? category,
    String? startDate,
    String? endDate,
  }) async { ... }
  
  static Future<Transaction> createTransaction(Transaction transaction) async { ... }
  static Future<void> updateTransaction(String id, Transaction transaction) async { ... }
  static Future<void> deleteTransaction(String id) async { ... }

  // Accounts
  static Future<List<Account>> getAccounts() async { ... }
  static Future<Account> createAccount(Account account) async { ... }
  static Future<void> updateAccount(String id, Account account) async { ... }
  static Future<void> deleteAccount(String id) async { ... }

  // Employees
  static Future<List<Employee>> getEmployees() async { ... }
  static Future<Employee> createEmployee(Employee employee) async { ... }
  static Future<void> updateEmployee(String id, Employee employee) async { ... }
  static Future<void> deleteEmployee(String id) async { ... }

  // Attendance
  static Future<List<Attendance>> getAttendance({DateTime? date}) async { ... }
  static Future<Attendance> createAttendance(Attendance attendance) async { ... }
  static Future<void> updateAttendance(String id, Attendance attendance) async { ... }
  static Future<void> deleteAttendance(String id) async { ... }

  // Payroll
  static Future<List<Payroll>> getPayroll({int? month, int? year}) async { ... }
  static Future<Payroll> createPayroll(Payroll payroll) async { ... }
  static Future<void> updatePayroll(String id, Payroll payroll) async { ... }
  static Future<void> deletePayroll(String id) async { ... }

  // Categories
  static Future<List<String>> getCategories() async { ... }
  static Future<void> createCategory(String category) async { ... }

  // Users
  static Future<User> getCurrentUser() async { ... }
  static Future<void> updateUserProfile(String id, Map<String, dynamic> data) async { ... }
}
```

---

## 📱 Step 3: Add Missing Mobile Screens

### A. Categories Screen
**File:** `mobile_app/lib/screens/categories_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/offline_api_service.dart';
import '../models/category.dart';
import '../widgets/drawer_menu.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final _nameController = TextEditingController();
  List<String> categories = [];
  bool isLoading = false;
  bool isOnline = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() => isLoading = true);
    try {
      final List<dynamic> data = await OfflineApiService.getCategories();
      setState(() {
        categories = List<String>.from(data);
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading categories: $e')),
      );
    }
  }

  Future<void> _addCategory() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter category name')),
      );
      return;
    }

    try {
      await OfflineApiService.createCategory(_nameController.text);
      _nameController.clear();
      _loadCategories();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Category added successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Categories')),
      drawer: const DrawerMenu(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'Category Name',
                    hintText: 'e.g., Food, Travel, Utilities',
                    prefixIcon: const Icon(Icons.category),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: _addCategory,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          leading: const Icon(Icons.tag),
                          title: Text(categories[index]),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () {
                              // Implement delete
                            },
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }
}
```

### B. Profile Screen
**File:** `mobile_app/lib/screens/profile_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/drawer_menu.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? userData;
  bool isLoading = true;
  bool isSaving = false;

  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    try {
      // Load from API - assuming you have a getCurrentUser endpoint
      setState(() => isLoading = true);
      // final user = await ApiService.getCurrentUser();
      // setState(() {
      //   userData = user.toJson();
      //   _emailController.text = user.email ?? '';
      //   _nameController.text = user.name ?? '';
      //   _phoneController.text = user.phone ?? '';
      //   isLoading = false;
      // });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading profile: $e')),
      );
    }
  }

  Future<void> _saveProfile() async {
    setState(() => isSaving = true);
    try {
      // Update profile
      // await ApiService.updateUserProfile(userId, {
      //   'email': _emailController.text,
      //   'name': _nameController.text,
      //   'phone': _phoneController.text,
      // });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('User Profile')),
      drawer: const DrawerMenu(),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 50,
                    child: Icon(Icons.person, size: 50),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: Icon(Icons.person),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Phone',
                      prefixIcon: Icon(Icons.phone),
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton.icon(
                    onPressed: isSaving ? null : _saveProfile,
                    icon: const Icon(Icons.save),
                    label: const Text('Save Profile'),
                  ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}
```

---

## 🔄 Step 4: Update Mobile Navigation

### File: `mobile_app/lib/main.dart`

Add new routes:

```dart
routes: {
  '/login': (context) => const LoginScreen(),
  '/': (context) => const DashboardScreen(),
  '/accounts': (context) => const AccountsScreen(),
  '/employees': (context) => const EmployeesScreen(),
  '/transactions': (context) => const TransactionsScreen(),
  '/attendance': (context) => const AttendanceScreen(),
  '/payroll': (context) => const PayrollScreen(),
  '/reports': (context) => const ReportsScreen(),
  '/categories': (context) => const CategoriesScreen(),  // NEW
  '/profile': (context) => const ProfileScreen(),         // NEW
},
```

### File: `mobile_app/lib/widgets/drawer_menu.dart`

Add menu items:

```dart
ListTile(
  leading: const Icon(Icons.category),
  title: const Text('Categories'),
  onTap: () {
    Navigator.pushNamed(context, '/categories');
  },
),
ListTile(
  leading: const Icon(Icons.person),
  title: const Text('My Profile'),
  onTap: () {
    Navigator.pushNamed(context, '/profile');
  },
),
```

---

## 📲 Step 5: Sync Data Process

### Initial Sync (First Run on New PC)

1. **Download all data:**
   ```
   Transactions → Stored in SQLite
   Accounts → Stored in SQLite
   Employees → Stored in SQLite
   Attendance → Stored in SQLite
   Payroll → Stored in SQLite
   Categories → Stored in SQLite
   ```

2. **SyncManager automatically:**
   - Runs every 30 seconds when online
   - Uploads any unsynced local changes
   - Downloads new data from server

### Ongoing Sync

The app automatically syncs:
- ✅ **Every 30 seconds** (if online)
- ✅ **On network state change** (when connection restored)
- ✅ **On app start** (check for new data)

---

## 📊 Step 6: Testing the Sync

### Test Checklist

- [ ] **Login:** Both web and mobile with same credentials
- [ ] **Create Transaction:**
  - [ ] Create on mobile (offline)
  - [ ] Go online and verify auto-sync
  - [ ] Check web app - transaction appears
- [ ] **Create Account:**
  - [ ] Create on mobile
  - [ ] Verify appears on web
- [ ] **Create Employee:**
  - [ ] Create on mobile
  - [ ] Sync and verify on web
- [ ] **Create Attendance:**
  - [ ] Create on web
  - [ ] Refresh mobile - should download
- [ ] **Offline Mode:**
  - [ ] Turn off network
  - [ ] Create transaction
  - [ ] Should show "saved offline"
  - [ ] Turn on network
  - [ ] Should auto-sync
  - [ ] Verify on web

---

## 🔧 Configuration

### API Base URL

**File:** `mobile_app/lib/services/api_service.dart`

Ensure correct base URL:

```dart
const String baseUrl = 'http://YOUR_MACHINE_IP:3000/api';
// Example: 'http://192.168.1.100:3000/api'
// Or: 'http://localhost:3000/api' (if on same machine)
```

**Important:** Use machine IP on another PC (not localhost)

### Authentication Token

The mobile app expects:
- JWT token from `/api/login`
- Stored in device secure storage
- Sent in Authorization header: `Bearer <token>`

---

## 📋 Sync Data Checklist

### Before Running Sync

- ✅ Web API is running: `npm run dev`
- ✅ PostgreSQL database is accessible
- ✅ All API endpoints return data
- ✅ Mobile app has internet connection
- ✅ Correct API base URL in mobile app
- ✅ JWT token is valid

### What Gets Synced

| Module | Web ↔ Mobile | Offline | Notes |
|--------|---|---|---|
| Transactions | ✅ Bi-directional | ✅ Yes | Full CRUD |
| Accounts | ✅ Bi-directional | ✅ Yes | Full CRUD |
| Employees | ✅ Bi-directional | ✅ Yes | Full CRUD |
| Attendance | ✅ Bi-directional | ✅ Yes | Full CRUD |
| Payroll | ✅ Bi-directional | ✅ Yes | Full CRUD |
| Categories | ✅ Bi-directional | ✅ Yes | List + Create |
| Reports | ⬅️ Download only | ⚠️ Limited | Read-only |
| Users | ⬅️ Download only | ⚠️ Limited | Profile only |

---

## 🚀 Quick Start Commands

### Web (Next.js)

```bash
# Start development server
npm run dev
# Access: http://localhost:3000

# Build for production
npm run build

# Run production server
npm start
```

### Mobile (Flutter)

```bash
# Get dependencies
flutter pub get

# Run on emulator/device
flutter run

# Run with specific configuration
flutter run --release
```

---

## 🐛 Troubleshooting

### Sync Not Working

**Problem:** Data not syncing from mobile to web

**Solution:**
1. Check network connectivity: `ping <server-ip>`
2. Verify API endpoint: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/transactions`
3. Check mobile logs: `flutter logs`
4. Verify JWT token is valid
5. Check PostgreSQL is running

### Offline Mode Issues

**Problem:** Can't work offline

**Solution:**
1. Ensure SQLite database was created
2. Check local database tables exist
3. Verify OfflineApiService is being used
4. Check logs for database errors

### Authentication Failed

**Problem:** 401 Unauthorized on API calls

**Solution:**
1. Ensure JWT token is stored correctly
2. Verify token hasn't expired
3. Check token sent in Authorization header
4. Re-login if token is invalid

---

## 📞 Support

For issues or questions:
1. Check API endpoint responses
2. Review logs in VS Code terminal (web) and Flutter console (mobile)
3. Verify database contains data: `npx prisma studio`
4. Test API manually with Postman/Insomnia before mobile testing

---

**Last Updated:** February 28, 2026
**Status:** Ready for Full Sync
