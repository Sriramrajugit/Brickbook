# User Credentials

This application now has role-based access control with three types of users:

## 1. Owner
- **Email:** owner@example.com
- **Password:** owner123
- **Access:** Full access to all sites and all features
- **Permissions:** Can view, add, edit, and delete all entries across all sites

## 2. Site Manager
Site managers only have access to their assigned site.

### Site Manager A
- **Email:** manager.a@example.com
- **Password:** manager123
- **Access:** Site A only
- **Permissions:** Can view, add, edit, and delete entries for Site A only

### Site Manager B
- **Email:** manager.b@example.com
- **Password:** manager123
- **Access:** Site B only
- **Permissions:** Can view, add, edit, and delete entries for Site B only

## 3. Guest
- **Email:** guest@example.com
- **Password:** guest123
- **Access:** View-only access to all data
- **Permissions:** Can view all screens and data but cannot add, edit, or delete any entries

## Sites Created
1. Main Office (Headquarters)
2. Site A (Location A)
3. Site B (Location B)

## Role Restrictions

| Feature | Owner | Site Manager | Guest |
|---------|-------|--------------|-------|
| View all data | ✅ | Only their site | ✅ |
| Add transactions | ✅ | ✅ (their site) | ❌ |
| Edit transactions | ✅ | ✅ (their site) | ❌ |
| Delete transactions | ✅ | ✅ (their site) | ❌ |
| Manage employees | ✅ | ✅ (their site) | ❌ |
| View reports | ✅ | ✅ (their site) | ✅ |
| Manage accounts | ✅ | ✅ (their site) | ❌ |
