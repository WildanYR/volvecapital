# Rencana Implementasi Bulk Operation - Dashboard Netflix (FINAL)

## 1. Fitur Utama
- **Multi-Select**: Memungkinkan admin memilih beberapa akun sekaligus menggunakan checkbox.
- **Bulk Actions**: Satu klik untuk melakukan aksi pada banyak akun.
- **Progress Monitoring**: Progress bar real-time saat operasi berjalan.

## 2. Detail Operasi Massal
| Aksi | Detail Implementasi |
| :--- | :--- |
| **Pin / Unpin** | Mengubah status pin semua akun terpilih. |
| **Freeze** | Otomatis diset **7 Hari** untuk semua akun terpilih. |
| **Delete** | **Wajib konfirmasi** dengan mengetik teks konfirmasi untuk keamanan. |
| **Clear** | Membersihkan metadata profil & status user pada akun terpilih. |
| **Reset Now** | Memicu tugas Bot untuk mereset password akun terpilih secara antrean. |
| **Auto Reload** | Memicu tugas Bot untuk melakukan reload otomatis pada akun terpilih. |

## 3. Perubahan Teknis
- **API**: Implementasi endpoint `PATCH /account/bulk` untuk efisiensi database.
- **Dashboard**: Penambahan state `selectedIds` dan komponen `BulkActionBar`.
- **Progress**: Menggunakan feedback visual per akun yang berhasil diproses.

---
*Status: Siap diimplementasikan.*
