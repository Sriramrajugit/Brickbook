# Mobile App Web Sync - Implementation Checklist

## ✅ COMPLETED: New Files Created

### Models
- [x] `mobile_app/lib/models/category.dart` - Category model for expense categories
- [x] `mobile_app/lib/models/user.dart` - User model for profile management

### Screens
- [x] `mobile_app/lib/screens/categories_screen.dart` - Category management screen
- [x] `mobile_app/lib/screens/profile_screen.dart` - User profile screen

### API Methods Added
- [x] `ApiService.getCategories()` - Fetch categories from server
- [x] `ApiService.createCategory()` - Create new category
- [x] `ApiService.getCurrentUser()` - Fetch current user profile
- [x] `ApiService.updateUserProfile()` - Update user profile

### Offline Support
- [x] `OfflineApiService.getCategories()` - Get categories (online/offline)
- [x] `OfflineApiService.createCategory()` - Create category (offline-first)
- [x] Default categories fallback for offline mode

### Navigation Updates
- [x] Added `/categories` route to main.dart
- [x] Added `/profile` route to main.dart
- [x] Updated drawer menu with new menu items
- [x] Added import statements for new screens

---

## 📋 TODO: Next Steps for Full Sync

### 1. **Update API Base URL** (CRITICAL)
**File:** `mobile_app/lib/services/api_service.dart` (Line 11)

```dart
// CHANGE THIS:
static const String baseUrl = 'http://192.168.1.15:3000/api';

// TO YOUR SERVER IP:
static const String baseUrl = 'http://YOUR_IP:3000/api';
// Example: static const String baseUrl = 'http://192.168.1.100:3000/api';
```

**How to get your IP:**
- On Windows: Open PowerShell and run `ipconfig` (look for IPv4 Address)
- Example IP: `192.168.x.x`

---

### 2. **Verify Web API Endpoints Exist**

Test each endpoint on your web server. Run this in terminal:

```powershell
# Start web dev server
npm run dev

# Test endpoints (replace TOKEN with your JWT token)
$token = "your-jwt-token-here"

# Test categories endpoint
curl -H "Authorization: Bearer $token" http://localhost:3000/api/categories

# Test users endpoint
curl -H "Authorization: Bearer $token" http://localhost:3000/api/users/me

# Test update user endpoint
curl -X PUT -H "Authorization: Bearer $token" -H "Content-Type: application/json" `
  -d '{"email":"user@example.com"}' `
  http://localhost:3000/api/users/[user-id]
```

**Expected Status Codes:**
- `200` - OK (data returned)
- `201` - Created (new resource created)
- `400` - Bad request (check params)
- `401` - Unauthorized (check token)
- `500` - Server error (check logs)

---

### 3. **Create Categories API Route** (if missing)

**File:** `app/api/categories/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
```

---

### 4. **Create Users API Routes** (if missing)

**File:** `app/api/users/me/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
```

**File:** `app/api/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only update their own profile or admins can update anyone
    if (user.id !== params.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, phone } = body;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(phone && { phone }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
```

---

### 5. **Test Mobile App on New PC**

**Prerequisites:**
- Flutter SDK installed
- Mobile device or emulator ready
- Web server running on accessible IP

**Steps:**

```bash
cd mobile_app

# Get latest dependencies
flutter pub get

# Run on emulator or device
flutter run

# Or with specific device
flutter run -d <device-id>
```

**Test Checklist:**
- [ ] Login with web credentials
- [ ] View dashboard
- [ ] View transactions (should sync from web)
- [ ] Create transaction offline → auto-sync online
- [ ] View accounts
- [ ] Create account → syncs to web
- [ ] View employees
- [ ] Create employee → syncs to web
- [ ] View **Categories** screen (NEW)
- [ ] Add new category (NEW)
- [ ] View **Profile** screen (NEW)
- [ ] Edit profile → syncs to web

---

### 6. **Sync Testing Scenarios**

#### Scenario 1: Basic Sync
1. **Create on Web**, Download on Mobile
   - [ ] Add transaction on web
   - [ ] Open mobile, check dashboard
   - [ ] Should auto-sync and show new transaction

2. **Create on Mobile**, Upload on Web
   - [ ] Create transaction on mobile
   - [ ] Go online
   - [ ] Check web app
   - [ ] Should see the transaction

