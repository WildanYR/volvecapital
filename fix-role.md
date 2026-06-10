# Rencana Implementasi Final: Role & Permission Management

## Keputusan Desain (Berdasarkan Jawaban Anda)

| # | Pertanyaan | Keputusan |
|---|-----------|-----------|
| 1 | Tujuan role | Sub-akun **staff baru** yang bisa login ke dashboard |
| 2 | Lokasi data | **Schema per-tenant** (terisolasi setiap tenant) |
| 3 | Tenant Owner | **Bypass semua permission** — akses penuh otomatis |
| 4 | Login staff | Endpoint terpisah: `POST /dashboard-user/login` |
| 5 | Contoh implementasi | Tombol & aksi di **halaman Produk** |

---

## Arsitektur Sistem

```
Tenant Owner (login via /tenant/login)
  ↓ JWT role: TENANT_OWNER → bypass semua permission check
  ↓ Bisa kelola role, permissions, dan staff

Dashboard User / Staff (login via /dashboard-user/login)
  ↓ JWT role: DASHBOARD_USER + daftar permissions[]
  ↓ Hanya bisa akses fitur sesuai permission role-nya
```

---

## Desain Database (Schema Per-Tenant)

```
┌─────────────────────┐     ┌─────────────────────┐
│       roles         │     │    permissions      │
├─────────────────────┤     ├─────────────────────┤
│ id          UUID PK │     │ id          UUID PK │
│ name        VARCHAR │     │ name        VARCHAR │ ← "product.create"
│ description TEXT    │     │ description TEXT    │
│ created_at  DATE    │     │ created_at  DATE    │
│ updated_at  DATE    │     └────────────┬────────┘
└──────────┬──────────┘                  │
           │                             │
           └────────────┐  ┌─────────────┘
                        ▼  ▼
              ┌──────────────────────┐
              │   role_permissions   │
              ├──────────────────────┤
              │ role_id       FK     │
              │ permission_id FK     │
              └──────────────────────┘

┌──────────────────────────┐
│     dashboard_users      │
├──────────────────────────┤
│ id         UUID PK       │
│ role_id    FK → roles    │
│ name       VARCHAR       │
│ email      VARCHAR UNIQ  │
│ password   VARCHAR       │  ← hashed sha256 (sama dgn TenantOwner)
│ is_active  BOOLEAN       │
│ created_at DATE          │
│ updated_at DATE          │
└──────────────────────────┘
```

---

## Daftar 21 Permission Default

```
dashboard.view
product.view        product.create      product.edit      product.delete
user.view           user.create         user.edit         user.delete
role.view           role.create         role.edit         role.delete
transaction.view    transaction.create  transaction.edit  transaction.delete
report.view
setting.view        setting.edit
voucher.view        voucher.create
```

---

## 4 Role Preset (Seed)

| Role | Permissions |
|------|------------|
| **Super Admin** | Semua 21 permission |
| **Admin** | Semua kecuali `role.*` |
| **Staff CS** | `dashboard.view`, `transaction.view`, `transaction.create`, `voucher.view` |
| **Viewer** | Semua `*.view` |

---

## Rincian File yang Akan Dibuat / Diubah

---

### 🗄️ BACKEND — Database Migration

#### [NEW] `apps/api/migrations/tenant/047-create-role-permission-tables.ts`
Migration untuk membuat 4 tabel baru di schema per-tenant:
- `roles`
- `permissions`
- `role_permissions`
- `dashboard_users`

---

### 🗄️ BACKEND — Models Sequelize

#### [NEW] `apps/api/src/database/models/role.model.ts`
Model untuk tabel `roles`.

#### [NEW] `apps/api/src/database/models/permission.model.ts`
Model untuk tabel `permissions`.

#### [NEW] `apps/api/src/database/models/role-permission.model.ts`
Model junction table `role_permissions` (BelongsToMany).

#### [NEW] `apps/api/src/database/models/dashboard-user.model.ts`
Model untuk tabel `dashboard_users`, berelasi `BelongsTo` ke `Role`.

