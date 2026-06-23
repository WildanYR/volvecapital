# Implementasi Fitur Bulk Edit Akun

Fitur ini memungkinkan pengguna untuk memilih beberapa akun sekaligus dan mengubah data-data spesifik (seperti Password, Subscription Berakhir, Status, Billing, Varian Produk, Harga Modal/HPP, dan Label/Catatan) secara massal.

## Design Decisions

- **UX Form Edit Massal**: Menggunakan pendekatan *checkbox* di samping setiap input. Hanya field yang di-centang yang akan di-update ke akun-akun yang dipilih.
- **Harga Modal (HPP)**: Cukup melakukan *update* pada field `capital_price` di tabel `account`, tanpa perlu mencatat di tabel `account_capital`.
- **Pengecualian**: Akun dengan status `banned` akan diabaikan (tidak bisa di-edit secara massal).

---

## Proposed Changes

### Frontend (Dashboard App)

Kita perlu membuat komponen form baru khusus untuk Bulk Edit, serta menyesuaikan halaman utama tabel akun.

#### 1. Modifikasi File `apps/dashboard/src/routes/dashboard/account/$slug.tsx`
- Menambahkan pilihan `Edit Massal` pada baris tombol Bulk Action saat ada kotak/checkbox akun yang dicentang.
- Mengontrol *state* modal `dialogBulkEditOpen`.
- Saat submit form, memanggil `bulkActionMutation.mutate({ ids: selectedIds, action: 'edit', payload: ... })`.

#### 2. Buat File Baru `apps/dashboard/src/components/forms/account-bulk-edit-modal.tsx`
- Membuat komponen modal baru (`Dialog`) dengan isian sama seperti "Ubah Akun" (Single Edit).
- Menambahkan state internal menggunakan *checkbox* untuk melacak field mana saja yang mau di-*override*.
- Tombol `Submit` yang akan meneruskan data ke komponen induk (`$slug.tsx`).

---

### Backend (API App)

Menambahkan logika untuk memproses perintah `action: 'edit'` pada service massal.

#### 1. Modifikasi File `apps/api/src/modules/account/account.service.ts`
- Pada fungsi `bulkAction(...)`, tambahkan validasi `case 'edit':`.
- Tangkap parameter dari `payload` (misal: `account_password`, `subscription_expiry`, `status`, `billing`, `product_variant_id`, `capital_price`, `label`).
- Eksekusi bulk update: 
  ```typescript
  await this.accountRepository.update(
    updateDataPayload,
    { where: { id: { [Op.in]: ids } }, transaction }
  );
  ```

---

## Verification Plan

### Manual Verification
- Jalankan dashboard secara lokal.
- Centang 2-3 akun pada tabel.
- Klik tombol "Edit Massal".
- Ubah **hanya** satu nilai (misalnya: `Subscription Berakhir`) dan submit.
- Cek akun yang dipilih apakah masa langganannya sudah terupdate dengan benar, dan data lainnya (seperti password) tidak berubah/hilang.