#### Scenario 2: Offline Mode
1. **Create Offline on Mobile**
   - [ ] Turn off mobile network
   - [ ] Create transaction
   - [ ] Should show "Saved Offline"
   - [ ] Turn on network
   - [ ] Should auto-sync

2. **Ensure All Data Persists**
   - [ ] Close and reopen mobile app
   - [ ] Data should still be there

#### Scenario 3: Multi-Device Sync
1. **Create on Web**, Sync to Both Devices
   - [ ] Add data on web
   - [ ] Refresh mobile app (or wait for auto-sync)
   - [ ] Data appears on both mobile devices

---

### 7. **Database Verification**

**Verify Categories Table Exists:**

```sql
-- Connect to PostgreSQL
-- Your DATABASE_URL: postgresql://postgres:admin@localhost:5432/ledger_db

-- Check if categories table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'Category';

-- View categories data
SELECT * FROM "Category";

-- Check User table
SELECT id, email, name, phone, role, "isActive" FROM "User";
```

---

### 8. **Troubleshooting Guide**

#### Issue: API returns 404 (Endpoint not found)

**Solution:**
1. Verify endpoint path is correct
2. Check if route file exists in correct location
3. Restart dev server: `npm run dev`
4. Check terminal for NextJS errors

#### Issue: Categories/Profile screens don't load

**Solution:**
1. Check API base URL is correct
2. Verify JWT token is valid
3. Check device is connected to same network
4. Run: `flutter logs` to see error details

#### Issue: Data doesn't sync

**Solution:**
1. Verify device is online: `ping 8.8.8.8`
2. Check network connectivity: Ensure same WiFi network
3. Check SyncManager is running (check logs)
4. Verify API endpoint returns data

#### Issue: Can't login on mobile

**Solution:**
1. Verify credentials are correct
2. Check web login works first
3. Verify API base URL points to correct server
4. Check firewall isn't blocking the port

---

### 9. **Final Verification Checklist**

- [ ] Web API running on accessible IP/port
- [ ] All API endpoints respond correctly
- [ ] Mobile app can fetch data from all endpoints
- [ ] Categories endpoint working
- [ ] Users/profile endpoint working
- [ ] Categories screen functional in mobile app
- [ ] Profile screen functional in mobile app
- [ ] Sync works: Create on web → shows on mobile
- [ ] Sync works: Create on mobile → shows on web
- [ ] Offline mode works on mobile
- [ ] Database tables verified with data
- [ ] Both mobile devices can sync same data

---

## 🚀 Quick Commands Reference

### Web Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check database with Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name add_categories
```

### Mobile Development
```bash
# Get dependencies
flutter pub get

# Run on device
flutter run

# View logs
flutter logs

# Clean build
flutter clean
flutter pub get
flutter run

# Build APK/IPA
flutter build apk
flutter build ios
```

### Database
```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -d ledger_db

# List all tables
\dt

# View categories
SELECT * FROM "Category";

# View users
SELECT * FROM "User";
```

---

## 📚 Documentation Files

- [MOBILE_SYNC_GUIDE.md](../MOBILE_SYNC_GUIDE.md) - Complete sync architecture
- [OFFLINE_IMPLEMENTATION.md](../mobile_app/OFFLINE_IMPLEMENTATION.md) - Offline features
- [MOBILE_SETUP_GUIDE.md](../mobile_app/MOBILE_SETUP_GUIDE.md) - Setup instructions
- [AUTH-SETUP.md](../Documents/AUTH-SETUP.md) - Authentication details

---

## ✨ Summary

You now have:

✅ **Models:** Category, User  
✅ **Screens:** Categories Management, User Profile  
✅ **API Methods:** Get/Create categories, User profile management  
✅ **Offline Support:** Categories work offline with defaults  
✅ **Navigation:** New routes and drawer menu items  
✅ **Sync:** Auto-sync configured for new modules  

**Next Steps:**
1. Update API base URL in `api_service.dart`
2. Verify/create API endpoints on web
3. Test on mobile device with new PC
4. Verify sync works for all modules
5. Use provided troubleshooting guide if needed

---

**Status:** 🟢 Ready for Mobile Testing  
**Last Updated:** February 28, 2026  
**Version:** 1.0 Complete Sync Package