#### [MODIFY] `apps/api/src/database/postgres.provider.ts`
Daftarkan 4 model baru ke `sequelize.addModels([...])`.

#### [MODIFY] `apps/api/src/database/repository.provider.ts`
Tambahkan 4 repository provider baru.

#### [MODIFY] `apps/api/src/constants/database.const.ts`
Tambahkan 4 konstanta baru:
```typescript
export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';
export const PERMISSION_REPOSITORY = 'PERMISSION_REPOSITORY';
export const ROLE_PERMISSION_REPOSITORY = 'ROLE_PERMISSION_REPOSITORY';
export const DASHBOARD_USER_REPOSITORY = 'DASHBOARD_USER_REPOSITORY';
```

---

### 🔐 BACKEND — Auth & Guard

#### [MODIFY] `apps/api/src/types/roles.type.ts`
Tambah tipe baru:
```typescript
export type Roles = 'USER' | 'ADMIN' | 'BACKEND' | 'TENANT_OWNER' | 'DASHBOARD_USER';
```

#### [MODIFY] `apps/api/src/types/access-token.type.ts`
Tambah field `permissions`:
```typescript
export interface IAccessTokenPayload {
  id?: string;
  tenant_id: string;
  role: Roles;
  email?: string;
  permissions?: string[];  // ← BARU: hanya diisi jika role = DASHBOARD_USER
}
```

#### [NEW] `apps/api/src/guards/permissions.decorator.ts`
Decorator untuk menandai endpoint yang butuh permission tertentu:
```typescript
@RequirePermissions('product.create', 'product.edit')
```

#### [MODIFY] `apps/api/src/guards/vc-auth.guard.ts`
Tambah logika permission check setelah JWT verified:
- Jika `role === 'TENANT_OWNER'` → **bypass, langsung return true**
- Jika ada `@RequirePermissions()` pada endpoint → cek apakah `token.permissions` mengandung permission yang diminta
- Jika tidak punya → throw **403 ForbiddenException**

---

### 🏗️ BACKEND — Modul Role

#### [NEW] `apps/api/src/modules/role/role.module.ts`
#### [NEW] `apps/api/src/modules/role/role.controller.ts`

Endpoints:
| Method | Path | Guard | Permission |
|--------|------|-------|-----------|
| `GET` | `/role` | VcAuthGuard | `role.view` |
| `POST` | `/role` | VcAuthGuard | `role.create` |
| `GET` | `/role/:id` | VcAuthGuard | `role.view` |
| `PATCH` | `/role/:id` | VcAuthGuard | `role.edit` |
| `DELETE` | `/role/:id` | VcAuthGuard | `role.delete` |
| `PUT` | `/role/:id/permissions` | VcAuthGuard | `role.edit` |

#### [NEW] `apps/api/src/modules/role/role.service.ts`
Logic CRUD role + set permissions (upsert ke `role_permissions`).

#### [NEW] `apps/api/src/modules/role/dto/create-role.dto.ts`
```typescript
{ name: string, description?: string, permission_ids?: string[] }
```

---

### 🏗️ BACKEND — Modul Dashboard User

#### [NEW] `apps/api/src/modules/dashboard-user/dashboard-user.module.ts`
#### [NEW] `apps/api/src/modules/dashboard-user/dashboard-user.controller.ts`

Endpoints:
| Method | Path | Guard | Permission |
|--------|------|-------|-----------|
| `GET` | `/dashboard-user` | VcAuthGuard | `user.view` |
| `POST` | `/dashboard-user` | VcAuthGuard | `user.create` |
| `PATCH` | `/dashboard-user/:id` | VcAuthGuard | `user.edit` |
| `DELETE` | `/dashboard-user/:id` | VcAuthGuard | `user.delete` |
| `POST` | `/dashboard-user/login` | **PublicRoute** | - |

#### [NEW] `apps/api/src/modules/dashboard-user/dashboard-user.service.ts`
- `login()` → validasi email+password, load role+permissions, sign JWT dengan `permissions[]` di payload
- CRUD untuk staff

---

### 🏗️ BACKEND — Modul Permission

