# Web-to-Mobile Sync - Quick Start Reference

**🎯 Your Status:** All web modules are ready to sync to mobile app!

---

## ⚡ What Was Done (✅ Completed)

```
✅ New Flutter Models Created:
   • Category.dart - For managing expense categories
   • User.dart - For user profile management

✅ New Flutter Screens Created:
   • categories_screen.dart - Add/view categories
   • profile_screen.dart - View/edit user profile

✅ API Methods Added:
   • getCategories() - Fetch from server
   • createCategory(category) - Save new category
   • getCurrentUser() - Get user profile
   • updateUserProfile(userId, data) - Update profile

✅ Navigation Updated:
   • /categories route added
   • /profile route added
   • Drawer menu updated with new items

✅ Offline Support:
   • Categories work offline with defaults
   • Syncs automatically when online
```

---

## 🚀 Next Steps (In Order)

### **CRITICAL: Update Server IP Address** ⚠️

**File:** `mobile_app/lib/services/api_service.dart` (Line 11)

Find this line:
```dart
static const String baseUrl = 'http://192.168.1.15:3000/api';
```

Replace with your IP (on another PC, use your machine's IP, NOT localhost):
```dart
static const String baseUrl = 'http://YOUR_PC_IP:3000/api';
// Example: http://192.168.1.100:3000/api
```

**To find your IP:**
- Open PowerShell and type: `ipconfig`
- Look for "IPv4 Address" (usually starts with 192.168.x.x or 10.x.x.x)

---

### **Step 1: Start Web Server** 

```bash
cd c:\My Data\Workspace\Ledger
npm run dev
```

✓ You should see: "Ready on http://0.0.0.0:3000"

---

### **Step 2: Update Mobile App**

```bash
cd c:\My Data\Workspace\Ledger\mobile_app
flutter pub get
```

---

### **Step 3: Run Mobile App on New PC**

```bash
flutter run
```

- Select your device/emulator
- App will start and sync data

---

### **Step 4: Test Sync** 

Try these on mobile:

1. **View Categories** ← NEW
   - Open drawer menu
   - Tap "Categories"
   - Should show list of categories

2. **Add Category** ← NEW
   - Tap "Add New Category"
   - Enter name: "Test"
   - Tap "Add Category"
   - Should appear in list

3. **View Profile** ← NEW
   - Open drawer menu
   - Tap "My Profile"
   - Should show your name, email, etc.

4. **Verify Sync**
   - Go to web app: http://localhost:3000
   - Check if category appears there
   - Create transaction on web
   - Refresh mobile → should see it

---

## 📋 All Web Modules Ready for Mobile

| Module | Web | Mobile | Sync Status |
|--------|-----|--------|------------|
| Transactions | ✅ | ✅ | Bi-directional |
| Accounts | ✅ | ✅ | Bi-directional |
| Employees | ✅ | ✅ | Bi-directional |
| Attendance | ✅ | ✅ | Bi-directional |
| Payroll | ✅ | ✅ | Bi-directional |
| Categories | ✅ | ✅ NEW | Bi-directional |
| Profile | ✅ | ✅ NEW | Bi-directional |
| Reports | ✅ | ✅ | Read-only |
| Dashboard | ✅ | ✅ | Real-time |

---

## 🔧 Troubleshooting Quick Fix

### ❌ "Can't connect to server"
- Verify web server is running: `npm run dev`
- Check IP address is correct in api_service.dart
- Ensure both PC and mobile are on same network

### ❌ "Categories not loading"
- Check Categories API endpoint exists at `/api/categories`
- Verify database has categories table
- Check browser console for API errors

### ❌ "Profile not showing"
- Check users API endpoint exists at `/api/users/me`
- Verify JWT token is valid
- Check user record exists in database

---

## 📱 Files Modified/Created

```
mobile_app/lib/
├── models/
│   ├── category.dart (NEW)
│   └── user.dart (NEW)
├── screens/
│   ├── categories_screen.dart (NEW)
│   ├── profile_screen.dart (NEW)
│   └── ... (existing screens unchanged)
├── services/
│   ├── api_service.dart (UPDATED - added category/user methods)
│   ├── offline_api_service.dart (UPDATED - added category support)
│   └── ... (other services unchanged)
├── widgets/
│   └── drawer_menu.dart (UPDATED - new menu items)
└── main.dart (UPDATED - new routes)
```

---

## 🎯 Verification Checklist

Before considering sync complete:

```
☐ Web server running on accessible IP
☐ Mobile app updated with correct server IP
☐ Can login on mobile
☐ Categories screen loads and shows data
☐ Can add new category on mobile
☐ Category appears on web app
☐ Profile screen loads
☐ All existing modules (transactions, accounts, etc.) still work
☐ Offline mode works (create transaction without internet)
☐ Data appears in web app after going online
```

---

## 🌟 Key Features Included

✨ **Automatic Sync**
- Every 30 seconds when online
- On network reconnect
- On app start

✨ **Offline First**
- Works without internet
- Queues changes locally
- Syncs when online

✨ **Multi-Device**
- Changes sync across all devices
- Real-time dashboard updates

✨ **User Profiles**
- View personal info
- Edit profile
- See account status

---

## 📞 Need Help?

1. **Check documentation:**
   - `MOBILE_SYNC_GUIDE.md` - Complete architecture
   - `MOBILE_SYNC_IMPLEMENTATION_CHECKLIST.md` - Detailed checklist

2. **Check logs:**
   - Web: Look at terminal running `npm run dev`
   - Mobile: Run `flutter logs` in terminal

3. **Test API manually:**
   ```bash
   # Get your JWT token first, then test endpoints
   curl -H "Authorization: Bearer YOUR_TOKEN" http://YOUR_IP:3000/api/categories
   ```

---

## 💡 Pro Tips

**Keep server running while testing:**
Use VS Code task: `Terminal → Run Task → Start Dev Server`

**Get real-time logs:**
```bash
# Mobile logs
flutter logs

# Web server logs
npm run dev (watch terminal)
```

**Test specific endpoints:**
Use Postman/Insomnia apps to test API before mobile testing

---

## 🎉 You're Ready!

Everything is set up. Just:
1. Update server IP in mobile app
2. Start web server: `npm run dev`
3. Run mobile: `flutter run`
4. Test the new Categories and Profile screens
5. Verify sync works both directions

**Estimated time:** 5-10 minutes to get everything running! 🚀

---

**Questions?** Check the detailed guides or analyze logs from `flutter logs` or browser console.
