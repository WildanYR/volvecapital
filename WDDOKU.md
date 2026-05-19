# Implementasi Sistem Withdrawal (WD) DOKU - Multi-Tenant

Dokumen ini menjelaskan alur kerja dan struktur teknis untuk fitur penarikan dana (Withdrawal) bagi setiap tenant menggunakan layanan **DOKU Payouts (Disbursement)**.

## 1. Arsitektur Saldo
Dalam sistem multi-tenant, saldo tidak hanya berupa angka, tapi harus bisa ditelusuri sumbernya.

*   **Gross Revenue**: Total uang yang masuk dari transaksi DOKU (Pay-in).
*   **Platform Fee**: Potongan biaya per transaksi untuk pemilik platform (Digital Premium).
*   **Net Balance**: Saldo bersih yang bisa ditarik oleh tenant.

### Penyimpanan Data
*   **Tenant Schema**: Menyimpan data permintaan WD (`withdrawal_request`) dan histori saldo tenant tersebut.
*   **Master Schema**: Menyimpan konfigurasi API DOKU Payout (Secret Key platform) dan log transaksi global untuk rekonsiliasi.

---

## 2. Struktur Database (Tenant Schema)

Kamu perlu menambahkan tabel baru di setiap schema tenant melalui migrasi:

### Table: `withdrawal_request`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `amount` | DECIMAL | Jumlah penarikan bersih yang diterima tenant |
| `admin_fee` | DECIMAL | Biaya transfer (biasanya flat dari DOKU, misal Rp 2.500) |
| `status` | ENUM | `PENDING`, `APPROVED`, `PROCESSING`, `SUCCESS`, `FAILED` |
| `bank_info` | JSON | Detail bank tujuan (`{ "bank_name": "BCA", "account_number": "123...", "account_holder": "..." }`) |
| `doku_reference` | STRING | ID referensi/transaksi dari API DOKU Payout |
| `created_at` | DATE | Waktu pengajuan penarikan |
| `updated_at` | DATE | Waktu update status terakhir |

---

## 3. Alur Kerja (Workflow)

### Tahap 1: Akumulasi Saldo
1. Setiap kali transaksi statusnya menjadi `SUCCESS` di schema tenant, hitung `Net Profit`.
2. Rumus: `Net Profit = Gross Amount - DOKU MDR - Platform Fee`.
3. Profit ini secara otomatis menambah "Total Saldo" di dashboard tenant.

### Tahap 2: Pengajuan WD (Dashboard Tenant)
1. Tenant masuk ke menu **Wallet/Keuangan**.
2. Sistem menampilkan "Saldo Tersedia" yang bisa ditarik.
3. Tenant mengisi form penarikan (Jumlah & Rekening Bank).
4. Sistem mengecek validasi (Saldo cukup? Minimal WD? OTP?).
5. Record baru dibuat di tabel `withdrawal_request` dengan status `PENDING`.

### Tahap 3: Approval (Super Admin)
1. Super Admin (kamu) melihat daftar pengajuan di Dashboard Admin Pusat.
2. Kamu melakukan verifikasi apakah aktivitas tenant tersebut normal (mencegah pencucian uang/fraud).
3. Klik tombol **"Approve & Transfer"**.

### Tahap 4: Eksekusi DOKU Payout
1. Saat klik Approve, Backend memanggil **API DOKU Payout**.
2. DOKU memotong saldo di **Wallet Platform** kamu dan mengirimkannya ke rekening bank tenant.
3. API mengembalikan respon `PROCESSING` atau `FAILED` secara real-time.

### Tahap 5: Webhook & Konfirmasi Akhir
1. DOKU mengirimkan **Webhook Notification** ke server kamu setelah transfer benar-benar sampai di bank tujuan.
2. Server mencari record `withdrawal_request` berdasarkan `doku_reference` dan mengubah statusnya menjadi `SUCCESS`.
3. Tenant menerima notifikasi bahwa uang telah masuk.

---

## 4. Contoh Payload API DOKU Payout

Ini adalah struktur data yang akan dikirimkan API kamu ke DOKU (Payouts API):

```json
{
  "request": {
    "payouts": [
      {
        "amount": 1000000,
        "beneficiary": {
          "name": "Sandi Tenant A",
          "account_number": "0022334455",
          "bank_code": "014", 
          "email": "sandi@tenant.com"
        },
        "description": "Withdrawal Digital Premium - Tenant Sandi",
        "external_id": "WD-2024-001-A"
      }
    ]
  }
}
```