#### [NEW] `apps/api/src/modules/permission/permission.module.ts`
#### [NEW] `apps/api/src/modules/permission/permission.controller.ts`

Endpoints:
| Method | Path | Guard |
|--------|------|-------|
| `GET` | `/permission` | VcAuthGuard |

Hanya endpoint list saja (permission tidak bisa dibuat manual dari UI, hanya dari seed).

---

### 🏗️ BACKEND — Seed & App Module

#### [NEW] `apps/api/src/scripts/seed-role-permission.ts`
Script untuk seed permission default dan 4 role preset ke database.

#### [MODIFY] `apps/api/src/app.module.ts`
Import `RoleModule`, `DashboardUserModule`, `PermissionModule`.

---

### 🎨 FRONTEND — Auth Context

#### [MODIFY] `apps/dashboard/src/context-providers/auth-context.type.ts`
```typescript
export interface ITenant {
  id: string
  accessToken: string
  permissions?: string[]   // ← BARU
  role?: string            // ← BARU: 'TENANT_OWNER' | 'DASHBOARD_USER'
}
```

#### [MODIFY] `apps/dashboard/src/context-providers/auth.provider.tsx`
- Tambah fungsi `loginAsStaff(email, password)` yang hit `/dashboard-user/login`
- Simpan `permissions` dari response ke localStorage
- Fungsi `login()` yang sudah ada (untuk Owner) tidak berubah

---

### 🎨 FRONTEND — Permission Helper

#### [NEW] `apps/dashboard/src/lib/permission.ts`
```typescript
// Ambil permissions dari auth context
export function can(permission: string, auth: IAuthContext): boolean {
  if (auth.tenant?.role === 'TENANT_OWNER') return true  // bypass
  return auth.tenant?.permissions?.includes(permission) ?? false
}

// Hook React untuk digunakan di komponen
export function usePermission(permission: string): boolean {
  const auth = useAuth()
  return can(permission, auth)
}

// Cek banyak permission sekaligus (semua harus ada)
export function canAll(permissions: string[], auth: IAuthContext): boolean
```

---

### 🎨 FRONTEND — Reusable Components

#### [NEW] `apps/dashboard/src/components/permission-gate.tsx`
Render children hanya jika punya permission. Jika tidak, render `null` (hidden).
```tsx
<PermissionGate permission="product.create">
  <Button>Buat Produk</Button>
</PermissionGate>
```

#### [NEW] `apps/dashboard/src/components/protected-button.tsx`
Tombol otomatis `disabled` + abu-abu + tooltip "Anda tidak memiliki akses" jika tidak punya permission.
```tsx
<ProtectedButton permission="product.delete" onClick={handleDelete}>
  Hapus
</ProtectedButton>
```

#### [NEW] `apps/dashboard/src/components/protected-menu-item.tsx`
`DropdownMenuItem` yang otomatis disabled jika tidak punya permission.
```tsx
<ProtectedMenuItem permission="product.edit" onSelect={handleEdit}>
  <SquarePen /> Update
</ProtectedMenuItem>
```

---

### 🎨 FRONTEND — Service Layer

#### [NEW] `apps/dashboard/src/services/role.service.ts`
Fungsi untuk CRUD role dan permission dari API.

#### [NEW] `apps/dashboard/src/services/dashboard-user.service.ts`
Fungsi untuk CRUD staff dan login staff.

#### [NEW] `apps/dashboard/src/services/permission.service.ts`
Fungsi untuk fetch daftar permission.

---

### 🎨 FRONTEND — Halaman Role Management

#### [NEW] `apps/dashboard/src/routes/dashboard/role/index.tsx`
Halaman daftar role dengan:
- Tabel role + jumlah permission + jumlah staff
- Tombol "Tambah Role" (protected: `role.create`)
- Tombol Edit/Hapus per baris (protected: `role.edit`, `role.delete`)

#### [NEW] `apps/dashboard/src/routes/dashboard/role/create.tsx`
Form buat role baru:
- Field: Nama, Deskripsi
- Checkbox daftar permission (dikelompokkan per modul)

