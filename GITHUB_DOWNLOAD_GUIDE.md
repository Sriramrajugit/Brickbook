# Download from GitHub on Another PC - Setup Guide

## ✅ Status: PUSHED TO GITHUB

Your mobile sync package has been successfully pushed to GitHub!

**Repository:** https://github.com/Sriramrajugit/Brickbook  
**Branch:** main  
**Latest Commit:** c7245ed0 - feat: Sync all web modules to mobile app with new screens and models

---

## 📥 Download on Another PC

### **Option 1: Fresh Clone (Recommended for new PC)**

```bash
# 1. Open PowerShell or Command Prompt on your new PC
# 2. Navigate to where you want the project
cd C:\Users\YourUsername\Documents

# 3. Clone the repository
git clone https://github.com/Sriramrajugit/Brickbook.git

# 4. Navigate to project
cd Brickbook

# 5. Initialize Git submodules (for mobile_app)
git submodule update --init --recursive

# 6. Install dependencies
cd mobile_app
flutter pub get

# 7. Done! Ready to run
flutter run
```

### **Option 2: Pull Latest Changes (If already cloned)**

```bash
# 1. Navigate to your Ledger folder
cd C:\My Data\Workspace\Ledger

# 2. Pull the latest changes
git pull origin main

# 3. Update mobile app dependencies
cd mobile_app
flutter pub get

# 4. Ready to run
flutter run
```

---

## 📁 What's Included in the Download

### **New Mobile Modules**
```
mobile_app/lib/
├── models/
│   ├── category.dart (NEW)
│   └── user.dart (NEW)
├── screens/
│   ├── categories_screen.dart (NEW)
│   └── profile_screen.dart (NEW)
├── services/
│   ├── api_service.dart (UPDATED)
│   └── offline_api_service.dart (UPDATED)
├── widgets/
│   └── drawer_menu.dart (UPDATED)
└── main.dart (UPDATED)
```

### **Documentation Files**
```
Project Root/
├── MOBILE_SYNC_GUIDE.md (NEW)
├── MOBILE_SYNC_IMPLEMENTATION_CHECKLIST.md (NEW)
├── QUICK_SYNC_START.md (NEW)
└── SYNC_COMPLETION_SUMMARY.md (NEW)
```

---

## ⚙️ Setup After Downloading

### **Step 1: Update Configuration**

After cloning, you **MUST** update the API base URL in your new PC's local file:

**File:** `mobile_app/lib/services/api_service.dart`

Find line 11:
```dart
static const String baseUrl = 'http://192.168.1.15:3000/api';
```

Replace with your **new PC's IP address**:
```dart
static const String baseUrl = 'http://YOUR_NEW_PC_IP:3000/api';
// Example: http://192.168.1.100:3000/api
```

**How to get your IP on the new PC:**
```powershell
# Open PowerShell and run:
ipconfig

# Look for "IPv4 Address" (usually starts with 192.168.x.x)
```

### **Step 2: Install Dependencies**

```bash
# Install Flutter packages
cd mobile_app
flutter pub get

# Install web server dependencies
cd ../
npm install
```

### **Step 3: Start Development**

```bash
# Terminal 1: Start web server
npm run dev

# Terminal 2: Run mobile app
cd mobile_app
flutter run
```

---

## 🔄 Sync Features Ready to Use

✅ **Transactions** - Create, sync, works offline  
✅ **Accounts** - Full sync support  
✅ **Employees** - Create and sync  
✅ **Attendance** - Full CRUD  
✅ **Payroll** - Sync available  
✅ **Categories** - NEW - Add/view categories  
✅ **Profile** - NEW - View/edit user profile  
✅ **Dashboard** - Real-time updates  
✅ **Auto-Sync** - Every 30 seconds + on network change  
✅ **Offline Mode** - All data works offline  

---

## 🧪 Verify Installation

After downloading and setting up, verify everything works:

```bash
# 1. Check Git status
git status
# Should show: "On branch main, Your branch is up to date with 'origin/main'"

# 2. Check Flutter version
flutter --version
# Should show Flutter SDK version

# 3. Check if pub.dev dependencies are installed
ls mobile_app/.dart_tool
# Should exist if flutter pub get was successful

# 4. Verify new files exist
ls mobile_app/lib/models/category.dart
ls mobile_app/lib/screens/categories_screen.dart
# Both should exist without errors
```

---

## 📋 Quick Checklist

After downloading on new PC:

- [ ] Cloned repository: `git clone https://github.com/Sriramrajugit/Brickbook.git`
- [ ] Updated API base URL in `api_service.dart`
- [ ] Ran `flutter pub get` in mobile_app folder
- [ ] Ran `npm install` in root folder
- [ ] Started web server: `npm run dev`
- [ ] Ran mobile app: `flutter run`
- [ ] Can view Categories screen
- [ ] Can view Profile screen
- [ ] Data syncs between web and mobile

---

## 🐛 Troubleshooting Downloads

### Issue: "fatal: repository not found"

**Solution:**
```bash
# Check if repository URL is correct
git clone https://github.com/Sriramrajugit/Brickbook.git

# If using SSH, make sure SSH key is added to GitHub
# Or use HTTPS instead
```

### Issue: "Submodule not found"

**Solution:**
```bash
# Initialize submodules
git submodule update --init --recursive

# Or during clone, use recursive flag
git clone --recursive https://github.com/Sriramrajugit/Brickbook.git
```

### Issue: "App won't connect to server"

**Solution:**
1. Check web server is running: `npm run dev`
2. Verify API base URL is correct
3. Check both PCs are on same network
4. Ensure firewall isn't blocking port 3000

### Issue: "Flutter pub get fails"

**Solution:**
```bash
# Clear pub cache
flutter pub cache clean

# Try again
flutter pub get

# Or use clean build
flutter clean
flutter pub get
```

---

## 📚 Documentation Location

After downloading, find these guides in the project root:

1. **QUICK_SYNC_START.md** ← Start here (5 min setup)
2. **MOBILE_SYNC_GUIDE.md** - Complete architecture
3. **MOBILE_SYNC_IMPLEMENTATION_CHECKLIST.md** - Step-by-step
4. **SYNC_COMPLETION_SUMMARY.md** - Full summary

---

## 🌐 GitHub Repository Details

```
Repository: Brickbook
URL: https://github.com/Sriramrajugit/Brickbook
Branch: main
Latest Commit: c7245ed0
Commit Date: February 28, 2026
Files Changed: 12
Lines Added: 2,744
```

### **Files in This Commit:**
- MOBILE_SYNC_GUIDE.md (NEW)
- MOBILE_SYNC_IMPLEMENTATION_CHECKLIST.md (NEW)
- QUICK_SYNC_START.md (NEW)
- SYNC_COMPLETION_SUMMARY.md (NEW)
- mobile_app/lib/models/category.dart (NEW)
- mobile_app/lib/models/user.dart (NEW)
- mobile_app/lib/screens/categories_screen.dart (NEW)
- mobile_app/lib/screens/profile_screen.dart (NEW)
- mobile_app/lib/main.dart (UPDATED)
- mobile_app/lib/services/api_service.dart (UPDATED)
- mobile_app/lib/services/offline_api_service.dart (UPDATED)
- mobile_app/lib/widgets/drawer_menu.dart (UPDATED)

---

## 🚀 Commands Summary

### **On New PC:**

```bash
# Clone repository
git clone https://github.com/Sriramrajugit/Brickbook.git
cd Brickbook

# Initialize submodules
git submodule update --init --recursive

# Install dependencies
npm install
cd mobile_app && flutter pub get && cd ..

# Update API URL in api_service.dart (REQUIRED!)

# Start web server
npm run dev

# In new terminal, run mobile app
cd mobile_app
flutter run
```

---

## ✨ What You Get After Download

✅ **All source code** for web and mobile  
✅ **4 comprehensive guides** for setup and sync  
✅ **2 new models** (Category, User)  
✅ **2 new screens** (Categories, Profile)  
✅ **Updated navigation** with new routes  
✅ **Offline support** for categories  
✅ **Auto-sync** configured and ready  
✅ **Full API integration** for all modules  

---

## 📞 Need Help?

1. **Quick Start?** → Read `QUICK_SYNC_START.md`
2. **Detailed Setup?** → Read `MOBILE_SYNC_IMPLEMENTATION_CHECKLIST.md`
3. **Architecture?** → Read `MOBILE_SYNC_GUIDE.md`
4. **Full Summary?** → Read `SYNC_COMPLETION_SUMMARY.md`

---

## 🎉 You're All Set!

The mobile app is now available on GitHub with all the latest modules synced from the web app. Download it, set up the API URL, and you're ready to sync on your new PC!

**Happy coding!** 🚀

---

**Pushed:** February 28, 2026  
**Status:** ✅ Available on GitHub  
**Ready to Download:** YES  
