# Analisa Bug Auto Reset & Auto Switch Netflix

## Temuan Masalah
Setelah menganalisa kode pada `apps/api` dan `apps/bot2`, ditemukan perbedaan krusial antara alur **Trigger Manual** dan **Trigger Otomatis** dalam menyusun data (payload) yang dikirim ke bot.

1.  **Payload Rusak pada Trigger Otomatis**:
    *   Pada file `apps/api/src/modules/account/account.service.ts`, fungsi `registerNetflixResetTask` (yang menangani jadwal otomatis) mengambil data `subscription_expiry` dan `variant_name` menggunakan properti `.dataValues`.
    *   Penggunaan `.dataValues` pada objek relasi (seperti `product_variant`) sangat rentan mengembalikan nilai `undefined` atau string kosong (`''`) jika objek tersebut sudah diproses/diserialisasi oleh Sequelize.
    *   Sebaliknya, **Trigger Manual** (`triggerReset` & `bulkAction`) menggunakan akses properti langsung (misal: `account.product_variant.name`), yang terbukti bekerja dengan benar.

2.  **Dampak pada Logika Bot**:
    *   **Gagal Auto Switch**: Karena `variant_name` terkirim sebagai string kosong (`''`), logika bot `shouldSwitch = variantName !== ''` menjadi `false`. Akibatnya, akun varian Mingguan/Bulanan tidak dipicu untuk ganti ke Harian.
    *   **Gagal Deteksi Expired**: Jika `subscription_expiry` kosong, bot tidak bisa menghitung apakah akun sudah kadaluarsa atau belum, sehingga statusnya selalu tertahan di `ready` (Masih aktif).

## Perubahan yang Dilakukan

### 1. Perbaikan Payload di API (`apps/api/src/modules/account/account.service.ts`)
*   Mengubah fungsi `registerNetflixResetTask` agar menggunakan akses properti langsung dan menambahkan *optional chaining* serta nilai default.
*   **Sebelum**:
    ```typescript
    subscription_expiry: account.dataValues.subscription_expiry?.toISOString?.() || '',
    variant_name: account.product_variant?.dataValues?.name ?? '',
    ```
*   **Sesudah**:
    ```typescript
    subscription_expiry: account.subscription_expiry?.toISOString() || '',
    variant_name: account.product_variant?.name || '',
    ```
*   Hal yang sama diterapkan pada `triggerReset` manual untuk konsistensi dan keamanan data.

### 2. Penguatan Logika Bot (`apps/bot2/src/modules/netflix/NetflixModule.ts`)
*   Menambahkan validasi pada fungsi `calculateAccountState()` untuk menangani kasus jika `subscriptionExpiry` kosong atau formatnya tidak valid (Invalid Date).
*   Bot sekarang akan memberikan pesan alasan yang jelas (`reason`) jika data tanggal tidak tersedia, alih-alih melakukan kalkulasi yang salah.

## Kesimpulan
Masalah utama terletak pada konstruksi payload di sisi API yang menyebabkan bot tidak menerima informasi varian produk yang benar saat dijalankan secara otomatis berdasarkan jadwal. Dengan perbaikan ini, bot akan menerima `variant_name` yang tepat dan menjalankan logika `shouldSwitch` sesuai aturan yang telah ditetapkan.