#### [NEW] `apps/dashboard/src/routes/dashboard/role/$roleId.tsx`
Halaman detail + edit role:
- Update nama/deskripsi
- Toggle permission (checkbox)

---

### 🎨 FRONTEND — Halaman Staff Management

#### [NEW] `apps/dashboard/src/routes/dashboard/staff/index.tsx`
Halaman daftar staff dengan:
- Tabel: Nama, Email, Role, Status
- Tombol tambah/edit/hapus (protected)

#### [NEW] `apps/dashboard/src/routes/dashboard/staff/create.tsx`
Form buat staff baru:
- Field: Nama, Email, Password, Pilih Role

---

### 🎨 FRONTEND — Login Page Update

#### [MODIFY] `apps/dashboard/src/routes/login.tsx`
Tambah toggle atau tab untuk memilih login sebagai **Owner** atau **Staff**:
- Owner → hit `/tenant/login`
- Staff → hit `/dashboard-user/login`

---

### 🎨 FRONTEND — Sidebar Update

#### [MODIFY] `apps/dashboard/src/routes/dashboard/route.tsx`
- Tambah group menu "Manajemen" dengan item "Role & Permission" dan "Staff"
- Item menu dibungkus `ProtectedMenuItem` dengan permission yang sesuai
- Sidebar hanya tampilkan menu yang boleh diakses

---

### 🎨 FRONTEND — Implementasi Contoh di Halaman Produk

#### [MODIFY] `apps/dashboard/src/routes/dashboard/product/index.tsx`

Tombol/aksi yang akan dilindungi permission:

| Elemen | Permission |
|--------|-----------|
| Tombol "Buat Produk" (link ke `/product/create`) | `product.create` |
| Dropdown menu **Update** produk | `product.edit` |
| Dropdown menu **Delete** produk | `product.delete` |
| Tombol **Tambah Varian** | `product.create` |
| Dropdown menu **Update** varian | `product.edit` |
| Dropdown menu **Delete** varian | `product.delete` |

---

## Urutan Eksekusi

```
Phase 1 — Backend Foundation
  1. Migration + Models + Constants + Repository
  2. Type updates (roles.type, access-token.type)
  3. Guard update (vc-auth.guard) + permissions.decorator

Phase 2 — Backend Modules
  4. PermissionModule (list only)
  5. RoleModule (CRUD + set permissions)
  6. DashboardUserModule (CRUD + login)
  7. Seed script
  8. Register modules di app.module.ts

Phase 3 — Frontend Foundation
  9. Update auth context types + provider (tambah loginAsStaff)
  10. permission.ts helper
  11. ProtectedButton, PermissionGate, ProtectedMenuItem components

Phase 4 — Frontend Pages
  12. RoleModule pages (list, create, edit)
  13. StaffModule pages (list, create)
  14. Login page update (toggle Owner/Staff)
  15. Sidebar update

Phase 5 — Contoh Implementasi
  16. Product page → pasang ProtectedButton & ProtectedMenuItem
```

---

## Verification Plan

### Backend
- Jalankan migration → 4 tabel baru berhasil dibuat di schema per-tenant
- `POST /dashboard-user/login` → response berisi JWT dengan `permissions[]`
- Hit endpoint product dengan token staff tanpa `product.delete` → **403**
- Hit endpoint product dengan token `TENANT_OWNER` → **200** (bypass)

### Frontend
- Login sebagai Owner → semua tombol aktif, semua menu tampil
- Login sebagai Staff CS → tombol "Buat Produk" disabled + tooltip muncul
- Login sebagai Viewer → semua tombol edit/hapus disabled

---

## Catatan Penting

> [!NOTE]
> **Tidak ada perubahan breaking pada fitur yang sudah ada.** Semua endpoint existing tetap berjalan normal karena `TENANT_OWNER` bypass permission check. Guard hanya akan aktif memvalidasi permission jika endpoint secara eksplisit menggunakan `@RequirePermissions()` decorator.

> [!WARNING]
> **Login page perlu diupdate** untuk mendukung dua jenis login (Owner vs Staff). Pastikan UX-nya jelas agar tidak membingungkan pengguna.
