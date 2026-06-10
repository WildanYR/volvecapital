# Implementasi Konfirmasi Edit Akun

Untuk menambahkan peringatan konfirmasi sebelum mensubmit hasil edit akun, kita bisa memanfaatkan fungsi `showAlertDialog` dari `useGlobalAlertDialog` yang sudah ada di file tersebut. Fungsi ini akan memunculkan popup modal (dialog) yang menanyakan konfirmasi kepada user sebelum benar-benar menjalankan proses penyimpanan (mutation).

Berikut adalah langkah-langkah implementasinya pada file `apps/dashboard/src/routes/dashboard/account/$slug.tsx`:

### 1. Cari fungsi `handleAccountEditSubmit`
Saat ini, fungsinya kemungkinan terlihat seperti ini:

```tsx
const handleAccountEditSubmit = (value: AccountEditFormSubmitData) => {
  accountEditMutation.mutate({
    id: selectedAccount!.id,
    payload: {
      ...value,
      email_id: value.email_id,
      product_variant_id: value.product_variant_id,
    },
  })
}
```

### 2. Ubah fungsi tersebut menjadi seperti ini:

```tsx
const handleAccountEditSubmit = (value: AccountEditFormSubmitData) => {
  // Panggil showAlertDialog untuk menampilkan popup konfirmasi
  showAlertDialog({
    title: 'Konfirmasi Edit Akun',
    description: (
      <>
        Pastikan data yang diedit sudah benar harap cek tanggal, input modal, dll.
      </>
    ),
    confirmText: 'Simpan Perubahan',
    isConfirming: accountEditMutation.isPending,
    onConfirm: () => {
      // Pindahkan proses mutate (simpan) ke dalam onConfirm
      accountEditMutation.mutate({
        id: selectedAccount!.id,
        payload: {
          ...value,
          email_id: value.email_id,
          product_variant_id: value.product_variant_id,
        },
      })
    }
  })
}
```

### Penjelasan:
- **`showAlertDialog`**: Sudah digunakan di komponen ini (terlihat pada fungsi `handleClearAccount` atau `handleDeleteAccount`), sehingga tidak perlu import tambahan.
- **`title`**: Judul dari modal peringatan.
- **`description`**: Pesan peringatan yang ingin ditampilkan (sesuai request: "pastikan data yang diedit sudah benar...").
- **`confirmText`**: Teks pada tombol konfirmasi, misalnya "Simpan Perubahan".
- **`onConfirm`**: Aksi yang dijalankan ketika tombol konfirmasi ditekan. Di sinilah kita mengeksekusi `accountEditMutation.mutate` yang tadinya langsung dieksekusi.
- **`isConfirming`**: Status loading tombol ketika sedang menunggu proses mutasi selesai.

Dengan perubahan ini, saat user klik tombol "Submit" atau "Simpan" pada form edit akun, popup peringatan akan muncul terlebih dahulu. Proses mutasi API hanya akan jalan setelah user menekan tombol "Simpan Perubahan" pada dialog konfirmasi.