---

## 5. Keamanan & Best Practices

1.  **Immutability**: Data di `withdrawal_request` tidak boleh bisa diubah oleh tenant setelah statusnya bukan `PENDING`.
2.  **Audit Trail**: Simpan log siapa admin yang meng-approve penarikan tersebut.
3.  **T+N Settlement**: Biasanya, jangan izinkan WD di hari yang sama dengan transaksi masuk. Berikan jeda (misal T+1 atau T+2) untuk memastikan dana dari DOKU Pay-in sudah benar-benar cair ke akun platform kamu.
4.  **Minimal WD**: Tentukan batas minimal penarikan (misal Rp 50.000) untuk menutupi biaya transfer bank.

---

## 6. Rencana Tahapan Coding

1.  **Backend**: Buat migrasi untuk tabel `withdrawal_request`.
2.  **Backend**: Buat service `WithdrawalService` untuk handle CRUD request.
3.  **Backend**: Integrasi library DOKU untuk Payout/Disbursement.
4.  **Frontend (Tenant)**: Buat halaman Wallet sederhana (List histori WD & Tombol Request).
5.  **Frontend (Admin)**: Buat halaman Approval WD untuk kamu.

---

## 7. Pertanyaan & Klarifikasi Sebelum Implementasi

Silakan jawab pertanyaan di bawah ini untuk memulai proses coding:

### 1. Lingkup Akun DOKU Payout
* **Pertanyaan:** Apakah kita menggunakan **satu akun DOKU Payout terpusat (milik platform Digital Premium)** untuk melakukan transfer ke semua rekening bank tujuan milik tenant?
* **Jawaban Anda:** menggunakan satu akun doku payout terpusat

### 2. Penghitungan & Penyimpanan Net Profit, DOKU MDR, & Platform Fee
* **Pertanyaan A:** Di mana kita menyimpan persentase/nilai nominal untuk **DOKU MDR** dan **Platform Fee**? Apakah dinamis per tenant (di tabel `tenant_setting` per schema) atau flat & global di config backend?
* **Jawaban A:** Sebaiknya disimpan secara dinamis per tenant di tabel seperti tenant_settings
* **Pertanyaan B:** Apakah setuju jika kita **menambahkan kolom `mdr_fee`, `platform_fee`, dan `net_profit` secara permanen ke tabel `transaction`** di schema tenant saat transaksi sukses? (Sangat direkomendasikan untuk integritas histori data jika rate fee berubah di masa depan).
* **Jawaban B:** Ya, sangat disarankan untuk menyimpan nilai tersebut langsung di tabel transaction saat status transaksi berubah menjadi SUCCESS

### 3. Kebijakan Settlement T+N
* **Pertanyaan:** Bagaimana validasi saldo tersedia yang ingin diterapkan? Apakah hanya transaksi yang usianya sudah **lebih dari N hari** (misal T+2) yang bisa ditarik? Berapa nilai N default yang diinginkan? Dan berapa minimal nominal WD?
* **Jawaban Anda:** N default adalah 2 hari (minimal WD Rp 50.000)

### 4. Hak Akses Dashboard (Super Admin vs. Tenant Owner)
* **Pertanyaan:** Bagaimana pemisahan tampilan Approval untuk Super Admin (`role: 'ADMIN'`) di frontend? Apakah setuju jika kita tambahkan sidebar group khusus **"Admin Panel"** di dashboard yang sama jika user yang login memiliki role `ADMIN`?
* **Jawaban Anda:** admin panel akan dibuat berbeda (nanti saya mau buat di subdomain lain misal : admin.digitalpremium.id)

### 5. Webhook DOKU Payout
* **Pertanyaan:** Apakah Anda memiliki dokumentasi spesifikasi payload webhook DOKU Payout yang ingin digunakan, atau kita akan melakukan validasi tanda tangan (*Signature Verification*) HMAC-SHA256 menggunakan `secretKey` yang sudah dikonfigurasi di `DokuConfig`?
* **Jawaban Anda:** Kita setuju membuat endpoint publik /public/webhook/doku/payout tanpa VcAuthGuard, tetapi tetap diamankan menggunakan Signature Verification HMAC-SHA256 dengan secretKey dari DokuConfig. Untuk payload, kita bisa mengikuti dokumentasi resmi DOKU Payout jika sudah tersedia, namun struktur handler dibuat fleksibel agar bisa disesuaikan dengan payload final dari DOKU.